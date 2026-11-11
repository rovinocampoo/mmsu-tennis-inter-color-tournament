# MMSU Tennis Club Inter-Color Tournament — Season 2
## Project Master Prompt

> **Repository:** https://github.com/rovinocampoo/mmsu-tennis-inter-color-tournament  
> **Mandatory instruction:** Build this application directly inside this repository. Do not ask the user to create another repository, do not scaffold elsewhere, and do not treat this as a hypothetical specification. Inspect this repository, then implement the application here. Commit changes to the default branch unless the user explicitly directs otherwise. Preserve existing work if the repository is no longer empty.

Act as a senior full-stack engineer, product designer, database architect, and UX specialist. Build a complete, production-ready tournament management web application for the Mariano Marcos State University (MMSU) Tennis Club 2026 Inter-Color Tournament — Season 2.

This is an independent project. Do not connect it to RallyLedger or the existing MMSU Tennis Club booking application. Use this repository as the sole source-code home for this project.

Do not build only a landing page or static UI prototype. Build a functional application backed by a real database, with validated workflows, secure organizer access, reliable match records, and responsive public pages.

---

# 1. Project identity and confirmed decisions

- Official name: MMSU Tennis Club Inter-Color Tournament — Season 2
- Institution: Mariano Marcos State University Tennis Club
- Tournament dates: November 11 – December 8, 2026
- Duration: 28 calendar days, inclusive
- Teams: Team Blue and Team White
- Registered players: 61 total (30 Blue, 31 White)
- Match format: Doubles only (2 vs. 2)
- **Confirmed match format: one 8-game advantage set**
- **Confirmed availability behavior: players can submit or update availability all day; there is no fixed daily cutoff**
- Categories: Class A, Class B, Beginners
- Timezone: Asia/Manila
- Weekday matches: 5:00 PM onwards, or earlier if all players in a scheduled match are present

## Critical distinction: daily aggregate score vs. tournament championship scoring

The tournament committee has clarified that **all games scores from every match played on a given day must be totalled together to produce that day's final team score**.

Implement a daily aggregate scoreboard as follows:

1. For each local tournament date, include every valid completed match played on that date.
2. Add together the games won by Team Blue across all those matches.
3. Separately add together the games won by Team White across all those matches.
4. Display the resulting daily aggregate as **Team Blue daily games total – Team White daily games total**.
5. This is the final aggregate score for that day, not merely the score of the last match.
6. Recalculate the daily aggregate whenever an authorized organizer records, edits, or voids a result.
7. Exclude scheduled, in-progress, postponed, and cancelled matches.
8. Clearly label this as the **Daily Aggregate Score** or **Today's Total Games**, so it cannot be confused with an individual match score.

Example:
- Match 1: Blue pair wins 8–6.
- Match 2: White pair wins 8–5.
- Match 3: Blue pair wins 8–4.
- Daily aggregate: Team Blue 21 – Team White 15.

The example is illustrative only; never seed fake results.

**The overall tournament championship point calculation remains undecided.** Do not assume that daily aggregate games automatically determine the championship unless the organizer explicitly confirms that rule in tournament settings. Keep these concepts separate:
- Individual match result.
- Daily aggregate games score.
- Overall tournament championship scoring.

Until championship scoring is confirmed, show daily aggregate scores and match wins/losses, but label cumulative championship points and champion determination as pending confirmation.

---

# 2. Technology and architecture

Use:
- Next.js with App Router
- React
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Supabase JavaScript client
- Vercel deployment

Requirements:
- Clean, maintainable architecture
- Reusable components and design tokens
- Server-side validation for sensitive operations
- Database migrations or a complete, repeatable SQL schema
- Environment variables for all secrets
- Responsive, mobile-first pages
- Accessible controls and readable contrast
- Proper loading, empty, success, and error states
- Automated tests for critical scoring, scheduling, and aggregation logic
- No unnecessary dependencies

Create a README with exact Windows setup instructions, Supabase setup, environment variables, database migration/seed instructions, local development, testing, and Vercel deployment.

Before implementation:
1. Inspect the repository and its current state.
2. Confirm the default branch and existing files.
3. If the repository is empty, initialize the project here.
4. If it already contains work, inspect and preserve it.
5. Present a concise architecture and phased plan, then proceed with implementation. Do not stop at a plan or ask the user to create another repo.

---

# 3. Official player roster

Seed exactly these 61 participants. Do not invent, remove, or duplicate players. Names should be editable by organizers because spellings may need confirmation against the original registration sheet.

## Team Blue — 30 players
Team Leader: Chloe Castro

1. Angel Badeth
2. Hannah Mata
3. Alvin Velasquez
4. Chayan Hombrob ueno
5. Francis Madrid
6. Louie Guerrero
7. John Paul Castro
8. Van Van Acuna
9. Castor Bumanlag
10. Chadley Balicao
11. Buchard Cutin
12. Frances Franco
13. Kim Castro
14. MJ Castro
15. Aura Castro
16. AJ Espiritu
17. Jelon Paraoan
18. Med Aga
19. Dathan Lagustan
20. Rock Dadiz
21. Rovin Ocampo
22. John Cuanang
23. Jerome Wangkey
24. Earl Mendoza
25. Jenny Concepcion-Tabal
26. Jessica Guittap
27. Kristine Yere
28. Enzo Singson
29. Arvin Soriano
30. Vincent Castro

## Team White — 31 players
Team Leader: Kathleen Flojo

1. Andrea Castillo
2. Angel Trisha Toribio
3. Bryan Acantilado
4. Janzzen Bartolome
5. Leon Blas
6. Prince Estavillo
7. Cesar Arevalo
8. Jed Arnel Raquel
9. Raffy Sadang
10. Oddie Olalo
11. Larry Agustin
12. Vina Cuanang-Cruz
13. Megan Lacambra
14. Rinalyn Portugal
15. Leigh Corpuz
16. Lyka Corpuz
17. Donna Villon
18. Karl Jade Labucay
19. Jessie Mata
20. Brien Lutap
21. Buboy Mata
22. Nestor Corpuz
23. Jethro Guittap
24. Jan Luis Corpuz
25. Marlon Labucay
26. Gianni Soriano
27. Stephanie Ulep
28. Chantiley Dadiz
29. Rachelle Bocoboc
30. Felix Theodore Raquel
31. Kim Lorenzo

Each player belongs to exactly one team. Add a roster verification check that confirms 30 Blue players and 31 White players after seeding.

---

# 4. Public application

No account registration should be required for basic player participation. The public site should be easy to use on a phone.

## A. Home / tournament dashboard

Immediately communicate:
- Team Blue vs. Team White
- Today's Daily Aggregate Score
- Today's completed match results
- Upcoming matches
- Tomorrow's availability totals
- Tournament dates and progress
- Latest results and quick navigation

If there are no completed matches today, show a friendly empty state. Never show invented scores.

Display the daily aggregate separately from the overall tournament championship standings.

## B. Player availability

Every day, players can declare whether they can play the following calendar day.

Workflow:
1. Player opens the availability page.
2. Selects Team Blue or Team White.
3. Selects their name from the official roster.
4. Sees the target date clearly, defaulting to tomorrow in Asia/Manila.
5. Selects Available or Not Available.
6. Submits and receives confirmation.

Confirmed rules:
- Availability is for the following calendar day by default.
- Use Asia/Manila to determine dates.
- Players may submit or update their response at any time throughout the day.
- There is no fixed daily cutoff.
- Do not disable submissions after an organizer publishes a schedule.
- If availability changes after a schedule is published, flag the affected assignment for organizer review and notify the organizer in the dashboard.
- Never automatically cancel or change a published match because availability changes.
- Prevent duplicate records for the same player and date; updates should replace the existing response.
- Store submitted_at and updated_at timestamps.
- Show the player's existing response when they return.
- Do not allow a player to select a name from the other team after choosing their team.
- Organizers may correct a response, with reason and activity log.

Show availability summaries for each team:
- Available
- Not available
- No response

Provide search and filters. Public availability displays may show player names and statuses for club coordination, but do not expose unnecessary personal information.

## C. Public match schedule

Display matches grouped by date with:
- Match number
- Date and scheduled time
- Court
- Category
- Team Blue pair
- Team White pair
- Status

Statuses:
- Scheduled
- In Progress
- Completed
- Postponed
- Cancelled

## D. Match results

For every completed match, display:
- Date
- Category
- Blue doubles pair
- White doubles pair
- Final set score
- Winning team

Provide filters for date and category. Show today's results prominently.

## E. Daily aggregate scoreboard

This is a required, first-class feature.

For a selected date, aggregate the game scores from **all completed matches on that date**:
- Team Blue daily total = sum of Blue games from every completed match that date.
- Team White daily total = sum of White games from every completed match that date.

Show:
- Daily Aggregate Score: Blue total – White total
- Number of completed matches included
- Per-match score breakdown
- Daily team wins and losses, separately from games totals

The daily total must update automatically after a result is recorded or corrected. It must never be calculated from only one match or from the last match entered.

Provide a date selector and a daily history view so players can review previous days' aggregate scores.

## F. Team standings and player statistics

Show:
- Total matches played
- Match wins and losses
- Daily aggregate score history
- Championship points only if the championship scoring method has been configured and confirmed

Individual player statistics:
- Matches played
- Wins
- Losses
- Win percentage
- Categories played
- Match history

Only completed, valid matches count toward statistics.

---

# 5. Organizer portal and passcode security

Create a separate organizer portal at /organizer.

Require a simple organizer passcode. Do not put the passcode in frontend code or commit it to Git.

Security requirements:
- Store the passcode in a server-side environment variable.
- Verify it on the server.
- Use secure HTTP-only session cookies.
- Apply appropriate Secure, SameSite, Path, and expiry settings.
- Add rate limiting or login-attempt protection.
- Protect every organizer API route and server action.
- Never rely only on hiding admin UI elements.
- Never expose the passcode or service-role credentials to the browser.
- Provide logout and session expiry.
- Use Supabase RLS and server-side authorization carefully.
- Document the security limitations of shared passcode access.

Organizer sections:
1. Overview
2. Daily Availability
3. Match Builder
4. Match Schedule
5. Record Results
6. Daily Aggregate Scores
7. Standings
8. Player Management
9. Tournament Settings
10. Activity History

---

# 6. Manual doubles match builder

Organizers manually create matchups based on player availability. Do not automatically generate or publish pairings.

Workflow:

### Step 1 — Select date
Default to tomorrow. Show availability counts for both teams.

### Step 2 — Review available players
Show separate Team Blue and Team White lists with:
- Player name
- Category, if assigned
- Availability status
- Existing match assignments for the selected date

### Step 3 — Create a match
Each match must contain exactly:
- Two Team Blue players
- Two Team White players

Additional fields:
- Category (Class A, Class B, Beginners)
- Match date
- Scheduled time
- Court
- Optional notes

Validation:
- Players must belong to the correct team.
- Available players are selectable by default.
- Organizers may override availability with a warning and recorded reason.
- A player cannot be assigned to overlapping matches.
- Multiple matches per player on one date are allowed only when times do not overlap and the organizer intentionally schedules them.

### Step 4 — Preview
Before publishing, allow organizers to:
- Edit pairings
- Remove matches
- Change category
- Change court and time
- Add more matches

Warn about duplicate assignments, unavailable players, incomplete pairs, wrong-team selections, and overlapping times.

### Step 5 — Publish
After confirmation:
- Public users can see the schedule.
- Matches appear on the homepage and date schedule.
- Organizer edits remain possible with activity logging.
- Availability changes after publication flag affected matches for review but do not silently alter them.

---

# 7. Match format and result entry

**Confirmed format: one 8-game advantage set.**

All matches are doubles.

Score validation:
- A team must win at least 8 games.
- A team must lead by at least 2 games.
- Valid examples: 8–0 through 8–6, 9–7, 10–8, and further advantage scores.
- 8–7 is not a completed valid score.
- If the score reaches 7–7 or later, play continues until a team leads by two.
- Do not silently impose a tiebreak at 8–8; the supplied rules specify an advantage set.
- Keep the rules engine isolated so it can be updated if the committee later confirms a different interpretation.

Result entry should be quick and mobile-friendly for organizers courtside.

For each match:
- Match date and number
- Category
- Both doubles pairs
- Final score
- Automatically determined winner
- Optional notes

Require confirmation before finalizing. Only valid completed results count. Postponed and cancelled matches do not count.

Authorized organizers may correct a result. Preserve a correction history and recalculate player statistics, daily aggregates, and any configured standings without double-counting.

---

# 8. Championship scoring remains undecided

The tournament rules say teams accumulate points from match results and the team with the highest total on December 8 becomes champion. However, the committee has not yet confirmed exactly how those championship points are calculated.

Do not assume a championship scoring method.

Possible methods to offer in settings:
- Total games won
- Fixed points per match victory
- Total sets won

Until the committee confirms:
- Store all match scores accurately.
- Calculate match wins and losses.
- Calculate each day's aggregate games score as specified above.
- Show daily aggregate score history.
- Do not fabricate cumulative championship points.
- Do not declare an official champion.
- Show “Championship scoring pending confirmation.”

Require an explicit organizer confirmation before enabling championship scoring. If the scoring method changes after results exist, warn the organizer and require confirmation before recalculating standings.

**Important:** Daily aggregate games score is already defined and must work immediately. The undecided item is only the overall championship point calculation.

---

# 9. Tournament calendar and duration

Build an interactive calendar for November 11 through December 8, 2026.

Show:
- Published matches
- Completed matches
- Unscheduled days
- Availability response status
- Daily aggregate score when results exist

Clicking a date opens that day's matches, individual results, and aggregate score.

Do not assume matches occur every day.

Tournament duration:
- 28 calendar days inclusive
- Show start date, end date, current tournament day, elapsed days, and remaining days
- Show actual match days and total matches played separately
- Do not declare the tournament complete based only on the calendar reaching December 8

Finalization must be organizer-controlled. If championship scoring is still unconfigured, prevent official champion declaration and explain why.

---

# 10. Official tournament rules page

Publish the supplied tournament rules:

## Team composition
- Two teams.
- Team White leader: Engr. Kathleen Flojo.
- Team Blue leader: Ms. Chloe Castro.

## Categories
- Class A
- Class B
- Beginners
- Categories may adjust depending on player availability.
- A player can play multiple times for their team.

## Match format
- Doubles only.
- One 8-game advantage set.
- Win by two games; no automatic tiebreak unless the committee confirms one.

## Scoring
- Teams accumulate points from match results.
- All games scores from matches played on a given day are totalled to produce the final aggregate score for that day.
- The overall championship point calculation remains pending committee confirmation.
- The team with the highest confirmed accumulated championship points on December 8 is champion.

## Match rules
1. ITF rules apply, with local adaptations if needed.
2. Games are played by an 8-game advantage set.
3. Warm-up time: 5 minutes maximum before each match.
4. Players must be present 10 minutes before scheduled match time.
5. No coaching during play.
6. Respect officials and opponents.

## Attire
1. Players must wear their team color on December 8.
2. Proper tennis attire must be worn.

## Code of conduct
1. Maintain sportsmanship and fair play at all times.
2. No abusive language or behavior.
3. Disputes will be resolved by the Tournament Committee, whose decision is final.

## Schedule
1. Tournament dates and match order may be announced in advance or on the spot, subject to player availability and match balance.
2. On weekdays, matches start at 5:00 PM or earlier if all players are present.

---

# 11. Database design

Design a normalized PostgreSQL schema. Suggested entities:

- teams: id, name, color, team_leader, created_at
- players: id, team_id, full_name, active, created_at, updated_at
- availability: id, player_id, availability_date, status, submitted_at, updated_at
- matches: id, match_date, match_number, category, court, scheduled_time, status, published, notes, created_at, updated_at
- match_players: id, match_id, player_id, team_id, pair_position
- match_sets or match_scores: id, match_id, set_number, blue_games, white_games, optional tiebreak fields if later required
- match_results: id, match_id, winning_team_id, completed_at, recorded_by, updated_at
- tournament_settings: id, tournament_name, start_date, end_date, timezone, scoring_method nullable until confirmed, match_format, tournament_status
- organizer_activity_logs: id, action, entity_type, entity_id, description, created_at

Add appropriate foreign keys, unique constraints, indexes, checks, and RLS policies.

Important data integrity:
- Unique availability per player and date.
- Exactly two players per team per match.
- No invalid player-team assignment.
- Validate 8-game advantage-set scores server-side.
- Derive the winner from the validated score; do not trust a client-supplied winner.
- Derive daily aggregate scores from completed match score records. Prefer a database view or a single well-tested server-side aggregation query rather than storing duplicated totals.
- A correction must replace the previous result contribution, never add a second contribution.
- Keep championship scoring nullable/unconfigured until confirmed.
- Keep secrets and Supabase service-role credentials server-only.

---

# 12. Design direction: jolly, interactive, tennis-inspired

This must feel like a cheerful university tennis club event, not a generic corporate SaaS dashboard.

Visual direction:
- Tennis green
- Bright yellow
- Warm white
- Deep forest green
- Team Blue accents
- Team White accents

Use:
- Rounded cards
- Friendly typography
- Smooth transitions
- Animated but restrained score counters
- Interactive team comparison
- Distinctive match cards
- Playful tennis-ball graphics
- Subtle court-inspired patterns
- Clear win and match-status indicators
- Friendly confirmations and micro-interactions

Avoid:
- Excessive corporate styling
- Generic admin templates
- Too much black or zinc-950
- Excessive gradients
- Clutter and tiny typography
- Unnecessary animations

Make mobile the priority. Availability submission and result viewing must be especially simple on phones.

The homepage should immediately answer:
- What is today's aggregate score?
- Who won today's matches?
- Who is playing tomorrow?
- How many players are available?
- What matches are coming up?

Never display fake numbers to fill empty states.

---

# 13. Testing requirements

Add automated tests for critical business logic. At minimum verify:

1. Exactly 61 seeded players.
2. Exactly 30 Team Blue players.
3. Exactly 31 Team White players.
4. Availability submission and update work throughout the day.
5. Duplicate availability is prevented.
6. Availability changes after publication flag the organizer for review.
7. Organizer authentication and authorization are enforced server-side.
8. Every match has exactly two players per team.
9. Players cannot be scheduled in overlapping matches.
10. Published schedules are publicly readable.
11. Valid 8-game advantage-set scores are accepted.
12. Scores such as 8–7 are rejected as completed results.
13. Winner calculation is correct.
14. Daily aggregate totals sum scores from every completed match on the selected date.
15. Daily aggregate excludes incomplete, postponed, and cancelled matches.
16. Daily aggregate updates correctly after a result correction.
17. Result corrections never double-count.
18. A date with multiple matches produces one combined daily score.
19. Date filters use Asia/Manila.
20. Championship points remain pending while unconfigured.
21. Player statistics are based only on completed matches.
22. Mobile layouts work at common phone widths.

Include test fixtures for the daily aggregation example:
- Match 1: Blue 8–6 White
- Match 2: Blue 5–8 White
- Match 3: Blue 8–4 White
- Expected daily aggregate: Blue 21 – White 18

These are test fixtures only, never production seed results.

---

# 14. Definition of done

The application is complete when:
- It is implemented directly in this GitHub repository.
- The public homepage is polished and responsive.
- Players can submit and update availability for tomorrow at any time.
- Organizers can securely access their portal with a passcode.
- Organizers can review availability and manually create doubles matches.
- Organizers can preview and publish schedules.
- Players can view published schedules.
- Organizers can record valid 8-game advantage-set results.
- Winners are calculated automatically.
- The daily aggregate score totals games from every completed match played that day.
- Daily aggregate history is available by date.
- Result corrections recalculate daily totals correctly.
- Individual player statistics are accurate.
- Championship scoring remains unconfigured until explicitly confirmed.
- The application uses a real Supabase database.
- Critical tests pass.
- README and deployment instructions are complete.
- The project is ready for Vercel deployment and production smoke testing.

# 15. Final execution instructions

Work directly in:

https://github.com/rovinocampoo/mmsu-tennis-inter-color-tournament

Do not ask the user to create a new repository. Do not create the project in another repository or local project name. Inspect and implement in this repository.

Do not stop after writing a plan, README, or mockup. Complete the application in phases, test the critical workflows, and report exactly what was implemented, what remains, what environment variables the user must supply, and what setup actions require the user's own Supabase or Vercel access.

Do not invent match results, daily scores, player records, or championship points.

The priority is a delightful and easy-to-use club experience, accurate daily coordination, reliable doubles match records, correct daily aggregate scoring, and a clear Team Blue versus Team White competition.
