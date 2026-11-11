import { supabasePublic } from "@/lib/supabase/server";

export const revalidate = 60;

type PlayerStatistic = {
  player_id: string;
  full_name: string;
  team_name: string;
  matches_played: number;
  wins: number;
  losses: number;
};

type DailyAggregate = {
  match_date: string;
  blue_games: number;
  white_games: number;
  completed_matches: number;
};

type Team = {
  id: string;
  name: string;
};

type TeamStanding = {
  name: string;
  played: number;
  wins: number;
  losses: number;
};

export default async function Standings() {
  const db = supabasePublic();

  let stats: PlayerStatistic[] = [];
  let daily: DailyAggregate[] = [];
  let teams: Team[] = [];

  if (db) {
    const [statisticsResult, dailyResult, teamsResult] = await Promise.all([
      db
        .from("player_match_statistics")
        .select("*")
        .order("matches_played", { ascending: false }),
      db
        .from("daily_aggregate_scores")
        .select("*")
        .order("match_date", { ascending: false }),
      db.from("teams").select("id,name"),
    ]);

    stats = (statisticsResult.data ?? []) as PlayerStatistic[];
    daily = (dailyResult.data ?? []) as DailyAggregate[];
    teams = (teamsResult.data ?? []) as Team[];
  }

  const teamStats: TeamStanding[] = teams.map((team) => {
    const playerStats = stats.filter((stat) => stat.team_name === team.name);

    return {
      name: team.name,
      played: playerStats.reduce(
        (total, stat) => total + stat.matches_played,
        0,
      ),
      wins: playerStats.reduce((total, stat) => total + stat.wins, 0) / 2,
      losses: playerStats.reduce((total, stat) => total + stat.losses, 0) / 2,
    };
  });

  return (
    <main className="shell" style={{ paddingTop: 44 }}>
      <div className="eyebrow">TEAM & PLAYER RECORDS</div>

      <h1
        style={{
          fontSize: 42,
          letterSpacing: "-.05em",
          margin: "10px 0",
        }}
      >
        Standings & statistics
      </h1>

      <p style={{ color: "var(--muted)" }}>
        Match wins and losses are shown separately from daily aggregate games.
        Championship points remain pending confirmation.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 14,
          marginTop: 22,
        }}
      >
        {teamStats.map((team) => (
          <div className="panel" key={team.name} style={{ padding: 22 }}>
            <div className="eyebrow">{team.name}</div>

            <div
              style={{
                fontSize: 34,
                fontWeight: 900,
                marginTop: 8,
              }}
            >
              {team.wins}–{team.losses}
            </div>

            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              Match wins – losses · {team.played / 2} total matches
            </div>
          </div>
        ))}
      </div>

      <div className="panel" style={{ padding: 22, marginTop: 24 }}>
        <h2 style={{ marginTop: 0 }}>Player statistics</h2>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr>
                {["Player", "Team", "Played", "Wins", "Losses", "Win %"].map(
                  (heading) => (
                    <th
                      key={heading}
                      style={{
                        textAlign: "left",
                        padding: 10,
                        borderBottom: "1px solid var(--line)",
                      }}
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody>
              {stats.map((stat) => {
                const values: (string | number)[] = [
                  stat.full_name,
                  stat.team_name,
                  stat.matches_played,
                  stat.wins,
                  stat.losses,
                  stat.matches_played
                    ? Math.round((stat.wins / stat.matches_played) * 100) + "%"
                    : "—",
                ];

                return (
                  <tr key={stat.player_id}>
                    {values.map((value, index) => (
                      <td
                        key={index}
                        style={{
                          padding: 10,
                          borderBottom: "1px solid var(--line)",
                        }}
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!stats.length && (
            <p style={{ color: "var(--muted)" }}>
              Player statistics will appear after completed results are
              recorded.
            </p>
          )}
        </div>
      </div>

      <div className="panel" style={{ padding: 22, marginTop: 24 }}>
        <h2 style={{ marginTop: 0 }}>Daily aggregate history</h2>

        {daily.length ? (
          daily.map((entry) => (
            <div
              key={entry.match_date}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 0",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <span>
                {entry.match_date} · {entry.completed_matches} matches
              </span>

              <b>
                {entry.blue_games} – {entry.white_games}
              </b>
            </div>
          ))
        ) : (
          <p style={{ color: "var(--muted)" }}>No completed match days yet.</p>
        )}
      </div>

      <p style={{ fontWeight: 800, marginTop: 18 }}>
        Championship scoring pending confirmation.
      </p>
    </main>
  );
}
