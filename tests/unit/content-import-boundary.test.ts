import { ESLint } from "eslint";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const REPO = fileURLToPath(new URL("../../", import.meta.url));

describe("the content import boundary", () => {
  it("allows #content only in the content loader", async () => {
    const eslint = new ESLint({ cwd: REPO });

    const [forbidden] = await eslint.lintText(
      'import { work } from "#content";\n',
      { filePath: "src/app/forbidden.ts" },
    );
    const [loader] = await eslint.lintText(
      'import { work } from "#content";\n',
      { filePath: "src/lib/content.ts" },
    );

    expect(forbidden?.messages.map((message) => message.ruleId)).toContain(
      "no-restricted-imports",
    );
    expect(loader?.messages.map((message) => message.ruleId)).not.toContain(
      "no-restricted-imports",
    );
  });
});
