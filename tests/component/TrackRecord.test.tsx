import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrackRecord } from "@/components/site/TrackRecord";
import { profile } from "@/data/profile";
import { formatRoleDates } from "@/lib/dates";

describe("TrackRecord", () => {
  it("renders every profile role as a list item", () => {
    const { container } = render(<TrackRecord roles={profile.roles} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(7);
    expect(container.querySelector("table")).toBeNull();
  });

  it("shows each formatted role date", () => {
    render(<TrackRecord roles={profile.roles} />);

    const expectedDates = profile.roles.map(formatRoleDates);
    const renderedDates = screen
      .getAllByRole("listitem")
      .map((row) => row.querySelector("time")?.textContent);

    expect(renderedDates).toEqual(expectedDates);
    expect(renderedDates).toHaveLength(7);

    const openEndedRole = profile.roles.find((role) => role.end === null);
    expect(openEndedRole).toBeDefined();
    expect(formatRoleDates(openEndedRole!)).toBe("2025—now");
  });

  it("keeps the two Azibo roles separate", () => {
    render(<TrackRecord roles={profile.roles} />);

    const aziboRoles = profile.roles.filter((role) => role.org === "Azibo");
    const aziboRows = screen
      .getAllByRole("listitem")
      .filter((row) => row.textContent?.includes("Azibo"));

    expect(aziboRows).toHaveLength(2);
    expect(aziboRoles.map((role) => role.title)).toHaveLength(2);
    expect(new Set(aziboRoles.map((role) => role.title)).size).toBe(2);
    expect(new Set(aziboRoles.map(formatRoleDates)).size).toBe(2);

    aziboRoles.forEach((role) => {
      const row = aziboRows.find(
        (candidate) =>
          candidate.textContent?.includes(role.title) &&
          candidate.textContent?.includes(formatRoleDates(role)),
      );
      expect(row).toBeDefined();
    });
  });

  it("renders every achievement below its role title", () => {
    render(<TrackRecord roles={profile.roles} />);

    const rows = screen.getAllByRole("listitem");

    profile.roles.forEach((role, index) => {
      const row = rows[index];
      expect(row).toBeDefined();
      expect(
        [...row!.querySelectorAll("small")].map((item) => item.textContent),
      ).toEqual(role.achievements);
    });
  });
});
