import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createBlockSchema, applyBlockSideEffects } from "@/lib/safety";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createBlockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { blocked_id } = parsed.data;

  if (blocked_id === user.id) {
    return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });
  }

  const { error } = await supabase
    .from("blocks")
    .upsert(
      { blocker_id: user.id, blocked_id },
      { onConflict: "blocker_id,blocked_id", ignoreDuplicates: true }
    );

  if (error) {
    console.error("[blocks POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { leftGroupId } = await applyBlockSideEffects(supabase, user.id, blocked_id);

  return NextResponse.json({ ok: true, leftGroupId });
}
