"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ReportSheet } from "@/components/safety/ReportSheet";
import { BlockDialog } from "@/components/safety/BlockDialog";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState<"report" | "block" | null>(null);
  const router = useRouter();

  if (targetUserId === currentUserId) return null;

  // ---- Report-only mode (header button) ----
  if (renderMode === "report-only") {
    return (
      <div className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="p-2 rounded-full hover:bg-ink/5 transition-colors"
          aria-label="More options"
        >
          <svg className="w-5 h-5 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
          </svg>
        </button>

        {menuOpen && !activeSheet && (
          <div className="absolute right-0 top-10 w-44 bg-card rounded-2xl shadow-xl border border-sunken z-50 overflow-hidden">
            <button
              onClick={() => setActiveSheet("report")}
              className="w-full px-4 py-3 text-left text-sm text-status-report font-medium hover:bg-status-report/5 transition-colors"
            >
              Report
            </button>
            <button
              onClick={() => setActiveSheet("block")}
              className="w-full px-4 py-3 text-left text-sm text-status-report font-medium hover:bg-status-report/5 transition-colors border-t border-sunken"
            >
              Block
            </button>
            <button
              onClick={() => setMenuOpen(false)}
              className="w-full px-4 py-3 text-left text-sm text-ink/50 hover:bg-sunken transition-colors border-t border-sunken"
            >
              Cancel
            </button>
          </div>
        )}

        <ReportSheet
          targetUserId={targetUserId}
          targetName={targetName}
          open={activeSheet === "report"}
          onClose={() => {
            setActiveSheet(null);
            setMenuOpen(false);
          }}
          eventId={eventId}
        />
        <BlockDialog
          targetUserId={targetUserId}
          targetName={targetName}
          open={activeSheet === "block"}
          onClose={() => {
            setActiveSheet(null);
            setMenuOpen(false);
          }}
          eventId={eventId}
        />
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
