import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const REPO = process.cwd();
const VELITE = join(REPO, "node_modules", ".bin", "velite");

// Environment failures must never be mistaken for schema failures.
const ENV_ERROR =
  /Cannot find module|command not found|ENOENT|MODULE_NOT_FOUND|is not recognized/i;

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

  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(root, "work", name), body);
  }

  // s.image() needs a real file to parse, so fixtures reuse this committed PNG.
  copyFileSync(
    "tests/fixtures/schema/cover.png",
    join(root, "work", "cover.png"),
  );

  const env = {
    ...process.env,
    VELITE_CONTENT_ROOT: root,
    VELITE_OUTPUT_DIR: join(root, ".velite-out"),
    // Redirect assets too so a fixture build cannot clean public/static.
    VELITE_ASSETS_DIR: join(root, ".assets-out"),
  };

  try {
    execFileSync(VELITE, ["build", "--clean", "--strict"], {
      cwd: REPO,
      encoding: "utf8",
      stdio: "pipe",
      env,
    });
    return { status: 0, stderr: "" };
  } catch (error: unknown) {
    const result = error as {
      status?: number;
      stderr?: string | Buffer;
      stdout?: string | Buffer;
    };
    return {
      status: result.status ?? 1,
      stderr: `${result.stderr ?? ""}${result.stdout ?? ""}`,
    };
  }
}

/** Assert a real schema rejection, including its field and runtime health. */
function expectSchemaFailure(
  result: { status: number; stderr: string },
  ...expected: RegExp[]
) {
  expect(result.status, "expected a non-zero exit").not.toBe(0);
  expect(
    result.stderr,
    `environment error masquerading as a schema failure:\n${result.stderr}`,
  ).not.toMatch(ENV_ERROR);
  for (const pattern of expected) {
    expect(result.stderr).toMatch(pattern);
  }
}

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

  it("rejects two write-ups sharing a slug", () => {
    // Both files declare slug "valid-item"; one filename must differ to exist.
    expectSchemaFailure(
      buildWith({ "valid-item.mdx": VALID, "other.mdx": VALID }),
      /slug|duplicate|unique/i,
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
});
