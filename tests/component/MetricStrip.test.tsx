import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MetricStrip } from "@/components/site/MetricStrip";
import type { ResolvedHeadlineOutcome } from "@/lib/content";

const outcomes: ResolvedHeadlineOutcome[] = [
  {
    metric: "3.5×",
    label: "Gross margin per user",
    org: "Azibo",
    period: "2023—2025",
    slug: "the-source-slug-is-not-the-route",
    href: "/work/the-rendered-route",
  },
  {
    metric: "$300M+",
    label: "Annual payment volume",
    org: "Azibo",
    period: "2023—2025",
    slug: "a-slug-does-not-make-this-a-link",
    href: null,
  },
  {
    metric: "9%",
    label: "Faster time to lease",
    org: "Evernest",
    period: "2025—2026",
    slug: "a-second-source-slug",
    href: "/work/a-second-rendered-route",
  },
  {
    metric: "50%",
    label: "Lower cost per enhanced photo",
    org: "Evernest",
    period: "2025—2026",
    href: null,
  },
];

describe("MetricStrip", () => {
  it("renders the supplied outcomes with their attributions", () => {
    render(<MetricStrip outcomes={outcomes} />);

    const metrics = screen.getAllByTestId("metric");
    const attributions = screen.getAllByTestId("metric-attribution");

    expect(metrics).toHaveLength(4);
    expect(attributions).toHaveLength(4);
    expect(attributions.map((item) => item.textContent)).toEqual(
      outcomes.map((outcome) => `${outcome.org} · ${outcome.period}`),
    );
  });

  it("links only outcomes backed by a write-up", () => {
    render(<MetricStrip outcomes={outcomes} />);

    const metrics = screen.getAllByTestId("metric");

    outcomes.forEach((outcome, index) => {
      const cell = metrics[index];
      expect(cell).toBeDefined();

      const link = within(cell!).queryByRole("link");
      if (outcome.href) {
        expect(link?.getAttribute("href")).toBe(outcome.href);
        expect(link?.textContent).toContain(outcome.metric);
        expect(link?.textContent).toContain(outcome.label);
      } else {
        expect(link).toBeNull();
      }
    });

    expect(metrics.filter((cell) => within(cell).queryByRole("link"))).toHaveLength(
      2,
    );
  });
});
