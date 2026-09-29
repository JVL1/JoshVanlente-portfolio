import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BarChart } from "@/components/mdx/BarChart";
import { Comparison } from "@/components/mdx/Comparison";
import { HexPath } from "@/components/mdx/HexPath";

/**
 * The charts are drawn in markup rather than shipped as images, so what a test
 * can hold them to is their content and the one-accent rule: each chart spends
 * the accent on the single figure it exists to show. The accent is read off a
 * data attribute, not a class name.
 */
const accented = (root: HTMLElement) => root.querySelectorAll("[data-accent]");

describe("BarChart", () => {
  const rows = [
    { label: "Big", value: 100 },
    { label: "Half", value: 50 },
    { label: "Payoff", value: 8, highlight: true },
  ];

  it("renders a labelled row for every value, with the title", () => {
    render(<BarChart title="Where they came from" rows={rows} />);

    expect(screen.getByText("Where they came from")).toBeDefined();
    const bars = screen.getAllByTestId("bar-row");
    expect(bars).toHaveLength(3);
    expect(bars.map((b) => within(b).getByTestId("bar-label").textContent)).toEqual([
      "Big",
      "Half",
      "Payoff",
    ]);
    expect(bars.map((b) => within(b).getByTestId("bar-value").textContent)).toEqual([
      "100",
      "50",
      "8",
    ]);
  });

  it("sizes each bar against the largest value", () => {
    render(<BarChart title="t" rows={rows} />);

    const widths = screen
      .getAllByTestId("bar-fill")
      .map((fill) => (fill as HTMLElement).style.width);
    expect(widths).toEqual(["100%", "50%", "8%"]);
  });

  it("spends the accent on the highlighted row only", () => {
    const { container } = render(<BarChart title="t" rows={rows} />);

    const marks = accented(container);
    expect(marks.length).toBeGreaterThan(0);
    for (const mark of marks) {
      expect(mark.closest("[data-testid='bar-row']")).toBe(screen.getAllByTestId("bar-row")[2]);
    }
  });
});

describe("Comparison", () => {
  it("renders both column headings and one row per topic", () => {
    const { container } = render(
      <Comparison
        left="What they said"
        right="What they did"
        rows={[
          { topic: "Smoke", left: "One for the unit", right: "One per room" },
          { topic: "Stickers", left: "Cleaning covers it", right: "Its own line in", accent: "20 of 24" },
        ]}
      />,
    );

    expect(screen.getAllByText("What they said").length).toBeGreaterThan(0);
    expect(screen.getAllByText("What they did").length).toBeGreaterThan(0);
    const rows = screen.getAllByTestId("comparison-row");
    expect(rows).toHaveLength(2);
    expect(rows[1]!.textContent).toContain("Its own line in 20 of 24");
    expect([...accented(container)].map((m) => m.textContent)).toEqual(["20 of 24"]);
  });
});

describe("HexPath", () => {
  const steps = [
    { label: "Move 1", value: "+2.5 / −2.6", title: "Rules from a sheet", note: "Fake" },
    { label: "Move 2", value: "+2.5", title: "Messy prompt", note: "Shipped", state: "win" as const },
    { label: "Goal", value: "90%", title: "The goal", note: "Still in the fog", state: "fog" as const },
  ];

  it("renders the steps in order as a list", () => {
    render(<HexPath title="The map so far" steps={steps} />);

    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items.map((i) => within(i).getByTestId("hex-title").textContent)).toEqual([
      "Rules from a sheet",
      "Messy prompt",
      "The goal",
    ]);
    expect(items.map((i) => i.getAttribute("data-state"))).toEqual(["done", "win", "fog"]);
  });

  it("spends the accent on the winning step's value only", () => {
    const { container } = render(<HexPath title="t" steps={steps} />);

    expect([...accented(container)].map((m) => m.textContent)).toEqual(["+2.5"]);
  });

  it("draws a caption only when given a title", () => {
    const { container, rerender } = render(<HexPath title="The map so far" steps={steps} />);
    expect(container.querySelector("figcaption")?.textContent).toBe("The map so far");

    rerender(<HexPath steps={steps} />);
    expect(container.querySelector("figcaption")).toBeNull();
  });
});
