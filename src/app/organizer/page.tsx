import OrganizerLogin from "./login";
import MatchBuilder from "./match-builder";
import ResultEntry from "./result-entry";
import { isOrganizerAuthenticated } from "@/lib/organizer-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Team = {
  id: string;
  name: string;
  players: {
    id: string;
    full_name: string;
    active: boolean;
  }[];
};

type Match = {
  id: string;
  match_number: number;
  match_date: string;
  category: string;
  status: string;
  published: boolean;
};

export default async function Organizer() {
  if (!(await isOrganizerAuthenticated())) {
    return (
      <main className="shell" style={{ paddingTop: 48, maxWidth: 560 }}>
        <div className="eyebrow">TOURNAMENT COMMITTEE</div>

        <h1 style={{ fontSize: 40, letterSpacing: "-.05em" }}>
          Organizer access
        </h1>

        <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
          Sign in with the committee passcode to manage the tournament.
        </p>

        <OrganizerLogin />
      </main>
    );
  }

  const db = supabaseAdmin();

  let teams: Team[] = [];
  let matches: Match[] = [];
  let players = 0;
  let review = 0;

  if (db) {
    const [teamResult, matchResult, playerResult, availabilityResult] =
      await Promise.all([
        db
          .from("teams")
          .select("id,name,players(id,full_name,active)")
          .order("name"),
        db
          .from("matches")
          .select("id,match_number,match_date,category,status,published")
          .order("match_date", { ascending: false })
          .order("match_number", { ascending: true }),
        db.from("players").select("id", { count: "exact", head: true }),
        db
          .from("availability")
          .select("id", { count: "exact", head: true })
          .eq("review_required", true),
      ]);

    teams = (teamResult.data ?? []) as Team[];
    matches = (matchResult.data ?? []) as Match[];
    players = playerResult.count ?? 0;
    review = availabilityResult.count ?? 0;
  }

  const overview = [
    { label: "Registered players", count: players },
    { label: "All matches", count: matches.length },
    { label: "Availability reviews", count: review },
  ];

  return (
    <main className="shell" style={{ paddingTop: 40 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div className="eyebrow">COMMITTEE CONTROL ROOM</div>

          <h1 style={{ fontSize: 38, margin: "8px 0" }}>Tournament overview</h1>
        </div>

        <form action="/api/organizer/logout" method="post">
          <button className="btn btn-light">Log out</button>
        </form>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
          gap: 14,
          marginTop: 24,
        }}
      >
        {overview.map((item) => (
          <div className="panel" key={item.label} style={{ padding: 20 }}>
            <div className="eyebrow">{item.label}</div>

            <div
              style={{
                fontSize: 36,
                fontWeight: 900,
                marginTop: 8,
              }}
            >
              {item.count}
            </div>
          </div>
        ))}
      </div>

      {!db && (
        <div className="panel" style={{ padding: 20, marginTop: 20 }}>
          Supabase is not configured. Add the environment variables and run the
          SQL setup.
        </div>
      )}

      <MatchBuilder teams={teams} matches={matches} />
      <ResultEntry matches={matches} />

      <div className="panel" style={{ padding: 22, marginTop: 18 }}>
        <h2 style={{ marginTop: 0 }}>Tournament scoring</h2>

        <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
          Daily aggregate games are calculated from all completed matches per
          date. Overall championship points remain pending committee
          confirmation. No champion can be declared until the committee
          configures and confirms the scoring method.
        </p>
      </div>
    </main>
  );
}
