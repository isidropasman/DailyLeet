import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { challenges, dailyChallenge, isChoices } from "@/lib/challenges";
import { database } from "@/lib/db";
import { evaluate, run } from "@/lib/engine";
import { practiceUnlocked } from "@/lib/practice";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

async function submittedToday(day: string): Promise<boolean> {
  const playerId = (await cookies()).get("dailyleet-player")?.value;
  if (!playerId || !UUID.test(playerId)) return false;
  try {
    const rows = await database()`SELECT 1 FROM attempts WHERE player_id = ${playerId} AND day = ${day} AND result IS NOT NULL`;
    return rows.length > 0;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null || !("choices" in body) || !("kind" in body) || !isChoices(body.choices)) return NextResponse.json({ error: "Elegí las tres decisiones." }, { status: 400 });
  const challenge = challenges.find(c => c.kind === body.kind);
  if (!challenge) return NextResponse.json({ error: "Desafío inválido." }, { status: 400 });
  const practice = "practice" in body && body.practice === true;
  if (practice) {
    const today = dailyChallenge().day;
    const unlocked = practiceUnlocked(challenge.kind, today, challenge.kind === dailyChallenge().kind && await submittedToday(today));
    if (!unlocked) return NextResponse.json({ error: "Este reto todavía se juega en el ranking. Vas a poder practicarlo cuando termine." }, { status: 403 });
  }
  const { input, target, other } = challenge.sample;
  const simulation = run(challenge.kind, body.choices, input, target, other);
  return NextResponse.json({ ...simulation, ...(practice ? { result: evaluate(challenge.kind, body.choices, 300) } : {}) });
}
