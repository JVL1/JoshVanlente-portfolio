import Link from "next/link";
import type { ResolvedHeadlineOutcome } from "@/lib/content";

type MetricStripProps = {
  outcomes: ResolvedHeadlineOutcome[];
};

export function MetricStrip({ outcomes }: MetricStripProps) {
  return (
    <div className="grid grid-cols-4 border-b border-border">
      {outcomes.map((outcome) => {
        const content = (
          <>
            <span className="block font-serif text-[clamp(32px,3.7vw,48px)] font-normal tracking-[-0.035em] text-text">
              {outcome.metric}
            </span>
            <span className="mt-2 block font-mono text-xs uppercase tracking-[0.11em] text-text-muted">
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
              <Link href={outcome.href} className="inline-block">
                {content}
              </Link>
            ) : (
              content
            )}
            {/* Some screen readers announce the middle dot by name. Treating
                the attribution as one labelled unit keeps its pause natural. */}
            <p
              role="img"
              aria-label={`${outcome.org}, ${outcome.period}`}
              data-testid="metric-attribution"
              className="mt-3 font-mono text-xs text-text-subtle"
            >
              {outcome.org} · {outcome.period}
            </p>
          </div>
        );
      })}
    </div>
  );
}
