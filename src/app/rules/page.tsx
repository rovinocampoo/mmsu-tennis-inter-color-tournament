const sections: [string, string[]][] = [
  [
    "Team composition",
    [
      "Two teams: Team Blue, led by Ms. Chloe Castro, and Team White, led by Engr. Kathleen Flojo.",
    ],
  ],
  [
    "Categories",
    [
      "Class A",
      "Class B",
      "Beginners",
      "Categories may adjust depending on player availability. A player may play multiple times for their team.",
    ],
  ],
  [
    "Match format",
    [
      "Doubles only (2 vs. 2).",
      "One 8-game advantage set. A team must win by two games.",
      "No automatic tiebreak unless the committee confirms one.",
    ],
  ],
  [
    "Scoring",
    [
      "All games from every match played on a given day are totalled to produce that day’s aggregate score.",
      "Overall championship point calculation is pending committee confirmation. Daily aggregate games must not be treated as championship points.",
    ],
  ],
  [
    "Match rules",
    [
      "ITF rules apply, with local adaptations if needed.",
      "Warm-up: 5 minutes maximum before each match.",
      "Players must be present 10 minutes before scheduled match time.",
      "No coaching during play. Respect officials and opponents.",
    ],
  ],
  [
    "Attire & conduct",
    [
      "Players must wear their team color on December 8 and proper tennis attire.",
      "Maintain sportsmanship and fair play. No abusive language or behavior.",
      "Disputes are resolved by the Tournament Committee, whose decision is final.",
    ],
  ],
  [
    "Schedule",
    [
      "Tournament dates and match order may be announced in advance or on the spot, subject to player availability and match balance.",
      "Weekday matches start at 5:00 PM onwards, or earlier if all scheduled players are present.",
    ],
  ],
];
export default function Rules() {
  return (
    <main className="shell" style={{ paddingTop: 44, maxWidth: 900 }}>
      <div className="eyebrow">THE GAME PLAN</div>
      <h1 style={{ fontSize: 42, letterSpacing: "-.05em", margin: "10px 0" }}>
        Tournament rules
      </h1>
      <p style={{ color: "var(--muted)" }}>
        MMSU Tennis Club Inter-Color Tournament · Season 2 · November 11 –
        December 8, 2026
      </p>
      <div style={{ display: "grid", gap: 12, marginTop: 26 }}>
        {sections.map(([title, items]) => (
          <section className="panel" key={title} style={{ padding: 22 }}>
            <h2 style={{ fontSize: 20, margin: "0 0 12px" }}>{title}</h2>
            <ul
              style={{
                margin: 0,
                paddingLeft: 20,
                color: "#56675c",
                lineHeight: 1.8,
              }}
            >
              {(items as string[]).map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
