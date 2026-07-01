"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { AttendeeCard, type AttendeeCardData } from "@/components/AttendeeCard";
import type { VibeTag } from "@/lib/types";

const VIBE_LABELS: Record<VibeTag, string> = {
  "here-for-headliners": "Headliners",
  "discover-new-artists": "Discover",
  "dance-all-night": "Dance",
  "chill-vibes": "Chill",
  "front-row-energy": "Front row",
  "festival-foodie": "Foodie",
  photographer: "Photographer",
  "first-timer": "First timer",
};

interface Props {
  currentUserId: string;
  attendees: AttendeeCardData[];
  event: { id: string; name: string; festival_name: string } | null;
  myGroup: { id: string; status: string } | null;
}


type GroupFilter = "all" | "looking" | "forming";

export default function FeedClient({ attendees, event, myGroup }: Props) {
  const [selectedVibes, setSelectedVibes] = useState<VibeTag[]>([]);
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("all");

  // Collect all vibe tags present in the feed
  const allVibes = useMemo(() => {
    const seen = new Set<VibeTag>();
    attendees.forEach((a) => a.vibeTags.forEach((t) => seen.add(t)));
    return Array.from(seen) as VibeTag[];
  }, [attendees]);

  const filtered = useMemo(() => {
    return attendees.filter((a) => {
      if (selectedVibes.length > 0 && !selectedVibes.some((v) => a.vibeTags.includes(v))) return false;
      if (groupFilter === "looking" && a.group !== null) return false;
      if (groupFilter === "forming" && a.group === null) return false;
      return true;
    });
  }, [attendees, selectedVibes, groupFilter]);

  function toggleVibe(tag: VibeTag) {
    setSelectedVibes((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  return (
    <div className="flex flex-col flex-1 pb-8">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <Link href="/feed" className="inline-flex items-center gap-1 text-neutral-400 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All events
        </Link>
        <h1 className="text-2xl font-bold text-white truncate">
          {event?.festival_name ?? "Your Event"}
        </h1>
        <p className="text-sm text-neutral-500 mt-0.5">{event?.name}</p>

        {/* My group status */}
        {myGroup ? (
          <Link
            href={`/groups/${myGroup.id}`}
            className="mt-3 flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 rounded-xl px-4 py-2.5"
          >
            <span className="text-brand-500 text-sm font-medium">
              {myGroup.status === "confirmed" ? "Your group is confirmed" : "You have a forming group"}
            </span>
            <svg className="w-4 h-4 text-brand-500 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : (
          <Link
            href={`/groups/create?event=${event?.id ?? ""}`}
            className="mt-3 flex items-center gap-2 bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 hover:border-brand-500 transition-colors"
          >
            <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-neutral-300 text-sm font-medium">Start a group</span>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="px-5 space-y-3 mb-4">
        {/* Group filter */}
        <div className="flex gap-2">
          {(["all", "looking", "forming"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setGroupFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
                groupFilter === f
                  ? "bg-brand-500 border-brand-500 text-white"
                  : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
              }`}
            >
              {f === "all" ? "Everyone" : f === "looking" ? "No group yet" : "Forming group"}
            </button>
          ))}
        </div>

        {/* Vibe tag filter */}
        {allVibes.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-hide">
            {allVibes.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleVibe(tag)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                  selectedVibes.includes(tag)
                    ? "bg-brand-500 border-brand-500 text-white"
                    : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
                }`}
              >
                {VIBE_LABELS[tag]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Attendee count */}
      <p className="px-5 text-xs text-neutral-500 mb-3">
        {filtered.length} {filtered.length === 1 ? "attendee" : "attendees"}
        {(selectedVibes.length > 0 || groupFilter !== "all") && " matching filters"}
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="px-5 grid grid-cols-2 gap-3">
          {filtered.map((attendee) => (
            <AttendeeCard key={attendee.userId} {...attendee} eventId={event?.id} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 text-center px-8 py-16">
          <p className="text-neutral-400 text-sm">No attendees match your filters.</p>
          <button
            onClick={() => { setSelectedVibes([]); setGroupFilter("all"); }}
            className="mt-3 text-brand-500 text-sm"
          >
            Clear filters
          </button>
        </div>
      )}

      {attendees.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 text-center px-8 py-16">
          <p className="text-neutral-400 text-sm">You&apos;re the first one here.</p>
          <p className="text-neutral-600 text-xs mt-1">Other verified attendees will appear as they join.</p>
        </div>
      )}
    </div>
  );
}
