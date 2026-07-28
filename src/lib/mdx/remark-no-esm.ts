import { visit } from "unist-util-visit";

/**
 * The shape this plugin reads off an mdast node. Declared locally rather than
 * imported from `mdast`, for the reason rehype-image-dimensions.ts records:
 * velite.config.ts bundles this file with esbuild, so its import list stays
 * short.
 */
type MdastNode = {
  type: string;
  value?: string;
  data?: { estree?: unknown };
  attributes?: unknown[];
};

/** The vfile remark hands a transformer. Only the path is read. */
type VFileLike = { path?: string };

/**
 * Walk an ESTree looking for the two node types that make an MDX expression
 * reach outside the body: `import(...)` and `import.meta`. Reading the tree
 * rather than matching the source text is what keeps a body that merely writes
 * the word "import" inside a string from failing the build.
 */
function reachesOutward(estree: unknown): boolean {
  const seen = new Set<unknown>();

  const walk = (node: unknown): boolean => {
    if (!node || typeof node !== "object" || seen.has(node)) return false;
    seen.add(node);

    if (Array.isArray(node)) return node.some(walk);

    const { type } = node as { type?: string };
    if (type === "ImportExpression" || type === "MetaProperty") return true;

    return Object.values(node as Record<string, unknown>).some(walk);
  };

  return walk(estree);
}

/**
 * Reject ESM and outward references in an MDX body.
 *
 * MDXContent evaluates each compiled body with `new Function`, which keeps the
 * MDX runtime out of the browser bundle and is the architectural decision Task 9
 * exists to make. `new Function` builds a plain synchronous function, and MDX's
 * function-body output breaks against that in two independent ways.
 *
 * `import` and `export … from` compile to a top-level `await import(...)`, so
 * constructing the function throws `SyntaxError: await is only valid in async
 * functions` — a message naming neither MDX nor the file the author edited.
 *
 * `import.meta` and a dynamic `import(...)` written inside an MDX *expression*
 * compile with no await at all, so `new Function` accepts them; MDX emits a
 * `_importMetaUrl` guard instead, which throws `Unexpected missing
 * options.baseUrl …` during the server render. Those expressions parse to
 * `mdxFlowExpression`, `mdxTextExpression`, and JSX attribute values rather than
 * to `mdxjsEsm`, so checking the ESM node type alone leaves this half of the
 * crash exactly where it was.
 *
 * A plain `export const` is the one form that genuinely works: it compiles to a
 * `const` and evaluates fine. It is refused anyway, because the MDX registry is
 * the single source of the components a write-up may use and frontmatter is the
 * single source of its metadata. That refusal is policy; the rest is mechanism.
 *
 * Velite compiles all of these without complaint, so `velite build --strict`,
 * the tests, typecheck, and `next build` all pass and the crash waits for a
 * server render. Throwing here converts it into a build failure that names the
 * file and quotes every offending line at once.
 */
export default function remarkNoEsm() {
  return (tree: unknown, file?: VFileLike) => {
    const offences: string[] = [];

    const checkExpression = (node: MdastNode) => {
      const estree = node.data?.estree;
      const outward = estree
        ? reachesOutward(estree)
        : /\bimport\s*\.\s*meta\b|\bimport\s*\(/.test(node.value ?? "");
      if (outward) offences.push((node.value ?? "").trim());
    };

    visit(tree as never, (node: unknown) => {
      const candidate = node as MdastNode;

      if (candidate.type === "mdxjsEsm") {
        offences.push((candidate.value ?? "").trim());
        return;
      }

      if (
        candidate.type === "mdxFlowExpression" ||
        candidate.type === "mdxTextExpression"
      ) {
        checkExpression(candidate);
        return;
      }

      // An attribute hangs off its element rather than sitting in `children`,
      // so the walk never reaches one on its own: `<span title={import.meta.url}>`
      // is invisible to every visitor except this branch.
      if (
        candidate.type === "mdxJsxFlowElement" ||
        candidate.type === "mdxJsxTextElement"
      ) {
        for (const attribute of candidate.attributes ?? []) {
          const value = (attribute as { value?: unknown }).value as
            | MdastNode
            | undefined;
          if (value?.type === "mdxJsxAttributeValueExpression") checkExpression(value);
        }
      }
    });

    if (offences.length === 0) return;

    // The first line carries no trailing colon: Velite appends the field name
    // to it when it prints an issue, which would leave the colon stranded
    // mid-sentence and push the quoted source outside the indented block.
    const where = file?.path ?? "an MDX body";
    throw new Error(
      `remark-no-esm: ${where} cannot import or export\n\n` +
        offences.map((offence) => `  ${offence}`).join("\n") +
        "\n\nThe body is evaluated synchronously on the server. Use a component " +
        "from src/components/mdx/registry.tsx instead, adding it there if it " +
        "does not exist yet, and put metadata in frontmatter.",
    );
  };
}
