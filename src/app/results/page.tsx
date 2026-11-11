import Link from "next/link";
import { supabasePublic } from "@/lib/supabase/server";
import ShareResultsButton from "./share-results-button";

export const revalidate = 30;

type MatchRow = { id: string; match_number: number; match_date: string; category: string };
type ScoreRow = { match_id: string; blue_games: number; white_games: number };
type PlayerRow = { id: string; full_name: string };
type MatchPlayerRow = { match_id: string; player_id: string; team_id: string };
type TeamRow = { id: string; name: string };
type DailyAggregate = { blue_games: number; white_games: number; completed_matches: number };

export default async function Results({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const params = await searchParams;
  const selectedDate = params.date;
  const db = supabasePublic();
  let matches: MatchRow[] = [];
  let daily: DailyAggregate | null = null;
  let shareRows: { match_number: number; blue_games: number; white_games: number; blue_players: string[]; white_players: string[] }[] = [];
  let blueTotal = 0;
  let whiteTotal = 0;

  if (db) {
    let matchQuery = db.from("matches").select("id,match_number,match_date,category")
      .eq("status", "completed").eq("published", true).order("match_date", { ascending: false }).order("match_number", { ascending: false });
    if (selectedDate) matchQuery = matchQuery.eq("match_date", selectedDate);
    const { data: matchData } = await matchQuery;
    matches = (matchData ?? []) as MatchRow[];

    const matchIds = matches.map((m) => m.id);
    if (matchIds.length) {
      const [scoreResult, playerResult, teamsResult] = await Promise.all([
        db.from("match_scores").select("match_id,blue_games,white_games").in("match_id", matchIds),
        db.from("match_players").select("match_id,player_id,team_id").in("match_id", matchIds),
        db.from("teams").select("id,name"),
      ]);
      const scores = (scoreResult.data ?? []) as ScoreRow[];
      const assignments = (playerResult.data ?? []) as MatchPlayerRow[];
      const teams = (teamsResult.data ?? []) as TeamRow[];
      const teamName = new Map(teams.map((team) => [team.id, team.name]));
      const playerIds = [...new Set(assignments.map((row) => row.player_id))];
      const { data: playerData } = playerIds.length
        ? await db.from("players").select("id,full_name").in("id", playerIds)
        : { data: [] as PlayerRow[] };
      const players = new Map(((playerData ?? []) as PlayerRow[]).map((player) => [player.id, player.full_name]));
      shareRows = matches.map((match) => {
        const score = scores.find((s) => s.match_id === match.id);
        const matchAssignments = assignments.filter((a) => a.match_id === match.id);
        return {
          match_number: match.match_number,
          blue_games: score?.blue_games ?? 0,
          white_games: score?.white_games ?? 0,
          blue_players: matchAssignments.filter((a) => teamName.get(a.team_id) === "Team Blue").map((a) => players.get(a.player_id) ?? "").filter(Boolean),
          white_players: matchAssignments.filter((a) => teamName.get(a.team_id) === "Team White").map((a) => players.get(a.player_id) ?? "").filter(Boolean),
        };
      });
      blueTotal = scores.reduce((sum, row) => sum + row.blue_games, 0);
      whiteTotal = scores.reduce((sum, row) => sum + row.white_games, 0);
    }
    if (selectedDate) {
      const { data } = await db.from("daily_aggregate_scores").select("*").eq("match_date", selectedDate).maybeSingle();
      daily = data as DailyAggregate | null;
    }
  }

  return (
    <main className="shell" style={{ paddingTop: 44 }}>
      <div className="eyebrow">OFFICIAL MATCH RECORDS</div>
      <h1 style={{ fontSize: 42, letterSpacing: "-.05em", margin: "10px 0" }}>Results & daily totals</h1>
      <p style={{ color: "var(--muted)", maxWidth: 680 }}>Individual doubles match results and daily aggregate games. Daily totals are the sum of all completed matches on that date.</p>
      {matches.length > 0 && (
        <div className="panel" style={{ padding: 20, marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <div className="eyebrow">SHAREABLE RESULTS</div>
              <b>{selectedDate ?? matches[0].match_date} · {matches.length} completed matches</b>
            </div>
            <ShareResultsButton date={selectedDate ?? matches[0].match_date} matches={shareRows} blueTotal={daily?.blue_games ?? blueTotal} whiteTotal={daily?.white_games ?? whiteTotal} />
          </div>
        </div>
      )}
      {selectedDate && (
        <div className="panel" style={{ padding: 20, marginTop: 18 }}>
          <div className="eyebrow">DAILY AGGREGATE · {selectedDate}</div>
          <div style={{ fontSize: 40, fontWeight: 900, marginTop: 8 }}>{daily ? `${daily.blue_games} – ${daily.white_games}` : "0 – 0"}</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>{daily?.completed_matches ?? 0} completed matches included</div>
          <Link href="/calendar" style={{ fontSize: 12, textDecoration: "underline", display: "inline-block", marginTop: 10 }}>Back to calendar</Link>
        </div>
      )}
      {matches.length ? (
        <div style={{ display: "grid", gap: 14, marginTop: 24 }}>
          {matches.map((match) => {
            const row = shareRows.find((r) => r.match_number === match.match_number);
            return (
              <article className="panel" key={match.id} style={{ padding: 20 }}>
                <div className="eyebrow">{match.match_date} · MATCH {match.match_number} · {match.category}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center", marginTop: 12 }}>
                  <div><b>Team Blue</b><div style={{ fontSize: 12, color: "var(--muted)", marginTop: 5 }}>{row?.blue_players.join(" & ") || "Players unavailable"}</div></div>
                  <div style={{ fontSize: 30, fontWeight: 900, whiteSpace: "nowrap" }}>{row?.blue_games ?? "—"} : {row?.white_games ?? "—"}</div>
                  <div style={{ textAlign: "right" }}><b>Team White</b><div style={{ fontSize: 12, color: "var(--muted)", marginTop: 5 }}>{row?.white_players.join(" & ") || "Players unavailable"}</div></div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="panel" style={{ padding: 24, marginTop: 24, color: "var(--muted)" }}>No completed match results {selectedDate ? "for this date" : "yet"}. The scoreboard updates after an organizer records a valid result.</div>
      )}
    </main>
  );
}
