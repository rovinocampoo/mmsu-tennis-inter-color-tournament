"use client";

import { useState } from "react";

type TeamSnapshot = {
  name: string;
  played: number;
  wins: number;
  losses: number;
  games: number;
};

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  })[char] ?? char);
}

function number(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export default function ShareHeadToHeadButton({
  blue,
  white,
  completedMatches,
  totalGames,
}: {
  blue: TeamSnapshot;
  white: TeamSnapshot;
  completedMatches: number;
  totalGames: number;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function download() {
    setBusy(true);
    setMessage("");
    try {
      const blueDecisions = blue.wins + blue.losses;
      const whiteDecisions = white.wins + white.losses;
      const blueRate = blueDecisions ? Math.round((blue.wins / blueDecisions) * 100) : 0;
      const whiteRate = whiteDecisions ? Math.round((white.wins / whiteDecisions) * 100) : 0;
      const gameLead = Math.abs(blue.games - white.games);
      const leader = blue.games === white.games ? "ALL SQUARE" : blue.games > white.games ? "BLUE LEADS" : "WHITE LEADS";
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1040" viewBox="0 0 1200 1040">
        <defs>
          <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2" fill="#dce6d7"/></pattern>
        </defs>
        <rect width="1200" height="1040" fill="#f7f8ef"/>
        <rect width="1200" height="330" fill="#123d2c"/>
        <circle cx="1080" cy="62" r="190" fill="#ffffff" opacity=".045"/>
        <circle cx="80" cy="300" r="130" fill="#d9f36a" opacity=".08"/>
        <text x="78" y="78" font-family="Arial" font-size="20" font-weight="800" letter-spacing="5" fill="#d9f36a">MMSU TENNIS CLUB</text>
        <text x="78" y="170" font-family="Arial" font-size="68" font-weight="900" fill="#ffffff">COLOR CLASH!</text>
        <text x="82" y="220" font-family="Arial" font-size="24" font-weight="700" fill="#e1eadf">THE HEAD-TO-HEAD SO FAR</text>
        <rect x="82" y="254" width="300" height="46" rx="23" fill="#d9f36a"/>
        <text x="232" y="284" text-anchor="middle" font-family="Arial" font-size="17" font-weight="900" fill="#123d2c">TOURNAMENT SNAPSHOT</text>
        <circle cx="1050" cy="190" r="48" fill="#d9f36a"/>
        <path d="M1018 157 C1050 174 1050 206 1082 223 M1082 157 C1050 174 1050 206 1018 223" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/>
        <rect x="64" y="360" width="520" height="360" rx="30" fill="#ffffff" stroke="#dbe5d7" stroke-width="3"/>
        <rect x="616" y="360" width="520" height="360" rx="30" fill="#ffffff" stroke="#dbe5d7" stroke-width="3"/>
        <rect x="64" y="360" width="520" height="18" rx="9" fill="#3478df"/>
        <rect x="616" y="360" width="520" height="18" rx="9" fill="#aeb9ad"/>
        <circle cx="160" cy="455" r="48" fill="#e9f1ff"/>
        <text x="160" y="470" text-anchor="middle" font-family="Arial" font-size="42" font-weight="900" fill="#3478df">B</text>
        <circle cx="712" cy="455" r="48" fill="#f0f2ed"/>
        <text x="712" y="470" text-anchor="middle" font-family="Arial" font-size="42" font-weight="900" fill="#657368">W</text>
        <text x="230" y="445" font-family="Arial" font-size="18" font-weight="800" fill="#3478df">THE BLUE CREW</text>
        <text x="230" y="480" font-family="Arial" font-size="30" font-weight="900" fill="#173326">TEAM BLUE</text>
        <text x="782" y="445" font-family="Arial" font-size="18" font-weight="800" fill="#657368">THE WHITE SIDE</text>
        <text x="782" y="480" font-family="Arial" font-size="30" font-weight="900" fill="#173326">TEAM WHITE</text>
        <text x="104" y="565" font-family="Arial" font-size="17" font-weight="800" fill="#718078">MATCH RECORD</text>
        <text x="656" y="565" font-family="Arial" font-size="17" font-weight="800" fill="#718078">MATCH RECORD</text>
        <text x="104" y="630" font-family="Arial" font-size="62" font-weight="900" fill="#173326">${escapeXml(number(blue.wins))}<tspan fill="#9aa59b"> – </tspan>${escapeXml(number(blue.losses))}</text>
        <text x="656" y="630" font-family="Arial" font-size="62" font-weight="900" fill="#173326">${escapeXml(number(white.wins))}<tspan fill="#9aa59b"> – </tspan>${escapeXml(number(white.losses))}</text>
        <text x="108" y="672" font-family="Arial" font-size="18" fill="#718078">${escapeXml(number(blue.played))} matches · ${blueRate}% win rate</text>
        <text x="660" y="672" font-family="Arial" font-size="18" fill="#718078">${escapeXml(number(white.played))} matches · ${whiteRate}% win rate</text>
        <rect x="82" y="748" width="1036" height="190" rx="28" fill="#ffffff"/>
        <text x="112" y="795" font-family="Arial" font-size="18" font-weight="900" letter-spacing="2" fill="#718078">GAMES WON</text>
        <text x="112" y="855" font-family="Arial" font-size="42" font-weight="900" fill="#3478df">${blue.games}</text>
        <text x="1088" y="855" text-anchor="end" font-family="Arial" font-size="42" font-weight="900" fill="#657368">${white.games}</text>
        <rect x="112" y="875" width="976" height="22" rx="11" fill="#edf0e9"/>
        <rect x="112" y="875" width="${totalGames ? 976 * (blue.games / totalGames) : 488}" height="22" rx="11" fill="#3478df"/>
        <text x="112" y="922" font-family="Arial" font-size="16" font-weight="800" fill="#3478df">TEAM BLUE</text>
        <text x="1088" y="922" text-anchor="end" font-family="Arial" font-size="16" font-weight="800" fill="#657368">TEAM WHITE</text>
        <rect x="390" y="965" width="420" height="54" rx="27" fill="#d9f36a"/>
        <text x="600" y="1000" text-anchor="middle" font-family="Arial" font-size="18" font-weight="900" fill="#123d2c">${leader} · BY ${gameLead} GAME${gameLead === 1 ? "" : "S"}</text>
        <text x="600" y="1032" text-anchor="middle" font-family="Arial" font-size="13" font-weight="700" fill="#718078">${completedMatches} COMPLETED MATCHES · ${totalGames} TOTAL GAMES · MMSU INTER-COLOR TOURNAMENT</text>
      </svg>`;

      const svgUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 2400;
        canvas.height = 2080;
        const context = canvas.getContext("2d");
        if (!context) {
          URL.revokeObjectURL(svgUrl);
          setMessage("Could not create the infographic.");
          setBusy(false);
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(svgUrl);
        canvas.toBlob(async (png) => {
          if (!png) {
            setMessage("Could not create the infographic.");
            setBusy(false);
            return;
          }
          const file = new File([png], "mmsu-head-to-head.png", { type: "image/png" });
          const shareData = { files: [file], title: "MMSU Color Clash", text: "Team Blue vs Team White · MMSU Tennis Club" };
          if (typeof navigator !== "undefined" && typeof navigator.share === "function" && navigator.canShare?.(shareData)) {
            try {
              await navigator.share(shareData);
              setMessage("Infographic shared!");
            } catch (error) {
              if (error instanceof Error && error.name === "AbortError") {
                setMessage("Sharing cancelled.");
              } else {
                const url = URL.createObjectURL(png);
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = "mmsu-head-to-head.png";
                anchor.click();
                URL.revokeObjectURL(url);
                setMessage("PNG downloaded!");
              }
            }
          } else {
            const url = URL.createObjectURL(png);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = "mmsu-head-to-head.png";
            anchor.click();
            URL.revokeObjectURL(url);
            setMessage("PNG downloaded!");
          }
          setBusy(false);
        }, "image/png");
      };
      image.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        setMessage("Could not render the infographic.");
        setBusy(false);
      };
      image.src = svgUrl;
    } catch {
      setMessage("Could not create the infographic.");
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", justifyItems: "start", gap: 6, marginTop: 14 }}>
      <button type="button" className="btn btn-dark" onClick={download} disabled={busy}>
        {busy ? "Making your infographic…" : "✦ Share head-to-head PNG"}
      </button>
      {message && <small role="status" style={{ color: "var(--muted)" }}>{message}</small>}
    </div>
  );
}
