import { describe, expect, it } from "vitest";
import {
  filterPublished,
  resolveRole,
  resolveAndFilter,
  assertHeadlineSlugs,
  assertFilenamesMatchSlugs,
} from "@/lib/content-rules";

// publishedAt values here are full ISO-8601 UTC timestamps, because that is what
// s.isodate() emits: it transforms via `new Date(value).toISOString()`, so a
// frontmatter date of "2026-01-01" reaches the loader as
// "2026-01-01T00:00:00.000Z". Writing bare dates in a fixture would test a shape
// the build never produces — and would hide the tie case below, since every
// date-only value collapses to the same midnight timestamp in production.
//
// sourcePath values are extension-LESS, for the same reason: that is what
// s.path() emits.
const item = <T extends Record<string, unknown> = Record<never, never>>(
  over?: T,
) => ({
  slug: "a",
  sourcePath: "work/a",
  title: "A",
  summary: "s",
  publishedAt: "2026-01-01T00:00:00.000Z",
  roleId: "evernest-staff-pm",
  timeframe: "2026",
  tags: ["T"],
  outcomes: [{ metric: "1×", label: "L" }],
  cover: { src: "/static/a.png", width: 100, height: 60 },
  draft: false,
  code: "",
  ...over,
});

describe("filterPublished", () => {
  it("drops drafts", () => {
    expect(
      filterPublished([
        item({ slug: "a" }),
        item({ slug: "b", draft: true }),
      ]).map((i) => i.slug),
    ).toEqual(["a"]);
  });

  it("sorts published items newest first", () => {
    const out = filterPublished([
      item({ slug: "old", publishedAt: "2024-01-01T00:00:00.000Z" }),
      item({ slug: "new", publishedAt: "2026-01-01T00:00:00.000Z" }),
      item({ slug: "mid", publishedAt: "2025-01-01T00:00:00.000Z" }),
    ]);
    expect(out.map((i) => i.slug)).toEqual(["new", "mid", "old"]);
  });

  it("orders two write-ups published on the same day by time of day", () => {
    const out = filterPublished([
      item({ slug: "morning", publishedAt: "2026-01-01T09:00:00.000Z" }),
      item({ slug: "evening", publishedAt: "2026-01-01T21:00:00.000Z" }),
    ]);
    expect(out.map((i) => i.slug)).toEqual(["evening", "morning"]);
  });

  it("breaks an exact tie by slug, so input order cannot change the result", () => {
    // Two write-ups dated the same day produce identical timestamps, and velite
    // emits items in unsorted directory order — byte-sorted on APFS locally,
    // hash-ordered on the ext4 images CI builds on. Array.prototype.sort is
    // stable, so without a tiebreaker the page would render in one order locally
    // and another in production. Feeding the same pair in both orders is what
    // proves the tiebreaker rather than the input order is doing the work.
    const tied = [
      item({ slug: "beta", publishedAt: "2026-01-01T00:00:00.000Z" }),
      item({ slug: "alpha", publishedAt: "2026-01-01T00:00:00.000Z" }),
    ];
    expect(filterPublished(tied).map((i) => i.slug)).toEqual(["alpha", "beta"]);
    expect(filterPublished([...tied].reverse()).map((i) => i.slug)).toEqual([
      "alpha",
      "beta",
    ]);
  });

  it("does not reorder the array it was given", () => {
    // .filter() allocates before .sort() mutates, so the caller's array is safe.
    // Reordering the implementation to items.sort(...).filter(...) would sort the
    // argument in place and still pass every other test in this block.
    const input = [
      item({ slug: "old", publishedAt: "2024-01-01T00:00:00.000Z" }),
      item({ slug: "new", publishedAt: "2026-01-01T00:00:00.000Z" }),
    ];
    filterPublished(input);
    expect(input.map((i) => i.slug)).toEqual(["old", "new"]);
  });
});

describe("resolveRole", () => {
  it("resolves org and role from a roleId", () => {
    expect(resolveRole(item({ roleId: "azibo-senior-pm" }))).toEqual({
      org: "Azibo",
      role: "Senior Product Manager",
    });
  });

  it("passes through a literal org/role pair", () => {
    expect(
      resolveRole(item({ roleId: undefined, org: "Self", role: "Consultant" })),
    ).toEqual({
      org: "Self",
      role: "Consultant",
    });
  });

  it("throws naming the file and the field for an unresolvable roleId", () => {
    expect(() =>
      resolveRole(item({ slug: "ghost", roleId: "no-such-role" })),
    ).toThrow(/ghost.*roleId.*no-such-role/s);
  });

  it("throws when neither a roleId nor an org/role pair is supplied", () => {
    expect(() => resolveRole(item({ slug: "bare", roleId: undefined }))).toThrow(
      /bare\.mdx.*needs either 'roleId' or both 'org' and 'role'/s,
    );
  });

  it("rejects a half-supplied literal pair rather than returning an undefined role", () => {
    // Weakening the `item.org && item.role` guard to `||` would return
    // { org: "Self", role: undefined } here — a WorkItem whose required `role`
    // is undefined at runtime while its type says string.
    expect(() =>
      resolveRole(item({ slug: "half", roleId: undefined, org: "Self" })),
    ).toThrow(/half\.mdx.*needs either/s);
  });
});

describe("resolveAndFilter", () => {
  it("validates a DRAFT's roleId too, not just published ones", () => {
    // This is the ordering guarantee, and it can only be asserted here. Calling
    // resolveRole directly with draft: true proves nothing, because resolveRole
    // never reads the flag — that test would pass even if the loader filtered
    // drafts before resolving. Here the draft is the ONLY item, so it reaches
    // resolution only if resolving happens before filtering.
    expect(() =>
      resolveAndFilter([
        item({ slug: "d", draft: true, roleId: "no-such-role" }),
      ]),
    ).toThrow(/no-such-role/);
  });

  it("attaches org and role to published items and drops the drafts", () => {
    const out = resolveAndFilter([
      item({ slug: "a", roleId: "azibo-senior-pm" }),
      item({ slug: "b", draft: true }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      slug: "a",
      org: "Azibo",
      role: "Senior Product Manager",
    });
  });
});

describe("assertFilenamesMatchSlugs", () => {
  it("accepts a matching pair", () => {
    expect(() =>
      assertFilenamesMatchSlugs([item({ slug: "a", sourcePath: "work/a" })]),
    ).not.toThrow();
  });

  it("throws naming both the file and the slug when they differ", () => {
    expect(() =>
      assertFilenamesMatchSlugs([
        item({ slug: "a", sourcePath: "work/wrong-name" }),
      ]),
    ).toThrow(/wrong-name\.mdx.*"a"/s);
  });

  it("throws on swapped slugs, which a set comparison would accept", () => {
    // a.mdx declares "b" and b.mdx declares "a". The two SETS are equal, so a
    // set-to-set check passes while both URLs are wrong. Per-entry catches it.
    expect(() =>
      assertFilenamesMatchSlugs([
        item({ slug: "b", sourcePath: "work/a" }),
        item({ slug: "a", sourcePath: "work/b" }),
      ]),
    ).toThrow(/a\.mdx.*"b"/s);
  });
});

describe("assertHeadlineSlugs", () => {
  it("accepts outcomes whose slugs resolve to published items", () => {
    expect(() =>
      assertHeadlineSlugs(
        [{ metric: "1×", label: "L", org: "O", period: "P", slug: "a" }],
        [item({ slug: "a" })],
      ),
    ).not.toThrow();
  });

  it("accepts outcomes with no slug at all", () => {
    expect(() =>
      assertHeadlineSlugs(
        [{ metric: "1×", label: "L", org: "O", period: "P" }],
        [],
      ),
    ).not.toThrow();
  });

  it("throws naming the slug and the published set when it points at nothing", () => {
    expect(() =>
      assertHeadlineSlugs(
        [{ metric: "1×", label: "L", org: "O", period: "P", slug: "missing" }],
        [item({ slug: "a" })],
      ),
    ).toThrow(/headlineOutcomes.*"missing".*matches no write-up.*Published: a/s);
  });

  it("says the write-up is a draft rather than reporting it as missing", () => {
    // The case the plan singles out: a homepage metric linking into a 404. The
    // draft has to sit alongside a published sibling, otherwise the published
    // list is empty and this is just the "points at nothing" test again.
    const all = [item({ slug: "a" }), item({ slug: "d", draft: true })];
    expect(() =>
      assertHeadlineSlugs(
        [{ metric: "1×", label: "L", org: "O", period: "P", slug: "d" }],
        filterPublished(all),
        all,
      ),
    ).toThrow(/headlineOutcomes.*"d".*content\/work\/d\.mdx.*draft: true/s);
  });
});
