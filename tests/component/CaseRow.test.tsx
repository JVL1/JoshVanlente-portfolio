import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CaseRow } from "@/components/site/CaseRow";
import type { WorkItem } from "@/lib/content";

/**
 * Hand-built rather than lifted from `#content`, so a test can hand the
 * component shapes the schema forbids — an empty `outcomes` is the one that
 * matters — and so the assertions below name values no write-up can change.
 */
function workItem(overrides: Partial<WorkItem> = {}): WorkItem {
  return {
    slug: "a-write-up",
    title: "A write-up title",
    summary: "One sentence of summary.",
    publishedAt: "2024-04-08T00:00:00.000Z",
    timeframe: "2023—2025",
    tags: ["Strategy", "0→1"],
    outcomes: [
      { metric: "1→7", label: "Products in the suite" },
      { metric: "3.5×", label: "Gross margin per user" },
      { metric: "2.8×", label: "Monetized users" },
    ],
    cover: { src: "/static/cover.webp", width: 1200, height: 710 },
    draft: false,
    sourcePath: "work/a-write-up",
    org: "Azibo",
    role: "Senior Product Manager",
    ...overrides,
  } as WorkItem;
}

function renderRow(item: WorkItem) {
  return render(
    <ul>
      <CaseRow item={item} />
    </ul>,
  );
}

describe("CaseRow", () => {
  it("shows only the first outcome, however many the write-up carries", () => {
    renderRow(workItem());

    const outcomes = screen.getAllByTestId("case-outcome");
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.textContent).toBe("1→7 Products in the suite");
  });

  // The stretched ::after hit area covers the summary, the tags and the year,
  // so a careless markup change can sweep all of them into the link's name and
  // leave a screen reader reading a paragraph where it expects a title.
  it("names the link with the title alone", () => {
    renderRow(workItem());

    const link = screen.getByRole("link", { name: "A write-up title" });
    expect(link.getAttribute("href")).toBe("/work/a-write-up");
  });

  it("titles the row at level 3 by default", () => {
    renderRow(workItem());

    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe(
      "A write-up title",
    );
  });

  it("titles the row at the level the page asks for", () => {
    render(
      <ul>
        <CaseRow item={workItem()} level={2} />
      </ul>,
    );

    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(
      "A write-up title",
    );
  });

  // velite.config.ts requires `outcomes` to be non-empty, but WorkItem infers a
  // plain array, so nothing in the type system stops an empty one reaching here.
  it("names the offending write-up when its outcomes are empty", () => {
    expect(() => renderRow(workItem({ outcomes: [] }))).toThrow(
      /a-write-up.*outcome/is,
    );
  });
});
