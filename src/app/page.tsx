import Link from "next/link";
import { supabasePublic } from "@/lib/supabase/server";
import { getManilaDate, getTomorrowManilaDate } from "@/lib/tournament";

export const revalidate = 30;

type DailyScore = {
  blue_games: number;
  white_games: number;
  completed_matches: number;
};

type AvailabilityRow = {
  status: string;
  players: {
    team_id: string;
    teams: {
      name: string;
    }[];
  }[];
};
type UpcomingMatch = {
  id: string;
  match_number: number;
  match_date: string;
  scheduled_time: string | null;
  court: string | null;
  category: string;
  status: string;
};

type TeamAvailability = {
  available: number;
  unavailable: number;
  total: number;
};

type AvailabilitySummary = {
  blue: TeamAvailability;
  white: TeamAvailability;
};

export default async function Home() {
  const db = supabasePublic();
  const today = getManilaDate();
  const tomorrow = getTomorrowManilaDate();

  let daily = {
    blue: 0,
    white: 0,
    matches: 0,
  };

  const availability: AvailabilitySummary = {
    blue: { available: 0, unavailable: 0, total: 30 },
    white: { available: 0, unavailable: 0, total: 31 },
  };

  let upcoming: UpcomingMatch[] = [];

  if (db) {
    const results = await Promise.allSettled([
      db
        .from("daily_aggregate_scores")
        .select("*")
        .eq("match_date", today)
        .maybeSingle(),

      db
        .from("availability")
        .select("status,players(team_id,teams(name))")
        .eq("availability_date", tomorrow),

      db
        .from("matches")
        .select(
          "id,match_number,match_date,scheduled_time,court,category,status",
        )
        .eq("published", true)
        .gte("match_date", today)
        .order("match_date")
        .order("scheduled_time")
        .limit(4),
    ]);

    const scoreResult =
      results[0].status === "fulfilled" ? results[0].value : null;

    const availabilityResult =
      results[1].status === "fulfilled" ? results[1].value : null;

    const matchResult =
      results[2].status === "fulfilled" ? results[2].value : null;

    if (scoreResult?.data) {
      const dailyScore = scoreResult.data as DailyScore;

      daily = {
        blue: dailyScore.blue_games ?? 0,
        white: dailyScore.white_games ?? 0,
        matches: dailyScore.completed_matches ?? 0,
      };
    }

    const availabilityRows = (availabilityResult?.data ??
      []) as unknown as AvailabilityRow[];

    for (const row of availabilityRows) {
      const teamName = row.players?.[0]?.teams?.[0]?.name.toLowerCase() ?? "";

      const team = teamName.includes("blue") ? "blue" : "white";

      if (row.status === "available") {
        availability[team].available += 1;
      } else {
        availability[team].unavailable += 1;
      }
    }

    upcoming = (matchResult?.data ?? []) as UpcomingMatch[];
  }

  return (
    <main>
      <section
        style={{
          background: "var(--forest)",
          color: "white",
          padding: "62px 0 78px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="shell" style={{ position: "relative" }}>
          <div className="eyebrow" style={{ color: "#c2d7a3" }}>
            MARIANO MARCOS STATE UNIVERSITY · TENNIS CLUB
          </div>

          <h1
            style={{
              fontSize: "clamp(38px,7vw,76px)",
              lineHeight: 0.98,
              letterSpacing: "-.055em",
              maxWidth: 780,
              margin: "22px 0 18px",
            }}
          >
            ONE CLUB.
            <br />
            <span style={{ color: "var(--lime)" }}>TWO COLORS.</span>
            <br />
            ALL HEART.
          </h1>

          <p
            style={{
              maxWidth: 520,
              color: "#d2e0d5",
              lineHeight: 1.7,
              fontSize: 16,
            }}
          >
            The official home of the 2026 Inter-Color Tournament. Follow the
            fixtures, declare your availability, and cheer on your team.
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 28,
            }}
          >
            <Link className="btn btn-primary" href="/availability">
              Declare availability ↗
            </Link>

            <Link
              className="btn"
              href="/schedule"
              style={{ background: "#ffffff18", color: "white" }}
            >
              View match schedule
            </Link>
          </div>

          <div
            style={{
              position: "absolute",
              right: 20,
              top: 5,
              fontSize: 170,
              opacity: 0.12,
              transform: "rotate(-18deg)",
            }}
          >
            🎾
          </div>
        </div>
      </section>

      <section
        className="shell"
        style={{ marginTop: -34, position: "relative" }}
      >
        <div
          className="panel"
          style={{
            padding: 26,
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: 18,
          }}
        >
          <div>
            <div className="eyebrow">TEAM BLUE</div>
            <div
              style={{
                fontSize: "clamp(22px,4vw,36px)",
                fontWeight: 900,
                marginTop: 7,
              }}
            >
              BLUE
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              Chloe Castro · Team Leader
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                color: "var(--muted)",
                letterSpacing: ".16em",
              }}
            >
              VS
            </div>
            <div style={{ fontSize: 22, marginTop: 5 }}>🏆</div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div className="eyebrow">TEAM WHITE</div>
            <div
              style={{
                fontSize: "clamp(22px,4vw,36px)",
                fontWeight: 900,
                marginTop: 7,
              }}
            >
              WHITE
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              Kathleen Flojo · Team Leader
            </div>
          </div>
        </div>
      </section>

      <section className="shell" style={{ paddingTop: 36 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "end",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div className="eyebrow">THE SCOREBOARD</div>
            <h2
              style={{
                fontSize: 30,
                letterSpacing: "-.04em",
                margin: "8px 0",
              }}
            >
              Today’s aggregate
            </h2>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
              All completed matches · {today}
            </p>
          </div>

          <span
            className="pill"
            style={{ background: "#edf4e7", color: "#386247" }}
          >
            ● Daily games total
          </span>
        </div>

        <div className="panel" style={{ padding: 26, marginTop: 16 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div>
              <div className="eyebrow">BLUE GAMES</div>
              <div
                style={{
                  fontSize: "clamp(42px,8vw,68px)",
                  fontWeight: 900,
                  letterSpacing: "-.06em",
                }}
              >
                {daily.matches ? daily.blue : "—"}
              </div>
            </div>

            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: "#a3afa4",
              }}
            >
              —
            </div>

            <div style={{ textAlign: "right" }}>
              <div className="eyebrow">WHITE GAMES</div>
              <div
                style={{
                  fontSize: "clamp(42px,8vw,68px)",
                  fontWeight: 900,
                  letterSpacing: "-.06em",
                }}
              >
                {daily.matches ? daily.white : "—"}
              </div>
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid var(--line)",
              paddingTop: 14,
              marginTop: 14,
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              color: "var(--muted)",
            }}
          >
            <span>
              {daily.matches} completed{" "}
              {daily.matches === 1 ? "match" : "matches"} included
            </span>

            <span>
              {daily.matches
                ? "Updated from match results"
                : "No completed matches yet"}
            </span>
          </div>
        </div>

        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 12 }}>
          Daily aggregate games are separate from championship points.{" "}
          <strong>
            Championship scoring is pending committee confirmation.
          </strong>
        </p>
      </section>

      <section className="shell" style={{ paddingTop: 36 }}>
        <div className="eyebrow">TOMORROW · {tomorrow}</div>

        <h2
          style={{
            fontSize: 28,
            margin: "8px 0 16px",
            letterSpacing: "-.04em",
          }}
        >
          Who’s ready to play?
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: 14,
          }}
        >
          {(["blue", "white"] as const).map((team) => (
            <div className="panel" key={team} style={{ padding: 22 }}>
              <div style={{ fontWeight: 900, fontSize: 18 }}>
                Team {team === "blue" ? "Blue" : "White"}
              </div>

              <div style={{ display: "flex", gap: 18, marginTop: 18 }}>
                <div>
                  <b style={{ fontSize: 30 }}>{availability[team].available}</b>
                  <div className="eyebrow">Available</div>
                </div>

                <div>
                  <b style={{ fontSize: 30 }}>
                    {availability[team].unavailable}
                  </b>
                  <div className="eyebrow">Unavailable</div>
                </div>

                <div>
                  <b style={{ fontSize: 30 }}>
                    {availability[team].total -
                      availability[team].available -
                      availability[team].unavailable}
                  </b>
                  <div className="eyebrow">No response</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14 }}>
          <Link className="btn btn-dark" href="/availability">
            Submit or update availability ↗
          </Link>
        </div>
      </section>

      <section className="shell" style={{ paddingTop: 42 }}>
        <div className="eyebrow">UP NEXT</div>

        <h2
          style={{
            fontSize: 28,
            margin: "8px 0 16px",
            letterSpacing: "-.04em",
          }}
        >
          Upcoming matches
        </h2>

        {upcoming.length ? (
          <div style={{ display: "grid", gap: 12 }}>
            {upcoming.map((match) => (
              <div
                className="panel"
                key={match.id}
                style={{
                  padding: 18,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <b>Match {match.match_number}</b>

                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      marginTop: 5,
                    }}
                  >
                    {match.match_date} · {match.scheduled_time ?? "Time TBA"} ·{" "}
                    {match.court ?? "Court TBA"} · {match.category}
                  </div>
                </div>

                <span className="pill" style={{ background: "#edf4e7" }}>
                  {match.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="panel" style={{ padding: 24, color: "var(--muted)" }}>
            No published matches yet. Check back after the organizers publish
            the schedule.
          </div>
        )}
      </section>

      <section className="shell" style={{ paddingTop: 42, paddingBottom: 20 }}>
        <div
          className="panel"
          style={{
            padding: 24,
            background: "#eaf2df",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 18,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div className="eyebrow">28 DAYS · 61 PLAYERS · 2 TEAMS</div>

            <h2 style={{ fontSize: 24, margin: "8px 0" }}>
              The season runs November 11 – December 8.
            </h2>

            <p style={{ margin: 0, color: "#5d715f", fontSize: 13 }}>
              One 8-game advantage set. Doubles only. Play fair, play together.
            </p>
          </div>

          <Link className="btn btn-dark" href="/rules">
            Read tournament rules
          </Link>
        </div>
      </section>
    </main>
  );
}
