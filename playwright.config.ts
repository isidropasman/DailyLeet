import { defineConfig } from "@playwright/test";
process.loadEnvFile(".env.local");
// Specs create and delete players straight in the DB; .env.local points at production Neon.
if (!process.env.DAILYLEET_LOCAL_NEON_ENDPOINT && process.env.DAILYLEET_E2E_ALLOW_REMOTE_DB !== "1") {
  throw new Error("E2E writes to the database: run it via `bash scripts/local-db.sh exec -- pnpm test:e2e`, or set DAILYLEET_E2E_ALLOW_REMOTE_DB=1 to target the real DB on purpose.");
}
export default defineConfig({
  testDir: "./tests/browser",
  workers: 1,
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3100", headless: true },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : { command: "pnpm dev --port 3100", url: "http://localhost:3100", reuseExistingServer: !process.env.CI, timeout: 60_000 },
});
