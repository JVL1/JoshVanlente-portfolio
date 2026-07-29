import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Rail } from "@/components/site/Rail";
import { profile } from "@/data/profile";

describe("Rail", () => {
  it("splits the profile name across two lines", () => {
    const [first, ...tail] = profile.name.split(" ");
    const rest = tail.join(" ");
    render(<Rail />);

    const firstLine = screen.getByText(first, { selector: "p" });
    const secondLine = screen.getByText(rest);

    // Whether the second line renders as a block is a styling choice jsdom
    // cannot observe, and AGENTS.md forbids reaching for the class name to
    // check it. The containment above is the part that carries meaning.
    expect(firstLine.contains(secondLine)).toBe(true);
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
