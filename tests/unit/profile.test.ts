import { describe, expect, it } from "vitest";
import { profile } from "@/data/profile";

// Transcribed from the July 2026 résumé. The résumé itself stays out of the repo —
// committing it would publish a phone number permanently in git history.
const RESUME = [
  {
    org: "Evernest",
    title: "Staff Product Manager, AI/LLM Initiatives",
    start: "2025-09",
    end: null,
  },
  {
    org: "Built",
    title: "Principal Product Manager",
    start: "2025-03",
    end: "2025-08",
  },
  {
    org: "Azibo",
    title: "Senior Manager, Product Management",
    start: "2023-03",
    end: "2025-03",
  },
  {
    org: "Azibo",
    title: "Senior Product Manager",
    start: "2022-02",
    end: "2023-03",
  },
  {
    org: "Upstart",
    title: "Product Manager",
    start: "2019-07",
    end: "2021-09",
  },
  {
    org: "Twitter",
    title: "Product Manager",
    start: "2018",
    end: "2019",
  },
  {
    org: "Ampush",
    title: "Senior Product Manager",
    start: "2013",
    end: "2018",
  },
];

describe("profile.roles", () => {
  it("matches the résumé exactly, in reverse-chronological order", () => {
    expect(
      profile.roles.map((r) => ({
        org: r.org,
        title: r.title,
        start: r.start,
        end: r.end,
      })),
    ).toEqual(RESUME);
  });

  it("gives every role a unique id", () => {
    const ids = profile.roles.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps the two ids that content frontmatter references", () => {
    // Task 7 writes these two into MDX frontmatter as `roleId`, and Task 6's
    // loader resolves them here. Renaming one orphans a write-up, so pin them
    // rather than trusting that whoever renames also greps content/.
    const ids = profile.roles.map((r) => r.id);
    expect(ids).toContain("azibo-senior-manager");
    expect(ids).toContain("azibo-senior-pm");
  });

  it("gives every role at least one achievement", () => {
    for (const r of profile.roles) {
      expect(r.achievements.length).toBeGreaterThan(0);
    }
  });
});

describe("profile.headlineOutcomes", () => {
  it("declares exactly four", () => {
    expect(profile.headlineOutcomes).toHaveLength(4);
  });

  it("attributes every metric with a structured org and period", () => {
    for (const o of profile.headlineOutcomes) {
      expect(o.org).toBeTruthy();
      expect(o.period).toBeTruthy();
    }
  });

  // The four metrics are the homepage's whole credibility argument, and nothing
  // else pins them — the schema only checks that the strings are non-empty.
  // They have drifted before: commit 01227ab replaced an Upstart figure with
  // Evernest's 9% time-to-lease. A golden record here means a future edit is a
  // deliberate act rather than a silent one, the same job the RESUME constant
  // does for the roles.
  it("matches the four headline metrics exactly", () => {
    expect(profile.headlineOutcomes).toEqual([
      { metric: "2.8×", label: "Monetized users", org: "Azibo", period: "2023—2025" },
      { metric: "$300M+", label: "Annual payment volume", org: "Azibo", period: "2023—2025" },
      {
        metric: "1→7",
        label: "Products in the suite",
        org: "Azibo",
        period: "2023—2025",
        slug: "all-in-one-rental-platform",
      },
      {
        metric: "9%",
        label: "Faster time to lease",
        org: "Evernest",
        period: "2025—2026",
        slug: "cutting-six-of-seven-steps",
      },
    ]);
  });

  // formatRoleDates renders the Track record a few hundred pixels below the
  // metric strip on the same page, and it emits four-digit end years. A
  // hand-written two-digit period here would read as drift rather than intent.
  it("writes every period with a four-digit end year, matching formatRoleDates", () => {
    for (const o of profile.headlineOutcomes) {
      expect(o.period, `${o.metric} (${o.label})`).toMatch(/^\d{4}—\d{4}$/);
    }
  });
});
