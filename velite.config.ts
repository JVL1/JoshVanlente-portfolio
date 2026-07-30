import { defineConfig, s } from "velite";
import { basename, dirname, resolve, sep } from "node:path";
import rehypeFigureParagraph from "./src/lib/mdx/rehype-figure-paragraph";
import rehypeImageDimensions from "./src/lib/mdx/rehype-image-dimensions";
import remarkNoEsm from "./src/lib/mdx/remark-no-esm";

/**
 * Read a path override, refusing a defined-but-empty value.
 *
 * `process.env.X ?? fallback` returns "" for a variable that is set but empty,
 * because "" is not nullish. Velite then computes `resolve(cwd, "")`, which is
 * the repo root — and `velite build --clean` runs a recursive force-delete of
 * that directory and exits 0. An exported blank shell variable, a CI `env:`
 * block with an empty value, or a `.env` line reading `VELITE_ASSETS_DIR=` is
 * enough to erase the checkout.
 *
 * Falling back on empty would be safe but silent. An empty override is always a
 * mistake, so it throws and names itself.
 */
const CLEANED_OUTPUT_ENV = new Set([
  "VELITE_OUTPUT_DIR",
  "VELITE_ASSETS_DIR",
]);

export function pathFromEnv(
  name: string,
  fallback: string,
  override = process.env[name],
  fixtureRootOverride = process.env.VELITE_FIXTURE_ROOT,
  contentRootOverride = process.env.VELITE_CONTENT_ROOT,
): string {
  const value = override;
  if (value === undefined) return fallback;
  if (value.trim() === "") {
    throw new Error(
      `${name} is set but empty. Unset it to use the default ("${fallback}"), ` +
        `or give it a real path — an empty value resolves to the repository ` +
        `root, which --clean would then delete.`,
    );
  }

  // These two paths are recursively removed by `velite build --clean`. Their
  // environment overrides exist only for fixture suites. A fixture names its
  // root explicitly, uses that same directory as its content root, and keeps
  // every cleanable output below it. Requiring all three facts lets the
  // dev-loop fixture change cwd safely without making a broad value such as
  // "." or "public" legal in the repository.
  if (CLEANED_OUTPUT_ENV.has(name)) {
    const base = resolve(process.cwd());
    const target = resolve(base, value);
    const defaultTarget = resolve(base, fallback);
    const fixtureRoot = fixtureRootOverride
      ? resolve(base, fixtureRootOverride)
      : null;
    const contentRoot = contentRootOverride
      ? resolve(base, contentRootOverride)
      : null;
    const isNamedFixture =
      fixtureRoot !== null && /^(?:fixture|devloop)-/.test(basename(fixtureRoot));
    const fixtureParent = fixtureRoot ? dirname(fixtureRoot) : null;
    const isTestFixture =
      fixtureParent !== null &&
      basename(fixtureParent) === ".tmp" &&
      basename(dirname(fixtureParent)) === "tests";
    const isFixtureTarget =
      fixtureRoot !== null &&
      contentRoot === fixtureRoot &&
      isNamedFixture &&
      isTestFixture &&
      target.startsWith(fixtureRoot + sep);

    if (target !== defaultTarget && !isFixtureTarget) {
      throw new Error(
        `${name} may only resolve to its default ("${fallback}") or below ` +
          `the explicit VELITE_FIXTURE_ROOT used as VELITE_CONTENT_ROOT; ` +
          `received "${value}". Velite deletes this path recursively when ` +
          `--clean is present.`,
      );
    }
  }

  return value;
}

const dateOnly = s
  .string()
  .refine(
    (value) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const parsed = new Date(`${value}T00:00:00.000Z`);
      return (
        Number.isFinite(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value
      );
    },
    "must be a real calendar date in YYYY-MM-DD format",
  )
  .transform((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    // Zod still runs transforms after a failed refinement. Preserve the bad
    // input long enough for Velite to print the field-level schema issue rather
    // than replacing it with an anonymous RangeError from toISOString().
    return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : value;
  });

const outcome = s
  .object({
    metric: s.string().min(1),
    label: s.string().min(1),
  })
  .strict();

export default defineConfig({
  // The fixture suite points the real config at a throwaway content tree.
  root: pathFromEnv("VELITE_CONTENT_ROOT", "content"),
  output: {
    data: pathFromEnv("VELITE_OUTPUT_DIR", ".velite"),
    // Redirecting assets is what keeps a fixture build's --clean away from the
    // site's generated output. It is the only guard; see the note on `clean`.
    assets: pathFromEnv("VELITE_ASSETS_DIR", "public/static"),
    base: "/static/",
    // Programmatic default only — the CLI always overrides it. velite's cli
    // declares `clean` with `default: false`, so options.clean is always a
    // boolean and this value never survives the merge. `velite build --clean`
    // therefore cleans regardless of what is written here, which is why the
    // env redirection above carries the whole burden of protecting real output.
    clean: false,
  },
  collections: {
    work: {
      name: "Work",
      pattern: "work/*.mdx",
      schema: s
        .object({
          slug: s.slug("work"),
          title: s.string().min(1).max(160),
          summary: s.string().min(1).max(300),
          publishedAt: dateOnly,
          updatedAt: dateOnly.optional(),

          // Exactly one of: roleId, or the org/role pair. Refined below.
          roleId: s.string().min(1).optional(),
          org: s.string().min(1).optional(),
          role: s.string().min(1).optional(),

          timeframe: s.string().min(1),
          tags: s.array(s.string().min(1)).min(1),
          outcomes: s.array(outcome).min(1),
          cover: s.image(),
          draft: s.boolean().default(false),
          // Body images are absolute /images/... paths, which s.image() never
          // sees. The plugin resolves each against public/ and stamps intrinsic
          // dimensions so next/image can reserve space for it.
          code: s.mdx({
            // The body is evaluated synchronously in a Server Component, and an
            // import compiles to a top-level await that evaluator cannot run.
            // Rejecting it here turns a render-time crash into a build failure
            // that names the file.
            remarkPlugins: [remarkNoEsm],
            // A paragraph holding nothing but an image is marked here rather
            // than matched in CSS, because deciding it needs the text nodes
            // beside the image and `:only-child` cannot see them. Prose selects
            // the marker.
            rehypePlugins: [
              [rehypeImageDimensions, { dir: "public" }],
              rehypeFigureParagraph,
            ],
          }),
          // The loader compares this path with the authored slug per entry.
          sourcePath: s.path(),
        })
        .strict()
        .superRefine((data, context) => {
          const hasRoleId = Boolean(data.roleId);
          const hasLiteral = Boolean(data.org && data.role);

          // `fatal` is what makes this an error rather than an info. Without it
          // velite prints the pairing as info and still writes the record to
          // work.json, so anything reading that file gets a write-up carrying
          // both a roleId and a contradicting org — the two sources of truth
          // roleId exists to collapse. Every script here passes --strict, which
          // fails the build on an info as readily as on an error, so `fatal` is
          // about what lands in work.json rather than about the exit code.
          if (hasRoleId === hasLiteral) {
            context.addIssue({
              fatal: true,
              code: "custom",
              path: ["roleId"],
              message:
                "supply exactly one of roleId (employed work, resolves org and " +
                "title from src/data/profile.ts) or the org/role pair (independent work)",
            });
          }

          // A half-pair is not "no literal pair". Boolean(org && role) is false
          // when exactly one is present, so `roleId` plus a stray `org` used to
          // look identical to roleId alone and was accepted — leaving the orphan
          // in work.json, where it contradicts the org the loader derives from
          // profile.ts. Two sources of truth for one field is the exact drift
          // roleId exists to prevent.
          if (hasRoleId && (data.org || data.role)) {
            context.addIssue({
              fatal: true,
              code: "custom",
              path: [data.org ? "org" : "role"],
              message:
                "roleId already supplies org and role from src/data/profile.ts; " +
                "remove the literal value rather than stating it twice",
            });
          }
        }),
    },
  },
});
