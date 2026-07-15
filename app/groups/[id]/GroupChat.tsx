"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface MemberProfile {
  userId: string;
  name: string;
  photoUrl: string | null;
}

interface Props {
  groupId: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
  members: MemberProfile[];
}

export function GroupChat({ groupId, currentUserId, initialMessages, members }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);

  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.userId, m])),
    [members]
  );

  function getProfile(userId: string): MemberProfile {
    return memberMap.get(userId) ?? { userId, name: "Member", photoUrl: null };
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`group-chat:${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            user_id: string;
            content: string;
            created_at: string;
          };
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [
              ...prev,
              {
                id: row.id,
                userId: row.user_id,
                content: row.content,
                createdAt: row.created_at,
              },
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, supabase]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    await supabase.from("messages").insert({
      group_id: groupId,
      user_id: currentUserId,
      content: text,
    });
    setSending(false);
  }

  return (
    <div className="mt-8">
      <p className="text-xs text-ink/40 uppercase tracking-wide mb-3 px-5">
        Group Chat
      </p>

      {/* Messages */}
      <div className="px-5 min-h-32 max-h-96 overflow-y-auto flex flex-col gap-3 pb-2">
        {messages.length === 0 && (
          <p className="text-center text-ink/40 text-sm py-10">
            No messages yet. Say hi!
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.userId === currentUserId;
          const profile = getProfile(msg.userId);
          return (
            <div
              key={msg.id}
              className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
            >
              {!isMe && (
                <div className="w-7 h-7 rounded-full bg-sunken shrink-0 overflow-hidden relative flex items-center justify-center mt-4">
                  {profile.photoUrl ? (
                    <Image
                      src={profile.photoUrl}
                      alt={profile.name}
                      fill
                      className="object-cover"
                      sizes="28px"
                    />
                  ) : (
                    <span className="text-xs font-serif font-bold text-ink/40">
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              )}
              <div
                className={`max-w-[75%] flex flex-col gap-0.5 ${
                  isMe ? "items-end" : "items-start"
                }`}
              >
                {!isMe && (
                  <span className="text-xs text-ink/40 px-1">
                    {profile.name}
                  </span>
                )}
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                    isMe
                      ? "bg-brand-500 text-white rounded-br-sm"
                      : "bg-card border border-sunken text-ink rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-5 mt-3 pb-8">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Message the group…"
            className="flex-1 bg-sunken text-ink placeholder-ink/30 rounded-2xl px-4 py-3 text-sm outline-none border border-ink/15 focus:border-brand-500 transition-colors"
          />
          <button
            onClick={() => void send()}
            disabled={!input.trim() || sending}
            className="w-11 h-11 bg-brand-500 disabled:bg-sunken disabled:opacity-50 text-white rounded-full flex items-center justify-center shrink-0 transition-colors active:scale-95"
          >
            <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
