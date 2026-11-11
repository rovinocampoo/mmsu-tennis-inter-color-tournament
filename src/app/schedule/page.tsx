import { supabasePublic } from "@/lib/supabase/server";

export const revalidate = 30;

type ScheduledMatch = {
  id: string;
  match_number: number;
  match_date: string;
  scheduled_time: string | null;
  court: string | null;
  category: string;
  status: string;
  match_players: {
    team_id: string;
    players: {
      full_name: string;
    }[];
    teams: {
      name: string;
    }[];
  }[];
};

type GroupedMatches = Record<string, ScheduledMatch[]>;

export default async function Schedule() {
  const db = supabasePublic();

  let matches: ScheduledMatch[] = [];

  if (db) {
    const { data } = await db
      .from("matches")
      .select(
        "id,match_number,match_date,scheduled_time,court,category,status,match_players(team_id,players(full_name),teams(name))",
      )
      .eq("published", true)
      .order("match_date")
      .order("scheduled_time");

    matches = (data ?? []) as ScheduledMatch[];
  }

  const grouped = matches.reduce<GroupedMatches>((groups, match) => {
    if (!groups[match.match_date]) {
      groups[match.match_date] = [];
    }

    groups[match.match_date].push(match);

    return groups;
  }, {});

  const dates = Object.keys(grouped);

  return (
    <main className="shell" style={{ paddingTop: 44 }}>
      <div className="eyebrow">FIXTURES & COURTS</div>

      <h1
        style={{
          fontSize: 42,
          letterSpacing: "-.05em",
          margin: "10px 0",
        }}
      >
        Match schedule
      </h1>

      <p style={{ color: "var(--muted)" }}>
        Only matches published by the tournament organizers appear here.
      </p>

      {dates.length ? (
        dates.map((date) => (
          <section key={date} style={{ marginTop: 28 }}>
            <h2 style={{ fontSize: 20 }}>
              {new Date(date + "T12:00:00+08:00").toLocaleDateString("en-PH", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h2>

            <div style={{ display: "grid", gap: 12 }}>
              {grouped[date].map((match) => (
                <article
                  className="panel"
                  key={match.id}
                  style={{ padding: 20 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <b>
                      Match {match.match_number} · {match.category}
                    </b>

                    <span className="pill" style={{ background: "#edf3e9" }}>
                      {match.status}
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: 14,
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    {(["blue", "white"] as const).map((team, index) => {
                      const teamPlayers = match.match_players.filter((player) =>
                        player.teams?.[0]?.name?.toLowerCase().includes(team),
                      );

                      return (
                        <div
                          key={team}
                          style={{
                            background: index ? "#f3f3ed" : "#eaf1fb",
                            padding: 14,
                            borderRadius: 14,
                          }}
                        >
                          <b>{index ? "Team White" : "Team Blue"}</b>

                          {teamPlayers.map((player) => (
                            <div
                              key={
                                player.team_id + player.players?.[0]?.full_name
                              }
                              style={{
                                fontSize: 13,
                                marginTop: 7,
                              }}
                            >
                              {player.players?.[0]?.full_name}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      marginTop: 12,
                    }}
                  >
                    {match.scheduled_time ?? "Time TBA"} ·{" "}
                    {match.court ?? "Court TBA"}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      ) : (
        <div
          className="panel"
          style={{
            padding: 24,
            marginTop: 24,
            color: "var(--muted)",
          }}
        >
          No matches have been published yet.
        </div>
      )}
    </main>
  );
}
