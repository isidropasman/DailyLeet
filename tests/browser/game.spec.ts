import { test, expect } from "@playwright/test";
import { neon } from "@neondatabase/serverless";
import "./local-db";
import { readFileSync } from "node:fs";
import { weekRange } from "../../src/lib/ranking-period";
import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { createClerkClient } from "@clerk/nextjs/server";
import { randomUUID } from "node:crypto";

const ids = new Set<string>();
test.afterAll(async () => {
  const env = readFileSync(".env.local", "utf8");
  const url = process.env.DATABASE_URL ?? env.match(/^DATABASE_URL="?([^"\n]+)/m)?.[1];
  if (!url) return;
  const sql = neon(url);
  for (const id of ids) {
    await sql`DELETE FROM memberships WHERE group_code IN (SELECT code FROM friend_groups WHERE owner_id = ${id})`;
    await sql`DELETE FROM memberships WHERE player_id = ${id}`;
    await sql`DELETE FROM friend_groups WHERE owner_id = ${id}`;
    await sql`DELETE FROM attempts WHERE player_id = ${id}`;
    await sql`DELETE FROM weekly_scores WHERE player_id = ${id}`;
    await sql`DELETE FROM players WHERE id = ${id}`;
  }
});

test("daily: decisions, execution, immutable submit and reload", async ({ page, context }) => {
  await page.setViewportSize({ width: 1280, height: 650 });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Empezar desafío" })).toBeEnabled();
  await page.getByRole("navigation", { name: "Navegación principal" }).getByRole("button", { name: "Cómo se juega" }).click();
  await expect(page.getByRole("dialog")).toContainText("Tu lógica, en tres decisiones");
  await page.getByRole("button", { name: "Cerrar" }).click();
  const cookie = (await context.cookies()).find(c => c.name === "dailyleet-player");
  if (cookie) ids.add(cookie.value);
  await page.getByRole("button", { name: "Empezar desafío" }).click();
  await expect(page.getByText("Desafío en curso", { exact: true })).toBeVisible();
  await page.locator('.option[data-choice="0"]').click();
  await expect(page.getByLabel("Código generado")).toContainText("for (");
  await expect(page.locator(".code-changed").first()).toBeVisible();
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await page.locator('.option[data-choice="0"]').click();
  await page.reload();
  await expect(page.locator(".progress-heading")).toContainText("2 de 3");
  await page.locator(".stepper button").nth(2).click();
  await page.locator('.option[data-choice="0"]').click();
  await page.getByRole("button", { name: "Probar ejemplo" }).click();
  await expect(page.locator(".cells")).toBeVisible();
  await page.getByRole("button", { name: "Avanzar", exact: true }).click();
  await expect(page.locator(".trace-heading")).toContainText("Paso 2");
  await page.getByRole("button", { name: "Enviar solución" }).click();
  await expect(page.getByLabel("Resultados de ejecución")).toContainText("12 / 12 tests");
  await expect(page.getByLabel("Puntaje de la solución")).toHaveCount(0);
  await page.getByRole("button", { name: "Ver mi puntaje" }).click();
  await expect(page.getByLabel("Puntaje de la solución")).toBeVisible();
  await page.getByRole("button", { name: "Ranking", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("El ranking mundial es solo para cuentas");
  await page.getByRole("button", { name: "Cerrar" }).click();
  await expect(page.getByLabel("Código generado")).toBeInViewport();
  await expect(page.getByRole("button", { name: "Enviar solución", exact: true })).toBeInViewport();
  const panel = await page.locator(".solution-panel").boundingBox();
  const actions = await page.locator(".solution-bottom").boundingBox();
  expect(panel && actions && actions.y + actions.height <= panel.y + panel.height).toBe(true);
  const before = await (await page.request.get("/api/game")).json();
  const repeat = await page.request.post("/api/game", { data: { action: "submit", day: before.day, choices: [3,3,3] }, headers: { origin: "http://localhost:3100" } });
  expect(repeat.ok()).toBe(true);
  expect((await repeat.json()).result).toEqual(before.attempt.result);
  await page.reload();
  await expect(page.getByRole("button", { name: "Ver resultado", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("profile, group invite and shared ranking across browsers", async ({ browser }) => {
  const owner = await browser.newContext(); const friend = await browser.newContext();
  try {
    const page = await owner.newPage();
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Empezar desafío" })).toBeEnabled();
    const cookie = (await owner.cookies()).find(c => c.name === "dailyleet-player"); if (cookie) ids.add(cookie.value);
    await page.getByRole("button", { name: "Mis grupos" }).click();
    await page.getByLabel("Tu nombre en el ranking").fill("QA Owner");
    await page.getByRole("button", { name: "Guardar", exact: true }).click();
    await expect(page.getByRole("dialog")).toContainText("Nombre guardado");
    await page.getByLabel("Un nuevo grupo").fill("QA friends");
    await page.getByRole("button", { name: "Crear", exact: true }).click();
    await expect(page.locator(".group-row")).toContainText("QA friends");
    const data = await (await page.request.get("/api/game")).json();
    const code: string = data.groups[0].code;
    const guest = await friend.newPage(); await guest.goto(`/?group=${code}`);
    await expect(guest.getByRole("button", { name: "Unirme al grupo" })).toBeVisible();
    await expect(guest.getByRole("button", { name: "Empezar desafío" })).toBeEnabled();
    const friendCookie = (await friend.cookies()).find(c => c.name === "dailyleet-player"); if (friendCookie) ids.add(friendCookie.value);
    await guest.getByRole("button", { name: "Unirme al grupo" }).click();
    await expect(guest.locator(".group-row")).toContainText("QA friends");
    await guest.getByRole("button", { name: "Ver ranking de QA friends" }).click();
    await expect(guest.getByRole("dialog")).toContainText("El ranking mundial es solo para cuentas");
  } finally { await owner.close(); await friend.close(); }
});

test("weekly ranking sums official attempts only within the UTC week", async ({ page, context }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Empezar desafío" })).toBeEnabled();
  const id = (await context.cookies()).find(c => c.name === "dailyleet-player")?.value;
  expect(id).toBeTruthy();
  if (!id) return;
  ids.add(id);
  const sql = neon(process.env.DATABASE_URL!);
  const session = await (await page.request.get("/api/game")).json();
  const day: string = session.day;
  const week = weekRange(day);
  const previous = new Date(`${week.start}T00:00:00Z`);
  previous.setUTCDate(previous.getUTCDate() - 1);
  await sql`INSERT INTO attempts (player_id, day, result, elapsed) VALUES (${id}, ${day}, ${JSON.stringify({ score: 21 })}::jsonb, 40), (${id}, ${previous.toISOString().slice(0,10)}, ${JSON.stringify({ score: 99 })}::jsonb, 1)`;
  if (week.start !== day) await sql`INSERT INTO attempts (player_id, day, result, elapsed) VALUES (${id}, ${week.start}, ${JSON.stringify({ score: 30 })}::jsonb, 50)`;
  await clerkSetup({ dotenv: false });
  const provider = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  const email = `weekly-${randomUUID()}+clerk_test@example.com`;
  const user = await provider.users.createUser({ emailAddress: [email], skipPasswordRequirement: true });
  try {
  await clerk.signIn({ page, emailAddress: email });
  await page.goto("/");
  const account = (await context.cookies()).find(c => c.name === "dailyleet-player")?.value;
  if (account) ids.add(account);
  const updated = await (await page.request.get("/api/game")).json();
  expect(updated.leaders.find((leader: { me: boolean }) => leader.me).score).toBe(21);
  expect(updated.weeklyLeaders.find((leader: { me: boolean }) => leader.me)).toMatchObject({ score: week.start === day ? 21 : 51, elapsed: week.start === day ? 40 : 90 });
  await page.getByRole("button", { name: "Ranking", exact: true }).click();
  await page.getByRole("button", { name: "Semanal", exact: true }).click();
  await expect(page.getByRole("table", { name: "Posiciones del ranking" }).locator("tr.me")).toContainText(String(week.start === day ? 21 : 51));
  } finally { await provider.users.deleteUser(user.id); }
});

test("mobile practice works for all three problems with no overflow", async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Empezar desafío" })).toBeEnabled();
  const cookie = (await context.cookies()).find(c => c.name === "dailyleet-player"); if (cookie) ids.add(cookie.value);
  await page.getByRole("button", { name: "Practicar", exact: true }).click();
  for (const title of ["Sin repetir", "La pareja exacta", "Todo en su lugar"]) {
    await page.locator(".practice-switch").getByRole("button", { name: title, exact: true }).click();
    for (let step = 0; step < 3; step++) {
      await page.locator(".stepper button").nth(step).click();
      await page.locator('.option[data-choice="0"]').click();
    }
    await page.getByRole("button", { name: "Enviar solución" }).click();
    await expect(page.getByLabel("Resultados de ejecución")).toContainText("12 / 12 tests");
  await expect(page.getByLabel("Puntaje de la solución")).toHaveCount(0);
  await page.getByRole("button", { name: "Ver mi puntaje" }).click();
  await expect(page.getByLabel("Puntaje de la solución")).toBeVisible();
    await page.locator(".stepper button").nth(2).click();
    await page.locator('.option[data-choice="1"]').click();
    await expect(page.getByLabel("Resultados de ejecución")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test("exhaustive two-sum skips decisions it does not use", async ({ page, context }) => {
  await page.goto("/"); await expect(page.getByRole("button", { name: "Empezar desafío" })).toBeEnabled();
  const cookie = (await context.cookies()).find(c => c.name === "dailyleet-player"); if (cookie) ids.add(cookie.value);
  await page.getByRole("button", { name: "Practicar", exact: true }).click();
  await page.locator(".practice-switch").getByRole("button", { name: "La pareja exacta", exact: true }).click();
  await page.locator('.option[data-choice="1"]').click();
  await expect(page.locator(".stepper button")).toHaveCount(1);
  await expect(page.locator(".stepper")).not.toContainText("Memoria");
  await expect(page.locator(".stepper")).not.toContainText("Regla");
  await expect(page.locator(".branch-note")).toHaveCount(0);
  await expect(page.locator(".progress-heading")).toContainText("1 de 1");
  await expect(page.getByRole("button", { name: "Enviar solución" })).toBeEnabled();
});

test("visible decisions are numbered consecutively", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Practicar", exact: true }).click();
  await page.locator(".practice-switch").getByRole("button", { name: "Todo en su lugar", exact: true }).click();
  await page.locator('.option[data-choice="1"]').click();
  await expect(page.locator(".progress-heading")).toContainText("1 de 2");
  await expect(page.locator(".stepper button").nth(1)).toHaveAttribute("aria-label", "Decisión 2: Regla");
});

test("desktop keeps code and decisions together in one viewport", async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/"); await expect(page.getByRole("button", { name: "Empezar desafío" })).toBeEnabled();
  const cookie = (await context.cookies()).find(c => c.name === "dailyleet-player"); if (cookie) ids.add(cookie.value);
  await page.getByRole("button", { name: "Practicar", exact: true }).click();
  await page.locator(".practice-switch").getByRole("button", { name: "Sin repetir", exact: true }).click();
  await page.locator('.option[data-choice="0"]').click();
  const approach = await page.getByLabel("Código generado").innerText();
  await page.locator(".stepper button").nth(1).click();
  await page.locator('.option[data-choice="1"]').click();
  const memory = await page.getByLabel("Código generado").innerText();
  expect(memory).not.toBe(approach);
  expect(memory).toContain("new Set<string>");
  await page.locator('.option[data-choice="0"]').click();
  await expect(page.getByLabel("Código generado")).toContainText("new Map<string, number>");
  await expect(page.locator(".solution-tabs")).toHaveCount(0);
  await expect(page.getByLabel("Código generado")).toBeInViewport();
  expect(await page.locator(".problem-content").evaluate(element => element.scrollHeight <= element.clientHeight)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);
});

test("incorrect solutions show actual failing executions before a partial score", async ({ page, context }) => {
  await page.goto("/"); await expect(page.getByRole("button", { name: "Empezar desafío" })).toBeEnabled();
  const cookie = (await context.cookies()).find(c => c.name === "dailyleet-player"); if (cookie) ids.add(cookie.value);
  await page.getByRole("button", { name: "Practicar", exact: true }).click();
  await page.locator(".practice-switch").getByRole("button", { name: "Sin repetir", exact: true }).click();
  for (const [step,choice] of [[0,0],[1,0],[2,1]]) {
    await page.locator(".stepper button").nth(step).click();
    await page.locator(`.option[data-choice="${choice}"]`).click();
  }
  await page.getByRole("button", { name: "Enviar solución", exact: true }).click();
  await expect(page.getByLabel("Resultados de ejecución")).toContainText("Hay casos por revisar");
  await expect(page.getByLabel("Puntaje de la solución")).toHaveCount(0);
  await page.locator(".test-selector .failed").first().click();
  const values = await page.locator(".execution-case code").allTextContents();
  expect(values[1]).not.toEqual(values[2]);
  await page.getByRole("button", { name: "Ver mi puntaje" }).click();
  await expect(page.locator(".score-breakdown")).toContainText("/ 90");
  await expect(page.locator(".score-breakdown")).toContainText("/ 3");
  const points = Number(await page.locator(".score-total strong").innerText());
  expect(points).toBeGreaterThan(1); expect(points).toBeLessThan(97);
});

test("share score copies the visible message with date and page link into the clipboard", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/"); await expect(page.getByRole("button", { name: "Empezar desafío" })).toBeEnabled();
  const cookie = (await context.cookies()).find(c => c.name === "dailyleet-player"); if (cookie) ids.add(cookie.value);
  await page.getByRole("button", { name: "Practicar", exact: true }).click();
  for (let step = 0; step < 3; step++) {
    await page.locator(".stepper button").nth(step).click();
    await page.locator('.option[data-choice="0"]').click();
  }
  await page.getByRole("button", { name: "Enviar solución", exact: true }).click();
  await page.getByRole("button", { name: "Ver mi puntaje" }).click();
  const message = await page.getByLabel("Mensaje para compartir").innerText();
  expect(message).toMatch(/\d+\/100/);
  expect(message).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  expect(message).toContain("http://localhost:3100/");
  await page.getByRole("button", { name: "Copiar mensaje", exact: true }).click();
  await expect(page.getByRole("button", { name: "Copiado al portapapeles" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(message);
});

test("API rejects malformed paths, cross-origin writes and stale daily", async ({ page, context }) => {
  await page.goto("/"); await expect(page.getByRole("button", { name: "Empezar desafío" })).toBeEnabled();
  const cookie = (await context.cookies()).find(c => c.name === "dailyleet-player"); if (cookie) ids.add(cookie.value);
  const response = await page.request.post("/api/game", { data: { action: "start", day: "2000-01-01" }, headers: { origin: "http://localhost:3100" } });
  expect(response.status()).toBe(409);
  const cross = await page.request.post("/api/game", { data: { action: "name", name: "Other" }, headers: { origin: "https://other.example" } });
  expect(cross.status()).toBe(403);
  const malformed = await page.request.post("/api/simulate", { data: { kind: "substring", choices: [0,0,99] } });
  expect(malformed.status()).toBe(400);
});

test("server deadline rejects a late solution even when all choices are correct", async ({ page, context }) => {
  await page.goto("/"); await expect(page.getByRole("button", { name: "Empezar desafío" })).toBeEnabled();
  const cookie = (await context.cookies()).find(c => c.name === "dailyleet-player");
  expect(cookie).toBeDefined();
  if (!cookie) return;
  ids.add(cookie.value);
  const state = await (await page.request.get("/api/game")).json();
  const origin = { origin: "http://localhost:3100" };
  await page.request.post("/api/game", { data: { action: "start", day: state.day }, headers: origin });
  const env = readFileSync(".env.local", "utf8");
  const url = process.env.DATABASE_URL ?? env.match(/^DATABASE_URL="?([^"\n]+)/m)?.[1];
  expect(url).toBeDefined();
  if (!url) return;
  const sql = neon(url);
  await sql`UPDATE attempts SET started_at = now() - interval '301 seconds' WHERE player_id = ${cookie.value} AND day = ${state.day}`;
  const response = await page.request.post("/api/game", { data: { action: "submit", day: state.day, choices: [0,0,0] }, headers: origin });
  expect(response.ok()).toBe(true);
  const data = await response.json();
  expect(data.result.score).toBe(1);
  expect(data.elapsed).toBe(300);
});
