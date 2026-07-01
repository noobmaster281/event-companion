"use client";

import Link from "next/link";
import Image from "next/image";
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

export interface AttendeeCardData {
  userId: string;
  name: string;
  photoUrl: string | null;
  vibeTags: VibeTag[];
  groupSizePref: number | null;
  socialHandle: string;
  group: {
    id: string;
    status: "open" | "confirmed";
    confirmedCount: number;
  } | null;
}

export function AttendeeCard({ userId, name, photoUrl, vibeTags, socialHandle, group }: AttendeeCardData) {
  return (
    <Link href={`/profile/${userId}`} className="block active:scale-95 transition-transform">
      <div className="bg-neutral-900 rounded-2xl overflow-hidden">
        <div className="aspect-[3/4] bg-neutral-800 relative">
          {photoUrl ? (
            <Image src={photoUrl} alt={name} fill className="object-cover" sizes="50vw" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-800">
              <span className="text-5xl font-bold text-neutral-600">
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

          {/* Group status pill */}
          {group && (
            <div className={`absolute bottom-2 left-2 text-xs font-semibold px-2 py-1 rounded-full backdrop-blur-sm ${
              group.status === "confirmed"
                ? "bg-green-500/90 text-white"
                : "bg-amber-400/90 text-black"
            }`}>
              {group.status === "confirmed"
                ? `Group · ${group.confirmedCount}`
                : "Forming…"}
            </div>
          )}
        </div>

        <div className="p-3 space-y-1.5">
          <p className="font-semibold text-white text-sm leading-tight truncate">{name}</p>
          <p className="text-xs text-neutral-500 truncate">{socialHandle}</p>
          {vibeTags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {vibeTags.slice(0, 2).map((tag) => (
                <span key={tag} className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full">
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
