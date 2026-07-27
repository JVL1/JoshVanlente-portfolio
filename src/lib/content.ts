import { work } from "#content";
import { profile, type HeadlineOutcome, type Role } from "@/data/profile";
import {
  assertFilenamesMatchSlugs,
  assertHeadlineSlugs,
  filterPublished,
  resolveRole,
} from "@/lib/content-rules";

type RawWork = (typeof work)[number];

export type WorkItem = RawWork & { org: string; role: string };
export type ResolvedHeadlineOutcome = HeadlineOutcome & { href: string | null };

// ---------------------------------------------------------------------------
// Module scope: every check below runs the moment anything imports this file.
// Pages, the sitemap, robots, the OG route, and generateStaticParams all import
// it, so `next build` fails on a bad reference rather than shipping a dead link.
// ---------------------------------------------------------------------------

// Filenames must match slugs, so every error message below names a real file.
// Each entry carries its own sourcePath from s.path(), so this needs no fs read.
assertFilenamesMatchSlugs(work);

// Resolve roles across EVERY item, drafts included, BEFORE filtering. A bad
// roleId in a draft is still a bad reference; validating only what is published
// would let it sit until someone flips the flag and shipped a broken page.
const resolved: WorkItem[] = work.map((item) => ({
  ...item,
  ...resolveRole(item),
}));

const published: WorkItem[] = filterPublished(resolved);

assertHeadlineSlugs(profile.headlineOutcomes, published);

export async function getWorkItems(): Promise<WorkItem[]> {
  return published;
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
  return profile.roles;
}
