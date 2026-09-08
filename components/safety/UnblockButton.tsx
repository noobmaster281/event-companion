"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  blockedUserId: string;
}

export function UnblockButton({ blockedUserId }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function unblock() {
    setLoading(true);
    const res = await fetch(`/api/blocks/${blockedUserId}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      onClick={unblock}
      disabled={loading}
      className="px-3 py-1.5 rounded-lg bg-sunken border border-ink/15 text-ink/70 text-sm font-medium disabled:opacity-50 hover:bg-ink/5 transition-colors"
    >
      {loading ? "Unblocking…" : "Unblock"}
    </button>
  );
}
