// Kept in step with `dateish` in src/data/profile.ts, which cannot import from
// here because that file may import nothing but zod. Change both together.
const DATE = /^(\d{4})(?:-(\d{2}))?$/;

type Parsed = { text: string; year: number; month: number };

function parse(value: string): Parsed {
  const m = DATE.exec(value);
  if (!m) {
    throw new Error(`expected YYYY or YYYY-MM, got "${value}"`);
  }
  // The shape check alone accepted "2025-13" and "2025-00". The month never
  // reaches the output, so a bad one used to travel silently through the schema
  // and into rendered copy.
  const month = m[2] === undefined ? 1 : Number(m[2]);
  if (month < 1 || month > 12) {
    throw new Error(`month must be 01 through 12, got "${value}"`);
  }
  return { text: m[1], year: Number(m[1]), month };
}

export function formatRoleDates({
  start,
  end,
}: {
  start: string;
  end: string | null;
}): string {
  const from = parse(start);
  if (end === null) {
    return `${from.text}—now`;
  }
  const to = parse(end);
  // A role cannot end before it starts. Without this check the inversion renders
  // as a backwards range, and a same-year inversion collapses to a single year,
  // hiding the bad data completely.
  if (to.year < from.year || (to.year === from.year && to.month < from.month)) {
    throw new Error(`end "${end}" precedes start "${start}"`);
  }
  return from.year === to.year ? from.text : `${from.text}—${to.text}`;
}
