import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UnblockButton } from "@/components/safety/UnblockButton";

interface BlockedRow {
  blocked_id: string;
  created_at: string;
  blocked: { id: string; name: string | null; photo_url: string | null } | null;
}

export default async function BlockedPeoplePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data } = await supabase
    .from("blocks")
    .select("blocked_id, created_at, blocked:users!blocks_blocked_id_fkey(id, name, photo_url)")
    .eq("blocker_id", user.id)
    .order("created_at", { ascending: false });

  const blocked = ((data ?? []) as unknown as BlockedRow[]).filter((row) => row.blocked);

  return (
    <div className="flex flex-col flex-1 pb-8">
      <div className="px-5 pt-6">
        <Link href="/profile" className="inline-flex items-center gap-1 text-ink/50 text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Profile
        </Link>
      </div>

      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-serif font-bold text-ink">Blocked people</h1>
      </div>

      <div className="px-5 space-y-2">
        {blocked.length === 0 && (
          <p className="text-ink/40 text-sm text-center py-12">You haven&apos;t blocked anyone.</p>
        )}
        {blocked.map((row) => (
          <div
            key={row.blocked_id}
            className="flex items-center gap-3 bg-card rounded-2xl p-4 border border-sunken"
          >
            <div className="w-11 h-11 rounded-full bg-sunken shrink-0 overflow-hidden relative">
              {row.blocked?.photo_url ? (
                <Image
                  src={row.blocked.photo_url}
                  alt={row.blocked.name ?? ""}
                  fill
                  className="object-cover"
                  sizes="44px"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-serif font-bold text-ink/30">
                    {(row.blocked?.name ?? "?").charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <p className="flex-1 min-w-0 font-medium text-ink text-sm truncate">
              {row.blocked?.name ?? "Unknown"}
            </p>
            <UnblockButton blockedUserId={row.blocked_id} />
          </div>
        ))}
      </div>
    </div>
  );
}
