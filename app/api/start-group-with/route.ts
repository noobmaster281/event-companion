import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { invitee_id, event_id } = await req.json();
  if (!invitee_id) return NextResponse.json({ error: "invitee_id required" }, { status: 400 });
  if (invitee_id === user.id) return NextResponse.json({ error: "Cannot group with yourself" }, { status: 400 });

  // Resolve event_id: use provided one or fall back to first verified event
  let resolvedEventId: string | null = event_id ?? null;
  if (!resolvedEventId) {
    const { data: badge } = await supabase
      .from("verified_badges")
      .select("event_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    resolvedEventId = badge?.event_id ?? null;
  }

  if (!resolvedEventId) {
    return NextResponse.json({ error: "No verified event found" }, { status: 400 });
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get current user's group size preference for max_size
  const { data: profile } = await supabase
    .from("users")
    .select("group_size_preference")
    .eq("id", user.id)
    .single();
  const maxSize = Math.min(profile?.group_size_preference ?? 5, 10);

  // Create the group
  const { data: group, error: groupError } = await admin
    .from("groups")
    .insert({ event_id: resolvedEventId, created_by: user.id, status: "open", max_size: maxSize })
    .select("id")
    .single();

  if (groupError || !group) {
    return NextResponse.json({ error: groupError?.message ?? "Failed to create group" }, { status: 500 });
  }

  // Add both users as confirmed (admin bypasses RLS)
  const { error: membersError } = await admin.from("group_members").insert([
    { group_id: group.id, user_id: user.id, status: "confirmed" },
    { group_id: group.id, user_id: invitee_id, status: "pending" },
  ]);

  if (membersError) {
    return NextResponse.json({ error: membersError.message }, { status: 500 });
  }

  return NextResponse.json({ group_id: group.id });
}
