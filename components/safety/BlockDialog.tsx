"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  targetUserId: string;
  targetName: string;
  open: boolean;
  onClose: () => void;
  eventId?: string;
}

export function BlockDialog({ targetUserId, targetName, open, onClose, eventId }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  if (!open) return null;

  async function confirm() {
    setSubmitting(true);
    const res = await fetch("/api/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocked_id: targetUserId }),
    });
    setSubmitting(false);
    if (res.ok) {
      onClose();
      router.push(eventId ? `/feed?event=${eventId}` : "/feed");
    }
  }

  return (
    <div className="absolute right-0 top-10 w-72 bg-card rounded-2xl shadow-xl border border-sunken z-50 overflow-hidden">
      <div className="px-4 py-4">
        <p className="text-sm text-ink font-medium">Block {targetName}?</p>
        <p className="text-xs text-ink/50 mt-1.5 leading-relaxed">
          They won&apos;t be notified. You won&apos;t see each other in the feed, and you&apos;ll
          leave any group you both share.
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={confirm}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl bg-status-report text-white text-sm font-medium disabled:opacity-50"
          >
            {submitting ? "Blocking…" : "Block"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-sunken border border-ink/15 text-ink/70 text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
