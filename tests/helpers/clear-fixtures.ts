import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const fixtureScratchDirectory = fileURLToPath(
  new URL("../.tmp", import.meta.url),
);

export function clearFixtureScratchDirectory(
  directory = fixtureScratchDirectory,
) {
  rmSync(directory, { recursive: true, force: true });
}
