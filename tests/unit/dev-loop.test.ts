import { spawn } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

// Resolved from this file rather than process.cwd(), for the reason
// tests/unit/schema.test.ts records: Vitest does not set a worker's cwd.
const REPO = fileURLToPath(new URL("../../", import.meta.url));
const VELITE = join(REPO, "node_modules", ".bin", "velite");
const FIXTURE_COVER = join(REPO, "tests", "fixtures", "schema", "cover.png");

const VALID = `---
slug: "valid-item"
title: "A valid write-up"
summary: "One sentence."
publishedAt: "2026-01-01"
roleId: "evernest-staff-pm"
timeframe: "2026"
tags: ["Test"]
outcomes:
  - metric: "1×"
    label: "Something real"
cover: "./cover.png"
draft: false
---

Body.
`;

/**
 * The flags `npm run dev` actually hands velite.
 *
 * Read out of package.json rather than written here, so this suite covers the
 * dev loop rather than a hypothetical invocation. The script is
 * `velite --watch & next dev`, and everything before the `&` is velite's half.
 */
function devVeliteFlags(): string[] {
  const pkg = JSON.parse(readFileSync(join(REPO, "package.json"), "utf8")) as {
    scripts: { dev: string };
  };
  const velitePart = pkg.scripts.dev.split("&")[0].trim();
  const [command, ...flags] = velitePart.split(/\s+/);
  if (command !== "velite") {
    throw new Error(`the dev script no longer starts with velite: ${pkg.scripts.dev}`);
  }
  return flags;
}

const FLAGS = devVeliteFlags();

const dirs: string[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

type Run = {
  /** Exit code, or null when the process had to be killed. */
  status: number | null;
  /** The signal that killed it, or null when it stopped on its own. */
  signal: string | null;
  output: string;
  /** The parsed work.json, or null when velite wrote none. */
  work: unknown[] | null;
};

/**
 * Run velite with the dev script's flags against a throwaway content root.
 *
 * `--watch` means a run that succeeds never exits, so the wait ends at
 * whichever comes first: the process stopping, or work.json appearing. A run
 * still going after that gets killed, and `signal` is what tells the reader
 * which of the two happened.
 */
async function runDevVelite(body: string): Promise<Run> {
  mkdirSync(join(REPO, "tests", ".tmp"), { recursive: true });
  const root = mkdtempSync(join(REPO, "tests", ".tmp", "devloop-"));
  dirs.push(root);
  mkdirSync(join(root, "work"), { recursive: true });
  writeFileSync(join(root, "work", "valid-item.mdx"), body);
  copyFileSync(FIXTURE_COVER, join(root, "work", "cover.png"));

  const out = join(root, ".velite-out");
  const workJson = join(out, "work.json");

  const child = spawn(VELITE, FLAGS, {
    cwd: REPO,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      VELITE_CONTENT_ROOT: root,
      VELITE_OUTPUT_DIR: out,
      VELITE_ASSETS_DIR: join(root, ".assets-out"),
    },
  });

  let output = "";
  child.stdout.on("data", (chunk) => (output += chunk));
  child.stderr.on("data", (chunk) => (output += chunk));

  const exited = new Promise<{ status: number | null; signal: string | null }>(
    (resolve) =>
      child.on("exit", (status, signal) => resolve({ status, signal: signal ?? null })),
  );

  const settled = await Promise.race([
    exited.then(() => "exited" as const),
    new Promise<"watching">((resolve) => {
      const poll = setInterval(() => {
        if (existsSync(workJson)) {
          clearInterval(poll);
          clearTimeout(deadline);
          resolve("watching");
        }
      }, 100);
      const deadline = setTimeout(() => {
        clearInterval(poll);
        resolve("watching");
      }, 60_000);
    }),
  ]);

  if (settled === "watching") child.kill("SIGKILL");
  const { status, signal } = await exited;

  return {
    status,
    signal,
    output,
    work: existsSync(workJson)
      ? (JSON.parse(readFileSync(workJson, "utf8")) as unknown[])
      : null,
  };
}

/**
 * `npm run dev` is where an author first meets a bad body, so it is where the
 * MDX guards have to bite. Velite's --strict is what turns a reported issue
 * into a non-zero exit; without it velite prints the rejection, exits 0, and
 * writes a work.json with the offending entry dropped — so the write-up
 * disappears from the dev site and nothing fails. That is the same silent
 * failure remark-no-esm was written to eliminate, wearing a new costume.
 */
describe("the velite half of `npm run dev`", () => {
  it("stops on a body remark-no-esm rejects rather than dropping it", async () => {
    const result = await runDevVelite(`${VALID}\nimport Chart from "./chart";\n`);

    expect(
      result.signal,
      `velite kept running after a rejected body:\n${result.output}`,
    ).toBe(null);
    expect(
      result.status,
      `velite exited cleanly on a rejected body:\n${result.output}`,
    ).not.toBe(0);
    expect(
      result.work,
      `velite wrote a work.json with the rejected write-up silently missing:\n${result.output}`,
    ).toBe(null);
    expect(result.output).toMatch(/import Chart from/);
  }, 90_000);

  it("still builds a valid body and then watches", async () => {
    const result = await runDevVelite(VALID);

    expect(result.work, `no work.json was written:\n${result.output}`).toHaveLength(1);
    // The watcher is the point of the dev loop: a valid body leaves velite
    // running, which is why this run had to be killed rather than awaited.
    expect(result.signal, `velite exited instead of watching:\n${result.output}`).toBe(
      "SIGKILL",
    );
  }, 90_000);
});
