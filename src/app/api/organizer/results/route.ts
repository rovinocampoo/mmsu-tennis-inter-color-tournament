import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/server";
import { isOrganizerAuthenticated } from "@/lib/organizer-auth";
import { validateAdvantageSet } from "@/lib/tournament";

const schema = z.object({
  matchId: z.string().uuid(),
  blue: z.number().int().min(0),
  white: z.number().int().min(0),
  reason: z.string().max(400).optional(),
});

type MatchPlayer = { team_id: string };

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
      { error: "Enter whole-number scores." },
      { status: 400 },
    );
  }

  const v = parsed.data;
  const verdict = validateAdvantageSet({
    blue: v.blue,
    white: v.white,
  });

  if (!verdict.valid || !verdict.winner) {
    return NextResponse.json({ error: verdict.message }, { status: 400 });
  }

  const db = supabaseAdmin();

  if (!db) {
    return NextResponse.json(
      { error: "Database not configured." },
      { status: 503 },
    );
  }

  const { data: match, error: matchError } = await db
    .from("matches")
    .select("id,match_number")
    .eq("id", v.matchId)
    .maybeSingle();

  if (matchError) {
    return NextResponse.json(
      { error: "Could not retrieve match details." },
      { status: 500 },
    );
  }

  if (!match) {
    return NextResponse.json({ error: "Match not found." }, { status: 404 });
  }

  const { data: matchPlayers, error: playersError } = await db
    .from("match_players")
    .select("team_id")
    .eq("match_id", v.matchId);

  if (playersError) {
    return NextResponse.json(
      { error: "Could not retrieve doubles pair assignments." },
      { status: 500 },
    );
  }

  const teamIds = [...new Set(((matchPlayers ?? []) as MatchPlayer[]).map((p) => p.team_id))];
  const { data: assignedTeams, error: assignedTeamsError } = await db
    .from("teams")
    .select("id,name")
    .in("id", teamIds);

  if (assignedTeamsError) {
    return NextResponse.json(
      { error: "Could not retrieve team assignments." },
      { status: 500 },
    );
  }

  const teamNames = (assignedTeams ?? []).map((team) => team.name);
  if (
    matchPlayers?.length !== 4 ||
    teamNames.filter((name) => name === "Team Blue").length !== 1 ||
    teamNames.filter((name) => name === "Team White").length !== 1
  ) {
    return NextResponse.json(
      { error: "Invalid doubles pairs. A match needs two players per team." },
      { status: 409 },
    );
  }

  const { data: old, error: oldError } = await db
    .from("match_scores")
    .select("blue_games,white_games")
    .eq("match_id", v.matchId)
    .maybeSingle();

  if (oldError) {
    return NextResponse.json(
      { error: "Could not retrieve the previous score." },
      { status: 500 },
    );
  }

  if (old && !v.reason) {
    return NextResponse.json(
      { error: "A correction reason is required." },
      { status: 400 },
    );
  }

  const winnerName = verdict.winner === "blue" ? "Team Blue" : "Team White";

  const { data: team, error: teamError } = await db
    .from("teams")
    .select("id")
    .eq("name", winnerName)
    .single();

  if (teamError || !team) {
    return NextResponse.json(
      { error: `Could not find ${winnerName}.` },
      { status: 500 },
    );
  }

  if (old) {
    const { error: historyError } = await db
      .from("match_result_history")
      .insert({
        match_id: v.matchId,
        old_blue_games: old.blue_games,
        old_white_games: old.white_games,
        new_blue_games: v.blue,
        new_white_games: v.white,
        reason: v.reason ?? "",
        changed_by: "organizer",
      });

    if (historyError) {
      return NextResponse.json(
        { error: "Could not save the result correction history." },
        { status: 500 },
      );
    }
  }

  const { error: scoreError } = await db.from("match_scores").upsert(
    {
      match_id: v.matchId,
      blue_games: v.blue,
      white_games: v.white,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "match_id" },
  );

  if (scoreError) {
    return NextResponse.json(
      { error: "Could not save score." },
      { status: 500 },
    );
  }

  const { error: resultError } = await db.from("match_results").upsert(
    {
      match_id: v.matchId,
      winning_team_id: team.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "match_id" },
  );

  if (resultError) {
    return NextResponse.json(
      { error: "Score saved but winner record failed." },
      { status: 500 },
    );
  }

  const { error: matchUpdateError } = await db
    .from("matches")
    .update({
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", v.matchId);

  if (matchUpdateError) {
    return NextResponse.json(
      { error: "Result saved but match status could not be updated." },
      { status: 500 },
    );
  }

  await db.from("organizer_activity_logs").insert({
    action: old ? "result_corrected" : "result_recorded",
    entity_type: "match",
    entity_id: v.matchId,
    description:
      `${old ? "Corrected" : "Recorded"} Match ${match.match_number}: ` +
      `${v.blue}-${v.white}`,
    reason: v.reason || null,
  });

  return NextResponse.json({
    ok: true,
    winner: winnerName,
  });
}
