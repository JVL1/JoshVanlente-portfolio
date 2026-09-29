type BarRow = { label: string; value: number; highlight?: boolean };

/**
 * A horizontal bar chart drawn in markup, so it takes the site's tokens and
 * fonts and reflows with the column instead of scaling down as a picture.
 *
 * Bars are sized against the largest value. The highlighted row is the one the
 * chart exists to show, and it is the only place the accent is spent. Below sm:
 * the label sits above its bar, because a label column beside a 390px-wide bar
 * leaves the bar too short to compare.
 *
 * Each value sits at the end of its own bar rather than in a column of its own,
 * so a short bar is not read against a number a whole row away. The track's
 * right padding is what keeps room for the value beside the longest bar: a
 * percentage width resolves against the content box, so 100% stops short of it.
 */
export function BarChart({ title, rows }: { title: string; rows: BarRow[] }) {
  const max = Math.max(...rows.map((r) => r.value));

  return (
    <figure className="my-10" data-testid="bar-chart">
      <figcaption className="font-mono text-xs uppercase tracking-[0.08em] text-text-subtle">
        {title}
      </figcaption>
      <div className="mt-6 space-y-5 sm:space-y-4">
        {rows.map((row) => {
          const accent = row.highlight ? { "data-accent": "" } : {};
          return (
            <div
              key={row.label}
              data-testid="bar-row"
              className="grid items-center gap-y-2 sm:grid-cols-[17rem_1fr] sm:gap-x-6"
            >
              <span data-testid="bar-label" className="text-md text-text">
                {row.label}
              </span>
              <div className="flex items-center gap-3 pr-14">
                <div
                  data-testid="bar-fill"
                  className={`h-3 shrink-0 rounded-sm ${row.highlight ? "bg-accent" : "bg-text-muted"}`}
                  style={{ width: `${Math.round((row.value / max) * 100)}%` }}
                  {...accent}
                />
                <span
                  data-testid="bar-value"
                  className={`font-serif text-xl ${row.highlight ? "text-accent" : "text-text"}`}
                  {...accent}
                >
                  {row.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
