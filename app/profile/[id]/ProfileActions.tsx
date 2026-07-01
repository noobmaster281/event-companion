"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  targetUserId: string;
  currentUserId: string;
  group: { id: string; name: string | null; confirmedCount: number } | null;
  alreadyRequested: boolean;
  alreadyInGroup: boolean;
}

export function ProfileActions({ targetUserId, currentUserId, group, alreadyRequested, alreadyInGroup }: Props) {
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(alreadyRequested);
  const router = useRouter();

  if (targetUserId === currentUserId) return null;

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

  if (alreadyInGroup) {
    return (
      <div className="px-4 py-3 rounded-2xl bg-green-500/10 border border-green-500/30 text-center">
        <p className="text-green-400 text-sm font-medium">You&apos;re in this group</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="px-4 py-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-center">
        <p className="text-neutral-400 text-sm">Not in a group yet</p>
        <p className="text-neutral-600 text-xs mt-1">You can connect after they join one</p>
      </div>
    );
  }

  if (requested) {
    return (
      <div className="px-4 py-3 rounded-2xl bg-neutral-900 border border-neutral-700 text-center">
        <p className="text-neutral-300 text-sm font-medium">Request sent</p>
        <p className="text-neutral-500 text-xs mt-1">Waiting for the group creator to accept</p>
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
