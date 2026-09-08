import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createReportSchema, applyBlockSideEffects } from "@/lib/safety";

const RATE_LIMIT_PER_HOUR = 5;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { reported_id, reason, details, event_id, message_id, also_block } = parsed.data;

  if (reported_id === user.id) {
    return NextResponse.json({ error: "Cannot report yourself" }, { status: 400 });
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("reporter_id", user.id)
    .gte("created_at", oneHourAgo);

  if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) {
    return NextResponse.json({ error: "Too many reports — please try again later" }, { status: 429 });
  }

  const { error } = await supabase.from("reports").upsert(
    {
      reporter_id: user.id,
      reported_id,
      reason,
      details: details ?? null,
      event_id: event_id ?? null,
      message_id: message_id ?? null,
      status: "open",
      resolved_at: null,
    },
    { onConflict: "reporter_id,reported_id" }
  );

  if (error) {
    console.error("[report-user]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let blocked = false;
  if (also_block) {
    await supabase
      .from("blocks")
      .upsert(
        { blocker_id: user.id, blocked_id: reported_id },
        { onConflict: "blocker_id,blocked_id", ignoreDuplicates: true }
      );
    await applyBlockSideEffects(supabase, user.id, reported_id);
    blocked = true;
  }

  return NextResponse.json({ ok: true, blocked });
}
