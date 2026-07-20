"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type EventRow = {
  id: string;
  name: string;
  festival_name: string;
  event_date: string | null;
  photo_url: string | null;
  ticket_url: string | null;
  verifiedCount: number;
  lookingCount: number;
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function EventCard({
  event,
  initialVerified,
}: {
  event: EventRow;
  initialVerified: boolean;
}) {
  const [verified, setVerified] = useState(initialVerified);
  const [loading, setLoading] = useState(false);

  async function handleVerify() {
    setLoading(true);
    const res = await fetch("/api/dev/verify-badge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: event.id }),
    });
    if (res.ok) setVerified(true);
    setLoading(false);
  }

  return (
    <div className="bg-card rounded-3xl overflow-hidden shadow-sm border border-sunken">
      <div className="relative w-full aspect-[16/9] bg-sunken">
        {event.photo_url ? (
          <Image
            src={event.photo_url}
            alt={event.festival_name}
            fill
            className="object-cover"
            sizes="(max-width: 448px) 100vw, 448px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-ink/20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="p-5">
        <p className="text-xs text-brand-500 font-medium uppercase tracking-wide mb-1">
          {event.festival_name}
        </p>
        <h2 className="text-lg font-serif font-bold text-ink leading-snug">{event.name}</h2>
        {event.event_date && (
          <p className="text-sm text-ink/50 mt-1">{formatDate(event.event_date)}</p>
        )}
        <p className="text-xs text-ink/60 mt-1 font-medium">
          {event.verifiedCount} verified · {event.lookingCount} looking for a group
        </p>

        <div className="mt-4 flex gap-3">
          <a
            href={event.ticket_url ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-brand-500 text-white text-sm font-semibold active:scale-95 transition-transform"
          >
            Get tickets
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>

          {verified ? (
            <Link
              href={`/feed?event=${event.id}`}
              className="px-4 py-3 rounded-2xl text-sm font-semibold border border-status-verified/40 text-status-verified bg-status-verified/10 active:scale-95 transition-transform"
            >
              Verified ✓
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleVerify}
              disabled={loading}
              className="px-4 py-3 rounded-2xl text-sm font-semibold border border-ink/20 text-ink/60 hover:border-ink/40 disabled:opacity-50 transition-all active:scale-95"
            >
              {loading ? "…" : "Dev: Verify"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EventsClient({
  events,
  verifiedEventIds,
}: {
  events: EventRow[];
  verifiedEventIds: string[];
}) {
  const verifiedSet = new Set(verifiedEventIds);

  if (events.length === 0) {
    return (
      <p className="text-ink/40 text-sm text-center py-12">
        No upcoming events yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          initialVerified={verifiedSet.has(event.id)}
        />
      ))}
    </div>
  );
}
