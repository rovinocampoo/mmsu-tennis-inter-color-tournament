"use client";

import { useState } from "react";

type ShareMatch = { match_number: number; blue_games: number; white_games: number; blue_players: string[]; white_players: string[] };
function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char] ?? char);
}

export default function ShareResultsButton({ date, matches, blueTotal, whiteTotal }: { date: string; matches: ShareMatch[]; blueTotal: number; whiteTotal: number }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function download() {
    setBusy(true);
    setMessage("");
    try {
      const rows = matches.map((match, index) => {
        const y = 410 + index * 92;
        const blueNames = match.blue_players.join(" & ") || "Team Blue";
        const whiteNames = match.white_players.join(" & ") || "Team White";
        return `
          <rect x="70" y="${y}" width="940" height="76" rx="18" fill="#ffffff" />
          <text x="96" y="${y + 27}" font-family="Arial" font-size="15" font-weight="700" fill="#718078">MATCH ${match.match_number}</text>
          <text x="96" y="${y + 53}" font-family="Arial" font-size="17" font-weight="700" fill="#173326">${escapeXml(blueNames)}</text>
          <text x="540" y="${y + 49}" text-anchor="middle" font-family="Arial" font-size="30" font-weight="900" fill="#123d2c">${match.blue_games} : ${match.white_games}</text>
          <text x="984" y="${y + 27}" text-anchor="end" font-family="Arial" font-size="15" font-weight="700" fill="#718078">TEAM WHITE</text>
          <text x="984" y="${y + 53}" text-anchor="end" font-family="Arial" font-size="17" font-weight="700" fill="#173326">${escapeXml(whiteNames)}</text>`;
      }).join("");
      const height = Math.max(780, 450 + matches.length * 92 + 180);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${height}" viewBox="0 0 1080 ${height}">
        <rect width="1080" height="${height}" fill="#f7f8ef"/>
        <rect x="0" y="0" width="1080" height="330" fill="#123d2c"/>
        <circle cx="990" cy="70" r="180" fill="#ffffff" opacity=".05"/>
        <text x="70" y="76" font-family="Arial" font-size="18" font-weight="700" letter-spacing="4" fill="#d9f36a">MMSU TENNIS CLUB</text>
        <text x="70" y="160" font-family="Arial" font-size="58" font-weight="900" fill="#ffffff">INTER-COLOR</text>
        <text x="70" y="220" font-family="Arial" font-size="42" font-weight="900" fill="#d9f36a">MATCH RESULTS</text>
        <text x="70" y="270" font-family="Arial" font-size="20" fill="#dce9df">${escapeXml(date)} · DOUBLES</text>
        <rect x="70" y="292" width="450" height="100" rx="20" fill="#3478df"/>
        <rect x="560" y="292" width="450" height="100" rx="20" fill="#ffffff"/>
        <text x="100" y="330" font-family="Arial" font-size="17" font-weight="700" fill="#ffffff">TEAM BLUE · DAILY GAMES</text>
        <text x="100" y="375" font-family="Arial" font-size="38" font-weight="900" fill="#ffffff">${blueTotal}</text>
        <text x="590" y="330" font-family="Arial" font-size="17" font-weight="700" fill="#173326">TEAM WHITE · DAILY GAMES</text>
        <text x="590" y="375" font-family="Arial" font-size="38" font-weight="900" fill="#173326">${whiteTotal}</text>
        ${rows}
        <text x="70" y="${height - 48}" font-family="Arial" font-size="15" font-weight="700" fill="#718078">OFFICIAL TOURNAMENT RECORD · MMSU TENNIS CLUB</text>
      </svg>`;
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 2160;
        canvas.height = height * 2;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas is unavailable.");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        canvas.toBlob((png) => {
          if (!png) { setMessage("Could not create the PNG."); setBusy(false); return; }
          const downloadUrl = URL.createObjectURL(png);
          const anchor = document.createElement("a");
          anchor.href = downloadUrl;
          anchor.download = `mmsu-results-${date}.png`;
          anchor.click();
          URL.revokeObjectURL(downloadUrl);
          setMessage("PNG created. You can now share it.");
          setBusy(false);
        }, "image/png");
      };
      image.onerror = () => { URL.revokeObjectURL(url); setMessage("Could not render the results image."); setBusy(false); };
      image.src = url;
    } catch {
      setMessage("Could not create the results image.");
      setBusy(false);
    }
  }

  return <div style={{ display: "grid", justifyItems: "end", gap: 6 }}>
    <button type="button" className="btn btn-dark" onClick={download} disabled={busy}>{busy ? "Preparing PNG…" : "↓ Share results PNG"}</button>
    {message && <small role="status" style={{ color: "var(--muted)" }}>{message}</small>}
  </div>;
}
