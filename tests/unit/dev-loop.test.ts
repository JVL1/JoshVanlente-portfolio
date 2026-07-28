import { spawn, type ChildProcess } from "node:child_process";
import {
  chmodSync,
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
const BIN = join(REPO, "node_modules", ".bin");
const FIXTURE_COVER = join(REPO, "tests", "fixtures", "schema", "cover.png");

/** Printed by the stub that stands in for `next dev`. */
const NEXT_STARTED = "STUB_NEXT_DEV_STARTED";

function frontmatter(title: string): string {
  return `---
slug: "valid-item"
title: "${title}"
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
}

const VALID = frontmatter("A valid write-up");

/**
 * The dev script exactly as `npm run dev` runs it.
 *
 * Read out of package.json and executed whole, rather than picked apart into
 * the velite half. The bug this suite exists to catch lived in the shell
 * operators between the two halves, not in either half's flags: `A & B` yields
 * B's status in sh, so velite could exit 1 on a rejected body and the script
 * still reported success. A test that pulls out velite's flags and runs them
 * alone cannot see that, because velite by itself was always right.
 */
function devScript(): string {
  const pkg = JSON.parse(readFileSync(join(REPO, "package.json"), "utf8")) as {
    scripts: { dev: string };
  };
  return pkg.scripts.dev;
}

const dirs: string[] = [];
const running: ChildProcess[] = [];

/**
 * Kill the whole process group, not the shell.
 *
 * The script leaves a velite watcher in the background, and killing only the
 * `sh` that started it reparents that watcher to init — the orphan AGENTS.md
 * warns about, here made by the test suite itself. Several of those rewriting
 * `.velite/` at once is what races the schema fixture tests.
 */
function killGroup(child: ChildProcess) {
  if (child.pid === undefined) return;
  try {
    process.kill(-child.pid, "SIGKILL");
  } catch {
    // Already gone.
  }
}

afterEach(() => {
  for (const child of running.splice(0)) killGroup(child);
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

type Dev = {
  /** Everything the script wrote to stdout and stderr so far. */
  output: () => string;
  exited: Promise<{ status: number | null; signal: string | null }>;
  /** The content file, so a test can edit it and watch the rebuild land. */
  source: string;
  workJson: string;
  kill: () => void;
};

/**
 * Run the dev script against a throwaway content root, with a stub in place of
 * `next dev`.
 *
 * The stub is what makes running the whole script safe in a test: the real
 * `next dev` binds a port and compiles the site. Standing in for it keeps every
 * shell operator in the script under test while leaving the second half a
 * process that starts, says so, and waits — which is all the script's control
 * flow cares about.
 */
function startDev(body: string): Dev {
  mkdirSync(join(REPO, "tests", ".tmp"), { recursive: true });
  const root = mkdtempSync(join(REPO, "tests", ".tmp", "devloop-"));
  dirs.push(root);
  mkdirSync(join(root, "work"), { recursive: true });
  const source = join(root, "work", "valid-item.mdx");
  writeFileSync(source, body);
  copyFileSync(FIXTURE_COVER, join(root, "work", "cover.png"));

  const stubBin = join(root, "bin");
  mkdirSync(stubBin);
  const stub = join(stubBin, "next");
  writeFileSync(
    stub,
    `#!/bin/sh\necho "${NEXT_STARTED} $*"\nwhile true; do sleep 1; done\n`,
  );
  chmodSync(stub, 0o755);

  const out = join(root, ".velite-out");

  // Velite compiles the config it loads to one fixed path beside that config —
  // `node_modules/.velite.config.compiled.mjs` — and imports it back from
  // there. Two velite processes started at once write and read that one file,
  // and a reader that imports it mid-write gets a module with no `collections`,
  // which velite reports as `'collections' is required in 'velite.config.ts'`:
  // a config error with nothing wrong with the config. Measured on this
  // machine, against separate content roots and separate outputs: 0 failures in
  // 30 builds two at a time, 2 in 32 at four. The dev script alone runs two
  // velite processes, and tests/unit/schema.test.ts runs more from another
  // Vitest worker.
  //
  // Giving the fixture a config of its own — one line, re-exporting the real
  // one — puts that compiled file under the fixture root, where nothing else
  // writes it. The schema, the plugins, and the dev script under test are all
  // still the real ones; only the path velite compiles to moves.
  writeFileSync(
    join(root, "velite.config.ts"),
    `export { default } from ${JSON.stringify(join(REPO, "velite.config.ts"))};\n`,
  );

  // detached so the script and its background watcher share a process group
  // this test can kill as one. cwd is the fixture root because that is how
  // velite finds the config above, which is what keeps its compiled output off
  // the shared path.
  const child = spawn("sh", ["-c", devScript()], {
    cwd: root,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      // The stub first, then the repo's binaries — which is what npm puts on
      // PATH for a script.
      PATH: `${stubBin}:${BIN}:${process.env.PATH ?? ""}`,
      VELITE_CONTENT_ROOT: root,
      VELITE_OUTPUT_DIR: out,
      VELITE_ASSETS_DIR: join(root, ".assets-out"),
    },
  });
  running.push(child);

  let output = "";
  child.stdout?.on("data", (chunk) => (output += chunk));
  child.stderr?.on("data", (chunk) => (output += chunk));

  return {
    output: () => output,
    exited: new Promise((resolve) =>
      child.on("exit", (status, signal) => resolve({ status, signal: signal ?? null })),
    ),
    source,
    workJson: join(out, "work.json"),
    kill: () => killGroup(child),
  };
}

/** Poll until `predicate` holds, or give up. Returns whether it held. */
async function waitFor(predicate: () => boolean, timeoutMs = 60_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return true;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return predicate();
}

/**
 * Wait until the watcher is armed, and prove it by making it fire.
 *
 * Velite prints `watching for changes` before it constructs its chokidar
 * watcher, and chokidar ignores everything it finds during its own initial scan
 * (`ignoreInitial: true`). A write that lands in that window is absorbed into
 * the scan's baseline: no event is ever emitted for it, so the rebuild does not
 * arrive late — it never arrives at all. Waiting longer cannot fix that, which
 * is why nothing here is a retry of the assertion.
 *
 * Neither of the signals the dev loop otherwise offers marks the end of that
 * window. `velite build --strict` writes work.json and `next dev` starts before
 * the watcher process is even up, so on a loaded machine both are true while
 * the watcher has yet to print a line. The only honest readiness signal left is
 * an event actually firing. Touching the source until velite reports a rebuild
 * is what waits for it; delivery is reliable from then on, so the edit under
 * test can be a single write.
 *
 * The touches deliberately leave the title alone. Only the edit under test
 * changes it, so only the edit under test can satisfy the assertion.
 */
async function waitUntilWatcherArmed(dev: Dev): Promise<boolean> {
  let touches = 0;
  let lastTouch = 0;
  return waitFor(() => {
    if (/rebuild finished/.test(dev.output())) return true;
    // Slower than the poll interval: each touch costs velite a rebuild, and
    // one every half-second is plenty to catch the window closing.
    if (Date.now() - lastTouch < 500) return false;
    lastTouch = Date.now();
    touches += 1;
    writeFileSync(dev.source, `${VALID}\nTouched ${touches} times.\n`);
    return false;
  });
}

function readWork(path: string): Array<{ title: string }> | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as Array<{ title: string }>;
  } catch {
    // A rebuild caught mid-write. The caller is polling; it will read it again.
    return null;
  }
}

/**
 * `npm run dev` is where an author first meets a bad body, so it is where the
 * MDX guards have to bite — and where the whole script, not just velite, has to
 * report the failure. Velite's --strict is what turns a reported issue into a
 * non-zero exit; without it velite prints the rejection, exits 0, and writes a
 * work.json with the offending entry dropped, so the write-up disappears from
 * the dev site and nothing fails. That is the same silent failure
 * remark-no-esm was written to eliminate, wearing a new costume.
 */
describe("`npm run dev`", () => {
  it("fails, and never starts the dev server, on a body remark-no-esm rejects", async () => {
    const dev = startDev(`${VALID}\nimport Chart from "./chart";\n`);

    const stopped = await Promise.race([
      dev.exited.then(() => true),
      new Promise<false>((resolve) => setTimeout(() => resolve(false), 60_000)),
    ]);
    expect(stopped, `the dev script kept running after a rejected body:\n${dev.output()}`)
      .toBe(true);

    const { status } = await dev.exited;
    expect(status, `the dev script reported success on a rejected body:\n${dev.output()}`)
      .not.toBe(0);
    expect(dev.output()).toMatch(/import Chart from/);
    expect(
      readWork(dev.workJson),
      `a work.json was written with the rejected write-up silently missing:\n${dev.output()}`,
    ).toBe(null);
    // The whole point of failing here is that the author sees it. A dev server
    // that started anyway would serve the last good content indefinitely, with
    // the failure already scrolled off the top of the terminal.
    expect(
      dev.output(),
      `the dev server started even though the content build failed:\n${dev.output()}`,
    ).not.toMatch(NEXT_STARTED);
  }, 90_000);

  it("builds a valid body, starts the dev server, and rebuilds on an edit", async () => {
    const dev = startDev(VALID);

    expect(
      await waitFor(() => readWork(dev.workJson)?.length === 1),
      `no work.json was written:\n${dev.output()}`,
    ).toBe(true);
    expect(
      await waitFor(() => dev.output().includes(NEXT_STARTED)),
      `the dev server never started:\n${dev.output()}`,
    ).toBe(true);

    // The watcher is the point of the dev loop, and it is the half the `&`
    // operators put at risk. Two things have to hold: it has to arm, and an
    // edit has to reach work.json — or the author changes a write-up and the
    // dev site keeps serving the old one forever.
    expect(
      await waitUntilWatcherArmed(dev),
      `the watcher never armed:\n${dev.output()}`,
    ).toBe(true);

    writeFileSync(dev.source, frontmatter("An edited write-up"));
    expect(
      await waitFor(
        () => readWork(dev.workJson)?.[0]?.title === "An edited write-up",
        // Generous next to the ~10ms a rebuild takes, and tight enough that a
        // watcher which stopped delivering fails the run rather than stalling
        // it. Arming is already proven by this point, so nothing here is
        // waiting on a race.
        20_000,
      ),
      `the watcher never rebuilt after an edit:\n${dev.output()}`,
    ).toBe(true);

    dev.kill();
    const { signal } = await dev.exited;
    expect(signal, `the dev script exited on its own:\n${dev.output()}`).toBe("SIGKILL");
  }, 90_000);
});
