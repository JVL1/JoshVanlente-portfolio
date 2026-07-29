import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MetricStrip } from "@/components/site/MetricStrip";
import { profile } from "@/data/profile";
import type { ResolvedHeadlineOutcome } from "@/lib/content";

const outcomes: ResolvedHeadlineOutcome[] = profile.headlineOutcomes.map(
  (outcome) => ({
    ...outcome,
    href: outcome.slug ? `/work/${outcome.slug}` : null,
  }),
);

describe("MetricStrip", () => {
  it("renders the four profile outcomes with their attributions", () => {
    render(<MetricStrip outcomes={outcomes} />);

    const metrics = screen.getAllByTestId("metric");
    const attributions = screen.getAllByTestId("metric-attribution");

    expect(metrics).toHaveLength(4);
    expect(attributions).toHaveLength(4);
    expect(attributions.map((item) => item.textContent)).toEqual(
      profile.headlineOutcomes.map(
        (outcome) => `${outcome.org} · ${outcome.period}`,
      ),
    );
  });

  it("links only outcomes backed by a write-up", () => {
    render(<MetricStrip outcomes={outcomes} />);

    const metrics = screen.getAllByTestId("metric");

    outcomes.forEach((outcome, index) => {
      const cell = metrics[index];
      expect(cell).toBeDefined();

      const link = within(cell!).queryByRole("link");
      if (outcome.slug) {
        expect(link?.getAttribute("href")).toBe(`/work/${outcome.slug}`);
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
