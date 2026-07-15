import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { reported_id, reason } = await req.json();
  if (!reported_id) return NextResponse.json({ error: "reported_id required" }, { status: 400 });
  if (reported_id === user.id) return NextResponse.json({ error: "Cannot report yourself" }, { status: 400 });

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    reported_id,
    reason: reason ?? null,
  });

  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
