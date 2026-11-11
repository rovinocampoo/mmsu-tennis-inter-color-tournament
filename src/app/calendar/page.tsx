import Link from "next/link";
import { supabasePublic } from "@/lib/supabase/server";
import {
  TOURNAMENT_START,
  TOURNAMENT_END,
  getManilaDate,
} from "@/lib/tournament";

export const revalidate = 60;

type Match = {
  id: string;
  match_date: string;
  match_number: number;
  status: string;
  published: boolean;
};

type DailyTotal = {
  match_date: string;
  blue_games: number;
  white_games: number;
  completed_matches: number;
};

function dates(): string[] {
  const output: string[] = [];
  const date = new Date(`${TOURNAMENT_START}T12:00:00Z`);
  const end = new Date(`${TOURNAMENT_END}T12:00:00Z`);

  while (date <= end) {
    output.push(date.toISOString().slice(0, 10));
    date.setUTCDate(date.getUTCDate() + 1);
  }

  return output;
}

export default async function Calendar() {
  const db = supabasePublic();

  let matches: Match[] = [];
  let totals: DailyTotal[] = [];

  if (db) {
    const [matchResult, totalResult] = await Promise.all([
      db
        .from("matches")
        .select("id,match_date,match_number,status,published")
        .eq("published", true),
      db.from("daily_aggregate_scores").select("*"),
    ]);

    matches = (matchResult.data ?? []) as Match[];
    totals = (totalResult.data ?? []) as DailyTotal[];
  }

  const today = getManilaDate();

  return (
    <main className="shell" style={{ paddingTop: 44 }}>
      <div className="eyebrow">NOVEMBER 11 — DECEMBER 8, 2026</div>

      <h1
        style={{
          fontSize: 42,
          letterSpacing: "-.05em",
          margin: "10px 0",
        }}
      >
        Tournament calendar
      </h1>

      <p style={{ color: "var(--muted)" }}>
        28 calendar days. Match days depend on player availability and organizer
        scheduling.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))",
          gap: 12,
          marginTop: 24,
        }}
      >
        {dates().map((date) => {
          const dayMatches = matches.filter(
            (match) => match.match_date === date,
          );
          const total = totals.find((entry) => entry.match_date === date);

          return (
            <Link
              href={"/results?date=" + date}
              key={date}
              className="panel"
              style={{
                padding: 14,
                border: date === today ? "2px solid #74a45e" : undefined,
                display: "block",
              }}
            >
              <div className="eyebrow">
                {new Date(date + "T12:00:00Z").toLocaleDateString("en-US", {
                  weekday: "short",
                  timeZone: "UTC",
                })}
              </div>

              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  marginTop: 4,
                }}
              >
                {new Date(date + "T12:00:00Z").toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  timeZone: "UTC",
                })}
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  marginTop: 8,
                }}
              >
                {dayMatches.length
                  ? dayMatches.length + " published matches"
                  : "No published matches"}
              </div>

              {total && (
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 900,
                    marginTop: 8,
                  }}
                >
                  {total.blue_games} – {total.white_games}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </main>
  );
}
