import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrackRecord } from "@/components/site/TrackRecord";
import type { Role } from "@/data/profile";

const roles: Role[] = [
  {
    id: "evernest-staff-pm",
    org: "Evernest",
    title: "Staff Product Manager",
    start: "2025-09",
    end: null,
    achievements: ["Built the product strategy."],
  },
  {
    id: "azibo-senior-pm",
    org: "Azibo",
    title: "Senior Product Manager",
    start: "2022-02",
    end: "2023-03",
    achievements: ["Launched a growth channel.", "Lowered acquisition cost."],
  },
];

describe("TrackRecord", () => {
  it("renders every supplied role as a list item", () => {
    const { container } = render(<TrackRecord roles={roles} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(container.querySelector("table")).toBeNull();
  });

  it("shows the supplied role data in its desktop-row structure", () => {
    render(<TrackRecord roles={roles} />);

    const rows = screen.getAllByRole("listitem");

    expect(rows[0]?.textContent).toContain("Evernest");
    expect(rows[0]?.textContent).toContain("Staff Product Manager");
    expect(rows[0]?.querySelector("[data-testid='role-dates']")?.textContent).toBe(
      "2025—now",
    );
    expect(rows[1]?.textContent).toContain("Azibo");
    expect(rows[1]?.textContent).toContain("Senior Product Manager");
    expect(rows[1]?.querySelector("[data-testid='role-dates']")?.textContent).toBe(
      "2022—2023",
    );
  });

  it("renders every achievement below its role title", () => {
    render(<TrackRecord roles={roles} />);

    const rows = screen.getAllByRole("listitem");

    roles.forEach((role, index) => {
      const row = rows[index];
      expect(row).toBeDefined();
      expect(
        [...row!.querySelectorAll("small")].map((item) => item.textContent),
      ).toEqual(role.achievements);
    });
  });
});
