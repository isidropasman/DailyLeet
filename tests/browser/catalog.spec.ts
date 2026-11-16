import { test, expect } from "@playwright/test";
import { neon } from "@neondatabase/serverless";
import "./local-db";

const ids = new Set<string>();
test.afterAll(async () => {
  const sql = neon(process.env.DATABASE_URL!);
  for (const id of ids) {
    await sql`DELETE FROM attempts WHERE player_id = ${id}`;
    await sql`DELETE FROM weekly_scores WHERE player_id = ${id}`;
    await sql`DELETE FROM memberships WHERE player_id = ${id}`;
    await sql`DELETE FROM players WHERE id = ${id}`;
  }
});

test("new exercises show changing code, real samples and valid evaluations", async ({ page, context }) => {
  await page.goto("/"); await expect(page.getByRole("button", { name:"Empezar desafío" })).toBeEnabled();
  const cookie = (await context.cookies()).find(c => c.name === "dailyleet-player"); if(cookie) ids.add(cookie.value);
  const dailyTitle = (await page.locator(".problem-panel h2").innerText()).trim();
  await page.getByRole("button", {name:"Practicar",exact:true}).click();
  // Today's daily stays out of practice until it's submitted: practice grades all hidden cases.
  await expect(page.locator(".practice-switch").getByRole("button", {name:dailyTitle,exact:true})).toHaveCount(0);
  for (const title of ["El mejor momento","Ceros al final","Las mismas letras"].filter(title => title !== dailyTitle)) {
    await page.locator(".practice-switch").getByRole("button", {name:title,exact:true}).click();
    await page.locator('.option[data-choice="0"]').click();
    const first = await page.getByLabel("Código generado").innerText();
    await page.getByRole("button",{name:"Siguiente",exact:true}).click();
    await page.locator('.option[data-choice="0"]').click();
    expect(await page.getByLabel("Código generado").innerText()).not.toBe(first);
    await page.getByRole("button",{name:"Siguiente",exact:true}).click();
    await page.locator('.option[data-choice="0"]').click();
    await page.getByRole("button",{name:"Probar ejemplo",exact:true}).click();
    await expect(page.locator(".trace-area")).toBeVisible();
    if(title === "Ceros al final") {
      const slider = page.getByRole("slider",{name:"Paso de ejecución"});
      await slider.fill(await slider.getAttribute("max") ?? "0");
      expect(await page.locator(".cell>span").allTextContents()).toEqual(["1","3","12","0","0"]);
    }
    await page.getByRole("button",{name:"Ejecutar y evaluar",exact:true}).click();
    await expect(page.getByLabel("Resultados de ejecución")).toContainText("12 / 12 tests");
    await page.getByRole("button",{name:"Ver mi puntaje",exact:true}).click();
    await expect(page.locator(".explain")).toContainText("La idea clave");
    await expect(page.locator(".explain")).toContainText("Solución óptima");
  }
});

test("one-decision approaches have a working next action and completed dailies open into practice", async ({page,context}) => {
  await page.goto("/"); await expect(page.getByRole("button",{name:"Empezar desafío"})).toBeEnabled();
  const cookie = (await context.cookies()).find(c => c.name === "dailyleet-player"); if(cookie) ids.add(cookie.value);
  await page.getByRole("button",{name:"Practicar",exact:true}).click();
  await page.locator(".practice-switch").getByRole("button",{name:"La pareja exacta",exact:true}).click();
  await page.locator('.option[data-choice="2"]').click();
  await expect(page.getByRole("button",{name:"Siguiente",exact:true})).toHaveCount(0);
  await page.getByRole("button",{name:"Ejecutar y evaluar",exact:true}).click();
  await expect(page.getByLabel("Resultados de ejecución")).toBeVisible();
  await page.getByRole("button",{name:"Desafío diario",exact:true}).click();
  await page.getByRole("button",{name:"Empezar desafío",exact:true}).click();
  for(let i=0;i<3;i++) {
    await page.locator(".stepper button").nth(i).click();
    await page.locator('.option[data-choice="0"]').click();
  }
  await page.getByRole("button",{name:"Enviar y terminar",exact:true}).click();
  await expect(page.getByRole("button",{name:"Seguir practicando",exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Seguir practicando",exact:true}).click();
  await expect(page.locator(".option").first()).toBeEnabled();
  await expect(page.getByText("Sin timer ni ranking",{exact:true})).toBeVisible();
});
