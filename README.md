# MMSU Tennis Club Inter-Color Tournament — Season 2
Mobile-first tournament coordination for November 11–December 8, 2026.

## Stack
Next.js App Router · React · TypeScript · Tailwind CSS v4 · Supabase PostgreSQL · Vercel.

## Windows setup
1. Install Node.js 20.9+ and Git.
2. Clone this repository and open it in VS Code.
3. Copy `.env.example` to `.env.local`.
4. Create a Supabase project. In Supabase SQL Editor, run `supabase/migrations/202611110001_initial_schema.sql`, then `supabase/seed.sql`.
5. Add the Supabase URL, anon key, service-role key, organizer passcode, and a random session secret to `.env.local`. Never commit `.env.local`.
6. In PowerShell run `npm install`, then `npm run dev`.
7. Open http://localhost:3000.

## Environment variables
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: public anon/publishable key.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only service-role key. Never expose it to browser code.
- `ORGANIZER_PASSCODE`: shared committee passcode.
- `ORGANIZER_SESSION_SECRET`: random secret of at least 32 characters for signed organizer sessions.

## Database and roster
Run the migration and seed SQL in order. The seed inserts only the 61 official players and verifies 30 Team Blue + 31 Team White. No results or fake scores are seeded. The daily aggregate view sums every completed match score for each local match date. Championship scoring stays unconfigured until the committee confirms the method.

## Commands
- `npm run dev`: local server.
- `npm run typecheck`: TypeScript validation.
- `npm test`: critical scoring and aggregate tests.
- `npm run build`: production build.

## Included application workflows
- Public tournament dashboard and daily aggregate scoreboard.
- Public availability submission/update for tournament dates.
- Published schedule and completed result views.
- Official rules page.
- Organizer passcode login with an eight-hour signed HTTP-only cookie.
- Organizer manual doubles match draft creation, availability override reason, publishing, result entry, and correction reason/history.
- Database views for daily aggregate scores and player match statistics.

## Vercel deployment
Import this repository into Vercel, configure all five environment variables for the correct environment, deploy, and run the SQL migration and seed against the intended Supabase project. Verify player availability, organizer login, match creation/publishing, score entry, and daily aggregation on the deployed URL.

## Security and production hardening
The organizer passcode is shared access, not individual organizer identity. The cookie uses HMAC-SHA256, is HTTP-only, SameSite=Strict, and expires after eight hours. Passcode comparison is timing-safe. Add distributed rate limiting and bot protection to the organizer login and public availability endpoint before opening the site broadly; in-memory limits are not reliable across serverless instances. Service-role access bypasses RLS and must remain server-only. Organizer write routes check the signed session and write activity records. Audit logs and correction history are not publicly readable.

The manual builder validates the team membership and pair count. It warns on unavailable or missing responses through a required override reason. It does not yet provide a full visual availability planner, drag-and-drop editing, overlap-duration management, or draft deletion. The shared passcode should be rotated if it is exposed.

## Validation status
Unit tests cover the 8-game advantage-set validator and daily aggregate reducer. The GitHub connector cannot run npm install, the Next.js compiler, Vitest, or a live Supabase migration against your accounts. Run `npm install`, `npm run typecheck`, `npm test`, and `npm run build` locally before deployment. This repository implementation has not yet been locally built or production-smoke-tested.
