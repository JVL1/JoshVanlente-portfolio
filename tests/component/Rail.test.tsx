import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Rail } from "@/components/site/Rail";
import { profile } from "@/data/profile";

describe("Rail", () => {
  it("lays out the banner, main content, and contact footer in reading order", () => {
    render(
      <Rail>
        <h1>A headline</h1>
      </Rail>,
    );

    const banner = screen.getByRole("banner");
    const main = screen.getByRole("main");
    const footer = screen.getByRole("contentinfo");

    expect(banner.compareDocumentPosition(main)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(main.compareDocumentPosition(footer)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "A headline",
    );
  });

  it("renders the profile name as one complete phrase", () => {
    const [first] = profile.name.split(" ");
    render(<Rail />);

    const name = screen.getByText(first, { selector: "p" });

    expect(name.textContent).toBe(profile.name);
  });

  it("shows profile positioning", () => {
    const { container } = render(<Rail />);
    const positioning = [...container.querySelectorAll("p")].find(
      (paragraph) =>
        paragraph.textContent === `${profile.role}${profile.disciplines}`,
    );

    expect(positioning).toBeTruthy();
  });

  it("links the sections from every route", () => {
    render(<Rail />);

    const navigation = screen.getByRole("navigation", { name: "Sections" });
    const links = navigation.querySelectorAll("a");

    expect([...links].map((link) => link.getAttribute("href"))).toEqual([
      "/#work",
      "/#track",
      "/about",
    ]);
  });

  it("links to the profile contact details", () => {
    render(<Rail />);

    expect(
      screen.getByRole("link", { name: "LinkedIn" }).getAttribute("href"),
    ).toBe(profile.links.linkedin);
    expect(
      screen.getByRole("link", { name: "GitHub" }).getAttribute("href"),
    ).toBe(profile.links.github);
    expect(
      screen.getByRole("link", { name: profile.email }).getAttribute("href"),
    ).toBe(`mailto:${profile.email}`);
  });
});
