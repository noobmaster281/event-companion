import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import FeedClient from "./FeedClient";
import type { AttendeeCardData } from "@/components/AttendeeCard";
import type { VibeTag, Gender } from "@/lib/types";

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
        <p className="text-ink/50 text-sm">No verified events yet.</p>
        <p className="text-ink/30 text-xs mt-1">
          Click the button on your ticket confirmation to get verified.
        </p>
      </div>
    );
  }

  const myEventIds = myBadges.map((b) => b.event_id);

  // No event selected — show event picker
  if (!eventId || !myEventIds.includes(eventId)) {
    const { data: events } = await supabase
      .from("events")
      .select("id, name, festival_name, event_date")
      .in("id", myEventIds)
      .order("event_date", { ascending: true });

    // Count verified + looking per event
    const { data: allBadges } = await supabase
      .from("verified_badges")
      .select("event_id, user_id")
      .in("event_id", myEventIds);

    const allBadgesByEvent = new Map<string, string[]>();
    for (const b of allBadges ?? []) {
      const arr = allBadgesByEvent.get(b.event_id) ?? [];
      arr.push(b.user_id);
      allBadgesByEvent.set(b.event_id, arr);
    }

    const eventUserIds = Array.from(new Set((allBadges ?? []).map((b) => b.user_id)));
    const { data: allGroups } = await supabase
      .from("groups")
      .select("id, event_id")
      .in("event_id", myEventIds);

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

    return (
      <div className="flex flex-col flex-1 pb-8">
        <div className="px-5 pt-10 pb-6">
          <h1 className="text-2xl font-serif font-bold text-ink">Your Events</h1>
          <p className="text-sm text-ink/50 mt-1">Pick an event to see who else is going.</p>
        </div>

        <div className="px-5 flex flex-col gap-3">
          {(events ?? []).map((event) => {
            const verifiedUsers = allBadgesByEvent.get(event.id) ?? [];
            const inGroup = inGroupByEvent.get(event.id) ?? new Set<string>();
            const lookingCount = verifiedUsers.filter((uid) => !inGroup.has(uid)).length;
            return (
              <Link
                key={event.id}
                href={`/feed?event=${event.id}`}
                className="flex items-center gap-4 bg-card rounded-2xl px-4 py-4 shadow-sm border border-sunken active:scale-[0.98] transition-transform"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-brand-500 font-medium uppercase tracking-wide mb-0.5">
                    {event.festival_name}
                  </p>
                  <p className="text-ink font-semibold text-sm leading-snug truncate">
                    {event.name}
                  </p>
                  {event.event_date && (
                    <p className="text-xs text-ink/40 mt-0.5">{formatDate(event.event_date)}</p>
                  )}
                  <p className="text-xs text-ink/30 mt-0.5">
                    {verifiedUsers.length} verified · {lookingCount} looking
                  </p>
                </div>
                <svg className="w-5 h-5 text-ink/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            );
          })}
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

  // All verified badges for this event
  const { data: allEventBadges } = await supabase
    .from("verified_badges")
    .select("user_id")
    .eq("event_id", eventId);

  const allEventUserIds = (allEventBadges ?? []).map((b) => b.user_id);
  const otherUserIds = allEventUserIds.filter((id) => id !== user.id);

  const { data: userProfiles } = otherUserIds.length > 0
    ? await supabase
        .from("users")
        .select("id, name, photo_url, vibe_tags, group_size_preference, instagram_handle, tiktok_handle, snapchat_handle, gender, age")
        .in("id", otherUserIds)
    : { data: [] };

  // Groups for this event
  const { data: rawGroups } = await supabase
    .from("groups")
    .select("id, name, status, created_by, event_id, max_size")
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
    { id: string; status: "open" | "confirmed"; confirmedCount: number; maxSize: number }
  >();

  for (const group of rawGroups ?? []) {
    const members = (rawMembers ?? []).filter((m) => m.group_id === group.id);
    const confirmed = members.filter((m) => m.status === "confirmed");
    for (const m of confirmed) {
      userGroupMap.set(m.user_id, {
        id: group.id,
        status: group.status as "open" | "confirmed",
        confirmedCount: confirmed.length,
        maxSize: group.max_size ?? 5,
      });
    }
  }

  const myGroup = userGroupMap.get(user.id) ?? null;

  // Count how many are "looking" (not in any confirmed group spot)
  const inGroupUserIds = new Set(userGroupMap.keys());
  const lookingCount = allEventUserIds.filter((id) => !inGroupUserIds.has(id)).length;

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
      gender: (u.gender ?? null) as Gender | null,
      age: u.age ?? null,
      group: userGroupMap.get(u.id) ?? null,
    };
  });

  return (
    <FeedClient
      currentUserId={user.id}
      attendees={attendees}
      event={eventRow ? { ...eventRow, verifiedCount: allEventUserIds.length, lookingCount } : null}
      myGroup={myGroup}
    />
  );
}
