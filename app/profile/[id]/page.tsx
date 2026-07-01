import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProfileActions } from "./ProfileActions";
import type { VibeTag } from "@/lib/types";

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

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: targetId } = await params;
  const supabase = await createClient();

  const {
    data: { user: me },
  } = await supabase.auth.getUser();
  if (!me) redirect("/");

  if (targetId === me.id) redirect("/profile");

  const { data: profile } = await supabase
    .from("users")
    .select(
      "id, name, photo_url, vibe_tags, group_size_preference, instagram_handle, tiktok_handle, snapchat_handle"
    )
    .eq("id", targetId)
    .single();

  if (!profile) notFound();

  // Get their shared event badges (events we're both verified for)
  const { data: myBadges } = await supabase
    .from("verified_badges")
    .select("event_id")
    .eq("user_id", me.id);

  const myEventIds = (myBadges ?? []).map((b) => b.event_id);

  const { data: sharedBadges } = await supabase
    .from("verified_badges")
    .select("event_id, events(name, festival_name)")
    .eq("user_id", targetId)
    .in("event_id", myEventIds);

  // Get their confirmed group (if any) in a shared event
  const { data: membership } = await supabase
    .from("group_members")
    .select("group_id, status, groups!inner(id, name, status, event_id)")
    .eq("user_id", targetId)
    .eq("status", "confirmed")
    .in("groups.event_id", myEventIds)
    .maybeSingle();

  type GroupRow = { id: string; name: string | null; status: string; event_id: string };
  const theirGroup = membership
    ? (membership.groups as unknown as GroupRow)
    : null;

  // Check my relationship to their group
  let alreadyRequested = false;
  let alreadyInGroup = false;
  if (theirGroup) {
    const { data: myMembership } = await supabase
      .from("group_members")
      .select("status")
      .eq("group_id", theirGroup.id)
      .eq("user_id", me.id)
      .maybeSingle();

    if (myMembership) {
      alreadyRequested = true;
      alreadyInGroup = myMembership.status === "confirmed";
    }
  }

  // Confirmed member count for their group
  let confirmedCount = 0;
  if (theirGroup) {
    const { count } = await supabase
      .from("group_members")
      .select("id", { count: "exact", head: true })
      .eq("group_id", theirGroup.id)
      .eq("status", "confirmed");
    confirmedCount = count ?? 0;
  }

  const vibeTags = (profile.vibe_tags ?? []) as VibeTag[];
  const socialHandles = [
    profile.instagram_handle ? { platform: "Instagram", handle: `@${profile.instagram_handle}` } : null,
    profile.tiktok_handle    ? { platform: "TikTok",    handle: `@${profile.tiktok_handle}` }    : null,
    profile.snapchat_handle  ? { platform: "Snapchat",  handle: `@${profile.snapchat_handle}` }  : null,
  ].filter((s): s is { platform: string; handle: string } => s !== null);

  const sharedEvent = sharedBadges?.[0]?.events as unknown as
    | { name: string; festival_name: string }
    | null;

  return (
    <div className="flex flex-col flex-1">
      {/* Back button */}
      <div className="px-5 pt-6">
        <Link href="/feed" className="inline-flex items-center gap-1 text-neutral-400 text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Feed
        </Link>
      </div>

      {/* Photo */}
      <div className="px-5 mt-4">
        <div className="w-28 h-28 rounded-3xl bg-neutral-800 overflow-hidden relative">
          {profile.photo_url ? (
            <Image src={profile.photo_url} alt={profile.name ?? ""} fill className="object-cover" sizes="112px" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-neutral-600">
                {(profile.name ?? "?").charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Name + verified badge */}
      <div className="px-5 mt-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
          <span className="flex items-center gap-1 bg-brand-500/10 text-brand-400 text-xs font-medium px-2 py-1 rounded-full border border-brand-500/20">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Verified
          </span>
        </div>
        {sharedEvent && (
          <p className="text-sm text-neutral-400 mt-0.5">{sharedEvent.festival_name}</p>
        )}
      </div>

      {/* Social handles */}
      {socialHandles.length > 0 && (
        <div className="px-5 mt-4 space-y-2">
          {socialHandles.map((s) => (
            <div key={s.platform} className="flex items-center gap-3 bg-neutral-900 rounded-xl px-4 py-3">
              <span className="text-xs text-neutral-500 uppercase tracking-wide w-20 shrink-0">
                {s.platform}
              </span>
              <span className="text-white font-medium text-sm">{s.handle}</span>
            </div>
          ))}
        </div>
      )}

      {/* Vibe tags */}
      {vibeTags.length > 0 && (
        <div className="px-5 mt-6">
          <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Vibe</p>
          <div className="flex flex-wrap gap-2">
            {vibeTags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 rounded-full text-sm font-medium border border-neutral-700 text-neutral-300"
              >
                {VIBE_LABELS[tag]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Group size preference */}
      {profile.group_size_preference && (
        <div className="px-5 mt-6">
          <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Ideal group size</p>
          <p className="text-white font-medium">
            {profile.group_size_preference >= 7 ? "7+" : profile.group_size_preference} people
          </p>
        </div>
      )}

      {/* Group status */}
      {theirGroup && (
        <div className="px-5 mt-6">
          <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Group</p>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${theirGroup.status === "confirmed" ? "bg-green-500" : "bg-amber-400"}`} />
            <span className="text-white text-sm">
              {theirGroup.status === "confirmed"
                ? `Confirmed group · ${confirmedCount} members`
                : `Forming a group · ${confirmedCount} confirmed`}
            </span>
          </div>
          {theirGroup.name && (
            <p className="text-neutral-400 text-sm mt-1">{theirGroup.name}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-5 mt-8 pb-8 mt-auto">
        <ProfileActions
          targetUserId={targetId}
          currentUserId={me.id}
          group={theirGroup ? { id: theirGroup.id, name: theirGroup.name, confirmedCount } : null}
          alreadyRequested={alreadyRequested}
          alreadyInGroup={alreadyInGroup}
        />
      </div>
    </div>
  );
}
