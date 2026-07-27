const DATE = /^(\d{4})(?:-(\d{2}))?$/;

function year(value: string): string {
  const m = DATE.exec(value);
  if (!m) {
    throw new Error(`expected YYYY or YYYY-MM, got "${value}"`);
  }
  return m[1];
}

export function formatRoleDates({
  start,
  end,
}: {
  start: string;
  end: string | null;
}): string {
  const from = year(start);
  if (end === null) {
    return `${from}—now`;
  }
  const to = year(end);
  return from === to ? from : `${from}—${to}`;
}
