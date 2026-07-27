import { profile, type HeadlineOutcome, type Role } from "@/data/profile";

type Rawish = {
  slug: string;
  draft: boolean;
  publishedAt: string;
  roleId?: string;
  org?: string;
  role?: string;
};

/**
 * Drop drafts and sort newest first. The only place drafts are filtered.
 *
 * `.filter()` builds a fresh array, so the `.sort()` below rearranges that copy
 * and never the array the caller handed in.
 *
 * The slug tiebreaker is load-bearing rather than tidy. Velite emits items in
 * fast-glob's directory order and never sorts them, and `s.isodate()` normalizes
 * a bare `2026-01-01` to midnight UTC — so any two write-ups dated the same day
 * compare exactly equal. `Array.prototype.sort` is stable, so such a tie would
 * silently inherit directory order, which is byte-sorted on APFS locally and
 * hash-ordered on the ext4 images CI builds on. The same content tree would then
 * render in one order locally and another in production. `s.slug()` enforces
 * uniqueness within the collection, so slug is a total tiebreaker.
 */
export function filterPublished<
  T extends { slug: string; draft: boolean; publishedAt: string },
>(items: T[]): T[] {
  return items
    .filter((i) => !i.draft)
    .sort(
      (a, b) =>
        b.publishedAt.localeCompare(a.publishedAt) ||
        a.slug.localeCompare(b.slug),
    );
}

/**
 * Employed work carries a roleId that resolves org and title from profile.ts,
 * so the two can't drift. Independent work supplies them literally.
 *
 * Precondition: call assertFilenamesMatchSlugs first. The messages below are
 * built as content/work/<slug>.mdx from the slug rather than from sourcePath,
 * so they name a real file only once the slug has been proved to match the
 * filename. Resolving before that check — or calling this from somewhere that
 * skips it — produces errors pointing at files that do not exist, which is the
 * failure assertFilenamesMatchSlugs exists to prevent.
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
 * Resolve every item's org and role, drafts included, and only then drop the
 * drafts.
 *
 * The order is the whole point. A bad roleId in a draft is still a bad
 * reference, and resolving after filtering would let it sit unnoticed until
 * someone flipped the flag and shipped a broken page. The sequence lives here
 * rather than inline in content.ts because content.ts imports #content, so a
 * test of the ordering there would fail at module load instead of on behavior.
 */
export function resolveAndFilter<T extends Rawish>(
  items: T[],
): (T & { org: string; role: string })[] {
  const resolved = items.map((item) => ({ ...item, ...resolveRole(item) }));
  return filterPublished(resolved);
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

/**
 * Every non-empty headlineOutcome.slug must resolve to a published write-up.
 *
 * Passing `all` — every item, drafts included — lets the message separate the
 * two ways a slug fails. Without it a typo and a write-up someone has just
 * marked `draft: true` produce the same "matches no write-up" text, and the
 * draft case is the likelier one: profile.ts already points two headline
 * metrics at write-ups that exist as files today, so the realistic break is
 * someone flipping a flag rather than misspelling a slug.
 */
export function assertHeadlineSlugs(
  outcomes: HeadlineOutcome[],
  published: { slug: string }[],
  all: { slug: string; draft: boolean }[] = [],
): void {
  const slugs = new Set(published.map((i) => i.slug));
  for (const o of outcomes) {
    if (o.slug && !slugs.has(o.slug)) {
      const drafted = all.some((i) => i.slug === o.slug && i.draft);
      const cause = drafted
        ? `exists at content/work/${o.slug}.mdx but is marked 'draft: true'`
        : `matches no write-up. Published: ${[...slugs].join(", ") || "none"}`;
      throw new Error(
        `src/data/profile.ts: field 'headlineOutcomes' has slug "${o.slug}" ` +
          `(metric "${o.metric}"), which ${cause}`,
      );
    }
  }
}
