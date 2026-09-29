type HexStep = {
  label: string;
  /** The figure inside the tile. " / " splits it over two lines. */
  value: string;
  title: string;
  note: string;
  /** "win" spends the accent on this step; "fog" draws the tile hatched. */
  state?: "done" | "win" | "fog";
};

// A pointy-top hexagon. The tile is two stacked hexes, an outer one in the
// border colour and an inner one inset by 2px, because clip-path cuts a CSS
// border off along with everything else outside the polygon.
const hex = "[clip-path:polygon(50%_0,100%_25%,100%_75%,50%_100%,0_75%,0_25%)]";

// The fog hatch, in the border token over the page background.
const fog =
  "bg-bg bg-[repeating-linear-gradient(45deg,var(--color-border-strong)_0_4px,transparent_4px_10px)]";

/**
 * A row of hex tiles, one per move, with the goal tile still in fog: the
 * Civilization map the fog-of-war write-up leans on, drawn in markup.
 *
 * From md: up the tiles run left to right on a dashed path. Below md: they run
 * top to bottom with the text beside each tile, because six tiles across a
 * phone would shrink the figures inside them below the 12px floor.
 *
 * The list is divs with list roles, and the text is divs rather than <p>: the
 * figure renders inside Prose, which caps every <ol> at the reading measure and
 * gives every <p> paragraph margins. Real <ol> and <p> squeezed the row into
 * the measure and opened a gap under each title.
 *
 * The caption is optional: leave it out when a heading right above the figure
 * already names it.
 */
export function HexPath({ title, steps }: { title?: string; steps: HexStep[] }) {
  return (
    <figure className="my-10" data-testid="hex-path">
      {title ? (
        <figcaption className="font-mono text-xs uppercase tracking-[0.08em] text-text-subtle">
          {title}
        </figcaption>
      ) : null}
      <div className={`relative ${title ? "mt-8" : ""}`}>
        <div
          aria-hidden
          className="absolute top-14 right-[8%] left-[8%] hidden border-t border-dashed border-border-strong md:block"
        />
        <div
          aria-hidden
          className="absolute top-10 bottom-10 left-[2.2rem] border-l border-dashed border-border-strong md:hidden"
        />
        <div role="list" className="relative flex flex-col gap-3 md:flex-row md:gap-2">
          {steps.map((step) => {
            const state = step.state ?? "done";
            const lines = step.value.split(" / ");
            return (
              <div
                role="listitem"
                key={step.title}
                data-state={state}
                className="flex items-center gap-5 md:flex-1 md:flex-col md:gap-4 md:text-center"
              >
                <div
                  className={`relative h-20 w-[4.4rem] shrink-0 md:h-28 md:w-24 ${hex} ${
                    state === "win" ? "bg-text-subtle" : "bg-border-strong"
                  }`}
                >
                  <div
                    className={`absolute inset-[2px] flex flex-col items-center justify-center ${hex} ${
                      state === "fog" ? fog : "bg-surface"
                    }`}
                  >
                    {state === "fog" ? null : (
                      <span className="hidden font-mono text-xs uppercase tracking-[0.08em] text-text-subtle md:block">
                        {step.label}
                      </span>
                    )}
                    {lines.map((line) => (
                      <span
                        key={line}
                        className={`font-serif text-xl leading-tight ${
                          state === "win"
                            ? "text-accent"
                            : state === "fog"
                              ? "text-text-muted"
                              : "text-text"
                        }`}
                        {...(state === "win" ? { "data-accent": "" } : {})}
                      >
                        {line}
                      </span>
                    ))}
                  </div>
                </div>
                {/* From xl up, a title never wraps: a long title widens its own
                    column and takes the width from the short ones. Below xl,
                    six unwrapped titles overflow the row. */}
                <div>
                  <div
                    data-testid="hex-title"
                    className="text-md font-semibold text-text xl:whitespace-nowrap"
                  >
                    {step.title}
                  </div>
                  <div className="mt-1 text-sm text-text-muted">{step.note}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </figure>
  );
}
