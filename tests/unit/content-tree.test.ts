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

  it("resolves every headline outcome that declares a slug", async () => {
    const resolved = await getHeadlineOutcomes();
    expect(resolved).toHaveLength(profile.headlineOutcomes.length);
    for (const o of resolved) {
      if (o.slug) expect(o.href).toBe(`/work/${o.slug}`);
      else expect(o.href).toBeNull();
    }
  });
});
