# Event Companion

Mobile-optimized web app for verified festival attendees to find and form groups. Runs in the phone's browser (not a native app).

## Stack
- **Next.js 15** (App Router, TypeScript) — frontend + API routes in one repo
- **Supabase** — auth (magic links), PostgreSQL, Realtime (group chat), Storage (photos)
- **Tailwind CSS** — mobile-first, dark theme

## Key conventions
- Server components fetch data directly; no API calls from RSC
- Client components are in files with `"use client"` at the top
- Supabase server client: `lib/supabase/server.ts` — use in server components and route handlers
- Supabase browser client: `lib/supabase/client.ts` — use in client components
- Admin/service role client (`createAdminClient`): only for route handlers that need to bypass RLS (token verification, badge stamping)
- Types live in `lib/types.ts` — keep them up to date

## Auth flow
1. User arrives at `/join?token=<signed-jwt>` from a festival confirmation page
2. `POST /api/verify-token` validates the JWT using the operator's secret key from the DB
3. On success: Supabase creates/upserts the user and emails a magic link
4. Magic link → `/auth/callback` → exchanges code for session → redirects to `/profile/create` or `/feed`

## Token system
- Each festival operator has a `secret_key` in the `operators` table
- They sign a JWT with that key: `{ email, event_id, exp }`
- We decode the event_id from the raw JWT, look up the operator secret, then re-verify
- See `lib/token.ts` for sign/verify helpers; `app/api/verify-token/route.ts` for the endpoint

## DB schema
Run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor to set up the schema.
Tables: `operators`, `events`, `users`, `verified_badges`, `groups`, `group_members`, `messages`

## Dev setup
```bash
cp .env.example .env.local
# fill in your Supabase URL, anon key, and service role key
npm install
npm run dev
```

## Build order
- [x] Weeks 1–2: Foundation (this PR) — auth, token system, profile creation
- [ ] Weeks 3–4: Event feed, group creation, join requests
- [ ] Week 5: Group chat (Supabase Realtime, unlocks at 3+ confirmed members)
- [ ] Week 6: Polish + end-to-end integration test with a real token

## Supabase setup checklist
- [ ] Run the migration SQL in your Supabase project
- [ ] Create a `profile-photos` storage bucket (public read)
- [ ] Add `http://localhost:3000/auth/callback` to your Supabase Auth → URL Configuration → Redirect URLs
- [ ] Add your production URL to Redirect URLs when you deploy
- [ ] Enable Realtime on the `messages` and `group_members` tables (the migration does this, but verify in the dashboard)
