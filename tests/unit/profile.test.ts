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
});
