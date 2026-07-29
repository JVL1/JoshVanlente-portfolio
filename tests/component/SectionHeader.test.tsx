import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SectionHeader } from "@/components/site/SectionHeader";

describe("SectionHeader", () => {
  it("heads a section at level 2 by default", () => {
    render(<SectionHeader title="Track record" count={4} />);

    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(
      "Track record",
    );
  });

  it("takes the page's h1 when asked", () => {
    render(<SectionHeader title="Work" count={5} level={1} />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Work");
  });

  // The count renders as `05`, which on its own reaches a screen reader as two
  // digits with no unit. Labelling it needs a role that permits a name — a bare
  // <span> is `generic`, which is name-prohibited, so the label is dropped.
  it("says what the count counts", () => {
    render(<SectionHeader title="Work" count={5} />);

    expect(screen.getByRole("img", { name: "5 items" })).toBeDefined();
  });
});
