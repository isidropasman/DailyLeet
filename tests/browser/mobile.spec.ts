import { test, expect, type Page } from "@playwright/test";
import { neon } from "@neondatabase/serverless";
import "./local-db";
import { readFileSync } from "node:fs";

const ids = new Set<string>();
test.afterAll(async () => {
  const url = process.env.DATABASE_URL ?? readFileSync(".env.local", "utf8").match(/^DATABASE_URL="?([^"\n]+)/m)?.[1];
  if (!url) return;
  const sql = neon(url);
  for (const id of ids) {
    await sql`DELETE FROM attempts WHERE player_id = ${id}`;
    await sql`DELETE FROM weekly_scores WHERE player_id = ${id}`;
    await sql`DELETE FROM players WHERE id = ${id}`;
  }
});

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

const fitsWidth = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

async function rightEdge(page: Page, selector: string) {
  const box = await page.locator(selector).boundingBox();
  return box ? box.x + box.width : Number.POSITIVE_INFINITY;
}

test("mobile: start jumps to the questions, choices show their code, submit opens a short result and a learn view", async ({ page, context }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Empezar desafío" })).toBeEnabled();
  const cookie = (await context.cookies()).find(c => c.name === "dailyleet-player");
  if (cookie) ids.add(cookie.value);

  await page.getByRole("button", { name: "Empezar desafío" }).click();
  await expect(page.locator(".decision h4")).toBeInViewport();
  await expect.poll(async () => (await page.locator(".decision h4").boundingBox())?.y ?? 9999).toBeLessThan(844 / 2);

  await page.locator('.option[data-choice="0"]').click();
  const peek = page.getByLabel("Cambios en tu código");
  await expect(peek).toBeInViewport();
  await expect(peek.locator(".code-changed").first()).toBeVisible();

  const steps = await page.locator(".stepper button").count();
  for (let step = 1; step < steps; step++) {
    await page.locator(".stepper button").nth(step).click();
    await page.locator('.option[data-choice="0"]').click();
  }
  await page.getByRole("button", { name: "Enviar solución", exact: true }).click();

  const result = page.getByRole("dialog", { name: /puntaje/i });
  await expect(result).toBeVisible();
  await expect(result.locator(".result-score")).toContainText("/ 100");
  await expect(result.getByRole("button", { name: "Compartir" })).toBeInViewport();
  await expect(result.getByRole("button", { name: "Entender por qué" })).toBeInViewport();
  expect(await fitsWidth(page)).toBe(true);

  await result.getByRole("button", { name: "Entender por qué" }).click();
  const learn = page.getByRole("region", { name: "Entender el ejercicio" });
  await expect(learn).toContainText("Qué se buscaba");
  await expect(learn).toContainText("Tu lógica vs la óptima");
  await expect(learn.getByLabel("Solución óptima")).toBeVisible();
  expect(await fitsWidth(page)).toBe(true);

  await page.reload();
  await expect(page.getByRole("button", { name: "Ver resultado", exact: true })).toBeVisible();
  expect(await rightEdge(page, ".game-bar")).toBeLessThanOrEqual(390);
  expect(await rightEdge(page, ".game-bar .primary")).toBeLessThanOrEqual(390);
  expect(await fitsWidth(page)).toBe(true);
  expect(errors).toEqual([]);
});
