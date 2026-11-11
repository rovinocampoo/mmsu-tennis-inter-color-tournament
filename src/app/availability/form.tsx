"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";

type Player = {
  id: string;
  full_name: string;
  active: boolean;
};

type Team = {
  id: string;
  name: string;
  players: Player[];
};

type AvailabilityResponse = {
  player_id: string;
  status: "available" | "unavailable";
};

type AvailabilityFormProps = {
  teams: Team[];
  initialResponses: AvailabilityResponse[];
  defaultDate: string;
};

export default function AvailabilityForm({
  teams,
  initialResponses,
  defaultDate,
}: AvailabilityFormProps) {
  const [team, setTeam] = useState("");
  const [player, setPlayer] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [status, setStatus] = useState<"available" | "unavailable">(
    "available",
  );
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const members = useMemo(
    () =>
      teams
        .find((entry) => entry.id === team)
        ?.players.filter((entry) => entry.active) ?? [],
    [teams, team],
  );

  function choosePlayer(id: string) {
    setPlayer(id);

    const existing = initialResponses.find(
      (response) => response.player_id === id,
    );

    if (existing) {
      setStatus(existing.status);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/availability", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          playerId: player,
          date,
          status,
        }),
      });

      const result: { error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to save availability.");
      }

      setMessage(
        "Your availability has been saved. You can update it anytime.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="panel"
      style={{
        padding: 24,
        marginTop: 24,
        maxWidth: 620,
        display: "grid",
        gap: 16,
      }}
    >
      <label>
        <span className="eyebrow">1 · YOUR TEAM</span>

        <select
          className="field"
          style={{ marginTop: 8 }}
          value={team}
          onChange={(event) => {
            setTeam(event.target.value);
            setPlayer("");
          }}
          required
        >
          <option value="">Choose your team</option>

          {teams.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className="eyebrow">2 · YOUR NAME</span>

        <select
          className="field"
          style={{ marginTop: 8 }}
          value={player}
          onChange={(event) => choosePlayer(event.target.value)}
          required
          disabled={!team}
        >
          <option value="">Select your registered name</option>

          {members.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.full_name}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className="eyebrow">3 · DATE</span>

        <input
          className="field"
          style={{ marginTop: 8 }}
          type="date"
          value={date}
          min="2026-11-11"
          max="2026-12-08"
          onChange={(event) => setDate(event.target.value)}
          required
        />
      </label>

      <div>
        <span className="eyebrow">4 · YOUR AVAILABILITY</span>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginTop: 8,
          }}
        >
          <button
            type="button"
            className="btn"
            onClick={() => setStatus("available")}
            style={{
              background: status === "available" ? "#e5f3d8" : "#f1f3ed",
              color: "#234d31",
              border:
                status === "available"
                  ? "2px solid #7ba45e"
                  : "2px solid transparent",
            }}
          >
            ✓ Available
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => setStatus("unavailable")}
            style={{
              background: status === "unavailable" ? "#fbe8e5" : "#f1f3ed",
              color: "#8b3d31",
              border:
                status === "unavailable"
                  ? "2px solid #c98475"
                  : "2px solid transparent",
            }}
          >
            ✕ Not available
          </button>
        </div>
      </div>

      <button className="btn btn-dark" disabled={busy || !teams.length}>
        {busy ? "Saving…" : "Save availability ↗"}
      </button>

      {!teams.length && (
        <p style={{ fontSize: 12, color: "#8b5c25" }}>
          Connect Supabase and run the database setup to load the official
          roster.
        </p>
      )}

      {message && (
        <p
          role="status"
          style={{
            fontSize: 13,
            color: message.startsWith("Your") ? "#287147" : "#a33",
          }}
        >
          {message}
        </p>
      )}
    </form>
  );
}
