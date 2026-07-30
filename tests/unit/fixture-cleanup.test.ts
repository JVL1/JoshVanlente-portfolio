import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { clearFixtureScratchDirectory } from "../helpers/clear-fixtures";

describe("fixture scratch cleanup", () => {
  it("removes a stale fixture directory", () => {
    const directory = mkdtempSync(join(tmpdir(), "portfolio-fixture-cleanup-"));
    writeFileSync(join(directory, "stale.txt"), "left by a killed test run");

    clearFixtureScratchDirectory(directory);

    expect(existsSync(directory)).toBe(false);
  });
});
