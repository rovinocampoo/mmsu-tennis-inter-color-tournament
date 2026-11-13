import { supabasePublic } from "@/lib/supabase/server";
import ShareHeadToHeadButton from "./share-head-to-head-button";

export const revalidate = 60;

type PlayerStatistic = { player_id: string; full_name: string; team_name: string; matches_played: number; wins: number; losses: number };
type DailyAggregate = { match_date: string; blue_games: number; white_games: number; completed_matches: number };
type Team = { id: string; name: string };
type TeamStanding = { name: string; played: number; wins: number; losses: number };

export default async function Standings() {
  const db = supabasePublic();
  let stats: PlayerStatistic[] = [];
  let daily: DailyAggregate[] = [];
  let teams: Team[] = [];
  if (db) {
    const [statisticsResult, dailyResult, teamsResult] = await Promise.all([
      db.from("player_match_statistics").select("*").order("matches_played", { ascending: false }),
      db.from("daily_aggregate_scores").select("*").order("match_date", { ascending: true }),
      db.from("teams").select("id,name"),
    ]);
    stats = (statisticsResult.data ?? []) as PlayerStatistic[];
    daily = (dailyResult.data ?? []) as DailyAggregate[];
    teams = (teamsResult.data ?? []) as Team[];
  }

  const teamStats: TeamStanding[] = teams.map((team) => {
    const rows = stats.filter((stat) => stat.team_name === team.name);
    return {
      name: team.name,
      played: rows.reduce((total, stat) => total + stat.matches_played, 0) / 2,
      wins: rows.reduce((total, stat) => total + stat.wins, 0) / 2,
      losses: rows.reduce((total, stat) => total + stat.losses, 0) / 2,
    };
  });
  const matches = daily.reduce((sum, day) => sum + day.completed_matches, 0);
  const blueGames = daily.reduce((sum, day) => sum + day.blue_games, 0);
  const whiteGames = daily.reduce((sum, day) => sum + day.white_games, 0);
  const totalGames = blueGames + whiteGames;
  const activePlayers = stats.filter((stat) => stat.matches_played > 0).length;
  const leaders = [...stats].filter((stat) => stat.matches_played > 0).sort((a, b) => b.wins - a.wins || b.matches_played - a.matches_played || a.full_name.localeCompare(b.full_name));
  const maxDaily = Math.max(1, ...daily.map((day) => Math.max(day.blue_games, day.white_games)));

  return (
    <main className="shell" style={{ paddingTop: 44 }}>
      <div className="eyebrow">TOURNAMENT ANALYTICS</div>
      <h1 style={{ fontSize: 42, letterSpacing: "-.05em", margin: "10px 0" }}>Standings & statistics</h1>
      <p style={{ color: "var(--muted)", maxWidth: 700, lineHeight: 1.7 }}>A live performance dashboard for match outcomes, player records, and daily game totals. Daily games are not championship points.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12, marginTop: 24 }}>
        {[
          { label: "Completed matches", value: matches },
          { label: "Players appeared", value: activePlayers },
          { label: "Total games played", value: totalGames },
          { label: "Match days", value: daily.length },
        ].map((item) => <div className="panel" key={item.label} style={{ padding: 20 }}>
          <div className="eyebrow">{item.label}</div>
          <div style={{ fontSize: 36, fontWeight: 900, marginTop: 8 }}>{item.value}</div>
        </div>)}
      </div>

      <section style={{ marginTop: 30 }}>
        <div className="eyebrow">TEAM COMPARISON</div>
        <h2 style={{ fontSize: 26, margin: "7px 0 14px" }}>Head-to-head record</h2>
        <ShareHeadToHeadButton
          blue={{ name: "Team Blue", played: teamStats.find((team) => team.name === "Team Blue")?.played ?? 0, wins: teamStats.find((team) => team.name === "Team Blue")?.wins ?? 0, losses: teamStats.find((team) => team.name === "Team Blue")?.losses ?? 0, games: blueGames }}
          white={{ name: "Team White", played: teamStats.find((team) => team.name === "Team White")?.played ?? 0, wins: teamStats.find((team) => team.name === "Team White")?.wins ?? 0, losses: teamStats.find((team) => team.name === "Team White")?.losses ?? 0, games: whiteGames }}
          completedMatches={matches}
          totalGames={totalGames}
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
          {teamStats.map((team) => {
            const blue = team.name === "Team Blue";
            const color = blue ? "#3478df" : "#9aa59b";
            const games = blue ? blueGames : whiteGames;
            return <article className="panel" key={team.name} style={{ padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <b>{team.name}</b><span className="pill" style={{ background: blue ? "#e9f1ff" : "#f0f2ed" }}>{blue ? "BLUE" : "WHITE"}</span>
              </div>
              <div style={{ fontSize: 40, fontWeight: 900, marginTop: 12 }}>{team.wins}–{team.losses}</div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>Wins – losses · {team.played} matches</div>
              <div style={{ height: 10, borderRadius: 20, background: "#edf0e9", overflow: "hidden", marginTop: 18 }}>
                <div style={{ width: `${totalGames ? (games / totalGames) * 100 : 0}%`, height: "100%", background: color, borderRadius: 20 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 8, color: "var(--muted)" }}><span>{games} games won</span><b>{totalGames ? Math.round((games / totalGames) * 100) : 0}%</b></div>
            </article>;
          })}
        </div>
      </section>

      <section className="panel" style={{ padding: 22, marginTop: 24 }}>
        <div className="eyebrow">PERFORMANCE LEADERS</div>
        <h2 style={{ margin: "7px 0 16px" }}>Player leaderboard</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 620 }}>
            <thead><tr>{["#", "Player", "Team", "Played", "Wins", "Losses", "Win rate"].map((heading) => <th key={heading} style={{ textAlign: heading === "Player" || heading === "Team" ? "left" : "right", padding: 11, borderBottom: "1px solid var(--line)", color: "var(--muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em" }}>{heading}</th>)}</tr></thead>
            <tbody>{leaders.map((stat, index) => {
              const winRate = stat.matches_played ? Math.round((stat.wins / stat.matches_played) * 100) : 0;
              return <tr key={stat.player_id}>
                <td style={{ padding: 12, borderBottom: "1px solid var(--line)", textAlign: "right", color: "var(--muted)" }}>{index + 1}</td>
                <td style={{ padding: 12, borderBottom: "1px solid var(--line)", fontWeight: 800 }}>{stat.full_name}</td>
                <td style={{ padding: 12, borderBottom: "1px solid var(--line)" }}>{stat.team_name}</td>
                {[stat.matches_played, stat.wins, stat.losses].map((value, i) => <td key={i} style={{ padding: 12, borderBottom: "1px solid var(--line)", textAlign: "right" }}>{value}</td>)}
                <td style={{ padding: 12, borderBottom: "1px solid var(--line)", textAlign: "right", fontWeight: 800 }}>{winRate}%</td>
              </tr>;
            })}</tbody>
          </table>
          {!leaders.length && <p style={{ color: "var(--muted)" }}>Player statistics will appear after completed results are recorded.</p>}
        </div>
      </section>

      <section className="panel" style={{ padding: 22, marginTop: 24 }}>
        <div className="eyebrow">DAILY PERFORMANCE</div>
        <h2 style={{ margin: "7px 0 6px" }}>Games by match day</h2>
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 0 }}>Each bar compares the combined games won by each color across all completed matches that day.</p>
        {daily.length ? <div style={{ display: "grid", gap: 18, marginTop: 22 }}>
          {daily.map((day) => <div key={day.match_date}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13, marginBottom: 8 }}><b>{day.match_date}</b><span style={{ color: "var(--muted)" }}>{day.completed_matches} matches · {day.blue_games}–{day.white_games}</span></div>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ height: 12, background: "#edf0e9", borderRadius: 20, overflow: "hidden" }}><div style={{ width: `${(day.blue_games / maxDaily) * 100}%`, height: "100%", background: "#3478df", borderRadius: 20 }} /></div>
              <div style={{ height: 12, background: "#edf0e9", borderRadius: 20, overflow: "hidden" }}><div style={{ width: `${(day.white_games / maxDaily) * 100}%`, height: "100%", background: "#aeb9ad", borderRadius: 20 }} /></div>
            </div>
          </div>)}
          <div style={{ display: "flex", gap: 18, fontSize: 12, color: "var(--muted)" }}><span>● Team Blue</span><span>● Team White</span></div>
        </div> : <p style={{ color: "var(--muted)" }}>Daily statistics will appear after completed results are recorded.</p>}
      </section>
      <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 18 }}>Statistics update from recorded match results. Championship points and final tournament ranking remain separate and pending committee confirmation.</p>
    </main>
  );
}
