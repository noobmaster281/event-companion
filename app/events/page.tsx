import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EventsClient } from "./EventsClient";

export default async function EventsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: events }, { data: badges }] = await Promise.all([
    supabase
      .from("events")
      .select("id, name, festival_name, event_date, photo_url, ticket_url")
      .order("event_date", { ascending: true }),
    user
      ? supabase
          .from("verified_badges")
          .select("event_id")
          .eq("user_id", user.id)
      : Promise.resolve({ data: [] }),
  ]);

  const verifiedEventIds = (badges ?? []).map((b) => b.event_id);

  return (
    <div className="flex flex-col flex-1 pb-8">
      <div className="px-5 pt-10 pb-6">
        <h1 className="text-2xl font-bold text-white">Upcoming Events</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Buy a ticket to get verified and find your group.
        </p>
      </div>

      <div className="px-5">
        <EventsClient
          events={events ?? []}
          verifiedEventIds={verifiedEventIds}
        />
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
