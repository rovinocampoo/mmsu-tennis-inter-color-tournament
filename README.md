# MMSU Tennis Club Inter-Color Tournament — Season 2
A mobile-first tournament coordination web app for November 11–December 8, 2026.

## Stack
Next.js App Router · React · TypeScript · Tailwind CSS v4 · Supabase PostgreSQL · Vercel.

## Windows setup
1. Install Node.js 20.9+ and Git.
2. Clone this repository and open its folder in VS Code.
3. Copy `.env.example` to `.env.local`.
4. Create a Supabase project. In Supabase SQL Editor, run `supabase/migrations/202611110001_initial_schema.sql`, then `supabase/seed.sql`.
5. Add the project URL, anon key, service-role key, organizer passcode, and a random session secret to `.env.local`. Never commit `.env.local`.
6. In PowerShell run `npm install`, then `npm run dev`.
7. Open http://localhost:3000.

## Environment
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: public anon/publishable key (RLS protected).
- `SUPABASE_SERVICE_ROLE_KEY`: server-only service-role key, never expose in client components.
- `ORGANIZER_PASSCODE`: shared organizer passcode.
- `ORGANIZER_SESSION_SECRET`: random secret of at least 32 characters for signed HTTP-only sessions.

## Database and roster
Run the migration and seed SQL in order. Seed inserts only the 61 official registered players, and validates 30 Blue + 31 White. No match results are seeded. Daily aggregate is a database view derived from all completed matches and recalculates naturally when score records change. Championship scoring is intentionally unconfigured.

## Commands
- `npm run dev`: local server.
- `npm run typecheck`: TypeScript check.
- `npm test`: critical scoring and daily aggregate tests.
- `npm run build`: production build.

## Vercel
Import this repository into Vercel, set the five environment variables above for Production/Preview as appropriate, deploy, then run the SQL migration and seed against the intended Supabase project. Verify availability submission, organizer login, published schedule, and results on the production URL.

## Security notes
Organizer login signs an 8-hour HTTP-only, SameSite=Strict cookie using HMAC-SHA256. Passcode verification is server-side and timing-safe. The shared passcode is not individual organizer identity. The included login endpoint is a baseline; before public production use, put distributed rate limiting (e.g. Upstash Redis/Vercel KV) and bot protection in front of it. Never enable client-side service-role access. All organizer writes must be performed through authenticated server routes and must be audited. Supabase service-role bypasses RLS and must remain server-only.

## Current implementation status
Public home, availability form and upsert API, published schedule, results listing, tournament rules, scoring validation helpers/tests, Supabase schema/seed, and passcode login shell are included. The organizer match-builder, publishing controls, result correction flow, complete audit trail, and advanced player-statistics screens are not yet complete. Do not treat this initial build as production-ready until these workflows and security checks have been implemented and verified.
