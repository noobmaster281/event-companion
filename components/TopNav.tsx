import { createClient } from "@/lib/supabase/server";
import { TopNavClient } from "./TopNavClient";

const NAV_ITEMS = [
  { href: "/feed", label: "Feed" },
  { href: "/events", label: "Events" },
  { href: "/profile", label: "Profile" },
];

export async function TopNav() {
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
    <TopNavClient
      items={NAV_ITEMS}
      avatarUrl={profile.photo_url}
      userName={profile.name}
    />
  );
}
