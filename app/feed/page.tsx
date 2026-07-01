import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FeedClient from "./FeedClient";
import type { AttendeeCardData } from "@/components/AttendeeCard";
import type { VibeTag } from "@/lib/types";

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("users")
    .select("name, profile_complete")
    .eq("id", user.id)
    .single();

  if (!profile?.profile_complete) redirect("/profile/create");

  // Get current user's verified event IDs (no embedded join — avoids PGRST125)
  const { data: myBadges, error: badgeError } = await supabase
    .from("verified_badges")
    .select("event_id")
    .eq("user_id", user.id);

  console.log(`[feed] user=${user.id} badges=${JSON.stringify(myBadges)} err=${JSON.stringify(badgeError)}`);

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

  // Fetch event details separately
  const { data: eventRows } = await supabase
    .from("events")
    .select("id, name, festival_name")
    .in("id", myEventIds);

  const primaryEvent = (eventRows ?? [])[0] as
    | { id: string; name: string; festival_name: string }
    | undefined;

  // Step 1: get all other verified user IDs for these events
  const { data: otherBadges, error: otherBadgesError } = await supabase
    .from("verified_badges")
    .select("user_id, event_id")
    .in("event_id", myEventIds)
    .neq("user_id", user.id);

  if (otherBadgesError) console.error("[feed] otherBadges error", otherBadgesError);

  const otherUserIds = (otherBadges ?? []).map((b) => b.user_id);

  // Step 2: fetch those users' profiles
  const { data: userProfiles, error: profilesError } = otherUserIds.length > 0
    ? await supabase
        .from("users")
        .select("id, name, photo_url, vibe_tags, group_size_preference, instagram_handle, tiktok_handle, snapchat_handle")
        .in("id", otherUserIds)
    : { data: [], error: null };

  if (profilesError) console.error("[feed] userProfiles error", profilesError);

  // Step 3: fetch groups for these events
  const { data: rawGroups, error: groupsError } = await supabase
    .from("groups")
    .select("id, name, status, created_by, event_id")
    .in("event_id", myEventIds);

  if (groupsError) console.error("[feed] groups error", groupsError);

  const groupIds = (rawGroups ?? []).map((g) => g.id);

  // Step 4: fetch group members separately
  const { data: rawMembers, error: membersError } = groupIds.length > 0
    ? await supabase
        .from("group_members")
        .select("group_id, user_id, status")
        .in("group_id", groupIds)
    : { data: [], error: null };

  if (membersError) console.error("[feed] members error", membersError);

  // Build userId → group lookup
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

  // Shape into card data
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

  console.log(`[feed] user=${user.id} events=${myEventIds.length} attendees=${attendees.length}`);

  return (
    <FeedClient
      currentUserId={user.id}
attendees={attendees}
      event={primaryEvent ?? null}
      myGroup={myGroup}
    />
  );
}
