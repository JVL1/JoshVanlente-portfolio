import { work } from "#content";
import { profile, type HeadlineOutcome, type Role } from "@/data/profile";
import {
  assertFilenamesMatchSlugs,
  assertHeadlineSlugs,
  resolveAndFilter,
} from "@/lib/content-rules";

type RawWork = (typeof work)[number];

export type WorkItem = RawWork & { org: string; role: string };
export type ResolvedHeadlineOutcome = HeadlineOutcome & { href: string | null };

// ---------------------------------------------------------------------------
// Module scope: every check below runs the moment anything imports this file.
// Pages, the sitemap, robots, and generateStaticParams all import it, so
// `next build` fails on a bad reference rather than shipping a dead link. The OG
// route is the one build-time consumer that does not: it draws only profile.ts,
// and the build output confirms og/route.js never loads this chunk.
// ---------------------------------------------------------------------------

// Filenames must match slugs, so every error message below names a real file.
// Each entry carries its own sourcePath from s.path(), so this needs no fs read.
assertFilenamesMatchSlugs(work);

// Resolve roles across EVERY item, drafts included, BEFORE filtering. A bad
// roleId in a draft is still a bad reference; validating only what is published
// would let it sit until someone flips the flag and shipped a broken page. The
// sequence lives in content-rules.ts so a test can prove that ordering without
// importing #content.
const published: WorkItem[] = resolveAndFilter(work);

// `work` is passed as well so a headline slug pointing at a real-but-draft
// write-up says so, rather than reading identically to a misspelling.
assertHeadlineSlugs(profile.headlineOutcomes, published, work);

// The getters below hand out copies of the module-level arrays. `published` is
// computed once per worker process and shared by every consumer, so returning it
// directly would let one page's `.sort()`, `.reverse()`, or `.splice()` reorder
// or truncate what the sitemap and generateStaticParams read afterwards. Next
// shards pages across workers, so that corruption would hit some pages and not
// others. The entries themselves are still shared by reference; nothing mutates
// them today, and cloning compiled MDX on every call would cost more than the
// hazard is worth.
export async function getWorkItems(): Promise<WorkItem[]> {
  return published.slice();
}

export async function getWorkItem(slug: string): Promise<WorkItem | null> {
  return published.find((i) => i.slug === slug) ?? null;
}

export async function getAllWorkSlugs(): Promise<string[]> {
  return published.map((i) => i.slug);
}

export async function getHeadlineOutcomes(): Promise<
  ResolvedHeadlineOutcome[]
> {
  return profile.headlineOutcomes.map((o) => ({
    ...o,
    href: o.slug ? `/work/${o.slug}` : null,
  }));
}

export async function getRoles(): Promise<Role[]> {
  return profile.roles.slice();
}
