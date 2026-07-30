import { ESLint } from "eslint";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const REPO = fileURLToPath(new URL("../../", import.meta.url));

describe("the content import boundary", () => {
  it("rejects representative static and dynamic #content imports outside the loader", async () => {
    const eslint = new ESLint({ cwd: REPO });

    const staticImports = [
      "src/app/forbidden.ts",
      "src/app/forbidden.js",
      "src/app/forbidden.jsx",
      "src/app/forbidden.mjs",
      "src/app/forbidden.mts",
      "scripts/forbidden.ts",
      "scripts/forbidden.mjs",
    ];

    for (const filePath of staticImports) {
      const [result] = await eslint.lintText(
        'import { work } from "#content";\n',
        { filePath },
      );

      expect(result?.messages.map((message) => message.ruleId)).toContain(
        "no-restricted-imports",
      );
    }

    const dynamicImports = ["src/app/forbidden.ts", "src/app/forbidden.js"];
    for (const filePath of dynamicImports) {
      const [result] = await eslint.lintText(
        'async function load() { return import("#content"); }\n',
        { filePath },
      );

      expect(result?.messages.map((message) => message.ruleId)).toContain(
        "no-restricted-syntax",
      );
    }

    const [staticLoader] = await eslint.lintText(
      'import { work } from "#content";\n',
      { filePath: "src/lib/content.ts" },
    );
    const [dynamicLoader] = await eslint.lintText(
      'async function load() { return import("#content"); }\n',
      { filePath: "src/lib/content.ts" },
    );

    expect(staticLoader?.messages.map((message) => message.ruleId)).not.toContain(
      "no-restricted-imports",
    );
    expect(dynamicLoader?.messages.map((message) => message.ruleId)).not.toContain(
      "no-restricted-syntax",
    );
  });
});
