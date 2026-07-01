import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import FeedClient from "./FeedClient";
import type { AttendeeCardData } from "@/components/AttendeeCard";
import type { VibeTag } from "@/lib/types";

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const { event: eventId } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("users")
    .select("profile_complete")
    .eq("id", user.id)
    .single();

  if (!profile?.profile_complete) redirect("/profile/create");

  const { data: myBadges } = await supabase
    .from("verified_badges")
    .select("event_id")
    .eq("user_id", user.id);

  if (!myBadges || myBadges.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-6 text-center">
        <p className="text-neutral-400 text-sm">No verified events yet.</p>
        <p className="text-neutral-600 text-xs mt-1">
          Click the button on your ticket confirmation to get verified.
        </p>
      </div>
    );
  }

  const myEventIds = myBadges.map((b) => b.event_id);

  // No event selected (or invalid) — show event picker
  if (!eventId || !myEventIds.includes(eventId)) {
    const { data: events } = await supabase
      .from("events")
      .select("id, name, festival_name, event_date")
      .in("id", myEventIds)
      .order("event_date", { ascending: true });

    return (
      <div className="flex flex-col flex-1 pb-8">
        <div className="px-5 pt-10 pb-6">
          <h1 className="text-2xl font-bold text-white">Your Events</h1>
          <p className="text-sm text-neutral-400 mt-1">Pick an event to see who else is going.</p>
        </div>

        <div className="px-5 flex flex-col gap-3">
          {(events ?? []).map((event) => (
            <Link
              key={event.id}
              href={`/feed?event=${event.id}`}
              className="flex items-center gap-4 bg-neutral-900 rounded-2xl px-4 py-4 active:scale-[0.98] transition-transform"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs text-brand-400 font-medium uppercase tracking-wide mb-0.5">
                  {event.festival_name}
                </p>
                <p className="text-white font-semibold text-sm leading-snug truncate">
                  {event.name}
                </p>
                {event.event_date && (
                  <p className="text-xs text-neutral-500 mt-0.5">{formatDate(event.event_date)}</p>
                )}
              </div>
              <svg className="w-5 h-5 text-neutral-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // Event selected — fetch event details
  const { data: eventRow } = await supabase
    .from("events")
    .select("id, name, festival_name")
    .eq("id", eventId)
    .single();

  // Other verified attendees for this event
  const { data: otherBadges } = await supabase
    .from("verified_badges")
    .select("user_id")
    .eq("event_id", eventId)
    .neq("user_id", user.id);

  const otherUserIds = (otherBadges ?? []).map((b) => b.user_id);

  const { data: userProfiles } = otherUserIds.length > 0
    ? await supabase
        .from("users")
        .select("id, name, photo_url, vibe_tags, group_size_preference, instagram_handle, tiktok_handle, snapchat_handle")
        .in("id", otherUserIds)
    : { data: [] };

  // Groups for this event
  const { data: rawGroups } = await supabase
    .from("groups")
    .select("id, name, status, created_by, event_id")
    .eq("event_id", eventId);

  const groupIds = (rawGroups ?? []).map((g) => g.id);

  const { data: rawMembers } = groupIds.length > 0
    ? await supabase
        .from("group_members")
        .select("group_id, user_id, status")
        .in("group_id", groupIds)
    : { data: [] };

  const userGroupMap = new Map<
    string,
    { id: string; status: "open" | "confirmed"; confirmedCount: number }
  >();

  for (const group of rawGroups ?? []) {
    const members = (rawMembers ?? []).filter((m) => m.group_id === group.id);
    const confirmed = members.filter((m) => m.status === "confirmed");
    for (const m of confirmed) {
      userGroupMap.set(m.user_id, {
        id: group.id,
        status: group.status as "open" | "confirmed",
        confirmedCount: confirmed.length,
      });
    }
  }

  const myGroup = userGroupMap.get(user.id) ?? null;

  const attendees: AttendeeCardData[] = (userProfiles ?? []).map((u) => {
    const handle = u.instagram_handle
      ? `@${u.instagram_handle}`
      : u.tiktok_handle
      ? `@${u.tiktok_handle}`
      : u.snapchat_handle
      ? `@${u.snapchat_handle}`
      : "";

    return {
      userId: u.id,
      name: u.name ?? "Anonymous",
      photoUrl: u.photo_url,
      vibeTags: (u.vibe_tags ?? []) as VibeTag[],
      groupSizePref: u.group_size_preference,
      socialHandle: handle,
      group: userGroupMap.get(u.id) ?? null,
    };
  });

  return (
    <FeedClient
      currentUserId={user.id}
      attendees={attendees}
      event={eventRow ?? null}
      myGroup={myGroup}
    />
  );
}
