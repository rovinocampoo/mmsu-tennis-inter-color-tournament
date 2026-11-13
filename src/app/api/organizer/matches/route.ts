import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isOrganizerAuthenticated } from "@/lib/organizer-auth";

const schema = z.object({
  date: z.string(),
  category: z.enum(["Class A", "Class B", "Beginners"]),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  court: z.string().max(80).optional(),
  blue: z.array(z.string().uuid()).length(2),
  white: z.array(z.string().uuid()).length(2),
  notes: z.string().max(500).optional(),
  overrideReason: z.string().max(300).optional(),
});

type Player = {
  id: string;
  team_id: string;
  full_name: string;
};

type Availability = {
  player_id: string;
  status: string;
};

export async function POST(req: Request) {
  if (!(await isOrganizerAuthenticated())) {
    return NextResponse.json(
      { error: "Organizer session required." },
      { status: 401 },
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Complete all four player slots and match details." },
      { status: 400 },
    );
  }

  const value = parsed.data;

  if (value.date < "2026-11-11" || value.date > "2026-12-08") {
    return NextResponse.json(
      { error: "Date must be within the tournament." },
      { status: 400 },
    );
  }

  const db = supabaseAdmin();

  if (!db) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 },
    );
  }

  const ids = [...value.blue, ...value.white];

  if (new Set(ids).size !== 4) {
    return NextResponse.json(
      { error: "Each match needs four different players." },
      { status: 400 },
    );
  }

  // Resolve team IDs explicitly. Avoid relying on PostgREST relationship
  // cardinality for players -> teams, which may be returned as an object.
  const { data: teamData, error: teamsError } = await db
    .from("teams")
    .select("id,name")
    .in("name", ["Team Blue", "Team White"]);

  if (teamsError || !teamData) {
    return NextResponse.json(
      { error: "Could not verify tournament teams." },
      { status: 500 },
    );
  }

  const blueTeam = teamData.find((team) => team.name === "Team Blue");
  const whiteTeam = teamData.find((team) => team.name === "Team White");

  if (!blueTeam || !whiteTeam) {
    return NextResponse.json(
      { error: "Team Blue or Team White is missing." },
      { status: 500 },
    );
  }

  const { data: playerData, error: playersError } = await db
    .from("players")
    .select("id,team_id,full_name")
    .in("id", ids)
    .eq("active", true);

  if (playersError || !playerData || playerData.length !== 4) {
    return NextResponse.json(
      { error: "One or more players are not active in the roster." },
      { status: 400 },
    );
  }

  const players = playerData as Player[];
  const bluePlayers = players.filter((player) => player.team_id === blueTeam.id);
  const whitePlayers = players.filter((player) => player.team_id === whiteTeam.id);

  if (
    bluePlayers.length !== 2 ||
    whitePlayers.length !== 2 ||
    !value.blue.every((id) => bluePlayers.some((player) => player.id === id)) ||
    !value.white.every((id) => whitePlayers.some((player) => player.id === id))
  ) {
    return NextResponse.json(
      { error: "Choose exactly two players from each correct team." },
      { status: 400 },
    );
  }

  const { data: availabilityData } = await db
    .from("availability")
    .select("player_id,status")
    .eq("availability_date", value.date)
    .in("player_id", ids);

  const availability = (availabilityData ?? []) as Availability[];

  const unavailable = ids.filter(
    (id) =>
      availability.find((entry) => entry.player_id === id)?.status !==
      "available",
  );

  if (unavailable.length && !value.overrideReason) {
    return NextResponse.json(
      {
        error:
          "A player is unavailable or has not responded. Enter an override reason to proceed.",
      },
      { status: 409 },
    );
  }

  const { data: existing } = await db
    .from("matches")
    .select("match_number")
    .order("match_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const number = (existing?.match_number ?? 0) + 1;

  const { data: match, error } = await db
    .from("matches")
    .insert({
      match_date: value.date,
      match_number: number,
      category: value.category,
      scheduled_time: value.time,
      court: value.court || null,
      notes: value.notes || null,
      status: "scheduled",
      published: false,
    })
    .select("id")
    .single();

  if (error || !match) {
    return NextResponse.json(
      { error: "Could not create match." },
      { status: 500 },
    );
  }

  const rows = players.map((player) => ({
    match_id: match.id,
    player_id: player.id,
    team_id: player.team_id,
    pair_position: (player.team_id === blueTeam.id ? value.blue : value.white).indexOf(player.id) + 1,
  }));

  const { error: insertError } = await db.from("match_players").insert(rows);

  if (insertError) {
    await db.from("matches").delete().eq("id", match.id);

    return NextResponse.json(
      { error: "Could not save doubles pairs." },
      { status: 500 },
    );
  }

  await db.from("organizer_activity_logs").insert({
    action: "match_created",
    entity_type: "match",
    entity_id: match.id,
    description: `Created Match ${number} for ${value.date}`,
    reason: value.overrideReason || null,
  });

  return NextResponse.json({
    ok: true,
    matchId: match.id,
    matchNumber: number,
  });
}
