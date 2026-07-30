import Image from "next/image";
import Link from "next/link";
import type { WorkItem } from "@/lib/content";

type CaseRowProps = {
  item: WorkItem;
  /**
   * The heading level the row's title takes. It defaults to 3, which is right
   * under a SectionHeader sitting at 2 — the homepage's arrangement. /work puts
   * its SectionHeader at 1, so it passes 2 and the outline descends a step at a
   * time rather than jumping from the h1 to an h3.
   */
  level?: 2 | 3;
};

export function CaseRow({ item, level = 3 }: CaseRowProps) {
  const Title = level === 2 ? "h2" : "h3";

  // velite.config.ts declares `s.array(outcome).min(1)`, but WorkItem infers a
  // plain array, so an empty one is a type error nobody gets. Saying which
  // write-up is short an outcome beats a property-of-undefined stack.
  const outcome = item.outcomes[0];
  if (!outcome) {
    throw new Error(
      `Work item "${item.slug}" has no outcomes; the row renders the first one.`,
    );
  }

  return (
    // `group` rather than a bare `[&:hover_img]`: Tailwind wraps its own `hover`
    // variant in `@media (hover: hover)` and an arbitrary one escapes it, so on
    // a phone the thumbnail used to zoom while the slide and the border sat
    // still. The focus-visible mirror stays written out because :has is what
    // reaches the image from the anchor.
    <li className="case-row group relative grid min-w-0 grid-cols-[minmax(0,1fr)] items-start gap-3 border-b border-border py-5 transition-[padding,border-color] duration-300 hover:border-accent hover:pl-4 [&:has(a:focus-visible)]:border-accent [&:has(a:focus-visible)]:pl-4 [&:has(a:focus-visible)_img]:scale-[1.06] [&:has(a:focus-visible)_img]:opacity-100 min-[360px]:grid-cols-[90px_minmax(0,1fr)] min-[360px]:gap-3.5 min-[900px]:grid-cols-[148px_minmax(0,1fr)_auto] min-[900px]:items-center min-[900px]:gap-6">
      {/* The transition names `scale`, not `transform`: Tailwind 4 compiles
          scale-[1.06] to the standalone `scale` property, which a transition on
          `transform` does not cover, so the zoom used to land on frame one. */}
      <div className="aspect-[16/10] overflow-hidden rounded-lg bg-surface">
        <Image
          src={item.cover.src}
          width={item.cover.width}
          height={item.cover.height}
          alt=""
          sizes="(min-width: 900px) 148px, (min-width: 360px) 90px, calc(100vw - 32px)"
          className="h-full w-full object-cover opacity-[0.78] transition-[opacity,scale] duration-300 group-hover:scale-[1.06] group-hover:opacity-100"
        />
      </div>

      <div className="min-w-0 [overflow-wrap:anywhere]">
        <Title className="min-w-0 text-xl font-semibold tracking-tight transition-colors duration-300 [overflow-wrap:anywhere]">
          <Link
            href={`/work/${item.slug}`}
            className="after:absolute after:inset-0 after:content-[''] hover:text-accent focus-visible:text-accent"
          >
            {item.title}
          </Link>
        </Title>
        {/* The three blocks below carry `relative z-10 w-fit` so they paint
            above the anchor's stretched ::after and stay selectable — a reader
            has to be able to copy the metric and the summary. `w-fit` is the
            load-bearing half: without it each block spans the whole text column
            and takes the row's dead space away from the link. */}
        <p className="relative z-10 w-fit text-base text-text-muted">
          {item.summary}
        </p>
        <p
          data-testid="case-outcome"
          className="relative z-10 mt-2 w-fit text-sm"
        >
          <span className="font-serif text-lg text-text">
            {outcome.metric}
          </span>{" "}
          <span className="text-text-subtle">{outcome.label}</span>
        </p>
        <ul className="relative z-10 mt-2 flex w-fit flex-wrap gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-[0.08em] text-text-subtle">
          {item.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      </div>

      <span className="hidden font-mono text-xs text-text-subtle min-[900px]:block">
        {item.publishedAt.slice(0, 4)}
      </span>
    </li>
  );
}
