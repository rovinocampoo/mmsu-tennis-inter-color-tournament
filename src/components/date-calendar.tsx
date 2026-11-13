import Link from "next/link";
import { TOURNAMENT_START, TOURNAMENT_END } from "@/lib/tournament";

function tournamentDates() {
  const dates: string[] = [];
  const cursor = new Date(TOURNAMENT_START + "T12:00:00Z");
  const end = new Date(TOURNAMENT_END + "T12:00:00Z");
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export default function DateCalendar({
  basePath,
  selectedDate,
  counts,
  label,
}: {
  basePath: "/schedule" | "/results";
  selectedDate?: string;
  counts: Record<string, number>;
  label: string;
}) {
  const dates = tournamentDates();
  const months = [...new Set(dates.map((date) => date.slice(0, 7)))];
  return (
    <section className="panel" style={{ padding: "clamp(14px,3vw,22px)", marginTop: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <div className="eyebrow">TOURNAMENT DATE FILTER</div>
          <b style={{ fontSize: 18 }}>Choose a date</b>
          <div style={{ color: "var(--muted)", fontSize: 11, marginTop: 3 }}>Tap a day to view its {label.toLowerCase()}.</div>
        </div>
        <Link href={basePath} style={{ fontSize: 12, fontWeight: 800, textDecoration: "underline", color: "var(--muted)" }}>
          View all dates
        </Link>
      </div>
      <div style={{ display: "grid", gap: 18, marginTop: 16 }}>
        {months.map((month) => {
          const [year, monthNumber] = month.split("-").map(Number);
          const monthDates = dates.filter((date) => date.startsWith(month));
          const offset = (new Date(Date.UTC(year, monthNumber - 1, 1, 12)).getUTCDay() + 6) % 7;
          const cells: (string | null)[] = [...Array.from({ length: offset }, () => null), ...monthDates];
          while (cells.length % 7) cells.push(null);
          return (
            <div key={month}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <b>{new Date(Date.UTC(year, monthNumber - 1, 1, 12)).toLocaleDateString("en-PH", { month: "long", year: "numeric", timeZone: "UTC" })}</b>
                <span style={{ fontSize: 10, color: "var(--muted)" }}>{monthDates.filter((date) => counts[date]).length} active days</span>
              </div>
              <div className="calendar-grid">
                {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => <div className="calendar-weekday" key={day}>{day}</div>)}
                {cells.map((date, index) => {
                  if (!date) return <div key={"empty-" + index} className="calendar-empty" />;
                  const count = counts[date] ?? 0;
                  const active = selectedDate === date;
                  return (
                    <Link key={date} href={basePath + "?date=" + date} aria-current={active ? "date" : undefined} className={`calendar-day ${active ? "is-today" : ""} ${count ? "has-matches" : ""}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <div className="calendar-day-number">{Number(date.slice(-2))}</div>
                      <div className="calendar-day-meta">
                        {count ? <b>{count} {count === 1 ? "match" : "matches"}</b> : <span className="no-matches">—</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
