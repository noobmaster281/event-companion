import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";

const patchSchema = z.object({
  status: z.enum(["open", "reviewing", "resolved", "dismissed"]),
  resolver_notes: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { status, resolver_notes } = parsed.data;
  const admin = await createAdminClient();

  const { error } = await admin
    .from("reports")
    .update({
      status,
      resolver_notes: resolver_notes ?? null,
      resolved_at: status === "resolved" || status === "dismissed" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) {
    console.error("[admin/reports PATCH]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
