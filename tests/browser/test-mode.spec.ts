import { test, expect } from "@playwright/test";
import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { createClerkClient } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import "./local-db";
import { randomUUID } from "node:crypto";

const provider = createClerkClient({secretKey:process.env.CLERK_SECRET_KEY});
const email = `dailyleet-tester-${randomUUID()}+clerk_test@example.com`;
const ids = new Set<string>();
let userId:string;

test.beforeAll(async () => {
  await clerkSetup({dotenv:false});
  const user = await provider.users.createUser({emailAddress:[email],skipPasswordRequirement:true,privateMetadata:{dailyleetTester:true}});
  userId = user.id;
});
test.afterAll(async () => {
  const sql = neon(process.env.DATABASE_URL!);
  if(userId) for(const row of await sql`SELECT id FROM players WHERE clerk_user_id = ${userId}`) ids.add(row.id as string);
  for(const id of ids) {
    await sql`DELETE FROM test_attempts WHERE player_id = ${id}`;
    await sql`DELETE FROM attempts WHERE player_id = ${id}`;
    await sql`DELETE FROM weekly_scores WHERE player_id = ${id}`;
    await sql`DELETE FROM memberships WHERE player_id = ${id}`;
    await sql`DELETE FROM players WHERE id = ${id}`;
  }
  if(userId) await provider.users.deleteUser(userId);
});

test("private daily can restart repeatedly without changing official result or ranking",async ({page,context}) => {
  test.setTimeout(90_000);
  const headers = {origin:new URL(test.info().project.use.baseURL ?? "http://localhost:3100").origin};
  await page.goto("/"); await expect(page.getByRole("button",{name:"Empezar desafío"})).toBeEnabled();
  const guest = (await context.cookies()).find(c=>c.name==="dailyleet-player"); if(guest) ids.add(guest.value);
  const guestState = await (await page.request.get("/api/game")).json();
  expect((await page.request.post("/api/test-game",{data:{action:"start",day:guestState.day},headers})).status()).toBe(403);
  await clerk.signIn({page,emailAddress:email}); await page.goto("/");
  await expect(page.getByRole("button",{name:"Modo de pruebas",exact:true})).toBeVisible();
  const state = await (await page.request.get("/api/game")).json();
  expect(state.canTest).toBe(true);
  await page.request.post("/api/game",{data:{action:"start",day:state.day},headers});
  await page.request.post("/api/game",{data:{action:"submit",day:state.day,choices:[0,0,0]},headers});
  const official = await (await page.request.get("/api/game")).json();
  await page.reload();
  await page.getByRole("button",{name:"Modo de pruebas",exact:true}).click();
  await expect(page.locator(".test-mode-banner")).toContainText("Modo de pruebas privado");
  await expect(page).toHaveURL(/mode=test/);
  for(let step=0;step<3;step++) {
    await page.locator(".stepper button").nth(step).click();
    await page.locator('.option[data-choice="0"]').click();
  }
  await page.getByRole("button",{name:"Enviar solución",exact:true}).click();
  await expect(page.getByLabel("Resultados de ejecución")).toContainText("12 / 12 tests");
  await expect(page.locator(".result-kicker")).toContainText("Prueba privada");
  await page.getByRole("dialog").getByRole("button", { name: "Cerrar" }).click();
  const first = await (await page.request.get("/api/game")).json();
  expect(first.attempt).toEqual(official.attempt);
  expect(first.leaders.find((entry: {me:boolean}) => entry.me)).toEqual(official.leaders.find((entry: {me:boolean}) => entry.me));
  expect(first.testAttempt.result.passed).toBe(12);
  await page.getByRole("button",{name:"Reiniciar prueba",exact:true}).click();
  await expect(page.getByLabel("Resultados de ejecución")).toHaveCount(0);
  const second = await (await page.request.get("/api/game")).json();
  expect(second.testAttempt.run_id).not.toBe(first.testAttempt.run_id);
  expect(second.testAttempt.result).toBeNull(); expect(second.testAttempt.choices).toBeNull();
  expect(second.attempt).toEqual(official.attempt);
  expect((await page.request.post("/api/test-game",{data:{action:"submit",day:state.day,runId:first.testAttempt.run_id,choices:[0,0,0]},headers})).status()).toBe(409);
  await page.reload();
  await expect(page.locator(".test-mode-banner")).toBeVisible();
  await expect(page.locator(".option").first()).toBeEnabled();
  await Promise.all([page.waitForResponse(response => response.url().endsWith("/api/test-game") && response.request().method() === "POST"), page.getByRole("button",{name:"Reiniciar prueba",exact:true}).click()]);
  const third = await (await page.request.get("/api/game")).json();
  expect(third.testAttempt.run_id).not.toBe(second.testAttempt.run_id);
  expect(third.leaders.find((entry: {me:boolean}) => entry.me)).toEqual(official.leaders.find((entry: {me:boolean}) => entry.me));
  await page.getByRole("button",{name:"Volver al daily",exact:true}).click();
  await expect(page.locator(".test-mode-banner")).toHaveCount(0);
  await expect(page.getByRole("button",{name:"Ver resultado",exact:true})).toBeVisible();
  await provider.users.updateUserMetadata(userId,{privateMetadata:{dailyleetTester:false}});
  // Reads cache tester access for 5 min; the next write re-checks Clerk and expires that cache.
  expect((await page.request.post("/api/test-game",{data:{action:"start",day:state.day},headers})).status()).toBe(403);
  const revoked = await (await page.request.get("/api/game")).json();
  expect(revoked.canTest).toBe(false);
});
