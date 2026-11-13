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

type DraftMatch = {
  id: string;
  match_number: number;
  match_date: string;
  category: string;
  published: boolean;
};

function PlayerCombobox({
  team,
  slot,
  players,
  value,
  selectedIds,
  onChange,
}: {
  team: "Blue" | "White";
  slot: number;
  players: Player[];
  value: string;
  selectedIds: string[];
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = players.find((player) => player.id === value);
  const sortedPlayers = useMemo(
    () => players.filter((player) => player.active).slice().sort((a, b) =>
      a.full_name.localeCompare(b.full_name, "en", { sensitivity: "base" }),
    ),
    [players],
  );
  const filtered = sortedPlayers.filter((player) => {
    const matchesQuery = player.full_name.toLowerCase().includes(query.trim().toLowerCase());
    const notSelectedElsewhere = player.id === value || !selectedIds.includes(player.id);
    return matchesQuery && notSelectedElsewhere;
  });

  return (
    <div style={{ position: "relative" }}>
      <input
        className="field"
        type="text"
        role="combobox"
        aria-label={`Choose Team ${team} player ${slot}`}
        aria-autocomplete="list"
        aria-expanded={open}
        placeholder={`Type to search Team ${team} player ${slot}…`}
        value={open ? query : selected?.full_name ?? ""}
        onFocus={() => {
          setQuery("");
          setOpen(true);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          if (value) onChange("");
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          if (event.key === "Enter" && filtered.length) {
            event.preventDefault();
            onChange(filtered[0].id);
            setQuery("");
            setOpen(false);
          }
        }}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 150);
        }}
      />
      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            zIndex: 30,
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            maxHeight: 230,
            overflowY: "auto",
            background: "var(--panel, white)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            boxShadow: "0 12px 30px #0002",
          }}
        >
          {filtered.length ? filtered.map((player) => (
            <button
              key={player.id}
              type="button"
              role="option"
              aria-selected={player.id === value}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(player.id);
                setQuery("");
                setOpen(false);
              }}
              style={{
                display: "block",
                width: "100%",
                padding: "10px 12px",
                border: 0,
                borderBottom: "1px solid var(--line)",
                background: player.id === value ? "var(--surface, #eef3e9)" : "transparent",
                color: "inherit",
                textAlign: "left",
                cursor: "pointer",
                font: "inherit",
              }}
            >
              {player.full_name}
            </button>
          )) : (
            <div style={{ padding: 12, color: "var(--muted)", fontSize: 13 }}>
              No matching players.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MatchBuilder({
  teams,
  matches,
}: {
  teams: Team[];
  matches: DraftMatch[];
}) {
  const [date, setDate] = useState("2026-11-12"),
    [category, setCategory] = useState("Class A"),
    [time, setTime] = useState("17:00"),
    [court, setCourt] = useState("Court 1"),
    [blue, setBlue] = useState(["", ""]),
    [white, setWhite] = useState(["", ""]),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");

  const b = teams.find((team) => team.name === "Team Blue")?.players ?? [];
  const w = teams.find((team) => team.name === "Team White")?.players ?? [];
  const selectedIds = [...blue, ...white].filter(Boolean);

  function updateSelection(
    values: string[],
    setValues: (next: string[]) => void,
    index: number,
    id: string,
  ) {
    setValues(values.map((current, i) => i === index ? id : current));
  }

  async function create(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/organizer/matches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          date,
          category,
          time,
          court,
          blue,
          white,
          overrideReason: reason || undefined,
        }),
      });
      const result = await response.json();
      setMessage(
        response.ok
          ? "Match " + result.matchNumber + " created as a draft."
          : result.error || "Unable to create match.",
      );
      if (response.ok) location.reload();
    } catch {
      setMessage("Unable to create match. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" style={{ padding: 22, marginTop: 18 }}>
      <h2 style={{ marginTop: 0 }}>Manual match builder</h2>
      <form onSubmit={create} style={{ display: "grid", gap: 12 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))",
            gap: 10,
          }}
        >
          <label className="eyebrow">
            DATE
            <input
              className="field"
              type="date"
              min="2026-11-11"
              max="2026-12-08"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <label className="eyebrow">
            CATEGORY
            <select className="field" value={category} onChange={(event) => setCategory(event.target.value)}>
              {["Class A", "Class B", "Beginners"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="eyebrow">
            TIME
            <input className="field" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
          </label>
          <label className="eyebrow">
            COURT
            <input className="field" value={court} onChange={(event) => setCourt(event.target.value)} />
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <b style={{ color: "#3478df" }}>TEAM BLUE PAIR</b>
            {blue.map((value, index) => (
              <PlayerCombobox
                key={index}
                team="Blue"
                slot={index + 1}
                players={b}
                value={value}
                selectedIds={selectedIds.filter((id) => id !== value)}
                onChange={(id) => updateSelection(blue, setBlue, index, id)}
              />
            ))}
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            <b>TEAM WHITE PAIR</b>
            {white.map((value, index) => (
              <PlayerCombobox
                key={index}
                team="White"
                slot={index + 1}
                players={w}
                value={value}
                selectedIds={selectedIds.filter((id) => id !== value)}
                onChange={(id) => updateSelection(white, setWhite, index, id)}
              />
            ))}
          </div>
        </div>

        <label className="eyebrow">
          OVERRIDE REASON (IF PLAYER IS NOT AVAILABLE)
          <input
            className="field"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Required if unavailable or no response"
          />
        </label>
        <button className="btn btn-dark" disabled={busy || !teams.length}>
          {busy ? "Creating…" : "Create match draft"}
        </button>
        {message && <p role="status" style={{ fontSize: 13 }}>{message}</p>}
      </form>

      <div style={{ marginTop: 20, display: "grid", gap: 8 }}>
        <b>Unpublished drafts</b>
        {matches.filter((match) => !match.published).map((match) => (
          <Draft key={match.id} match={match} />
        ))}
        {!matches.some((match) => !match.published) && (
          <small style={{ color: "var(--muted)" }}>No draft matches yet.</small>
        )}
      </div>
    </section>
  );
}

function Draft({ match }: { match: DraftMatch }) {
  const [message, setMessage] = useState("");
  async function publish() {
    const response = await fetch("/api/organizer/matches/" + match.id + "/publish", { method: "PATCH" });
    const result = await response.json();
    setMessage(response.ok ? "Published." : result.error || "Failed.");
    if (response.ok) location.reload();
  }
  return (
    <div style={{
      border: "1px solid var(--line)",
      borderRadius: 12,
      padding: 12,
      display: "flex",
      justifyContent: "space-between",
      gap: 10,
      alignItems: "center",
      flexWrap: "wrap",
    }}>
      <span style={{ fontSize: 13 }}>
        Match {match.match_number} · {match.match_date} · {match.category}
      </span>
      <button type="button" className="btn btn-light" onClick={publish}>Publish</button>
      {message && <small>{message}</small>}
    </div>
  );
}
