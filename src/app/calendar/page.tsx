import Link from "next/link";
import { supabasePublic } from "@/lib/supabase/server";
import { TOURNAMENT_START, TOURNAMENT_END, getManilaDate } from "@/lib/tournament";

export const revalidate = 60;

type Match = { id: string; match_date: string; match_number: number; status: string; published: boolean };
type DailyTotal = { match_date: string; blue_games: number; white_games: number; completed_matches: number };

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

function dayLabel(date: string, options: Intl.DateTimeFormatOptions) {
  return new Date(date + "T12:00:00Z").toLocaleDateString("en-PH", { ...options, timeZone: "UTC" });
}

export default async function Calendar() {
  const db = supabasePublic();
  let matches: Match[] = [];
  let totals: DailyTotal[] = [];
  if (db) {
    const [matchResult, totalResult] = await Promise.all([
      db.from("matches").select("id,match_date,match_number,status,published").eq("published", true),
      db.from("daily_aggregate_scores").select("*"),
    ]);
    matches = (matchResult.data ?? []) as Match[];
    totals = (totalResult.data ?? []) as DailyTotal[];
  }

  const today = getManilaDate();
  const allDates = dates();
  const counts = matches.reduce<Record<string, number>>((acc, match) => {
    acc[match.match_date] = (acc[match.match_date] ?? 0) + 1;
    return acc;
  }, {});
  const completedCounts = matches.filter((m) => m.status === "completed").reduce<Record<string, number>>((acc, match) => {
    acc[match.match_date] = (acc[match.match_date] ?? 0) + 1;
    return acc;
  }, {});
  const firstDate = new Date(TOURNAMENT_START + "T12:00:00Z");
  const lastDate = new Date(TOURNAMENT_END + "T12:00:00Z");
  const months: string[] = [];
  const cursor = new Date(Date.UTC(firstDate.getUTCFullYear(), firstDate.getUTCMonth(), 1, 12));
  while (cursor <= lastDate) {
    months.push(cursor.toISOString().slice(0, 7));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  const totalMatches = matches.length;
  const completedMatches = matches.filter((m) => m.status === "completed").length;

  return (
    <main className="shell" style={{ paddingTop: 36, paddingBottom: 48 }}>
      <div className="eyebrow">NOVEMBER 11 — DECEMBER 8, 2026 · ASIA/MANILA</div>
      <h1 style={{ fontSize: "clamp(32px,6vw,46px)", letterSpacing: "-.05em", margin: "10px 0" }}>Tournament calendar</h1>
      <p style={{ color: "var(--muted)", maxWidth: 660, lineHeight: 1.6, marginTop: 0 }}>
        Your tournament at a glance. Choose any date to open its fixtures or recorded results.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10, marginTop: 22 }}>
        {[
          { label: "Published matches", value: totalMatches },
          { label: "Completed", value: completedMatches },
          { label: "Match days", value: Object.keys(counts).length },
        ].map((item) => (
          <div className="panel" key={item.label} style={{ padding: "14px 16px" }}>
            <div className="eyebrow" style={{ fontSize: 9 }}>{item.label}</div>
            <div style={{ fontSize: 27, fontWeight: 900, marginTop: 5 }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: 18, marginTop: 24 }}>
        {months.map((month) => {
          const [year, monthNumber] = month.split("-").map(Number);
          const monthDates = allDates.filter((date) => date.startsWith(month));
          const offset = (new Date(Date.UTC(year, monthNumber - 1, 1, 12)).getUTCDay() + 6) % 7;
          const cells: (string | null)[] = [...Array.from({ length: offset }, () => null), ...monthDates];
          while (cells.length % 7) cells.push(null);
          return (
            <section className="panel" key={month} style={{ padding: "clamp(14px,3vw,22px)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
                <h2 style={{ fontSize: 22, margin: 0 }}>{new Date(Date.UTC(year, monthNumber - 1, 1, 12)).toLocaleDateString("en-PH", { month: "long", year: "numeric", timeZone: "UTC" })}</h2>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>{monthDates.filter((d) => counts[d]).length} active days</span>
              </div>
              <div className="calendar-grid">
                {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => <div className="calendar-weekday" key={day}>{day}</div>)}
                {cells.map((date, index) => {
                  if (!date) return <div key={"empty-" + index} className="calendar-empty" />;
                  const count = counts[date] ?? 0;
                  const complete = completedCounts[date] ?? 0;
                  const total = totals.find((entry) => entry.match_date === date);
                  const isToday = date === today;
                  return (
                    <div key={date} className={`calendar-day ${isToday ? "is-today" : ""} ${count ? "has-matches" : ""}`}>
                      <div className="calendar-day-number">{Number(date.slice(-2))}{isToday && <span className="today-dot" aria-label="Today" />}</div>
                      <div className="calendar-day-meta">
                        {count ? <><b>{count} {count === 1 ? "match" : "matches"}</b><span>{complete} completed</span></> : <span className="no-matches">No matches</span>}
                      </div>
                      {total && <div className="calendar-total">B {total.blue_games} – {total.white_games} W</div>}
                      <div className="calendar-day-actions">
                        <Link href={"/schedule?date=" + date}>Schedule</Link>
                        <Link href={"/results?date=" + date}>Results</Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}>
        <Link className="btn btn-dark" href="/schedule">Full schedule</Link>
        <Link className="btn btn-light" href="/results">All results</Link>
      </div>
    </main>
  );
}
