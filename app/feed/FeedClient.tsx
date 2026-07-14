"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { AttendeeCard, type AttendeeCardData } from "@/components/AttendeeCard";
import type { VibeTag, Gender } from "@/lib/types";

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

const GENDER_LABELS: Record<Gender, string> = {
  male: "Male",
  female: "Female",
  "non-binary": "Non-binary",
  "prefer-not-to-say": "Other",
};

const ALL_GENDERS: Gender[] = ["male", "female", "non-binary", "prefer-not-to-say"];

interface Props {
  currentUserId: string;
  attendees: AttendeeCardData[];
  event: { id: string; name: string; festival_name: string; verifiedCount: number; lookingCount: number } | null;
  myGroup: { id: string; status: string } | null;
}

type GroupFilter = "all" | "looking" | "forming";

function sortAttendees(list: AttendeeCardData[]): AttendeeCardData[] {
  return [...list].sort((a, b) => {
    const rank = (x: AttendeeCardData) => {
      if (!x.group) return 0; // solo — top
      const { confirmedCount, maxSize } = x.group;
      if (confirmedCount >= maxSize) return 3; // full group — bottom
      if (x.group.status === "confirmed") return 2; // confirmed group
      return 1; // forming
    };
    return rank(a) - rank(b);
  });
}

export default function FeedClient({ currentUserId, attendees, event, myGroup }: Props) {
  const [selectedVibes, setSelectedVibes] = useState<VibeTag[]>([]);
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("all");
  const [genderFilter, setGenderFilter] = useState<Gender | "all">("all");

  const allVibes = useMemo(() => {
    const seen = new Set<VibeTag>();
    attendees.forEach((a) => a.vibeTags.forEach((t) => seen.add(t)));
    return Array.from(seen) as VibeTag[];
  }, [attendees]);

  const filtered = useMemo(() => {
    const result = attendees.filter((a) => {
      if (selectedVibes.length > 0 && !selectedVibes.some((v) => a.vibeTags.includes(v))) return false;
      if (groupFilter === "looking" && a.group !== null && (a.group.confirmedCount > 1 || a.group.status === "confirmed")) return false;
      if (groupFilter === "forming" && (a.group === null || a.group.confirmedCount <= 1)) return false;
      if (genderFilter !== "all" && a.gender !== genderFilter) return false;
      return true;
    });
    return sortAttendees(result);
  }, [attendees, selectedVibes, groupFilter, genderFilter]);

  function toggleVibe(tag: VibeTag) {
    setSelectedVibes((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  const hasFilters = selectedVibes.length > 0 || groupFilter !== "all" || genderFilter !== "all";

  return (
    <div className="flex flex-col flex-1 pb-24 relative">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <Link href="/feed" className="inline-flex items-center gap-1 text-ink/50 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All events
        </Link>
        <h1 className="text-2xl font-serif font-bold text-ink truncate">
          {event?.festival_name ?? "Your Event"}
        </h1>
        <p className="text-sm text-ink/50 mt-0.5">{event?.name}</p>

        {/* Event stats */}
        {event && (
          <p className="text-xs text-ink/40 mt-1">
            {event.verifiedCount} verified · {event.lookingCount} looking for a group
          </p>
        )}

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
        ) : null}
      </div>

      {/* Filters */}
      <div className="px-5 space-y-2.5 mb-4">
        {/* Gender filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-hide">
          <button
            onClick={() => setGenderFilter("all")}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              genderFilter === "all"
                ? "bg-brand-500 border-brand-500 text-white"
                : "border-ink/20 text-ink/60 bg-card hover:border-ink/40"
            }`}
          >
            Everyone
          </button>
          {ALL_GENDERS.filter((g) => g !== "prefer-not-to-say").map((g) => (
            <button
              key={g}
              onClick={() => setGenderFilter(g === genderFilter ? "all" : g)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                genderFilter === g
                  ? "bg-brand-500 border-brand-500 text-white"
                  : "border-ink/20 text-ink/60 bg-card hover:border-ink/40"
              }`}
            >
              {GENDER_LABELS[g]}
            </button>
          ))}
        </div>

        {/* Group filter */}
        <div className="flex gap-2">
          {(["all", "looking", "forming"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setGroupFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
                groupFilter === f
                  ? "bg-brand-500 border-brand-500 text-white"
                  : "border-ink/20 text-ink/60 bg-card hover:border-ink/40"
              }`}
            >
              {f === "all" ? "All" : f === "looking" ? "Solo" : "Forming"}
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
                    : "border-ink/20 text-ink/60 bg-card hover:border-ink/40"
                }`}
              >
                {VIBE_LABELS[tag]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Attendee count */}
      <p className="px-5 text-xs text-ink/40 mb-3">
        {filtered.length} {filtered.length === 1 ? "person" : "people"}
        {hasFilters && " matching filters"}
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
          <p className="text-ink/40 text-sm">No one matches your filters.</p>
          <button
            onClick={() => { setSelectedVibes([]); setGroupFilter("all"); setGenderFilter("all"); }}
            className="mt-3 text-brand-500 text-sm font-medium"
          >
            Clear filters
          </button>
        </div>
      )}

      {attendees.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 text-center px-8 py-16">
          <p className="text-ink/40 text-sm">You&apos;re the first one here.</p>
          <p className="text-ink/30 text-xs mt-1">Other verified attendees will appear as they join.</p>
        </div>
      )}

      {/* FAB — start a group */}
      {!myGroup && (
        <Link
          href={`/groups/create?event=${event?.id ?? ""}`}
          className="fixed bottom-24 right-5 w-14 h-14 bg-brand-500 rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-30"
          aria-label="Start a group"
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Link>
      )}
    </div>
  );
}
