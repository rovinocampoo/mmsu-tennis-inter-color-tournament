"use client";

import type { FormEvent } from "react";
import { useState } from "react";

type Match = {
  id: string;
  match_number: number;
  match_date: string;
  category: string;
  status: string;
  published: boolean;
};

type ResultEntryProps = {
  matches: Match[];
};

export default function ResultEntry({ matches }: ResultEntryProps) {
  const [matchId, setMatchId] = useState("");
  const [blue, setBlue] = useState("8");
  const [white, setWhite] = useState("0");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const matchesByDate = [...matches]
    .filter(
      (match) =>
        match.published &&
        !["cancelled", "postponed"].includes(match.status),
    )
    .sort((a, b) => b.match_date.localeCompare(a.match_date) || a.match_number - b.match_number)
    .reduce<Record<string, Match[]>>((groups, match) => {
      (groups[match.match_date] ??= []).push(match);
      return groups;
    }, {});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/organizer/results", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          matchId,
          blue: Number(blue),
          white: Number(white),
          reason: reason || undefined,
        }),
      });

      const result: { winner?: string; error?: string } = await response.json();

      setMessage(
        response.ok
          ? `Result saved. Winner: ${result.winner}.`
          : result.error || "Unable to save.",
      );

      if (response.ok) {
        window.location.reload();
      }
    } catch {
      setMessage("Unable to save. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="panel"
      onSubmit={submit}
      style={{
        padding: 22,
        marginTop: 18,
        display: "grid",
        gap: 12,
      }}
    >
      <h2 style={{ margin: 0 }}>Record or correct a result</h2>

      <label className="eyebrow">
        MATCH
        <select
          className="field"
          required
          value={matchId}
          onChange={(event) => setMatchId(event.target.value)}
        >
          <option value="">Choose published match</option>

          {Object.entries(matchesByDate).map(([date, dateMatches]) => (
            <optgroup key={date} label={new Date(date + "T12:00:00+08:00").toLocaleDateString("en-PH", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
              timeZone: "Asia/Manila",
            })}>
              {dateMatches.map((match) => (
                <option key={match.id} value={match.id}>
                  Match {match.match_number} · {match.category}
                  {match.status === "completed" ? " · correction" : ""}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
        }}
      >
        <label className="eyebrow">
          BLUE GAMES
          <input
            className="field"
            type="number"
            min="0"
            step="1"
            value={blue}
            onChange={(event) => setBlue(event.target.value)}
          />
        </label>

        <label className="eyebrow">
          WHITE GAMES
          <input
            className="field"
            type="number"
            min="0"
            step="1"
            value={white}
            onChange={(event) => setWhite(event.target.value)}
          />
        </label>
      </div>

      <label className="eyebrow">
        CORRECTION REASON
        <input
          className="field"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Required when replacing a saved result"
        />
      </label>

      <button className="btn btn-dark" disabled={busy || !matchId}>
        {busy ? "Saving…" : "Save final result"}
      </button>

      <small style={{ color: "var(--muted)" }}>
        A team must reach 8 games and lead by 2. At 7–7, a tiebreak decides 8–7. Winner is calculated automatically.
      </small>

      {message && (
        <p role="status" style={{ fontSize: 13 }}>
          {message}
        </p>
      )}
    </form>
  );
}
