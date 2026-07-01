import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Root page: redirect authenticated users to feed, unauthenticated to /join
export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // No session — they need to arrive via a festival button token
    redirect("/join");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("profile_complete")
    .eq("id", user.id)
    .single();

  if (!profile?.profile_complete) {
    redirect("/profile/create");
  }

  redirect("/feed");
}
