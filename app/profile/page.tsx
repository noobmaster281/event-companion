import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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
  male: "Male",
  female: "Female",
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

export default async function MyProfilePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("users")
    .select("name, photo_url, vibe_tags, group_size_preference, instagram_handle, tiktok_handle, snapchat_handle, age, gender, bio, profile_complete")
    .eq("id", user.id)
    .single();

  if (!profile?.profile_complete) redirect("/profile/create");

  const { data: badges } = await supabase
    .from("verified_badges")
    .select("event_id")
    .eq("user_id", user.id);

  const eventIds = (badges ?? []).map((b) => b.event_id);

  const { data: events } = eventIds.length > 0
    ? await supabase.from("events").select("id, name, festival_name").in("id", eventIds)
    : { data: [] };

  const { data: myMembership } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", user.id)
    .eq("status", "confirmed")
    .maybeSingle();

  let myGroup: { id: string; name: string | null; status: string; confirmedCount: number } | null = null;

  if (myMembership) {
    const [{ data: group }, { count }] = await Promise.all([
      supabase.from("groups").select("id, name, status").eq("id", myMembership.group_id).single(),
      supabase.from("group_members").select("id", { count: "exact", head: true }).eq("group_id", myMembership.group_id).eq("status", "confirmed"),
    ]);
    if (group) myGroup = { id: group.id, name: group.name, status: group.status, confirmedCount: count ?? 0 };
  }

  const vibeTags = (profile.vibe_tags ?? []) as VibeTag[];
  const socialHandles = [
    profile.instagram_handle ? { platform: "Instagram", handle: profile.instagram_handle } : null,
    profile.tiktok_handle    ? { platform: "TikTok",    handle: profile.tiktok_handle }    : null,
    profile.snapchat_handle  ? { platform: "Snapchat",  handle: profile.snapchat_handle }  : null,
  ].filter((s): s is { platform: string; handle: string } => s !== null);

  return (
    <div className="flex flex-col flex-1 pb-8">
      {/* Header */}
      <div className="px-5 pt-6 flex items-center justify-between">
        <Link href="/feed" className="inline-flex items-center gap-1 text-ink/50 text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Feed
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/settings/blocked" className="text-sm text-ink/50 font-medium">Blocked</Link>
          <Link href="/profile/edit" className="text-sm text-brand-500 font-medium">Edit</Link>
        </div>
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

      {/* Ideal group size */}
      {profile.group_size_preference && (
        <div className="px-5 mt-6">
          <p className="text-xs text-ink/40 uppercase tracking-wide mb-2">Ideal group size</p>
          <p className="text-ink font-medium">
            {profile.group_size_preference >= 7 ? "7+" : profile.group_size_preference} people
          </p>
        </div>
      )}

      {/* Group */}
      <div className="px-5 mt-6">
        <p className="text-xs text-ink/40 uppercase tracking-wide mb-2">Group</p>
        {myGroup ? (
          <Link
            href={`/groups/${myGroup.id}`}
            className="flex items-center gap-3 bg-card rounded-2xl p-4 border border-sunken"
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${
              myGroup.status === "confirmed" ? "bg-status-verified" : "bg-status-forming"
            }`} />
            <div className="flex-1 min-w-0">
              <p className="text-ink text-sm font-medium">
                {myGroup.confirmedCount <= 1
                  ? "Solo · Open"
                  : myGroup.status === "confirmed"
                  ? `Confirmed · ${myGroup.confirmedCount} members`
                  : `Forming · ${myGroup.confirmedCount} confirmed`}
              </p>
              {myGroup.name && (
                <p className="text-ink/40 text-xs mt-0.5 truncate">{myGroup.name}</p>
              )}
            </div>
            <svg className="w-4 h-4 text-ink/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : (
          <div className="flex items-center justify-between bg-card rounded-2xl p-4 border border-sunken">
            <p className="text-ink/50 text-sm">Not in a group yet</p>
            <Link href="/groups/create" className="text-brand-500 text-sm font-medium">Start one →</Link>
          </div>
        )}
      </div>

      {/* Verified events */}
      {(events ?? []).length > 0 && (
        <div className="px-5 mt-6">
          <p className="text-xs text-ink/40 uppercase tracking-wide mb-2">Verified for</p>
          <div className="space-y-2">
            {(events ?? []).map((e) => (
              <div key={e.id} className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 border border-sunken">
                <svg className="w-4 h-4 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="text-ink text-sm font-medium">{e.festival_name}</p>
                  <p className="text-ink/40 text-xs">{e.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
