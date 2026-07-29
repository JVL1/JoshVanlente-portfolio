import Link from "next/link";
import type { ResolvedHeadlineOutcome } from "@/lib/content";

type MetricStripProps = {
  outcomes: ResolvedHeadlineOutcome[];
};

export function MetricStrip({ outcomes }: MetricStripProps) {
  return (
    <div className="grid grid-cols-4 border-b border-border">
      {outcomes.map((outcome) => {
        // The group-* variants only bite in the linked branch, which is the
        // point: a plain cell has no `group` ancestor, so it stays inert. They
        // have to sit on the spans rather than on the link, because each span
        // sets its own colour and a child's declaration wins on specificity —
        // `hover:text-accent` on the link itself would compile and do nothing.
        const content = (
          <>
            <span className="block font-serif text-[clamp(32px,3.7vw,48px)] font-normal tracking-[-0.035em] text-text transition-colors duration-200 group-hover:text-accent group-focus-visible:text-accent">
              {outcome.metric}
            </span>
            <span className="mt-2 block font-mono text-xs uppercase tracking-[0.11em] text-text-muted transition-colors duration-200 group-hover:text-accent group-focus-visible:text-accent">
              {outcome.label}
            </span>
          </>
        );

        return (
          <div
            key={`${outcome.org}-${outcome.metric}-${outcome.label}`}
            data-testid="metric"
            className="border-r border-border px-4 py-8 text-center last:border-r-0"
          >
            {outcome.href ? (
              // `block`, not `inline-block`: an inline-block establishes a line
              // box whose inherited 16px strut pushed the attribution in the two
              // linked cells below the two plain ones, across a strip whose whole
              // job is alignment. It also widens the target to the full cell.
              <Link href={outcome.href} className="group block">
                {content}
              </Link>
            ) : (
              content
            )}
            {/* The dot is decoration between two facts, so it is hidden rather
                than spoken. Hiding it leaves textContent untouched, which is
                what an sr-only separator would not do. */}
            <p
              data-testid="metric-attribution"
              className="mt-3 font-mono text-xs text-text-subtle"
            >
              {outcome.org}
              <span aria-hidden="true"> · </span>
              {outcome.period}
            </p>
          </div>
        );
      })}
    </div>
  );
}
