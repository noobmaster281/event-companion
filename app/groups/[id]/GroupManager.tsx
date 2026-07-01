"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface PendingMember {
  userId: string;
  name: string;
  photoUrl: string | null;
  socialHandle: string;
}

interface Props {
  groupId: string;
  pendingMembers: PendingMember[];
}

export function GroupManager({ groupId, pendingMembers }: Props) {
  const router = useRouter();
  const [acting, setActing] = useState<string | null>(null);

  async function accept(userId: string) {
    setActing(userId);
    const supabase = createClient();
    await supabase
      .from("group_members")
      .update({ status: "confirmed" })
      .eq("group_id", groupId)
      .eq("user_id", userId);
    setActing(null);
    router.refresh();
  }

  async function decline(userId: string) {
    setActing(userId);
    const supabase = createClient();
    await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);
    setActing(null);
    router.refresh();
  }

  if (pendingMembers.length === 0) return null;

  return (
    <div className="mt-8">
      <p className="text-xs text-neutral-500 uppercase tracking-wide mb-3 px-5">
        Requests to join ({pendingMembers.length})
      </p>
      <div className="space-y-3 px-5">
        {pendingMembers.map((member) => (
          <div key={member.userId} className="bg-neutral-900 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center shrink-0 overflow-hidden">
                {member.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-neutral-500">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white text-sm truncate">{member.name}</p>
                <p className="text-xs text-neutral-400 truncate">{member.socialHandle}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => accept(member.userId)}
                disabled={acting === member.userId}
                className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium disabled:opacity-50 hover:bg-brand-600 transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => decline(member.userId)}
                disabled={acting === member.userId}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-sm font-medium disabled:opacity-50 hover:bg-neutral-700 transition-colors"
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
