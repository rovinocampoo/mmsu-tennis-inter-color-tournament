import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isOrganizerAuthenticated } from "@/lib/organizer-auth";

type MatchPlayer = {
  id: string;
  team_id: string;
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

  // Fetch the match and assignments independently. This avoids fragile
  // nested PostgREST joins across the match_players/team relationships.
  const { data: match, error: matchError } = await db
    .from("matches")
    .select("id,match_number,match_date,published")
    .eq("id", id)
    .maybeSingle();

  if (matchError) {
    console.error("Publish match lookup failed:", matchError);
    return NextResponse.json(
      { error: "Unable to retrieve match." },
      { status: 500 },
    );
  }

  if (!match) {
    return NextResponse.json({ error: "Match not found." }, { status: 404 });
  }

  if (match.published) {
    return NextResponse.json({ ok: true, alreadyPublished: true });
  }

  const [{ data: assignmentData, error: assignmentError }, { data: teamData, error: teamsError }] =
    await Promise.all([
      db.from("match_players").select("id,team_id").eq("match_id", id),
      db.from("teams").select("id,name").in("name", ["Team Blue", "Team White"]),
    ]);

  if (assignmentError || teamsError || !assignmentData || !teamData) {
    console.error("Publish match validation lookup failed:", {
      assignmentError,
      teamsError,
    });
    return NextResponse.json(
      { error: "Unable to verify match players and teams." },
      { status: 500 },
    );
  }

  const players = assignmentData as MatchPlayer[];
  const blueTeam = teamData.find((team) => team.name === "Team Blue");
  const whiteTeam = teamData.find((team) => team.name === "Team White");

  if (!blueTeam || !whiteTeam) {
    return NextResponse.json(
      { error: "Team Blue or Team White is missing." },
      { status: 500 },
    );
  }

  const bluePlayers = players.filter((player) => player.team_id === blueTeam.id);
  const whitePlayers = players.filter((player) => player.team_id === whiteTeam.id);

  if (
    players.length !== 4 ||
    bluePlayers.length !== 2 ||
    whitePlayers.length !== 2
  ) {
    return NextResponse.json(
      { error: "Match must contain exactly two players per team." },
      { status: 409 },
    );
  }

  const { error: publishError } = await db
    .from("matches")
    .update({
      published: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (publishError) {
    console.error("Publish match update failed:", publishError);
    return NextResponse.json(
      { error: "Unable to publish match." },
      { status: 500 },
    );
  }

  const { error: logError } = await db.from("organizer_activity_logs").insert({
    action: "match_published",
    entity_type: "match",
    entity_id: id,
    description: `Published Match ${match.match_number} for ${match.match_date}`,
  });

  if (logError) {
    console.error("Publish activity log failed:", logError);
  }

  return NextResponse.json({ ok: true });
}
