import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { group_id, invitee_id } = await req.json();
  if (!group_id || !invitee_id) {
    return NextResponse.json({ error: "group_id and invitee_id required" }, { status: 400 });
  }

  // Verify the caller is a confirmed member of this group
  const { data: myMembership } = await supabase
    .from("group_members")
    .select("status")
    .eq("group_id", group_id)
    .eq("user_id", user.id)
    .eq("status", "confirmed")
    .maybeSingle();

  if (!myMembership) {
    return NextResponse.json({ error: "Not a confirmed member of this group" }, { status: 403 });
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await admin.from("group_members").insert({
    group_id,
    user_id: invitee_id,
    status: "pending",
  });

  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
