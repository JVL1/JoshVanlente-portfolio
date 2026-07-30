import { describe, expect, it } from "vitest";
import { formatRoleDates } from "@/lib/dates";

describe("formatRoleDates", () => {
  it("renders a current role as ending in 'now'", () => {
    expect(formatRoleDates({ start: "2025-09", end: null })).toBe("2025—now");
  });

  it("renders a closed role as a year range", () => {
    expect(formatRoleDates({ start: "2023-03", end: "2025-03" })).toBe(
      "2023—2025",
    );
  });

  it("accepts year-only dates", () => {
    expect(formatRoleDates({ start: "2013", end: "2018" })).toBe("2013—2018");
  });

  it("collapses a range inside one year to a single year", () => {
    expect(formatRoleDates({ start: "2025-03", end: "2025-08" })).toBe("2025");
  });

  it("rejects a malformed date rather than rendering NaN", () => {
    expect(() =>
      formatRoleDates({ start: "March 2025", end: null }),
    ).toThrow(/YYYY/);
  });

  it("spans a year boundary without collapsing", () => {
    expect(formatRoleDates({ start: "2024-12", end: "2025-01" })).toBe(
      "2024—2025",
    );
  });

  it("rejects a month outside 01-12", () => {
    // The shape check alone passed these, and the month never reaches the output,
    // so nothing downstream would have noticed.
    expect(() => formatRoleDates({ start: "2025-13", end: null })).toThrow(/01 through 12/);
    expect(() => formatRoleDates({ start: "2025-00", end: null })).toThrow(/01 through 12/);
  });

  it("rejects an end that precedes its start", () => {
    expect(() =>
      formatRoleDates({ start: "2025-03", end: "2024-12" }),
    ).toThrow(/precedes/);
  });

  it("rejects a same-year inversion, which would otherwise collapse to one year", () => {
    expect(() =>
      formatRoleDates({ start: "2025-08", end: "2025-03" }),
    ).toThrow(/precedes/);
  });
});
