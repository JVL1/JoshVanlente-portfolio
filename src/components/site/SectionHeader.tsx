type SectionHeaderProps = {
  title: string;
  count: number;
  id?: string;
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
  level = 2,
}: SectionHeaderProps) {
  const Heading = level === 1 ? "h1" : "h2";

  return (
    <header
      id={id}
      className="flex items-center justify-between border-b border-text pb-3 font-mono text-xs uppercase tracking-[0.2em]"
    >
      <Heading>{title}</Heading>
      {/* role="img" because the count renders as `05`, and a name on a bare
          <span> is dropped: a span computes to `generic`, which ARIA forbids
          from carrying one. The role also hides the padded digits, so what a
          screen reader hears is the count and its unit. */}
      <span role="img" aria-label={`${count} items`}>
        {String(count).padStart(2, "0")}
      </span>
    </header>
  );
}
