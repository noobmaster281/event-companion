"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { REPORT_REASONS } from "@/lib/safety";
import type { ReportReason } from "@/lib/types";

interface Props {
  targetUserId: string;
  targetName: string;
  open: boolean;
  onClose: () => void;
  eventId?: string;
}

export function ReportSheet({ targetUserId, targetName, open, onClose, eventId }: Props) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  if (!open) return null;

  async function submit() {
    if (!reason || submitting) return;
    setSubmitting(true);
    const res = await fetch("/api/report-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reported_id: targetUserId,
        reason,
        details: details.trim() || undefined,
        event_id: eventId,
        also_block: alsoBlock,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      setSubmitted(true);
    }
  }

  function finish() {
    onClose();
    router.push(eventId ? `/feed?event=${eventId}` : "/feed");
  }

  return (
    <div className="absolute right-0 top-10 w-72 bg-card rounded-2xl shadow-xl border border-sunken z-50 overflow-hidden">
      {submitted ? (
        <div className="px-4 py-4">
          <p className="text-sm text-ink font-medium">Thanks — our team will review this.</p>
          <p className="text-xs text-ink/50 mt-1">
            This is private. {targetName} won&apos;t be told who reported them
            {alsoBlock ? ", and they won't be notified they've been blocked." : "."}
          </p>
          <button
            onClick={finish}
            className="w-full mt-3 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium"
          >
            Done
          </button>
        </div>
      ) : (
        <>
          <div className="px-4 pt-3 pb-2">
            <p className="text-xs font-medium text-ink/50 uppercase tracking-wide mb-2">
              Report {targetName}
            </p>
            <div className="space-y-1.5">
              {REPORT_REASONS.map((r) => (
                <label key={r.value} className="flex items-center gap-2 text-sm text-ink/80">
                  <input
                    type="radio"
                    name="report-reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="accent-brand-500"
                  />
                  {r.label}
                </label>
              ))}
            </div>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Additional details (optional)"
              className="w-full mt-2 bg-sunken rounded-lg px-3 py-2 text-sm text-ink placeholder-ink/30 focus:outline-none resize-none border border-ink/10"
              rows={2}
              maxLength={1000}
            />
            <label className="flex items-center gap-2 text-xs text-ink/60 mt-2">
              <input
                type="checkbox"
                checked={alsoBlock}
                onChange={(e) => setAlsoBlock(e.target.checked)}
                className="accent-brand-500"
              />
              Also block {targetName}
            </label>
            <p className="text-[11px] text-ink/40 mt-1.5 leading-relaxed">
              This is private — {targetName} won&apos;t know who reported them, and won&apos;t be notified.
            </p>
          </div>
          <button
            onClick={submit}
            disabled={!reason || submitting}
            className="w-full px-4 py-3 text-left text-sm text-status-report font-medium hover:bg-status-report/5 transition-colors border-t border-sunken disabled:opacity-40"
          >
            {submitting ? "Submitting…" : "Submit report"}
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-3 text-left text-sm text-ink/50 hover:bg-sunken transition-colors border-t border-sunken"
          >
            Cancel
          </button>
        </>
      )}
    </div>
  );
}
