import { test, expect } from "@playwright/test";
import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { createClerkClient } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import "./local-db";
import { randomUUID } from "node:crypto";

const email = `dailyleet-${randomUUID()}+clerk_test@example.com`;
const ids = new Set<string>();
const provider = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
let userId: string;

test.beforeAll(async () => {
  await clerkSetup({ dotenv: false });
  const user = await provider.users.createUser({ emailAddress: [email], firstName: "Isidro", lastName: "Pasman", skipPasswordRequirement: true });
  userId = user.id;
});

test.afterAll(async () => {
  const sql = neon(process.env.DATABASE_URL!);
  const accounts = userId ? await sql`SELECT id FROM players WHERE clerk_user_id = ${userId}` : [];
  for (const row of accounts) ids.add(row.id as string);
  for (const id of ids) {
    await sql`DELETE FROM memberships WHERE group_code IN (SELECT code FROM friend_groups WHERE owner_id = ${id})`;
    await sql`DELETE FROM memberships WHERE player_id = ${id}`;
    await sql`DELETE FROM friend_groups WHERE owner_id = ${id}`;
    await sql`DELETE FROM attempts WHERE player_id = ${id}`;
    await sql`DELETE FROM weekly_scores WHERE player_id = ${id}`;
    await sql`DELETE FROM players WHERE id = ${id}`;
  }
  if (userId) await provider.users.deleteUser(userId);
});

test("real Clerk login preserves guest score and groups across devices and isolates sign-out", async ({ page, context, browser }) => {
  test.setTimeout(90_000);
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Iniciar sesión", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Empezar desafío" })).toBeEnabled();
  const initial = await (await page.request.get("/api/game")).json();
  expect(initial.authenticated).toBe(false);
  expect(initial.leaders).toEqual([]);
  expect(initial.weeklyLeaders).toEqual([]);
  await page.getByRole("button", { name: "Ranking", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("El ranking mundial es solo para cuentas");
  await expect(page.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute("href", "/sign-in");
  await expect(page.getByRole("table", { name: "Posiciones del ranking" })).toHaveCount(0);
  await page.getByRole("button", { name: "Cerrar" }).click();
  const guest = (await context.cookies()).find(c => c.name === "dailyleet-player"); if (guest) ids.add(guest.value);
  const origin = new URL(page.url()).origin;
  const headers = { origin };
  await page.request.post("/api/game", { data: { action: "name", name: "QA Logged Coder" }, headers });
  const group = await (await page.request.post("/api/game", { data: { action: "create-group", name: "QA Account Group" }, headers })).json();
  await page.request.post("/api/game", { data: { action: "start", day: initial.day }, headers });
  const scored = await (await page.request.post("/api/game", { data: { action: "submit", day: initial.day, choices: [0,0,0] }, headers })).json();
  await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();
  await expect(page.locator(".cl-signIn-root")).toBeVisible();
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: email });
  await page.goto("/");
  await expect.poll(async () => (await (await page.request.get("/api/game")).json()).authenticated).toBe(true);
  const signed = await (await page.request.get("/api/game")).json();
  expect(signed.name).toBe("QA Logged Coder");
  await expect(page.getByRole("button", { name: "Editar tu nombre" })).toHaveText("Isidro Pasman");
  expect(signed.attempt.result.score).toBe(scored.result.score);
  expect(signed.groups.map((g: { code: string }) => g.code)).toContain(group.code);
  expect(signed.leaders.some((leader: { me: boolean }) => leader.me)).toBe(true);
  expect(signed.weeklyLeaders.some((leader: { me: boolean }) => leader.me)).toBe(true);
  await page.getByRole("button", { name: "Ranking", exact: true }).click();
  await expect(page.getByRole("table", { name: "Posiciones del ranking" })).toBeVisible();
  await page.getByRole("button", { name: "Semanal", exact: true }).click();
  await expect(page.getByRole("table", { name: "Posiciones del ranking" })).toBeVisible();
  await page.getByRole("button", { name: "Cerrar" }).click();
  const accountCookie = (await context.cookies()).find(c => c.name === "dailyleet-player"); if (accountCookie) ids.add(accountCookie.value);

  const other = await browser.newContext();
  try {
    const second = await other.newPage(); await second.goto("/");
    await expect(second.getByRole("button", { name: "Iniciar sesión", exact: true })).toBeVisible();
    const fresh = (await other.cookies()).find(c => c.name === "dailyleet-player"); if (fresh) ids.add(fresh.value);
    await clerk.signIn({ page: second, emailAddress: email });
    await second.goto("/");
    const restored = await (await second.request.get("/api/game")).json();
    expect(restored.authenticated).toBe(true);
    expect(restored.attempt.result.score).toBe(scored.result.score);
    expect(restored.groups.map((g: { code: string }) => g.code)).toContain(group.code);
  } finally { await other.close(); }

  await clerk.signOut({ page });
  await page.goto("/");
  const signedOut = await (await page.request.get("/api/game")).json();
  expect(signedOut.authenticated).toBe(false);
  expect(signedOut.leaders).toEqual([]); expect(signedOut.weeklyLeaders).toEqual([]);
  expect(signedOut.attempt).toBeNull(); expect(signedOut.groups).toEqual([]);
  const after = (await context.cookies()).find(c => c.name === "dailyleet-player"); if (after) ids.add(after.value);
  if (accountCookie) await context.addCookies([{ name: "dailyleet-player", value: accountCookie.value, domain: new URL(origin).hostname, path: "/", secure: origin.startsWith("https:") }]);
  const replay = await (await page.request.get("/api/game")).json();
  expect(replay.authenticated).toBe(false); expect(replay.groups).toEqual([]); expect(replay.attempt).toBeNull();
  expect(replay.leaders).toEqual([]); expect(replay.weeklyLeaders).toEqual([]);
  const last = (await context.cookies()).find(c => c.name === "dailyleet-player"); if (last) ids.add(last.value);
});
