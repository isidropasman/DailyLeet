import { NextResponse } from "next/server";
import { dailyChallenge } from "@/lib/challenges";
import { weekRange } from "@/lib/ranking-period";
import { cachedDailyBoard, cachedWeeklyBoard } from "@/lib/board-cache";

// Viewer-independent on purpose (no cookies, no auth): identical bytes for everyone is
// what lets the CDN absorb board polling during a spike.
export async function GET(request: Request) {
  const period = new URL(request.url).searchParams.get("period") === "weekly" ? "weekly" : "daily";
  const day = dailyChallenge().day;
  const week = weekRange(day);
  try {
    const board = period === "weekly" ? await cachedWeeklyBoard(week.start) : await cachedDailyBoard(day);
    return NextResponse.json(
      { period, day, week, updatedAt: board.generatedAt, leaders: board.entries.map(entry => ({ name: entry.name, score: entry.score, elapsed: entry.elapsed })) },
      { headers: { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=30" } },
    );
  } catch {
    return NextResponse.json({ error: "El ranking no está disponible ahora." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
