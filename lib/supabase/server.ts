import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server component — cookies set in middleware instead
          }
        },
      },
    }
  );
}

// Service role client — only for server-side operations that need to bypass RLS.
// Deliberately NOT createServerClient(): that client is cookie/session-aware and
// will authorize requests using the caller's own logged-in session when one is
// present in cookies, silently overriding the service-role key and re-imposing
// RLS. A plain supabase-js client has no cookie integration, so it always acts
// as the service role, matching the pattern already used in invite-to-group,
// start-group-with, and dev/verify-badge.
export async function createAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
