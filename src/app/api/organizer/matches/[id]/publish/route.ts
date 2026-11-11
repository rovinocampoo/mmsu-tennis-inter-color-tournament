import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isOrganizerAuthenticated } from "@/lib/organizer-auth";

type MatchPlayer = {
  id: string;
  teams: {
    name: string;
  }[];
};

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isOrganizerAuthenticated())) {
    return NextResponse.json(
      { error: "Organizer session required." },
      { status: 401 },
    );
  }

  const { id } = await params;
  const db = supabaseAdmin();

  if (!db) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 },
    );
  }

  const { data: match, error: matchError } = await db
    .from("matches")
    .select("id,match_number,match_date,match_players(id,teams(name))")
    .eq("id", id)
    .maybeSingle();

  if (matchError) {
    return NextResponse.json(
      { error: "Unable to retrieve match." },
      { status: 500 },
    );
  }

  if (!match) {
    return NextResponse.json({ error: "Match not found." }, { status: 404 });
  }

  const players = (match.match_players ?? []) as MatchPlayer[];
  const bluePlayers = players.filter(
    (player) => player.teams?.[0]?.name === "Team Blue",
  );
  const whitePlayers = players.filter(
    (player) => player.teams?.[0]?.name === "Team White",
  );

  if (
    players.length !== 4 ||
    bluePlayers.length !== 2 ||
    whitePlayers.length !== 2
  ) {
    return NextResponse.json(
      { error: "Match must contain two players per team." },
      { status: 409 },
    );
  }

  const { error } = await db
    .from("matches")
    .update({
      published: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Unable to publish match." },
      { status: 500 },
    );
  }

  await db.from("organizer_activity_logs").insert({
    action: "match_published",
    entity_type: "match",
    entity_id: id,
    description: `Published Match ${match.match_number} for ${match.match_date}`,
  });

  return NextResponse.json({ ok: true });
}
