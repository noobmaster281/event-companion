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
      ? supabase.from("verified_badges").select("event_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] }),
  ]);

  const verifiedEventIds = (badges ?? []).map((b) => b.event_id);
  const eventIds = (events ?? []).map((e) => e.id);

  // Count verified attendees per event
  const { data: allBadges } = eventIds.length > 0
    ? await supabase.from("verified_badges").select("event_id, user_id").in("event_id", eventIds)
    : { data: [] };

  const verifiedByEvent = new Map<string, Set<string>>();
  for (const b of allBadges ?? []) {
    const s = verifiedByEvent.get(b.event_id) ?? new Set<string>();
    s.add(b.user_id);
    verifiedByEvent.set(b.event_id, s);
  }

  // Count who is in a confirmed group spot per event
  const { data: allGroups } = eventIds.length > 0
    ? await supabase.from("groups").select("id, event_id").in("event_id", eventIds)
    : { data: [] };

  const groupIds = (allGroups ?? []).map((g) => g.id);
  const { data: allMembers } = groupIds.length > 0
    ? await supabase
        .from("group_members")
        .select("group_id, user_id, status")
        .in("group_id", groupIds)
        .eq("status", "confirmed")
    : { data: [] };

  const inGroupByEvent = new Map<string, Set<string>>();
  for (const m of allMembers ?? []) {
    const g = (allGroups ?? []).find((g) => g.id === m.group_id);
    if (!g) continue;
    const s = inGroupByEvent.get(g.event_id) ?? new Set<string>();
    s.add(m.user_id);
    inGroupByEvent.set(g.event_id, s);
  }

  const enrichedEvents = (events ?? []).map((event) => {
    const verified = verifiedByEvent.get(event.id) ?? new Set<string>();
    const inGroup = inGroupByEvent.get(event.id) ?? new Set<string>();
    const lookingCount = Array.from(verified).filter((uid) => !inGroup.has(uid)).length;
    return {
      ...event,
      verifiedCount: verified.size,
      lookingCount,
    };
  });

  return (
    <div className="flex flex-col flex-1 pb-8">
      <div className="px-5 pt-10 pb-6">
        <h1 className="text-2xl font-serif font-bold text-ink">Upcoming Events</h1>
        <p className="text-sm text-ink/50 mt-1">
          Buy a ticket to get verified and find your group.
        </p>
      </div>

      <div className="px-5">
        <EventsClient
          events={enrichedEvents}
          verifiedEventIds={verifiedEventIds}
        />
      </div>

      <div className="px-5 mt-8">
        <Link
          href="/feed"
          className="inline-flex items-center gap-1 text-ink/40 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to feed
        </Link>
      </div>
    </div>
  );
}
