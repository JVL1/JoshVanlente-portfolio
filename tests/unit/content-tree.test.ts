import { describe, expect, it } from "vitest";
import {
  getAllWorkSlugs,
  getHeadlineOutcomes,
  getWorkItem,
  getWorkItems,
} from "@/lib/content";
import { work } from "#content";
import { profile } from "@/data/profile";

describe("the real content tree", () => {
  it("generates six items, of which exactly one is a draft", () => {
    expect(work).toHaveLength(6);
    expect(work.filter((i) => i.draft).map((i) => i.slug)).toEqual([
      "draft-fixture",
    ]);
  });

  it("never returns a draft from any surface", async () => {
    const items = await getWorkItems();
    expect(items).toHaveLength(5);
    expect(items.every((i) => i.draft === false)).toBe(true);
    expect(await getAllWorkSlugs()).toEqual(items.map((i) => i.slug));
    expect(await getWorkItem("draft-fixture")).toBeNull();
  });

  it("returns null for an unknown slug", async () => {
    expect(await getWorkItem("no-such-write-up")).toBeNull();
  });

  it("resolves org and role on every item", async () => {
    for (const i of await getWorkItems()) {
      expect(i.org, i.slug).toBeTruthy();
      expect(i.role, i.slug).toBeTruthy();
    }
  });

  it("gives every item at least one outcome, per the schema", async () => {
    for (const i of await getWorkItems())
      expect(i.outcomes.length, i.slug).toBeGreaterThan(0);
  });

  // The expected slugs are written out rather than read back off the outcome
  // being checked. Deriving them from the data under test made this pass with
  // every slug deleted: each entry took the `else` branch, and a test named for
  // resolving declared slugs resolved none. Naming them means dropping a slug
  // from profile.ts fails here instead of silently emptying the homepage metric
  // strip's links.
  const LINKED_HEADLINE_SLUGS = [
    "all-in-one-rental-platform",
    "cutting-six-of-seven-steps",
  ];

  it("links exactly the headline outcomes that name a write-up", async () => {
    const resolved = await getHeadlineOutcomes();
    expect(resolved.map((o) => o.slug).filter(Boolean)).toEqual(
      LINKED_HEADLINE_SLUGS,
    );
    expect(resolved.filter((o) => o.href !== null).map((o) => o.href)).toEqual(
      LINKED_HEADLINE_SLUGS.map((s) => `/work/${s}`),
    );
  });

  it("points every linked headline outcome at a published write-up", async () => {
    const published = (await getWorkItems()).map((i) => i.slug);
    for (const slug of LINKED_HEADLINE_SLUGS) {
      expect(published, `${slug} must resolve to a published write-up`).toContain(
        slug,
      );
    }
  });

  it("keeps the metric strip's four columns filled", async () => {
    expect(await getHeadlineOutcomes()).toHaveLength(4);
    expect(profile.headlineOutcomes).toHaveLength(4);
  });
});
