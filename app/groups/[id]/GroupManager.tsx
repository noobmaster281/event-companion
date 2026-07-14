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
      <p className="text-xs text-ink/40 uppercase tracking-wide mb-3 px-5">
        Requests to join ({pendingMembers.length})
      </p>
      <div className="space-y-3 px-5">
        {pendingMembers.map((member) => (
          <div key={member.userId} className="bg-card rounded-2xl p-4 border border-sunken">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-sunken flex items-center justify-center shrink-0 overflow-hidden">
                {member.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-serif font-bold text-ink/30">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink text-sm truncate">{member.name}</p>
                <p className="text-xs text-ink/40 truncate">{member.socialHandle}</p>
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
                className="flex-1 py-2.5 rounded-xl bg-sunken border border-ink/15 text-ink/70 text-sm font-medium disabled:opacity-50 hover:bg-ink/5 transition-colors"
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
