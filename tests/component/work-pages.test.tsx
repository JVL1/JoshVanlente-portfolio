import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotFound from "@/app/not-found";
import WorkItemPage from "@/app/work/[slug]/page";
import WorkIndex from "@/app/work/page";

const SLUG = "all-in-one-rental-platform";

/**
 * Task 12 puts `<main id="main" tabIndex={-1}>` in layout.tsx and points a skip
 * link at it. A route that renders its own <main> would nest one inside the
 * other and leave the skip link aimed at the wrong element, so the routes have
 * to stop shipping their own before that lands.
 */
describe("the routes' document outline", () => {
  it("leaves <main> to the layout on /work/[slug]", async () => {
    const { container } = render(
      await WorkItemPage({ params: Promise.resolve({ slug: SLUG }) }),
    );

    expect(container.querySelectorAll("main")).toHaveLength(0);
  });

  it("leaves <main> to the layout on /work", async () => {
    const { container } = render(await WorkIndex());

    expect(container.querySelectorAll("main")).toHaveLength(0);
  });

  it("leaves <main> to the layout on the 404", () => {
    const { container } = render(<NotFound />);

    expect(container.querySelectorAll("main")).toHaveLength(0);
  });

  it("gives /work an h1 and descends one level at a time", async () => {
    const { container } = render(await WorkIndex());

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Work");
    const levels = [...container.querySelectorAll("h1,h2,h3,h4,h5,h6")].map(
      (h) => Number(h.tagName[1]),
    );
    expect(levels[0]).toBe(1);
    expect(Math.max(...levels)).toBe(2);
  });

  // The cover sits directly under the title, which carries the same words. An
  // alt that repeats them makes a screen reader say the title twice.
  it("keeps the /work/[slug] cover out of the accessibility tree", async () => {
    const { container } = render(
      await WorkItemPage({ params: Promise.resolve({ slug: SLUG }) }),
    );
    const title = screen.getByRole("heading", { level: 1 }).textContent;

    const echoes = [...container.querySelectorAll("img")].filter(
      (img) => img.getAttribute("alt") === title,
    );
    expect(echoes).toHaveLength(0);
  });
});
