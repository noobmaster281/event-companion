import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReportReason } from "@/lib/types";

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "harassment", label: "Harassment or unwanted contact" },
  { value: "inappropriate-messages", label: "Inappropriate messages" },
  { value: "fake-or-impersonation", label: "Fake profile or impersonation" },
  { value: "spam", label: "Spam" },
  { value: "safety-concern", label: "Safety concern" },
  { value: "other", label: "Other" },
];

const reportReasonValues = REPORT_REASONS.map((r) => r.value) as [ReportReason, ...ReportReason[]];
export const reportReasonSchema = z.enum(reportReasonValues);

// zod's built-in .uuid() enforces real RFC 4122 version/variant bits, which is
// stricter than Postgres's own `uuid` column type (any UUID-shaped string is
// valid there). Match the database's actual leniency rather than rejecting
// syntactically-fine ids that just don't happen to be real v4 UUIDs.
const uuidSchema = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "Invalid id");

export const createReportSchema = z.object({
  reported_id: uuidSchema,
  reason: reportReasonSchema,
  details: z.string().max(1000).optional(),
  event_id: uuidSchema.optional(),
  message_id: uuidSchema.optional(),
  also_block: z.boolean().optional().default(true),
});

export const createBlockSchema = z.object({
  blocked_id: uuidSchema,
});

// Fetch the set of user ids blocked-by or blocking the given user (both directions).
// Fails open (empty set) on error — a DB hiccup should degrade to "block
// filtering not applied for this render" rather than crash the page.
export async function getBlockedIds(
  supabase: SupabaseClient,
  userId: string
): Promise<Set<string>> {
  const { data, error } = await supabase.rpc("blocked_user_ids", { me: userId });
  if (error) {
    console.error("[getBlockedIds]", error);
    return new Set();
  }
  return new Set((data ?? []).map((r: { uid: string }) => r.uid));
}

// Shared side effects when a block relationship is created (used by both
// POST /api/blocks and the also_block path of the report route).
export async function applyBlockSideEffects(
  supabase: SupabaseClient,
  blockerId: string,
  blockedId: string
): Promise<{ leftGroupId: string | null }> {
  // Find a group where both are confirmed members.
  const { data: myMemberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", blockerId)
    .eq("status", "confirmed");

  const myGroupIds = (myMemberships ?? []).map((m: { group_id: string }) => m.group_id);
  let leftGroupId: string | null = null;

  if (myGroupIds.length > 0) {
    const { data: sharedRow } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", blockedId)
      .eq("status", "confirmed")
      .in("group_id", myGroupIds)
      .maybeSingle();

    if (sharedRow) {
      leftGroupId = sharedRow.group_id;
      // Self-leave — covered by the group_members_delete_self RLS policy.
      await supabase
        .from("group_members")
        .delete()
        .eq("group_id", sharedRow.group_id)
        .eq("user_id", blockerId);
    }
  }

  // Clean up pending join requests in either direction.
  // (a) Blocked user's pending request into a group the blocker created —
  //     covered by group_members_delete_creator.
  const { data: myCreatedGroups } = await supabase
    .from("groups")
    .select("id")
    .eq("created_by", blockerId);
  const myCreatedGroupIds = (myCreatedGroups ?? []).map((g: { id: string }) => g.id);
  if (myCreatedGroupIds.length > 0) {
    await supabase
      .from("group_members")
      .delete()
      .eq("user_id", blockedId)
      .eq("status", "pending")
      .in("group_id", myCreatedGroupIds);
  }

  // (b) Blocker's own pending request into a group the blocked user created —
  //     covered by group_members_delete_self.
  const { data: theirCreatedGroups } = await supabase
    .from("groups")
    .select("id")
    .eq("created_by", blockedId);
  const theirCreatedGroupIds = (theirCreatedGroups ?? []).map((g: { id: string }) => g.id);
  if (theirCreatedGroupIds.length > 0) {
    await supabase
      .from("group_members")
      .delete()
      .eq("user_id", blockerId)
      .eq("status", "pending")
      .in("group_id", theirCreatedGroupIds);
  }

  return { leftGroupId };
}
