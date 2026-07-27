import { defineConfig, s } from "velite";

const outcome = s.object({
  metric: s.string().min(1),
  label: s.string().min(1),
});

export default defineConfig({
  // The fixture suite points the real config at a throwaway content tree.
  root: process.env.VELITE_CONTENT_ROOT ?? "content",
  output: {
    data: process.env.VELITE_OUTPUT_DIR ?? ".velite",
    // Redirecting assets keeps fixture cleanup away from the site's output.
    assets: process.env.VELITE_ASSETS_DIR ?? "public/static",
    base: "/static/",
    // Build scripts opt into cleaning. Tests can regenerate data without
    // deleting assets or racing the watcher used by `npm run dev`.
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

          // Each entry uses roleId or a literal org and role pair.
          roleId: s.string().min(1).optional(),
          org: s.string().min(1).optional(),
          role: s.string().min(1).optional(),

          timeframe: s.string().min(1),
          tags: s.array(s.string().min(1)).min(1),
          outcomes: s.array(outcome).min(1),
          cover: s.image(),
          draft: s.boolean().default(false),
          code: s.mdx(),
          // The loader compares this path with the authored slug per entry.
          sourcePath: s.path(),
        })
        .superRefine((data, context) => {
          const hasRoleId = Boolean(data.roleId);
          const hasLiteral = Boolean(data.org && data.role);

          if (hasRoleId === hasLiteral) {
            context.addIssue({
              code: "custom",
              path: ["roleId"],
              message:
                "field 'roleId': supply exactly one of roleId (employed work, resolves org and " +
                "title from src/data/profile.ts) or the org/role pair (independent work)",
            });
          }
        }),
    },
  },
});
