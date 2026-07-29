import { describe, expect, it } from "vitest";
import { profile } from "@/data/profile";
import { normalizeOgTitle } from "@/lib/og-title";

const fallback = `${profile.name} — ${profile.role}`;

describe("normalizeOgTitle", () => {
  it("passes a normal title through", () => {
    expect(normalizeOgTitle("Selected work")).toBe("Selected work");
  });

  it.each([undefined, null, "", "   \t\n"])(
    "uses the profile fallback for a missing title",
    (title) => {
      expect(normalizeOgTitle(title)).toBe(fallback);
    },
  );

  it("truncates a long title to 120 characters including the ellipsis", () => {
    const title = normalizeOgTitle("a".repeat(300));

    expect(title).toHaveLength(120);
    expect(title.endsWith("…")).toBe(true);
  });

  it("does not truncate a title of exactly 120 characters", () => {
    const title = "a".repeat(120);

    expect(normalizeOgTitle(title)).toBe(title);
  });
});
