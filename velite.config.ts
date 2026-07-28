import { defineConfig, s } from "velite";
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
function pathFromEnv(name: string, fallback: string): string {
  const value = process.env[name];
  if (value === undefined) return fallback;
  if (value.trim() === "") {
    throw new Error(
      `${name} is set but empty. Unset it to use the default ("${fallback}"), ` +
        `or give it a real path — an empty value resolves to the repository ` +
        `root, which --clean would then delete.`,
    );
  }
  return value;
}

const outcome = s.object({
  metric: s.string().min(1),
  label: s.string().min(1),
});

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
          publishedAt: s.isodate(),
          updatedAt: s.isodate().optional(),

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
