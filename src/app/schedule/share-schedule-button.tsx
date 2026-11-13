"use client";

import { useState } from "react";

type ScheduleMatch = {
  match_number: number;
  category: string;
  scheduled_time: string | null;
  court: string | null;
  blue_players: string[];
  white_players: string[];
};

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  })[char] ?? char);
}

export default function ShareScheduleButton({
  date,
  matches,
}: {
  date: string;
  matches: ScheduleMatch[];
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function download() {
    setBusy(true);
    setMessage("");

    try {
      const rowHeight = 184;
      const height = Math.max(760, 360 + matches.length * rowHeight + 90);
      const rows = matches.map((match, index) => {
        const y = 340 + index * rowHeight;
        const blue = match.blue_players.join("  ·  ") || "Players TBA";
        const white = match.white_players.join("  ·  ") || "Players TBA";
        return `
          <rect x="64" y="${y}" width="952" height="160" rx="22" fill="#ffffff"/>
          <text x="94" y="${y + 38}" font-family="Arial" font-size="17" font-weight="800" fill="#718078">MATCH ${match.match_number} · ${escapeXml(match.category.toUpperCase())}</text>
          <rect x="94" y="${y + 58}" width="420" height="78" rx="14" fill="#eaf1fb"/>
          <rect x="566" y="${y + 58}" width="420" height="78" rx="14" fill="#f3f3ed"/>
          <text x="116" y="${y + 86}" font-family="Arial" font-size="15" font-weight="800" fill="#245eae">TEAM BLUE</text>
          <text x="116" y="${y + 116}" font-family="Arial" font-size="17" font-weight="700" fill="#173326">${escapeXml(blue)}</text>
          <text x="588" y="${y + 86}" font-family="Arial" font-size="15" font-weight="800" fill="#59645c">TEAM WHITE</text>
          <text x="588" y="${y + 116}" font-family="Arial" font-size="17" font-weight="700" fill="#173326">${escapeXml(white)}</text>
          <text x="94" y="${y + 151}" font-family="Arial" font-size="14" fill="#718078">${escapeXml(match.scheduled_time ?? "Time TBA")}  ·  ${escapeXml(match.court ?? "Court TBA")}</text>`;
      }).join("");

      const displayDate = new Date(date + "T12:00:00+08:00").toLocaleDateString("en-PH", {
        weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Manila",
      });
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${height}" viewBox="0 0 1080 ${height}">
        <rect width="1080" height="${height}" fill="#f7f8ef"/>
        <rect width="1080" height="290" fill="#123d2c"/>
        <circle cx="990" cy="60" r="190" fill="#ffffff" opacity=".05"/>
        <text x="64" y="74" font-family="Arial" font-size="18" font-weight="800" letter-spacing="4" fill="#d9f36a">MMSU TENNIS CLUB</text>
        <text x="64" y="158" font-family="Arial" font-size="58" font-weight="900" fill="#ffffff">MATCH SCHEDULE</text>
        <text x="64" y="218" font-family="Arial" font-size="25" font-weight="700" fill="#d9f36a">${escapeXml(displayDate)}</text>
        <text x="64" y="260" font-family="Arial" font-size="16" fill="#dce9df">INTER-COLOR TOURNAMENT  ·  DOUBLES FIXTURES</text>
        ${rows}
        <text x="64" y="${height - 38}" font-family="Arial" font-size="14" font-weight="700" fill="#718078">OFFICIAL TOURNAMENT SCHEDULE · MMSU TENNIS CLUB</text>
      </svg>`;

      const svgUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 2160;
        canvas.height = height * 2;
        const context = canvas.getContext("2d");
        if (!context) {
          URL.revokeObjectURL(svgUrl);
          setMessage("Could not create the schedule PNG.");
          setBusy(false);
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(svgUrl);
        canvas.toBlob((png) => {
          if (!png) {
            setMessage("Could not create the schedule PNG.");
            setBusy(false);
            return;
          }
          const file = new File([png], `mmsu-match-schedule-${date}.png`, { type: "image/png" });
          const shareData = { files: [file], title: "MMSU Match Schedule", text: "MMSU Tennis Club · Inter-Color Tournament" };
          if (typeof navigator !== "undefined" && typeof navigator.share === "function" && navigator.canShare?.(shareData)) {
            try {
              await navigator.share(shareData);
              setMessage("Schedule image shared.");
            } catch (error) {
              if (error instanceof Error && error.name === "AbortError") {
                setMessage("Sharing cancelled.");
              } else {
                const downloadUrl = URL.createObjectURL(png);
                const anchor = document.createElement("a");
                anchor.href = downloadUrl;
                anchor.download = `mmsu-match-schedule-${date}.png`;
                anchor.click();
                URL.revokeObjectURL(downloadUrl);
                setMessage("Schedule PNG downloaded.");
              }
            }
          } else {
            const downloadUrl = URL.createObjectURL(png);
            const anchor = document.createElement("a");
            anchor.href = downloadUrl;
            anchor.download = `mmsu-match-schedule-${date}.png`;
            anchor.click();
            URL.revokeObjectURL(downloadUrl);
            setMessage("Schedule PNG downloaded.");
          }
          setBusy(false);
        }, "image/png");
      };
      image.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        setMessage("Could not render the schedule image.");
        setBusy(false);
      };
      image.src = svgUrl;
    } catch {
      setMessage("Could not create the schedule PNG.");
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", justifyItems: "end", gap: 5 }}>
      <button type="button" className="btn btn-dark" onClick={download} disabled={busy || matches.length === 0}>
        {busy ? "Preparing PNG…" : "↓ Share schedule PNG"}
      </button>
      {message && <small role="status" style={{ color: "var(--muted)" }}>{message}</small>}
    </div>
  );
}
