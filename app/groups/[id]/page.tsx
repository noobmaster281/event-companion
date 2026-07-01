import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { GroupManager } from "./GroupManager";
import { GroupChat, type ChatMessage, type MemberProfile } from "./GroupChat";

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params;
  const supabase = await createClient();

  const {
    data: { user: me },
  } = await supabase.auth.getUser();
  if (!me) redirect("/");

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, status, created_by, event_id, events(name, festival_name)")
    .eq("id", groupId)
    .single();

  if (!group) notFound();

  const event = group.events as unknown as { name: string; festival_name: string } | null;

  // Get all members with their profiles
  const { data: members } = await supabase
    .from("group_members")
    .select(
      `status, joined_at,
       users!inner(id, name, photo_url, instagram_handle, tiktok_handle, snapchat_handle)`
    )
    .eq("group_id", groupId)
    .order("joined_at");

  type MemberRow = {
    status: string;
    joined_at: string;
    users: {
      id: string;
      name: string | null;
      photo_url: string | null;
      instagram_handle: string | null;
      tiktok_handle: string | null;
      snapchat_handle: string | null;
    };
  };

  const allMembers = (members ?? []) as unknown as MemberRow[];
  const confirmed = allMembers.filter((m) => m.status === "confirmed");
  const pending = allMembers.filter((m) => m.status === "pending");

  const isConfirmedMember = confirmed.some((m) => m.users.id === me.id);
  const isPendingMember = pending.some((m) => m.users.id === me.id);
  const isCreator = group.created_by === me.id;

  // Only confirmed members and the creator can see this page
  if (!isConfirmedMember && !isPendingMember && !isCreator) {
    redirect("/feed");
  }

  const chatUnlocked = confirmed.length >= 2 && isConfirmedMember;

  // Fetch initial messages when chat is unlocked
  const initialMessages: ChatMessage[] = [];
  if (chatUnlocked) {
    const { data: rawMessages } = await supabase
      .from("messages")
      .select("id, user_id, content, created_at")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true })
      .limit(100);

    for (const msg of rawMessages ?? []) {
      initialMessages.push({
        id: msg.id,
        userId: msg.user_id,
        content: msg.content,
        createdAt: msg.created_at,
      });
    }
  }

  const memberProfiles: MemberProfile[] = confirmed.map(({ users: u }) => ({
    userId: u.id,
    name: u.name ?? "Member",
    photoUrl: u.photo_url,
  }));

  function getSocialHandle(u: MemberRow["users"]) {
    if (u.instagram_handle) return `@${u.instagram_handle}`;
    if (u.tiktok_handle) return `@${u.tiktok_handle}`;
    if (u.snapchat_handle) return `@${u.snapchat_handle}`;
    return "";
  }

  return (
    <div className="flex flex-col flex-1 pb-8">
      {/* Header */}
      <div className="px-5 pt-6">
        <Link href="/feed" className="inline-flex items-center gap-1 text-neutral-400 text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Feed
        </Link>
      </div>

      <div className="px-5 mt-6">
        {/* Status pill */}
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full mb-3 ${
          group.status === "confirmed"
            ? "bg-green-500/10 text-green-400 border border-green-500/20"
            : "bg-amber-400/10 text-amber-400 border border-amber-400/20"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${group.status === "confirmed" ? "bg-green-400" : "bg-amber-400"}`} />
          {group.status === "confirmed" ? "Confirmed" : "Forming"}
        </span>

        <h1 className="text-2xl font-bold text-white">
          {group.name ?? `${allMembers[0]?.users.name ?? ""}${confirmed.length > 1 ? `'s group` : "'s group"}`}
        </h1>
        {event && (
          <p className="text-sm text-neutral-400 mt-0.5">{event.festival_name} · {event.name}</p>
        )}

        {/* Progress toward chat unlock */}
        {!chatUnlocked && (
          <div className="mt-4 bg-neutral-900 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-neutral-400">Progress to group chat</p>
              <p className="text-xs text-neutral-300 font-medium">{confirmed.length} / 2 confirmed</p>
            </div>
            <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all"
                style={{ width: `${Math.min((confirmed.length / 2) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              {2 - confirmed.length} more {2 - confirmed.length === 1 ? "person" : "people"} needed to unlock chat
            </p>
          </div>
        )}

        {chatUnlocked && (
          <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-brand-400">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
            Group chat unlocked
          </div>
        )}
      </div>

      {/* Confirmed members */}
      <div className="mt-8">
        <p className="text-xs text-neutral-500 uppercase tracking-wide mb-3 px-5">
          Members ({confirmed.length})
        </p>
        <div className="space-y-2 px-5">
          {confirmed.map(({ users: u }) => (
            <Link
              key={u.id}
              href={u.id === me.id ? "/profile" : `/profile/${u.id}`}
              className="flex items-center gap-3 bg-neutral-900 rounded-2xl p-4"
            >
              <div className="w-11 h-11 rounded-full bg-neutral-800 shrink-0 overflow-hidden relative">
                {u.photo_url ? (
                  <Image src={u.photo_url} alt={u.name ?? ""} fill className="object-cover" sizes="44px" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-neutral-500">
                      {(u.name ?? "?").charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm truncate">
                  {u.name}{u.id === me.id ? " (you)" : ""}{u.id === group.created_by ? " · creator" : ""}
                </p>
                <p className="text-xs text-neutral-400 truncate">{getSocialHandle(u)}</p>
              </div>
              <svg className="w-4 h-4 text-neutral-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      {/* Pending join requests — only visible to creator */}
      {isCreator && (
        <GroupManager
          groupId={groupId}
          pendingMembers={pending.map(({ users: u }) => ({
            userId: u.id,
            name: u.name ?? "Unknown",
            photoUrl: u.photo_url,
            socialHandle: getSocialHandle(u),
          }))}
        />
      )}

      {/* Non-creator sees pending count */}
      {!isCreator && pending.length > 0 && !isPendingMember && (
        <div className="px-5 mt-6">
          <p className="text-xs text-neutral-500 text-center">
            {pending.length} pending request{pending.length !== 1 ? "s" : ""} — the creator will review them
          </p>
        </div>
      )}

      {/* Pending member — waiting on creator approval */}
      {isPendingMember && (
        <div className="px-5 mt-6">
          <div className="bg-neutral-900 rounded-2xl p-5 text-center">
            <p className="text-sm font-medium text-white">Request pending</p>
            <p className="text-xs text-neutral-500 mt-1">
              The group creator will review your request. Chat unlocks once 2 members are confirmed.
            </p>
          </div>
        </div>
      )}

      {/* Group chat — unlocks when group is confirmed with 3+ members */}
      {chatUnlocked && (
        <GroupChat
          groupId={groupId}
          currentUserId={me.id}
          initialMessages={initialMessages}
          members={memberProfiles}
        />
      )}
    </div>
  );
}
