import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { pathFromEnv } from "../../velite.config";

// Resolved from this file, not the launching shell's cwd. With process.cwd()
// a run started from a subdirectory failed 7/7 with ENOENT on the fixture PNG
// and created fixture trees at <repo>/src/tests/.tmp/, inside the tracked
// source tree and outside .gitignore's reach. Vitest forks inherit that cwd.
const REPO = fileURLToPath(new URL("../../", import.meta.url));
const VELITE = join(REPO, "node_modules", ".bin", "velite");
const FIXTURE_COVER = join(REPO, "tests", "fixtures", "schema", "cover.png");

// There is deliberately no ENV_ERROR regex here. The previous version matched
// against the child's stdout and stderr, which a spawn failure leaves undefined
// — so the string it inspected was always "" and the guard could never fire on
// the failure it was written for. buildWith now throws with the real reason
// from `err.message` instead, and expectSchemaFailure proves a schema run
// happened rather than trying to enumerate the ways one might not have.

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
 * Frontmatter variants are written out in full rather than regex-patched.
 * A regex like /outcomes:\n(  - .*\n)+/ matches the two-space "- metric:" line
 * but not the four-space "label:" line under it, so it would leave an orphaned
 * key and test YAML parsing instead of the schema rule.
 */
function withoutField(field: string): string {
  const lines = VALID.split("\n");
  const start = lines.findIndex((line) => line.startsWith(`${field}:`));
  if (start === -1) throw new Error(`fixture has no field '${field}'`);

  let end = start + 1;
  while (
    end < lines.length &&
    /^\s+/.test(lines[end]) &&
    lines[end].trim() !== ""
  ) {
    end++;
  }

  return [...lines.slice(0, start), ...lines.slice(end)].join("\n");
}

const dirs: string[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

/** Run the real velite.config.ts against a throwaway content root. */
function buildWith(files: Record<string, string>) {
  // This stays inside the repo so Node resolution reaches the real node_modules.
  mkdirSync(join(REPO, "tests", ".tmp"), { recursive: true });
  const root = mkdtempSync(join(REPO, "tests", ".tmp", "fixture-"));
  dirs.push(root);
  mkdirSync(join(root, "work"), { recursive: true });

  // Velite reports paths relative to cwd for a fixture inside the repo, so the
  // absolute root never appears in the output. The basename does, and its
  // random suffix is unique per call — which is what makes it unforgeable.
  const fixtureId = basename(root);

  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(root, "work", name), body);
  }

  // s.image() needs a real file to parse, so fixtures reuse this committed PNG.
  copyFileSync(FIXTURE_COVER, join(root, "work", "cover.png"));

  const env = {
    ...process.env,
    VELITE_CONTENT_ROOT: root,
    VELITE_OUTPUT_DIR: join(root, ".velite-out"),
    // Redirect assets too so a fixture build cannot clean public/static.
    // Removing this line deletes real output on every test run; the "fixture
    // isolation" test above is the only thing that notices. Verified.
    VELITE_ASSETS_DIR: join(root, ".assets-out"),
  };

  try {
    execFileSync(VELITE, ["build", "--clean", "--strict"], {
      cwd: REPO,
      encoding: "utf8",
      stdio: "pipe",
      env,
    });
    return { status: 0, stderr: "", fixtureId };
  } catch (error: unknown) {
    const result = error as {
      status?: number | null;
      signal?: string | null;
      code?: string;
      message?: string;
      stderr?: string | Buffer;
      stdout?: string | Buffer;
    };

    // When execFileSync fails to spawn at all, Node leaves stdout and stderr
    // undefined and puts the reason on `message` alone. Returning a result here
    // would hand every assertion an empty string, which passes the "not an
    // environment error" check and then fails on the field regex — sending the
    // reader hunting through the schema for a missing binary.
    if (result.stdout === undefined && result.stderr === undefined) {
      throw new Error(
        `could not run ${VELITE} (${result.code}): ${result.message}`,
      );
    }

    // A signal kill leaves `status` null, which `?? 1` would disguise as an
    // ordinary rejection. Velite prints the file and field before its final
    // line, so a kill in that window leaves output satisfying every assertion.
    if (result.signal) {
      throw new Error(
        `velite was killed by ${result.signal}; partial output:\n` +
          `${result.stderr ?? ""}${result.stdout ?? ""}`,
      );
    }

    return {
      status: result.status ?? 1,
      stderr: `${result.stderr ?? ""}${result.stdout ?? ""}`,
      fixtureId,
    };
  }
}

/** Assert a real schema rejection, including its field and runtime health. */
function expectSchemaFailure(
  result: { status: number; stderr: string; fixtureId: string },
  ...expected: RegExp[]
) {
  expect(result.status, "expected a non-zero exit").not.toBe(0);

  // Proof that velite got past config load, flag parsing, and MDX compilation.
  // Verified against velite 0.4.0: every genuine rejection ends with this line,
  // and no config-load failure, unknown-flag error, or YAML parse error does.
  expect(
    result.stderr,
    `velite failed before schema validation:\n${result.stderr}`,
  ).toContain("Schema validation failed");

  // Proof the report is about THIS fixture tree. The mkdtemp suffix is unique
  // per call and nothing in the config can echo it. Velite prints the path
  // relative to cwd for a fixture inside the repo, so match the basename.
  expect(
    result.stderr,
    `velite never read fixture ${result.fixtureId}:\n${result.stderr}`,
  ).toContain(result.fixtureId);

  // Field names are matched only inside the issue report. A config syntax error
  // makes esbuild echo the offending source line, and velite.config.ts contains
  // the literal words slug, outcomes, and roleId — so an unscoped match lets a
  // broken config forge the exact tokens these tests look for. Verified: before
  // this change, turning `s.slug("work")` into `s.slug("work"]` left both slug
  // tests green while nothing was validated.
  const issues = result.stderr.slice(result.stderr.indexOf(result.fixtureId));
  for (const pattern of expected) {
    expect(issues).toMatch(pattern);
  }
}

describe("fixture isolation", () => {
  // The single highest-value assertion in this file. Every fixture build runs
  // `velite build --clean`, and velite resolves output.assets against the repo
  // root — so if the VELITE_ASSETS_DIR redirection is ever dropped, or receives
  // an empty string, --clean deletes real output and the run still exits 0. The
  // schema tests would stay green throughout, because they only read stderr.
  //
  // A sentinel is the only thing that notices. This also covers the empty-string
  // case: with assets resolving to the repo root, this file would be deleted.
  it("cannot touch the site's generated output", () => {
    const sentinelDir = join(REPO, "public", "static");
    const sentinel = join(sentinelDir, "__isolation_sentinel.txt");
    const contents = `written by ${basename(import.meta.url)}`;

    mkdirSync(sentinelDir, { recursive: true });
    writeFileSync(sentinel, contents);

    try {
      // A rejection, so the build reaches --clean and then fails. Either
      // outcome is fine; what matters is what survives.
      buildWith({ "valid-item.mdx": withoutField("outcomes") });

      expect(
        existsSync(sentinel),
        "a fixture build deleted public/static — the assets redirection is not holding",
      ).toBe(true);
      expect(readFileSync(sentinel, "utf8")).toBe(contents);
    } finally {
      rmSync(sentinel, { force: true });
    }
  });
});

describe("content schema, under --strict", () => {
  it("accepts a valid write-up", () => {
    const result = buildWith({ "valid-item.mdx": VALID });
    expect(result.status, result.stderr).toBe(0);
  });

  it("rejects a missing 'outcomes', naming the file and the field", () => {
    expectSchemaFailure(
      buildWith({ "valid-item.mdx": withoutField("outcomes") }),
      /valid-item\.mdx/,
      /outcomes/,
    );
  });

  it("rejects an empty 'outcomes' array", () => {
    expectSchemaFailure(
      buildWith({
        "valid-item.mdx": withoutField("outcomes").replace(
          "tags:",
          "outcomes: []\ntags:",
        ),
      }),
      /outcomes/,
    );
  });

  it("rejects a missing 'slug'", () => {
    expectSchemaFailure(
      buildWith({ "valid-item.mdx": withoutField("slug") }),
      /slug/,
    );
  });

  it("rejects an unknown top-level frontmatter key", () => {
    expectSchemaFailure(
      buildWith({
        "valid-item.mdx": VALID.replace(
          'draft: false',
          'draft: false\ndrfat: true',
        ),
      }),
      /drfat/,
    );
  });

  it("rejects an unknown key inside an outcome", () => {
    expectSchemaFailure(
      buildWith({
        "valid-item.mdx": VALID.replace(
          '    label: "Something real"',
          '    label: "Something real"\n    attribution: "Untracked"',
        ),
      }),
      /attribution/,
    );
  });

  it.each(["2025-02-30", "3/4/2025", "2025-13-01"])(
    "rejects publishedAt %s as something other than a real YYYY-MM-DD date",
    (publishedAt) => {
      expectSchemaFailure(
        buildWith({
          "valid-item.mdx": VALID.replace(
            'publishedAt: "2026-01-01"',
            `publishedAt: "${publishedAt}"`,
          ),
        }),
        /publishedAt/,
      );
    },
  );

  it("rejects two write-ups sharing a slug", () => {
    // Both files declare slug "valid-item"; one filename must differ to exist.
    // The pattern deliberately excludes the bare word "slug": an ordinary
    // `Required  slug` message contains it, so matching on it would prove only
    // that the field was mentioned, not that the uniqueness check ran.
    expectSchemaFailure(
      buildWith({ "valid-item.mdx": VALID, "other.mdx": VALID }),
      /duplicate|unique|conflicts/i,
    );
  });

  it("rejects both roleId and a literal org/role pair", () => {
    expectSchemaFailure(
      buildWith({
        "valid-item.mdx": VALID.replace(
          'roleId: "evernest-staff-pm"\n',
          'roleId: "evernest-staff-pm"\norg: "Somewhere"\nrole: "Consultant"\n',
        ),
      }),
      /roleId/,
    );
  });

  it("rejects neither roleId nor an org/role pair", () => {
    expectSchemaFailure(
      buildWith({ "valid-item.mdx": withoutField("roleId") }),
      /roleId/,
    );
  });

  // The attribution rule has eight input combinations and the original suite
  // covered two: all three fields, and none. The four below cover the rest that
  // matter, including the one the rule got wrong.

  it("accepts independent work, which supplies org and role and no roleId", () => {
    // The whole point of the org/role branch, and it had no test at all — a
    // regression that broke independent work would have shipped silently.
    const result = buildWith({
      "valid-item.mdx": withoutField("roleId").replace(
        'timeframe: "2026"',
        'org: "Self"\nrole: "Consultant"\ntimeframe: "2026"',
      ),
    });
    expect(result.status, result.stderr).toBe(0);
  });

  it("rejects roleId alongside a stray 'org' with no 'role'", () => {
    // Boolean(org && role) reads a half-pair as "no literal pair", so this used
    // to be accepted and the orphaned org landed in work.json — contradicting
    // the org the loader derives from profile.ts for the same entry.
    expectSchemaFailure(
      buildWith({
        "valid-item.mdx": VALID.replace(
          'roleId: "evernest-staff-pm"\n',
          'roleId: "evernest-staff-pm"\norg: "Somewhere Else Entirely"\n',
        ),
      }),
      /org/,
    );
  });

  it("rejects roleId alongside a stray 'role' with no 'org'", () => {
    expectSchemaFailure(
      buildWith({
        "valid-item.mdx": VALID.replace(
          'roleId: "evernest-staff-pm"\n',
          'roleId: "evernest-staff-pm"\nrole: "Consultant"\n',
        ),
      }),
      /role/,
    );
  });

  // MDXContent evaluates each compiled body with `new Function`, which is
  // synchronous. An `import` makes MDX emit a top-level `await import(...)`, so
  // the body compiles clean, ships, and then throws "await is only valid in
  // async functions" during a server render — naming neither MDX nor the file it
  // came from. The build has to be where that stops.
  it("rejects an MDX body containing an import, naming the file", () => {
    const result = buildWith({
      "valid-item.mdx": `${VALID}\nimport Chart from "./chart";\n`,
    });
    expect(result.status, result.stderr).not.toBe(0);
    expect(result.stderr).toMatch(/valid-item\.mdx/);
    expect(result.stderr).toMatch(/import Chart from/);
  });

  it("rejects a half-pair on its own, with no roleId", () => {
    expectSchemaFailure(
      buildWith({
        "valid-item.mdx": withoutField("roleId").replace(
          'timeframe: "2026"',
          'org: "Self"\ntimeframe: "2026"',
        ),
      }),
      /roleId/,
    );
  });
});

describe("Velite output path overrides", () => {
  it.each([".", "public", "src", "../outside"])(
    "rejects %s before --clean can target authored files",
    (value) => {
      expect(() =>
        pathFromEnv("VELITE_OUTPUT_DIR", ".velite", value),
      ).toThrow(/VELITE_OUTPUT_DIR/);
    },
  );

  it("allows a fixture output below tests/.tmp", () => {
    expect(
      pathFromEnv(
        "VELITE_OUTPUT_DIR",
        ".velite",
        join(REPO, "tests", ".tmp", "fixture-safe", ".velite-out"),
      ),
    ).toContain(join("tests", ".tmp", "fixture-safe", ".velite-out"));
  });
});
