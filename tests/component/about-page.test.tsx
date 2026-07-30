import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AboutPage from "@/app/about/page";
import { about } from "@/data/about";

describe("the About page", () => {
  it("leaves <main> to the layout", () => {
    const { container } = render(<AboutPage />);

    expect(container.querySelectorAll("main")).toHaveLength(0);
  });

  it("has one h1 and descends one heading level at a time", () => {
    const { container } = render(<AboutPage />);
    const levels = [...container.querySelectorAll("h1,h2,h3,h4,h5,h6")].map(
      (heading) => Number(heading.tagName[1]),
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(levels[0]).toBe(1);
    expect(
      levels.every(
        (level, index) => index === 0 || level <= levels[index - 1] + 1,
      ),
    ).toBe(true);
  });

  it("renders every approved narrative paragraph from the parsed data", () => {
    render(<AboutPage />);

    for (const paragraph of about.narrative) {
      expect(screen.getByText(paragraph)).toBeTruthy();
    }
  });

  it("renders the education credential, with the minor marked as one", () => {
    render(<AboutPage />);
    const education = within(screen.getByTestId("education"));

    expect(education.getByText(about.education.institution)).toBeTruthy();
    // One line, and the word "minor" is in it. Stacked and unlabelled, the two
    // read as two degrees at equal rank — asserting the combined string is what
    // stops a later edit splitting them back apart and overstating the minor.
    expect(
      education.getByText(
        `${about.education.degree}, minor ${about.education.minor}`,
      ),
    ).toBeTruthy();
  });

  it("contains no em dash", () => {
    const { container } = render(<AboutPage />);

    expect(container.textContent).not.toContain("—");
  });

  it("contains no graduation year in the education block", () => {
    render(<AboutPage />);

    expect(screen.getByTestId("education").textContent).not.toMatch(/\b\d{4}\b/);
  });
});
