import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function EventsPage() {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("id, name, festival_name, event_date, photo_url, ticket_url")
    .order("event_date", { ascending: true });

  return (
    <div className="flex flex-col flex-1 pb-8">
      <div className="px-5 pt-10 pb-6">
        <h1 className="text-2xl font-bold text-white">Upcoming Events</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Buy a ticket to get verified and find your group.
        </p>
      </div>

      <div className="flex flex-col gap-4 px-5">
        {(events ?? []).length === 0 && (
          <p className="text-neutral-500 text-sm text-center py-12">
            No upcoming events yet.
          </p>
        )}

        {(events ?? []).map((event) => (
          <div
            key={event.id}
            className="bg-neutral-900 rounded-3xl overflow-hidden"
          >
            {/* Photo */}
            <div className="relative w-full aspect-[16/9] bg-neutral-800">
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
                    className="w-10 h-10 text-neutral-700"
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

            {/* Info */}
            <div className="p-5">
              <p className="text-xs text-brand-400 font-medium uppercase tracking-wide mb-1">
                {event.festival_name}
              </p>
              <h2 className="text-lg font-bold text-white leading-snug">
                {event.name}
              </h2>
              {event.event_date && (
                <p className="text-sm text-neutral-400 mt-1">
                  {formatDate(event.event_date)}
                </p>
              )}

              <a
                href={event.ticket_url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-brand-500 text-white text-sm font-semibold active:scale-95 transition-transform"
              >
                Get tickets
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 mt-8">
        <Link
          href="/feed"
          className="inline-flex items-center gap-1 text-neutral-500 text-sm"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to feed
        </Link>
      </div>
    </div>
  );
}
