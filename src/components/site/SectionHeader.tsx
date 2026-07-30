import Link from "next/link";

type SectionHeaderProps = {
  title: string;
  /**
   * Omitted where the section has nothing to count. /about's two headings have
   * no collection behind them, and before this was optional they hand-rolled
   * the same typography, which would have left Task 19's site-wide
   * accessible-name fix with two call sites it could not reach.
   */
  count?: number;
  id?: string;
  href?: string;
  /**
   * The heading level this header renders. It defaults to 2, which is what the
   * homepage's sections want — the metric strip and the track record both sit
   * under a headline that owns the h1. A page whose only heading is this one,
   * like /work, passes 1 so the document has a top-level heading at all.
   */
  level?: 1 | 2;
};

export function SectionHeader({
  title,
  count,
  id,
  href,
  level = 2,
}: SectionHeaderProps) {
  const Heading = level === 1 ? "h1" : "h2";

  return (
    <header
      id={id}
      className="flex min-w-0 items-center justify-between gap-4 border-b border-text pb-3 font-mono text-xs uppercase tracking-[0.2em]"
    >
      <Heading
        aria-label={title}
        className="min-w-0 [overflow-wrap:anywhere]"
      >
        {href ? (
          <Link
            href={href}
            className="inline-flex min-h-11 items-center transition-colors duration-200 hover:text-accent focus-visible:text-accent min-[900px]:min-h-0"
          >
            {title}
          </Link>
        ) : (
          title
        )}
      </Heading>
      {/* role="img" because the count renders as `05`, and a name on a bare
          <span> is dropped: a span computes to `generic`, which ARIA forbids
          from carrying one. The role also hides the padded digits, so what a
          screen reader hears is the count and its unit. */}
      {count !== undefined && (
        <span role="img" aria-label={`${count} items`} className="shrink-0">
          {String(count).padStart(2, "0")}
        </span>
      )}
    </header>
  );
}
