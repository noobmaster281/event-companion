"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function CreateGroupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("event");

  const [groupName, setGroupName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backHref = eventId ? `/feed?event=${eventId}` : "/feed";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/"); return; }

    let resolvedEventId = eventId;
    if (!resolvedEventId) {
      const { data: badge } = await supabase
        .from("verified_badges")
        .select("event_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();
      if (!badge) {
        setError("You need a verified ticket to create a group.");
        setSubmitting(false);
        return;
      }
      resolvedEventId = badge.event_id;
    }

    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({
        event_id: resolvedEventId,
        name: groupName.trim() || null,
        created_by: user.id,
        status: "open",
      })
      .select("id")
      .single();

    if (groupError || !group) {
      setError("Failed to create group. Please try again.");
      setSubmitting(false);
      return;
    }

    await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: user.id,
      status: "confirmed",
    });

    router.push(`/groups/${group.id}`);
  }

  return (
    <div className="flex flex-col flex-1 px-5 pt-8 pb-8">
      <Link href={backHref} className="inline-flex items-center gap-1 text-neutral-400 text-sm mb-8">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Feed
      </Link>

      <h1 className="text-2xl font-bold text-white">Start a group</h1>
      <p className="text-sm text-neutral-400 mt-2 mb-8">
        You&apos;ll be the first confirmed member. Others can request to join from the feed.
        Chat unlocks once 2 members are confirmed.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Group name <span className="text-neutral-500">(optional)</span>
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g. Mainstage crew, Sunday squad…"
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-brand-500 transition-colors"
            maxLength={60}
          />
          <p className="mt-2 text-xs text-neutral-500">
            Leave blank and people will see your name instead.
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-auto w-full py-4 rounded-2xl bg-brand-500 text-white font-semibold text-base disabled:opacity-40 hover:bg-brand-600 active:scale-95 transition-all"
        >
          {submitting ? "Creating…" : "Create group"}
        </button>
      </form>
    </div>
  );
}

export default function CreateGroupPage() {
  return (
    <Suspense>
      <CreateGroupForm />
    </Suspense>
  );
}
