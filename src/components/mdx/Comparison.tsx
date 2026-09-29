type ComparisonRow = {
  topic: string;
  left: string;
  right: string;
  /** Appended to `right` and set in the accent: the one figure the table exists to show. */
  accent?: string;
};

const eyebrow = "font-mono text-xs uppercase tracking-[0.08em] text-text-subtle";

/**
 * Two claims side by side, one row per topic, drawn in markup so it reflows.
 *
 * From sm: up it is a three-column table with the headings once at the top.
 * Below sm: each row stacks, and every cell carries its own heading, because a
 * reader scrolling a phone never sees the header row and the cell next to it at
 * the same time.
 */
export function Comparison({
  left,
  right,
  rows,
}: {
  left: string;
  right: string;
  rows: ComparisonRow[];
}) {
  return (
    <figure className="my-10" data-testid="comparison">
      <div className="hidden grid-cols-[12rem_1fr_1fr] gap-6 border-b border-border pb-3 sm:grid">
        <span />
        <span className={eyebrow}>{left}</span>
        <span className={eyebrow}>{right}</span>
      </div>
      {rows.map((row) => (
        <div
          key={row.topic}
          data-testid="comparison-row"
          className="grid gap-3 border-b border-border py-5 sm:grid-cols-[12rem_1fr_1fr] sm:gap-6"
        >
          <span className="text-md font-semibold text-text">{row.topic}</span>
          <span className="text-md text-text-muted">
            <span className={`${eyebrow} block pb-1 sm:hidden`}>{left}</span>
            {row.left}
          </span>
          <span className="text-md text-text">
            <span className={`${eyebrow} block pb-1 sm:hidden`}>{right}</span>
            {row.right}
            {row.accent ? (
              <>
                {" "}
                <span data-accent="" className="font-semibold text-accent">
                  {row.accent}
                </span>
              </>
            ) : null}
          </span>
        </div>
      ))}
    </figure>
  );
}
