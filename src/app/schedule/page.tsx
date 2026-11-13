import Link from "next/link";
import ShareScheduleButton from "./share-schedule-button";
import DateCalendar from "@/components/date-calendar";
import { supabasePublic } from "@/lib/supabase/server";

export const revalidate = 30;

type MatchRow = {
  id: string;
  match_number: number;
  match_date: string;
  scheduled_time: string | null;
  court: string | null;
  category: string;
  status: string;
};

type ScheduleMatch = MatchRow & {
  blue_players: string[];
  white_players: string[];
};

function formatDate(date: string) {
  return new Date(date + "T12:00:00+08:00").toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
}

export default async function Schedule({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const params = await searchParams;
  const selectedDate = params.date;
  const db = supabasePublic();
  let matches: ScheduleMatch[] = [];
  let dateCounts: Record<string, number> = {};

  if (db) {
    const { data: matchData } = await db
      .from("matches")
      .select("id,match_number,match_date,scheduled_time,court,category,status")
      .eq("published", true)
      .order("match_date", { ascending: false })
      .order("scheduled_time", { ascending: true });

    const allPublishedMatches = (matchData ?? []) as MatchRow[];
    dateCounts = allPublishedMatches.reduce<Record<string, number>>((counts, match) => {
      counts[match.match_date] = (counts[match.match_date] ?? 0) + 1;
      return counts;
    }, {});
    const publishedMatches = allPublishedMatches.filter(
      (match) => !selectedDate || match.match_date === selectedDate,
    );
    const matchIds = publishedMatches.map((match) => match.id);

    if (matchIds.length) {
      const [{ data: assignments }, { data: teams }, { data: players }] =
        await Promise.all([
          db.from("match_players").select("match_id,player_id,team_id").in("match_id", matchIds),
          db.from("teams").select("id,name"),
          db.from("players").select("id,full_name"),
        ]);

      const teamNameById = new Map((teams ?? []).map((team) => [team.id, team.name]));
      const playerNameById = new Map((players ?? []).map((player) => [player.id, player.full_name]));
      const byMatch = new Map<string, { blue_players: string[]; white_players: string[] }>();

      for (const assignment of assignments ?? []) {
        const entry = byMatch.get(assignment.match_id) ?? { blue_players: [], white_players: [] };
        const teamName = teamNameById.get(assignment.team_id);
        const playerName = playerNameById.get(assignment.player_id);

        if (playerName && teamName === "Team Blue") entry.blue_players.push(playerName);
        if (playerName && teamName === "Team White") entry.white_players.push(playerName);
        byMatch.set(assignment.match_id, entry);
      }

      matches = publishedMatches.map((match) => ({
        ...match,
        ...(byMatch.get(match.id) ?? { blue_players: [], white_players: [] }),
      }));
    }
  }

  const grouped = matches.reduce<Record<string, ScheduleMatch[]>>((groups, match) => {
    (groups[match.match_date] ??= []).push(match);
    return groups;
  }, {});
  const dates = Object.keys(grouped);

  return (
    <main className="shell" style={{ paddingTop: 44, paddingBottom: 56 }}>
      <div className="eyebrow">FIXTURES & COURTS</div>
      <h1 style={{ fontSize: 42, letterSpacing: "-.05em", margin: "10px 0" }}>
        Match schedule
      </h1>
      <p style={{ color: "var(--muted)" }}>
        Only matches published by the tournament organizers appear here.
        {selectedDate ? ` Showing ${formatDate(selectedDate)}.` : ""}
      </p>

      <DateCalendar basePath="/schedule" selectedDate={selectedDate} counts={dateCounts} label="Published matches" />

      {selectedDate && (
        <div style={{ marginTop: 18 }}>
          <Link href="/schedule" style={{ textDecoration: "underline", fontSize: 13 }}>← Show all schedule dates</Link>
        </div>
      )}

      {dates.length ? (
        dates.map((date) => (
          <section key={date} style={{ marginTop: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
              <h2 style={{ fontSize: 20, margin: 0 }}>{formatDate(date)}</h2>
              <ShareScheduleButton date={date} matches={grouped[date]} />
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {grouped[date].map((match) => (
                <article className="panel" key={match.id} style={{ padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <b>Match {match.match_number} · {match.category}</b>
                    <span className="pill" style={{ background: "#edf3e9" }}>{match.status}</span>
                  </div>

                  <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ background: "#eaf1fb", padding: 14, borderRadius: 14 }}>
                      <b style={{ color: "#245eae" }}>TEAM BLUE</b>
                      {match.blue_players.map((name) => <div key={name} style={{ fontSize: 13, marginTop: 7 }}>{name}</div>)}
                    </div>
                    <div style={{ background: "#f3f3ed", padding: 14, borderRadius: 14 }}>
                      <b>TEAM WHITE</b>
                      {match.white_players.map((name) => <div key={name} style={{ fontSize: 13, marginTop: 7 }}>{name}</div>)}
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 12 }}>
                    {match.scheduled_time ?? "Time TBA"} · {match.court ?? "Court TBA"}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className="panel" style={{ padding: 24, marginTop: 24, color: "var(--muted)" }}>
          {selectedDate ? "No published matches for this date." : "No matches have been published yet."}
        </div>
      )}
    </main>
  );
}
