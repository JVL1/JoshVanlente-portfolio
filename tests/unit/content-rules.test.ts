import { describe, expect, it } from "vitest";
import {
  filterPublished,
  resolveRole,
  assertHeadlineSlugs,
  assertFilenamesMatchSlugs,
} from "@/lib/content-rules";

const item = <T extends Record<string, unknown> = Record<never, never>>(
  over?: T,
) => ({
  slug: "a",
  sourcePath: "work/a",
  title: "A",
  summary: "s",
  publishedAt: "2026-01-01",
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
      item({ slug: "old", publishedAt: "2024-01-01" }),
      item({ slug: "new", publishedAt: "2026-01-01" }),
      item({ slug: "mid", publishedAt: "2025-01-01" }),
    ]);
    expect(out.map((i) => i.slug)).toEqual(["new", "mid", "old"]);
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
      resolveRole(
        item({ roleId: undefined, org: "Self", role: "Consultant" }),
      ),
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

  it("validates a DRAFT's roleId too, not just published ones", () => {
    // Drafts are filtered for display, but a bad reference in one is still a
    // bad reference — and it becomes a live 404 the moment the flag flips.
    expect(() =>
      resolveRole(item({ slug: "d", draft: true, roleId: "no-such-role" })),
    ).toThrow(/no-such-role/);
  });
});

// sourcePath values here are extension-LESS, because that is what s.path()
// emits. Writing "work/a.mdx" in a fixture would make these tests green against
// a shape the build never produces.
describe("assertFilenamesMatchSlugs", () => {
  it("accepts a matching pair", () => {
    expect(() =>
      assertFilenamesMatchSlugs([
        item({ slug: "a", sourcePath: "work/a" }),
      ]),
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

  it("throws when a slug points at nothing", () => {
    expect(() =>
      assertHeadlineSlugs(
        [
          {
            metric: "1×",
            label: "L",
            org: "O",
            period: "P",
            slug: "missing",
          },
        ],
        [item({ slug: "a" })],
      ),
    ).toThrow(/headlineOutcomes.*missing/s);
  });

  it("throws when a slug points at a draft", () => {
    expect(() =>
      assertHeadlineSlugs(
        [{ metric: "1×", label: "L", org: "O", period: "P", slug: "d" }],
        filterPublished([item({ slug: "d", draft: true })]),
      ),
    ).toThrow(/headlineOutcomes.*d/s);
  });
});
