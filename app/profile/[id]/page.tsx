import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProfileActions } from "./ProfileActions";
import type { VibeTag, Gender } from "@/lib/types";

const VIBE_LABELS: Record<VibeTag, string> = {
  "here-for-headliners": "Here for the headliners",
  "discover-new-artists": "Discover new artists",
  "dance-all-night": "Dance all night",
  "chill-vibes": "Chill vibes",
  "front-row-energy": "Front row energy",
  "festival-foodie": "Festival foodie",
  photographer: "Photographer",
  "first-timer": "First timer",
};

const GENDER_LABELS: Record<Gender, string> = {
  male: "Man",
  female: "Woman",
  "non-binary": "Non-binary",
  "prefer-not-to-say": "Prefer not to say",
};

function socialUrl(platform: string, handle: string): string {
  switch (platform) {
    case "Instagram": return `https://instagram.com/${handle}`;
    case "TikTok": return `https://tiktok.com/@${handle}`;
    case "Snapchat": return `https://snapchat.com/add/${handle}`;
    default: return "#";
  }
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ event?: string }>;
}) {
  const [{ id: targetId }, { event: eventId }] = await Promise.all([params, searchParams]);
  const supabase = await createClient();

  const { data: { user: me } } = await supabase.auth.getUser();
  if (!me) redirect("/");

  if (targetId === me.id) redirect("/profile");

  const { data: profile } = await supabase
    .from("users")
    .select("id, name, photo_url, vibe_tags, group_size_preference, instagram_handle, tiktok_handle, snapchat_handle, age, gender, bio")
    .eq("id", targetId)
    .single();

  if (!profile) notFound();

  let scopedEventIds: string[];
  if (eventId) {
    scopedEventIds = [eventId];
  } else {
    const { data: myBadges } = await supabase
      .from("verified_badges")
      .select("event_id")
      .eq("user_id", me.id);
    scopedEventIds = (myBadges ?? []).map((b) => b.event_id);
  }

  const { data: sharedBadges } = await supabase
    .from("verified_badges")
    .select("event_id, events(name, festival_name)")
    .eq("user_id", targetId)
    .in("event_id", scopedEventIds);

  const { data: membership } = await supabase
    .from("group_members")
    .select("group_id, status, groups!inner(id, name, status, event_id, max_size)")
    .eq("user_id", targetId)
    .eq("status", "confirmed")
    .in("groups.event_id", scopedEventIds)
    .maybeSingle();

  type GroupRow = { id: string; name: string | null; status: string; event_id: string; max_size: number };
  const theirGroup = membership ? (membership.groups as unknown as GroupRow) : null;

  // My group in this event context
  const { data: myMembership } = await supabase
    .from("group_members")
    .select("group_id, status, groups!inner(id, name, status, event_id, max_size)")
    .eq("user_id", me.id)
    .eq("status", "confirmed")
    .in("groups.event_id", scopedEventIds)
    .maybeSingle();

  const myGroupRow = myMembership ? (myMembership.groups as unknown as GroupRow) : null;

  let alreadyRequested = false;
  let alreadyInGroup = false;
  let alreadyInAnotherGroup = false;
  let confirmedCount = 0;
  let myGroupConfirmedCount = 0;

  if (theirGroup) {
    const [{ data: myMembershipInTheirGroup }, { count: theirCount }] = await Promise.all([
      supabase
        .from("group_members")
        .select("status")
        .eq("group_id", theirGroup.id)
        .eq("user_id", me.id)
        .maybeSingle(),
      supabase
        .from("group_members")
        .select("id", { count: "exact", head: true })
        .eq("group_id", theirGroup.id)
        .eq("status", "confirmed"),
    ]);

    confirmedCount = theirCount ?? 0;
    if (myMembershipInTheirGroup) {
      alreadyRequested = true;
      alreadyInGroup = myMembershipInTheirGroup.status === "confirmed";
    }
  }

  if (myGroupRow && theirGroup && myGroupRow.id !== theirGroup.id) {
    alreadyInAnotherGroup = true;
  } else if (myGroupRow && !theirGroup) {
    alreadyInAnotherGroup = false; // I have a group but they don't — can invite
  }

  if (myGroupRow) {
    const { count } = await supabase
      .from("group_members")
      .select("id", { count: "exact", head: true })
      .eq("group_id", myGroupRow.id)
      .eq("status", "confirmed");
    myGroupConfirmedCount = count ?? 0;
  }

  const vibeTags = (profile.vibe_tags ?? []) as VibeTag[];
  const socialHandles = [
    profile.instagram_handle ? { platform: "Instagram", handle: profile.instagram_handle } : null,
    profile.tiktok_handle    ? { platform: "TikTok",    handle: profile.tiktok_handle }    : null,
    profile.snapchat_handle  ? { platform: "Snapchat",  handle: profile.snapchat_handle }  : null,
  ].filter((s): s is { platform: string; handle: string } => s !== null);

  const sharedEvent = sharedBadges?.[0]?.events as unknown as
    | { name: string; festival_name: string }
    | null;

  const backHref = eventId ? `/feed?event=${eventId}` : "/feed";

  const myGroupIsFull = myGroupRow
    ? myGroupConfirmedCount >= (myGroupRow.max_size ?? 5)
    : false;

  return (
    <div className="flex flex-col flex-1">
      {/* Back button */}
      <div className="px-5 pt-6 flex items-center justify-between">
        <Link href={backHref} className="inline-flex items-center gap-1 text-ink/50 text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Feed
        </Link>
        {/* Report button */}
        <ProfileActions
          targetUserId={targetId}
          targetName={profile.name ?? "this person"}
          currentUserId={me.id}
          group={theirGroup ? { id: theirGroup.id, name: theirGroup.name, confirmedCount, maxSize: theirGroup.max_size ?? 5 } : null}
          myGroup={myGroupRow ? { id: myGroupRow.id, confirmedCount: myGroupConfirmedCount, isFull: myGroupIsFull } : null}
          alreadyRequested={alreadyRequested}
          alreadyInGroup={alreadyInGroup}
          alreadyInAnotherGroup={alreadyInAnotherGroup}
          eventId={eventId}
          renderMode="report-only"
        />
      </div>

      {/* Photo */}
      <div className="px-5 mt-4">
        <div className="w-28 h-28 rounded-3xl bg-sunken overflow-hidden relative">
          {profile.photo_url ? (
            <Image src={profile.photo_url} alt={profile.name ?? ""} fill className="object-cover" sizes="112px" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-serif font-bold text-ink/20">
                {(profile.name ?? "?").charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Name + age + verified */}
      <div className="px-5 mt-4">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-serif font-bold text-ink">{profile.name}</h1>
          {profile.age && <span className="text-ink/50 text-lg">{profile.age}</span>}
          <span className="flex items-center gap-1 bg-brand-500/10 text-brand-500 text-xs font-medium px-2 py-1 rounded-full border border-brand-500/20">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Verified
          </span>
        </div>
        {profile.gender && (
          <p className="text-sm text-ink/40 mt-0.5">{GENDER_LABELS[profile.gender as Gender]}</p>
        )}
        {sharedEvent && (
          <p className="text-sm text-ink/40 mt-0.5">{sharedEvent.festival_name}</p>
        )}
        {profile.bio && (
          <p className="text-sm text-ink/70 mt-2 leading-relaxed">{profile.bio}</p>
        )}
      </div>

      {/* Social handles — tappable */}
      {socialHandles.length > 0 && (
        <div className="px-5 mt-4 space-y-2">
          {socialHandles.map((s) => (
            <a
              key={s.platform}
              href={socialUrl(s.platform, s.handle)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 border border-sunken active:scale-[0.98] transition-transform"
            >
              <span className="text-xs text-ink/40 uppercase tracking-wide w-20 shrink-0">{s.platform}</span>
              <span className="text-brand-500 font-medium text-sm">@{s.handle}</span>
              <svg className="w-3.5 h-3.5 text-ink/20 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ))}
        </div>
      )}

      {/* Vibe tags */}
      {vibeTags.length > 0 && (
        <div className="px-5 mt-6">
          <p className="text-xs text-ink/40 uppercase tracking-wide mb-2">Vibe</p>
          <div className="flex flex-wrap gap-2">
            {vibeTags.map((tag) => (
              <span key={tag} className="px-3 py-1.5 rounded-full text-sm font-medium border border-ink/15 text-ink/70">
                {VIBE_LABELS[tag]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Group size preference */}
      {profile.group_size_preference && (
        <div className="px-5 mt-6">
          <p className="text-xs text-ink/40 uppercase tracking-wide mb-2">Ideal group size</p>
          <p className="text-ink font-medium">
            {profile.group_size_preference >= 7 ? "7+" : profile.group_size_preference} people
          </p>
        </div>
      )}

      {/* Group status */}
      {theirGroup && (
        <div className="px-5 mt-6">
          <p className="text-xs text-ink/40 uppercase tracking-wide mb-2">Group</p>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${theirGroup.status === "confirmed" ? "bg-status-verified" : "bg-status-forming"}`} />
            <span className="text-ink text-sm">
              {confirmedCount <= 1
                ? "Solo · Open"
                : theirGroup.status === "confirmed"
                ? `Confirmed group · ${confirmedCount} members`
                : `Forming · ${confirmedCount} confirmed`}
            </span>
          </div>
          {theirGroup.name && <p className="text-ink/40 text-sm mt-1">{theirGroup.name}</p>}
        </div>
      )}

      {/* Actions */}
      <div className="px-5 mt-8 pb-8 mt-auto">
        <ProfileActions
          targetUserId={targetId}
          targetName={profile.name ?? "this person"}
          currentUserId={me.id}
          group={theirGroup ? { id: theirGroup.id, name: theirGroup.name, confirmedCount, maxSize: theirGroup.max_size ?? 5 } : null}
          myGroup={myGroupRow ? { id: myGroupRow.id, confirmedCount: myGroupConfirmedCount, isFull: myGroupIsFull } : null}
          alreadyRequested={alreadyRequested}
          alreadyInGroup={alreadyInGroup}
          alreadyInAnotherGroup={alreadyInAnotherGroup}
          eventId={eventId}
          renderMode="actions"
        />
      </div>
    </div>
  );
}
