import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

const previewURL = process.env.PREVIEW_URL;
const localEnv = resolve(process.cwd(), ".env.local");

if (!process.env.VERCEL_AUTOMATION_BYPASS_SECRET && existsSync(localEnv)) {
  process.loadEnvFile(localEnv);
}

const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

if (previewURL && !bypassSecret) {
  throw new Error(
    "PREVIEW_URL requires VERCEL_AUTOMATION_BYPASS_SECRET in the process environment or .env.local.",
  );
}

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./test-results",
  reporter: "line",
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    ...devices["Desktop Chrome"],
    baseURL: previewURL ?? "http://localhost:3000",
    extraHTTPHeaders: previewURL
      ? { "x-vercel-protection-bypass": bypassSecret! }
      : undefined,
    screenshot: "off",
    trace: "off",
    video: "off",
  },
});
