import Link from "next/link";
import { supabasePublic } from "@/lib/supabase/server";

export const revalidate = 30;

type MatchResult = {
  id: string;
  match_number: number;
  match_date: string;
  category: string;
  match_scores: {
    blue_games: number;
    white_games: number;
  } | null;
  match_players: {
    players: {
      full_name: string;
      teams: {
        name: string;
      }[];
    }[];
  }[];
  match_results: {
    winning_team_id: string;
  }[];
};

type DailyAggregate = {
  blue_games: number;
  white_games: number;
  completed_matches: number;
};

export default async function Results({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const selectedDate = params.date;
  const db = supabasePublic();

  let matches: MatchResult[] = [];
  let daily: DailyAggregate | null = null;

  if (db) {
    let query = db
      .from("matches")
      .select(
        "id,match_number,match_date,category,match_scores(blue_games,white_games),match_players(players(full_name,teams(name))),match_results(winning_team_id)",
      )
      .eq("status", "completed")
      .eq("published", true)
      .order("match_date", { ascending: false });

    if (selectedDate) {
      query = query.eq("match_date", selectedDate);
    }

    const [matchResult, dailyResult] = await Promise.all([
      query,
      selectedDate
        ? db
            .from("daily_aggregate_scores")
            .select("*")
            .eq("match_date", selectedDate)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    matches = (matchResult.data ?? []) as MatchResult[];
    daily = dailyResult.data as DailyAggregate | null;
  }

  return (
    <main className="shell" style={{ paddingTop: 44 }}>
      <div className="eyebrow">OFFICIAL MATCH RECORDS</div>

      <h1
        style={{
          fontSize: 42,
          letterSpacing: "-.05em",
          margin: "10px 0",
        }}
      >
        Results & daily totals
      </h1>

      <p style={{ color: "var(--muted)", maxWidth: 680 }}>
        Each match result is shown individually. Daily aggregate scores combine
        games from every completed match on the same date.
      </p>

      {selectedDate && (
        <div className="panel" style={{ padding: 20, marginTop: 18 }}>
          <div className="eyebrow">DAILY AGGREGATE · {selectedDate}</div>

          <div style={{ fontSize: 40, fontWeight: 900, marginTop: 8 }}>
            {daily ? `${daily.blue_games} – ${daily.white_games}` : "0 – 0"}
          </div>

          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            {daily?.completed_matches ?? 0} completed matches included
          </div>

          <Link
            href="/calendar"
            style={{
              fontSize: 12,
              textDecoration: "underline",
              display: "inline-block",
              marginTop: 10,
            }}
          >
            Back to calendar
          </Link>
        </div>
      )}

      {matches.length ? (
        <div style={{ display: "grid", gap: 14, marginTop: 24 }}>
          {matches.map((match) => {
            const score = Array.isArray(match.match_scores)
              ? match.match_scores[0]
              : match.match_scores;

            const bluePlayers = match.match_players
              .filter((player) =>
                player.players[0]?.teams[0]?.name.toLowerCase().includes("blue"),
              )
              .map((player) => player.players[0]?.full_name)
              .filter((name): name is string => Boolean(name));

            const whitePlayers = match.match_players
              .filter((player) =>
                player.players[0]?.teams[0]?.name.toLowerCase().includes("white"),
              )
              .map((player) => player.players[0]?.full_name)
              .filter((name): name is string => Boolean(name));

            return (
              <article className="panel" key={match.id} style={{ padding: 20 }}>
                <div className="eyebrow">
                  {match.match_date} · MATCH {match.match_number} ·{" "}
                  {match.category}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto 1fr",
                    gap: 12,
                    alignItems: "center",
                    marginTop: 12,
                  }}
                >
                  <div>
                    <b>Team Blue</b>

                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--muted)",
                        marginTop: 5,
                      }}
                    >
                      {bluePlayers.join(" & ")}
                    </div>
                  </div>

                  <div style={{ fontSize: 30, fontWeight: 900 }}>
                    {score?.blue_games ?? "—"} : {score?.white_games ?? "—"}
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <b>Team White</b>

                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--muted)",
                        marginTop: 5,
                      }}
                    >
                      {whitePlayers.join(" & ")}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div
          className="panel"
          style={{
            padding: 24,
            marginTop: 24,
            color: "var(--muted)",
          }}
        >
          No completed match results {selectedDate ? "for this date" : "yet"}.
          The scoreboard updates after an organizer records a valid result.
        </div>
      )}
    </main>
  );
}
