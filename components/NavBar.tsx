import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

export async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("name, photo_url, profile_complete")
    .eq("id", user.id)
    .single();

  if (!profile?.profile_complete) return null;

  return (
    <Link
      href="/profile"
      className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-neutral-800 overflow-hidden border-2 border-neutral-700 hover:border-brand-500 active:scale-95 transition-all"
    >
      {profile.photo_url ? (
        <Image
          src={profile.photo_url}
          alt={profile.name ?? "Your profile"}
          fill
          className="object-cover"
          sizes="40px"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-sm font-bold text-neutral-400">
            {(profile.name ?? "?").charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </Link>
  );
}
