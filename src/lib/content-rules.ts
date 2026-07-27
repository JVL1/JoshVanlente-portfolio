import { profile, type HeadlineOutcome, type Role } from "@/data/profile";

type Rawish = {
  slug: string;
  draft: boolean;
  publishedAt: string;
  roleId?: string;
  org?: string;
  role?: string;
};

/** Drop drafts and sort newest first. The only place drafts are filtered. */
export function filterPublished<
  T extends { draft: boolean; publishedAt: string },
>(items: T[]): T[] {
  return items
    .filter((i) => !i.draft)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/**
 * Employed work carries a roleId that resolves org and title from profile.ts,
 * so the two can't drift. Independent work supplies them literally.
 */
export function resolveRole(
  item: Pick<Rawish, "slug" | "roleId" | "org" | "role">,
): { org: string; role: string } {
  if (item.roleId) {
    const match: Role | undefined = profile.roles.find(
      (r) => r.id === item.roleId,
    );
    if (!match) {
      throw new Error(
        `content/work/${item.slug}.mdx: field 'roleId' is "${item.roleId}", which matches no role id in ` +
          `src/data/profile.ts. Known ids: ${profile.roles.map((r) => r.id).join(", ")}`,
      );
    }
    return { org: match.org, role: match.title };
  }
  if (item.org && item.role) return { org: item.org, role: item.role };
  throw new Error(
    `content/work/${item.slug}.mdx: needs either 'roleId' or both 'org' and 'role'`,
  );
}

/**
 * The loader reports problems as content/work/<slug>.mdx, so a slug that does
 * not match its filename would make every error message name a file that does
 * not exist. Requiring the match also means renaming a file fails the build
 * loudly rather than silently changing a live URL.
 */
export function assertFilenamesMatchSlugs(
  items: { slug: string; sourcePath: string }[],
): void {
  // Compare PER ENTRY, not set-to-set. A set comparison would accept a.mdx
  // declaring slug "b" while b.mdx declares slug "a" — the two sets are equal
  // and both URLs are silently wrong. sourcePath comes from s.path() in the
  // schema, so each entry carries the file it was actually parsed from.
  // s.path() STRIPS the extension: a file at content/work/a.mdx arrives as
  // "work/a", not "work/a.mdx". Verified against velite 0.4.0 during Task 5's
  // review. So the stem needs no .replace(), and the error message has to append
  // the extension itself — otherwise it names content/work/a, a path that does
  // not exist, which is the exact failure this rule was written to prevent.
  for (const { slug, sourcePath } of items) {
    const stem = sourcePath.split("/").pop()!;
    if (stem !== slug) {
      throw new Error(
        `content/${sourcePath}.mdx: filename does not match its declared slug "${slug}". ` +
          `Rename the file to ${slug}.mdx, or change the slug to "${stem}".`,
      );
    }
  }
}

/** Every non-empty headlineOutcome.slug must resolve to a published write-up. */
export function assertHeadlineSlugs(
  outcomes: HeadlineOutcome[],
  published: { slug: string }[],
): void {
  const slugs = new Set(published.map((i) => i.slug));
  for (const o of outcomes) {
    if (o.slug && !slugs.has(o.slug)) {
      throw new Error(
        `src/data/profile.ts: field 'headlineOutcomes' has slug "${o.slug}" (metric "${o.metric}"), ` +
          `which is not a published write-up. Published: ${[...slugs].join(", ") || "none"}`,
      );
    }
  }
}
