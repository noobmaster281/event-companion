"use client";

import Link from "next/link";
import Image from "next/image";
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

export interface AttendeeCardData {
  userId: string;
  name: string;
  photoUrl: string | null;
  vibeTags: VibeTag[];
  groupSizePref: number | null;
  socialHandle: string;
  gender: Gender | null;
  age: number | null;
  group: {
    id: string;
    status: "open" | "confirmed";
    confirmedCount: number;
    maxSize: number;
  } | null;
}

function GroupStatusPill({ group }: { group: AttendeeCardData["group"] }) {
  if (!group) {
    return (
      <div className="absolute bottom-2 left-2 text-xs font-semibold px-2 py-1 rounded-full bg-[#3B7DA6]/90 text-white">
        Solo
      </div>
    );
  }

  const { status, confirmedCount, maxSize } = group;
  const isFull = confirmedCount >= maxSize;

  if (isFull) {
    return (
      <div className="absolute bottom-2 left-2 text-xs font-semibold px-2 py-1 rounded-full bg-ink/70 text-white">
        Group full
      </div>
    );
  }

  if (status === "confirmed" || confirmedCount > 1) {
    return (
      <div className="absolute bottom-2 left-2 text-xs font-semibold px-2 py-1 rounded-full bg-[#2F8F5B]/90 text-white">
        {status === "confirmed" ? `Group · ${confirmedCount}` : `Forming (${confirmedCount}/${maxSize})`}
      </div>
    );
  }

  // Solo-open: in a group but only themselves
  if (confirmedCount <= 1) {
    return (
      <div className="absolute bottom-2 left-2 text-xs font-semibold px-2 py-1 rounded-full bg-[#3B7DA6]/90 text-white">
        Solo · Open
      </div>
    );
  }

  return null;
}

export function AttendeeCard({ userId, name, photoUrl, vibeTags, socialHandle, group, eventId }: AttendeeCardData & { eventId?: string }) {
  const href = eventId ? `/profile/${userId}?event=${eventId}` : `/profile/${userId}`;
  return (
    <Link href={href} className="block active:scale-95 transition-transform">
      <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-sunken">
        <div className="aspect-[3/4] bg-sunken relative">
          {photoUrl ? (
            <Image src={photoUrl} alt={name} fill className="object-cover" sizes="50vw" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-sunken">
              <span className="text-5xl font-serif font-bold text-ink/20">
                {name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Verified badge */}
          <div className="absolute top-2 right-2 w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <GroupStatusPill group={group} />
        </div>

        <div className="p-3 space-y-1.5">
          <p className="font-serif font-semibold text-ink text-sm leading-tight truncate">{name}</p>
          <p className="text-xs text-ink/50 truncate">{socialHandle}</p>
          {vibeTags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {vibeTags.slice(0, 2).map((tag) => (
                <span key={tag} className="text-xs bg-sunken text-ink/60 px-2 py-0.5 rounded-full border border-ink/10">
                  {VIBE_LABELS[tag]}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
