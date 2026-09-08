"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ReportStatus } from "@/lib/types";

const STATUS_OPTIONS: ReportStatus[] = ["open", "reviewing", "resolved", "dismissed"];

interface Props {
  id: string;
  status: ReportStatus;
  resolverNotes: string | null;
}

export function ReportRow({ id, status, resolverNotes }: Props) {
  const [statusVal, setStatusVal] = useState<ReportStatus>(status);
  const [notes, setNotes] = useState(resolverNotes ?? "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: statusVal, resolver_notes: notes.trim() || undefined }),
    });
    setSaving(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex items-center gap-2 mt-3">
      <select
        value={statusVal}
        onChange={(e) => setStatusVal(e.target.value as ReportStatus)}
        className="bg-sunken border border-ink/15 rounded-lg px-2 py-1.5 text-xs text-ink"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Resolver notes"
        className="flex-1 bg-sunken border border-ink/15 rounded-lg px-2 py-1.5 text-xs text-ink placeholder-ink/30"
      />
      <button
        onClick={save}
        disabled={saving}
        className="px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-medium disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
