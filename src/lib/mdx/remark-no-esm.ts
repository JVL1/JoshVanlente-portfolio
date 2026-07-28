import { visit } from "unist-util-visit";

/**
 * The shape this plugin reads off an mdast node. Declared locally rather than
 * imported from `mdast`, for the reason rehype-image-dimensions.ts records:
 * velite.config.ts bundles this file with esbuild, so its import list stays
 * short.
 */
type MdastNode = { type: string; value?: string };

/** The vfile remark hands a transformer. Only the path is read. */
type VFileLike = { path?: string };

/**
 * Reject `import` and `export` in an MDX body.
 *
 * MDXContent evaluates each compiled body with `new Function`, which keeps the
 * MDX runtime out of the browser bundle and is the architectural decision Task 9
 * exists to make. `new Function` builds a plain synchronous function. When a
 * body contains ESM, MDX's function-body output emits a top-level
 * `await import(...)` plus a `baseUrl` guard, and constructing that function
 * throws `SyntaxError: await is only valid in async functions` — a message that
 * names neither MDX nor the file the author edited.
 *
 * Velite compiles such a body without complaint, so `velite build --strict`,
 * the tests, typecheck, and `next build` all pass and the crash waits for a
 * server render. Throwing here converts it into a build failure that names the
 * file and quotes the line, the same shape as the missing-image throw in
 * rehype-image-dimensions.ts.
 *
 * A body needs no imports: every component a write-up can use is supplied by
 * the MDX registry, which the evaluator passes in.
 */
export default function remarkNoEsm() {
  return (tree: unknown, file?: VFileLike) => {
    visit(tree as never, "mdxjsEsm", (node: unknown) => {
      const { value = "" } = node as MdastNode;
      const where = file?.path ?? "an MDX body";
      throw new Error(
        `remark-no-esm: ${where} cannot import or export:\n\n` +
          `  ${value.trim()}\n\n` +
          "The body is evaluated synchronously on the server, and ESM compiles " +
          "to a top-level await that a synchronous evaluator cannot run. Use a " +
          "component from src/components/mdx/registry.tsx instead, adding it " +
          "there if it does not exist yet.",
      );
    });
  };
}
