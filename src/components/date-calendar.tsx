import Link from "next/link";

const START = "2026-11-11";
const END = "2026-12-08";

function getDates() {
  const dates: string[] = [];
  const cursor = new Date(START + "T12:00:00Z");
  const end = new Date(END + "T12:00:00Z");
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
  const dates = getDates();
  const firstOffset = (new Date(START + "T12:00:00Z").getUTCDay() + 6) % 7;
  const cells: (string | null)[] = [
    ...Array.from({ length: firstOffset }, () => null),
    ...dates,
  ];
  while (cells.length % 7) cells.push(null);

  return (
    <section className="panel" style={{ padding: 18, marginTop: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <div className="eyebrow">SELECT A TOURNAMENT DATE</div>
          <b style={{ fontSize: 18 }}>November – December 2026</b>
        </div>
        <Link href={basePath} style={{ fontSize: 12, textDecoration: "underline", color: "var(--muted)" }}>
          View all {label.toLowerCase()}
        </Link>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 6, marginTop: 14 }}>
        {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
          <div key={index} style={{ textAlign: "center", fontSize: 11, color: "var(--muted)", padding: 5, fontWeight: 800 }}>{day}</div>
        ))}
        {cells.map((date, index) => {
          if (!date) return <div key={"blank-" + index} />;
          const count = counts[date] ?? 0;
          const active = selectedDate === date;
          return (
            <Link
              key={date}
              href={basePath + "?date=" + date}
              aria-label={date + ", " + count + " " + label.toLowerCase()}
              aria-current={active ? "date" : undefined}
              style={{
                minHeight: 58,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                borderRadius: 10,
                textDecoration: "none",
                border: active ? "2px solid #d9f36a" : "1px solid var(--line)",
                background: active ? "#123d2c" : count ? "var(--panel)" : "transparent",
                color: active ? "#fff" : "inherit",
                opacity: count || active ? 1 : .58,
              }}
            >
              <b style={{ fontSize: 14 }}>{Number(date.slice(-2))}</b>
              <span style={{ fontSize: 9, color: active ? "#d9f36a" : "var(--muted)", lineHeight: 1 }}>
                {count ? count + (count === 1 ? " match" : " matches") : "—"}
              </span>
            </Link>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 12, fontSize: 11, color: "var(--muted)" }}>
        <span>Tap any date to filter {label.toLowerCase()}.</span>
        <span>Dates with matches show a count.</span>
      </div>
    </section>
  );
}
