import { randomBytes } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { database, type Row, type Sql } from "@/lib/db";
import { dailyChallenge, isChoices } from "@/lib/challenges";
import { evaluate } from "@/lib/engine";
import { resolveIdentity } from "@/lib/identity";
import { hasTestAccess } from "@/lib/test-access";
import { weekRange } from "@/lib/ranking-period";
import { cachedDailyBoard, cachedDailyBuckets, cachedWeeklyBoard, cachedWeeklyBuckets, revalidateBoardsFor } from "@/lib/board-cache";
import { dailyPeersAhead, groupDailyBoard, groupWeeklyBoard, leadersFor, myEntries, rankFrom, weeklyPeersAhead, type Entry, type Leader, type Rank } from "@/lib/leaderboard";
import { readStreak, startAttempt, submitAttempt, type Streak } from "@/lib/submission";
import { clientIp, createLimiter } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const limit = createLimiter();
const PLAYER_COOKIE = "dailyleet-player";

async function player() {
  const jar = await cookies();
  const existing = jar.get(PLAYER_COOKIE)?.value;
  const { userId } = await auth();
  const identity = await resolveIdentity(existing, userId);
  jar.set(PLAYER_COOKIE, identity.id, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 31_536_000, path: "/" });
  // A Clerk outage must not take the game down; test mode is the only thing it gates here.
  return { ...identity, canTest: await hasTestAccess(userId).catch(() => false) };
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type Boards = { leaders: Leader[]; weeklyLeaders: Leader[]; rank: { daily: Rank | null; weekly: Rank | null }; updatedAt: number | null };

async function dailyRank(sql: Sql, day: string, mine: Entry | null): Promise<Rank | null> {
  if (!mine) return null;
  const [histogram, ahead] = await Promise.all([cachedDailyBuckets(day), dailyPeersAhead(sql, day, mine)]);
  return rankFrom(histogram, mine, ahead);
}

async function weeklyRank(sql: Sql, weekStart: string, mine: Entry | null): Promise<Rank | null> {
  if (!mine) return null;
  const [histogram, ahead] = await Promise.all([cachedWeeklyBuckets(weekStart), weeklyPeersAhead(sql, weekStart, mine)]);
  return rankFrom(histogram, mine, ahead);
}

type Lists = { daily: Entry[]; weekly: Entry[]; cached: boolean; generatedAt: number };

async function lists(sql: Sql, input: { day: string; weekStart: string; group: string | null }): Promise<Lists> {
  // Groups are small and per-viewer, so they're read live; only the global board is shared.
  if (input.group) {
    const [daily, weekly] = await Promise.all([groupDailyBoard(sql, input.group, input.day), groupWeeklyBoard(sql, input.group, input.weekStart)]);
    return { daily, weekly, cached: false, generatedAt: Date.now() };
  }
  const [daily, weekly] = await Promise.all([cachedDailyBoard(input.day), cachedWeeklyBoard(input.weekStart)]);
  return { daily: daily.entries, weekly: weekly.entries, cached: true, generatedAt: Math.min(daily.generatedAt, weekly.generatedAt) };
}

async function boards(sql: Sql, input: { playerId: string; day: string; weekStart: string; group: string | null; authenticated: boolean }): Promise<Boards> {
  const [mine, shown] = await Promise.all([myEntries(sql, input.playerId, input.day, input.weekStart), input.authenticated ? lists(sql, input) : null]);
  const [daily, weekly] = input.authenticated ? await Promise.all([dailyRank(sql, input.day, mine.daily), weeklyRank(sql, input.weekStart, mine.weekly)]) : [null, null];
  const rank = { daily, weekly };
  if (!shown) return { leaders: [], weeklyLeaders: [], rank, updatedAt: null };
  return {
    leaders: leadersFor(shown.daily, input.playerId, shown.cached ? mine.daily : null),
    weeklyLeaders: leadersFor(shown.weekly, input.playerId, shown.cached ? mine.weekly : null),
    rank,
    updatedAt: shown.generatedAt,
  };
}

export async function GET(request: Request) {
  let core;
  try {
    const user = await player();
    const sql = database();
    const daily = dailyChallenge();
    const week = weekRange(daily.day);
    const group = new URL(request.url).searchParams.get("group");
    const [attempts, testAttempts, groups]: Row[][] = await Promise.all([
      sql`SELECT started_at, choices, result, elapsed FROM attempts WHERE player_id = ${user.id} AND day = ${daily.day}`,
      user.canTest ? sql`SELECT run_id,started_at,choices,result,elapsed FROM test_attempts WHERE player_id = ${user.id} AND day = ${daily.day}` : Promise.resolve([]),
      sql`SELECT g.code, g.name FROM friend_groups g JOIN memberships m ON m.group_code = g.code WHERE m.player_id = ${user.id} ORDER BY g.created_at DESC`,
    ]);
    const allowedGroup = group && groups.some(g => g.code === group) ? group : null;
    core = { user, sql, daily, week, attempts, testAttempts, groups, allowedGroup };
  } catch {
    return NextResponse.json({ error: "No pudimos cargar la partida. Volvé a intentar." }, { status: 503 });
  }
  const { user, sql, daily, week, attempts, testAttempts, groups, allowedGroup } = core;
  // Boards and streaks are extras: if they fail the player can still load and submit.
  const [boardResult, streakResult] = await Promise.allSettled([
    boards(sql, { playerId: user.id, day: daily.day, weekStart: week.start, group: allowedGroup, authenticated: user.authenticated }),
    readStreak(sql, user.id, daily.day),
  ]);
  const board = boardResult.status === "fulfilled" ? boardResult.value : null;
  const streak: Streak | null = streakResult.status === "fulfilled" ? streakResult.value : null;
  return NextResponse.json({
    week,
    weeklyLeaders: board?.weeklyLeaders ?? [],
    leaders: board?.leaders ?? [],
    name: user.name,
    authenticated: user.authenticated,
    canTest: user.canTest,
    testAttempt: testAttempts[0] ?? null,
    attempt: attempts[0] ?? null,
    groups,
    day: daily.day,
    serverNow: Date.now(),
    streak,
    rank: board?.rank ?? { daily: null, weekly: null },
    leaderboard: { available: board !== null, updatedAt: board?.updatedAt ?? null },
  });
}

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Origen inválido." }, { status: 403 });
  const cookie = (await cookies()).get(PLAYER_COOKIE)?.value;
  const decision = limit([
    { key: `ip:${clientIp(request)}`, max: 120, windowMs: 60_000 },
    ...(cookie ? [{ key: `player:${cookie}`, max: 30, windowMs: 60_000 }] : []),
  ]);
  if (!decision.ok) return NextResponse.json({ error: "Demasiados intentos seguidos. Esperá unos segundos." }, { status: 429, headers: { "Retry-After": String(decision.retryAfterSeconds) } });
  const body: unknown = await request.json().catch(() => null);
  if (!object(body)) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  try {
    const user = await player();
    const sql = database();
    const daily = dailyChallenge();
    if ((body.action === "start" || body.action === "submit") && body.day !== daily.day) return NextResponse.json({ error: "Ya cambió el desafío del día. Recargá la página para jugar el nuevo." }, { status: 409 });
    if (body.action === "start") {
      const row = await startAttempt(sql, user.id, daily.day);
      return NextResponse.json({ ...row, serverNow: Date.now() });
    }
    if (body.action === "submit") {
      const choices = body.choices;
      if (choices !== null && !isChoices(choices)) return NextResponse.json({ error: "Completá las decisiones antes de enviar." }, { status: 400 });
      const outcome = await submitAttempt(sql, { playerId: user.id, day: daily.day, choices, evaluate: (picked, elapsed) => evaluate(daily.kind, picked, elapsed), timeoutFeedback: "El tiempo terminó antes del envío. Podés seguir explorando en práctica." });
      if (!outcome.ok) return NextResponse.json({ error: "Primero iniciá el desafío." }, { status: 400 });
      const totals = outcome.value.totals;
      if (totals && user.authenticated) {
        const entry = (score: { score: number; elapsed: number }): Entry => ({ playerId: user.id, name: user.name, ...score });
        // The submit is already committed; a cache hiccup must not turn it into an error.
        await revalidateBoardsFor(daily.day, weekRange(daily.day).start, { daily: entry(totals.daily), weekly: entry(totals.weekly) }).catch(() => undefined);
      }
      return NextResponse.json({ result: outcome.value.result, elapsed: outcome.value.elapsed, streak: outcome.value.streak });
    }
    if (body.action === "name") {
      if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 24) return NextResponse.json({ error: "Usá un nombre de entre 1 y 24 caracteres." }, { status: 400 });
      await sql`UPDATE players SET name = ${body.name.trim()} WHERE id = ${user.id}`;
      return NextResponse.json({ ok: true });
    }
    if (body.action === "create-group") {
      if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 40) return NextResponse.json({ error: "El grupo necesita un nombre de hasta 40 caracteres." }, { status: 400 });
      const owned = await sql`SELECT code FROM friend_groups WHERE owner_id = ${user.id}`;
      if (owned.length >= 5) return NextResponse.json({ error: "Podés crear hasta cinco grupos." }, { status: 400 });
      const code = randomBytes(12).toString("hex");
      await sql.transaction([
        sql`INSERT INTO friend_groups (code, name, owner_id) VALUES (${code}, ${body.name.trim()}, ${user.id})`,
        sql`INSERT INTO memberships (group_code, player_id) VALUES (${code}, ${user.id})`,
      ]);
      return NextResponse.json({ code });
    }
    if (body.action === "join-group") {
      if (typeof body.code !== "string" || !/^[a-f0-9]{24}$/.test(body.code)) return NextResponse.json({ error: "La invitación no es válida." }, { status: 400 });
      const groups = await sql`SELECT code FROM friend_groups WHERE code = ${body.code}`;
      if (!groups.length) return NextResponse.json({ error: "No encontramos ese grupo." }, { status: 404 });
      await sql`INSERT INTO memberships (group_code, player_id) VALUES (${body.code}, ${user.id}) ON CONFLICT DO NOTHING`;
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "No pudimos guardar el cambio. Volvé a intentar." }, { status: 503 });
  }
}
