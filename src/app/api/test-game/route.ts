import { randomUUID } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { database } from "@/lib/db";
import { dailyChallenge, isChoices } from "@/lib/challenges";
import { evaluate, type Evaluation } from "@/lib/engine";
import { resolveIdentity } from "@/lib/identity";
import { hasTestAccess } from "@/lib/test-access";

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Origen inválido." }, {status:403});
  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null || !("action" in body) || !("day" in body)) return NextResponse.json({error:"Solicitud inválida."},{status:400});
  const daily = dailyChallenge();
  if(body.day !== daily.day) return NextResponse.json({error:"Cambió el desafío del día. Recargá la página."},{status:409});
  if(body.action !== "start" && body.action !== "submit") return NextResponse.json({error:"Acción inválida."},{status:400});
  try {
    const {userId} = await auth();
    if(!await hasTestAccess(userId,{fresh:true})) return NextResponse.json({error:"El modo de pruebas no está habilitado para esta cuenta."},{status:403});
    const jar = await cookies();
    const user = await resolveIdentity(jar.get("dailyleet-player")?.value,userId);
    const sql = database();
    if(body.action === "start") {
      const runId = randomUUID();
      const rows = await sql`INSERT INTO test_attempts (player_id,day,run_id) VALUES (${user.id},${daily.day},${runId}) ON CONFLICT (player_id,day) DO UPDATE SET run_id = EXCLUDED.run_id, started_at = now(), choices = NULL, result = NULL, elapsed = NULL RETURNING run_id, started_at`;
      return NextResponse.json({...rows[0],serverNow:Date.now()});
    }
    if (!("runId" in body) || typeof body.runId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(body.runId) || !("choices" in body) || (body.choices !== null && !isChoices(body.choices))) return NextResponse.json({error:"La prueba no es válida. Reiniciala para continuar."},{status:400});
    const rows = await sql`SELECT started_at,result,elapsed FROM test_attempts WHERE player_id = ${user.id} AND day = ${daily.day} AND run_id = ${body.runId}`;
    const attempt = rows[0];
    if(!attempt) return NextResponse.json({error:"Esta prueba ya se reinició. Iniciá un intento nuevo."},{status:409});
    if(attempt.result) return NextResponse.json({result:attempt.result,elapsed:attempt.elapsed});
    const elapsed = Math.max(0,Math.floor((Date.now()-new Date(attempt.started_at as string).getTime())/1000));
    const result: Evaluation = body.choices === null || elapsed > 300 ? {score:1,passed:0,total:12,efficient:false,tests:[],feedback:["Terminó el tiempo. Podés reiniciar esta prueba todas las veces que quieras."]} : evaluate(daily.kind,body.choices,elapsed);
    const saved = await sql`UPDATE test_attempts SET choices = ${JSON.stringify(body.choices)}::jsonb,result = ${JSON.stringify(result)}::jsonb,elapsed = ${Math.min(elapsed,300)} WHERE player_id = ${user.id} AND day = ${daily.day} AND run_id = ${body.runId} AND result IS NULL RETURNING result,elapsed`;
    if(saved.length) return NextResponse.json(saved[0]);
    const existing = await sql`SELECT result,elapsed FROM test_attempts WHERE player_id = ${user.id} AND day = ${daily.day} AND run_id = ${body.runId} AND result IS NOT NULL`;
    return existing.length ? NextResponse.json(existing[0]) : NextResponse.json({error:"Esta prueba ya se reinició."},{status:409});
  } catch { return NextResponse.json({error:"No pudimos guardar la prueba. Volvé a intentar."},{status:503}); }
}
