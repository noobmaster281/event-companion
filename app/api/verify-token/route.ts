import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyInboundToken } from "@/lib/token";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Decode event_id from the raw JWT without verifying yet (we need it to look
    // up the operator's secret before we can verify the signature).
    let rawPayload: { email?: string; event_id?: string };
    try {
      const parts = token.split(".");
      if (parts.length !== 3) throw new Error("Malformed JWT");
      rawPayload = JSON.parse(
        Buffer.from(parts[1], "base64url").toString("utf8")
      );
    } catch {
      return NextResponse.json({ error: "Malformed token" }, { status: 400 });
    }

    const { event_id } = rawPayload;
    if (!event_id) {
      return NextResponse.json(
        { error: "Token missing event_id" },
        { status: 400 }
      );
    }

    // Look up the event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, name, festival_name, operator_id")
      .eq("id", event_id)
      .single();

    if (eventError || !event) {
      console.error("[verify-token] event lookup failed", { event_id, eventError });
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Look up the operator's secret key separately (avoids PostgREST join on RLS-blocked table)
    const { data: operator, error: operatorError } = await supabase
      .from("operators")
      .select("secret_key")
      .eq("id", event.operator_id)
      .single();

    if (operatorError || !operator?.secret_key) {
      console.error("[verify-token] operator lookup failed", { operator_id: event.operator_id, operatorError });
      return NextResponse.json({ error: "Operator not configured" }, { status: 500 });
    }

    const operatorSecret = operator.secret_key;

    // Now verify signature and expiry
    let payload;
    try {
      payload = await verifyInboundToken(token, operatorSecret);
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const { email } = payload;

    // Find or create the Supabase auth user
    // createUser is idempotent-ish — if the email exists it returns an error we handle
    let userId: string;
    const { data: created, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
      });

    if (createError) {
      // User already exists — look them up via our public users table
      const { data: existingProfile, error: lookupError } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (lookupError || !existingProfile) {
        return NextResponse.json(
          { error: "Failed to locate user account" },
          { status: 500 }
        );
      }
      userId = existingProfile.id;
    } else {
      userId = created.user.id;
    }

    // Upsert the user row in our public users table
    await supabase
      .from("users")
      .upsert({ id: userId, email }, { onConflict: "id", ignoreDuplicates: true });

    // Stamp the verified badge (no-op if already exists)
    await supabase
      .from("verified_badges")
      .upsert(
        { user_id: userId, event_id },
        { onConflict: "user_id,event_id", ignoreDuplicates: true }
      );

    // Return the verified email so the client can trigger the magic link via signInWithOtp.
    // We don't send from here — generateLink doesn't deliver email; signInWithOtp does.
    return NextResponse.json({
      ok: true,
      email,
      event: {
        id: event.id,
        name: event.name,
        festival_name: event.festival_name,
      },
    });
  } catch (err) {
    console.error("[verify-token]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
