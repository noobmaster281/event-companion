"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  targetUserId: string;
  targetName: string;
  currentUserId: string;
  group: { id: string; name: string | null; confirmedCount: number; maxSize: number } | null;
  myGroup: { id: string; confirmedCount: number; isFull: boolean } | null;
  alreadyRequested: boolean;
  alreadyInGroup: boolean;
  alreadyInAnotherGroup: boolean;
  eventId?: string;
  renderMode: "actions" | "report-only";
}

export function ProfileActions({
  targetUserId,
  targetName,
  currentUserId,
  group,
  myGroup,
  alreadyRequested,
  alreadyInGroup,
  alreadyInAnotherGroup,
  eventId,
  renderMode,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(alreadyRequested);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reported, setReported] = useState(false);
  const router = useRouter();

  if (targetUserId === currentUserId) return null;

  // ---- Report-only mode (header button) ----
  if (renderMode === "report-only") {
    return (
      <div className="relative">
        <button
          onClick={() => setReportOpen((o) => !o)}
          className="p-2 rounded-full hover:bg-ink/5 transition-colors"
          aria-label="Report or block"
        >
          <svg className="w-5 h-5 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
          </svg>
        </button>

        {reportOpen && (
          <div className="absolute right-0 top-10 w-56 bg-card rounded-2xl shadow-xl border border-sunken z-50 overflow-hidden">
            {reported ? (
              <p className="px-4 py-3 text-sm text-ink/60">Report submitted. Thank you.</p>
            ) : (
              <>
                <div className="px-4 pt-3 pb-2">
                  <p className="text-xs font-medium text-ink/50 uppercase tracking-wide mb-2">Reason (optional)</p>
                  <textarea
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="What's the issue?"
                    className="w-full bg-sunken rounded-lg px-3 py-2 text-sm text-ink placeholder-ink/30 focus:outline-none resize-none border border-ink/10"
                    rows={2}
                    maxLength={200}
                  />
                </div>
                <button
                  onClick={async () => {
                    await fetch("/api/report-user", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ reported_id: targetUserId, reason: reportReason.trim() || null }),
                    });
                    setReported(true);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-status-report font-medium hover:bg-status-report/5 transition-colors border-t border-sunken"
                >
                  Report {targetName}
                </button>
              </>
            )}
            <button
              onClick={() => setReportOpen(false)}
              className="w-full px-4 py-3 text-left text-sm text-ink/50 hover:bg-sunken transition-colors border-t border-sunken"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  }

  // ---- Actions mode (bottom of profile) ----

  async function requestToJoin() {
    if (!group) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: currentUserId,
      status: "pending",
    });
    setLoading(false);
    if (!error) {
      setRequested(true);
      router.refresh();
    }
  }

  async function startGroupWith() {
    setLoading(true);
    const res = await fetch("/api/start-group-with", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invitee_id: targetUserId, event_id: eventId }),
    });
    setLoading(false);
    if (res.ok) {
      const { group_id } = await res.json();
      router.push(`/groups/${group_id}`);
    }
  }

  async function inviteToMyGroup() {
    if (!myGroup) return;
    setLoading(true);
    await fetch("/api/invite-to-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group_id: myGroup.id, invitee_id: targetUserId }),
    });
    setLoading(false);
    setRequested(true);
    router.refresh();
  }

  if (alreadyInGroup) {
    return (
      <div className="px-4 py-3 rounded-2xl bg-status-verified/10 border border-status-verified/30 text-center">
        <p className="text-status-verified text-sm font-medium">You&apos;re in this group</p>
      </div>
    );
  }

  // They are in a group
  if (group) {
    const isFull = group.confirmedCount >= group.maxSize;

    if (isFull) {
      return (
        <div className="px-4 py-3 rounded-2xl bg-sunken border border-ink/15 text-center">
          <p className="text-ink/50 text-sm font-medium">Group full</p>
        </div>
      );
    }

    if (requested) {
      return (
        <div className="px-4 py-3 rounded-2xl bg-card border border-ink/15 text-center">
          <p className="text-ink/70 text-sm font-medium">Request sent</p>
          <p className="text-ink/40 text-xs mt-1">Waiting for the group creator to accept</p>
        </div>
      );
    }

    if (alreadyInAnotherGroup) {
      return (
        <div className="px-4 py-3 rounded-2xl bg-card border border-ink/15 text-center">
          <p className="text-ink/50 text-sm font-medium">You&apos;re already in a group</p>
          <p className="text-ink/30 text-xs mt-1">Leave your current group to join a new one</p>
        </div>
      );
    }

    return (
      <button
        onClick={requestToJoin}
        disabled={loading}
        className="w-full py-4 rounded-2xl bg-brand-500 text-white font-semibold text-base disabled:opacity-50 hover:bg-brand-600 active:scale-95 transition-all"
      >
        {loading ? "Sending request…" : `Request to join group (${group.confirmedCount} confirmed)`}
      </button>
    );
  }

  // They have no group
  if (!group) {
    // I have a group and it's not full — invite them
    if (myGroup && !myGroup.isFull) {
      return (
        <div className="space-y-3">
          <button
            onClick={inviteToMyGroup}
            disabled={loading || requested}
            className="w-full py-4 rounded-2xl bg-brand-500 text-white font-semibold text-base disabled:opacity-50 hover:bg-brand-600 active:scale-95 transition-all"
          >
            {loading ? "Sending invite…" : requested ? "Invite sent!" : `Invite ${targetName} to your group`}
          </button>
        </div>
      );
    }

    // I have no group either — start one together
    if (!myGroup) {
      return (
        <button
          onClick={startGroupWith}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-brand-500 text-white font-semibold text-base disabled:opacity-50 hover:bg-brand-600 active:scale-95 transition-all"
        >
          {loading ? "Creating group…" : `Start a group with ${targetName}`}
        </button>
      );
    }

    // My group is full — can't do anything
    return (
      <div className="px-4 py-3 rounded-2xl bg-sunken border border-ink/15 text-center">
        <p className="text-ink/50 text-sm">They&apos;re not in a group yet</p>
        <p className="text-ink/30 text-xs mt-1">Your group is full — no room to invite</p>
      </div>
    );
  }

  return null;
}
