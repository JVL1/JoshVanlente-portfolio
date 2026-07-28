/**
 * Typography for a write-up body.
 *
 * The rules are descendant selectors because the body is compiled MDX: the
 * elements arrive as plain `h2`, `p`, `li` and carry no classes of their own.
 * Only `img` is missing here, because the MDX registry renders body images
 * through next/image and styles them there.
 *
 * The measure is capped on the text elements rather than on the container, so a
 * body image or the comparison slider still runs the full column — roughly
 * 760px, which is the width the `sizes` attribute in the registry declares.
 */
const prose = [
  // Body colour and size. Headings override the size; nothing overrides colour.
  "text-lg text-text",

  // A write-up opens on its first heading, and the page header above it already
  // supplies the space this margin would add again.
  "[&>*:first-child]:mt-0",

  "[&_h2]:mt-14 [&_h2]:mb-4 [&_h2]:max-w-[68ch] [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-[-0.02em] [&_h2]:text-text",
  "[&_h3]:mt-10 [&_h3]:mb-3 [&_h3]:max-w-[68ch] [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:tracking-[-0.01em] [&_h3]:text-text",

  "[&_p]:my-5 [&_p]:max-w-[68ch] [&_p]:leading-relaxed",
  // Markdown wraps a standalone image in a paragraph, so without this a body
  // image would be capped at the reading measure while the slider — JSX, and
  // therefore not wrapped — ran the full column. Both are figures; both get the
  // column, which is also the width the registry's `sizes` attribute declares.
  //
  // `:only-child` is load-bearing. Without it the rule also matches a paragraph
  // of prose that merely contains an inline image, and that paragraph's text
  // loses the 68ch measure the rule above exists to protect. Only a paragraph
  // that is nothing but an image is a figure.
  "[&_p:has(>img:only-child)]:max-w-none",
  // A linked image — `[![alt](x)](/href)` — compiles to `p > a > img`, so the
  // rule above never matches it and the figure stayed squeezed inside the
  // measure. Both `:only-child`s keep the exception narrow: the paragraph holds
  // nothing but the link, and the link holds nothing but the image.
  "[&_p:has(>a:only-child>img:only-child)]:max-w-none",

  "[&_ul]:my-5 [&_ul]:max-w-[68ch] [&_ul]:list-disc [&_ul]:pl-5",
  "[&_ol]:my-5 [&_ol]:max-w-[68ch] [&_ol]:list-decimal [&_ol]:pl-5",
  "[&_li]:my-2 [&_li]:leading-relaxed",
  "[&_li::marker]:text-text-subtle",
  // A nested list belongs to the item above it, so it keeps the tighter rhythm.
  "[&_li_ul]:my-2 [&_li_ol]:my-2",

  "[&_strong]:font-semibold [&_strong]:text-text",
  "[&_em]:italic",

  // The underline is what marks a link, so it stays neutral until the accent
  // takes it over on hover and focus — the one sanctioned accent use here.
  "[&_a]:text-text [&_a]:underline [&_a]:decoration-border-strong [&_a]:underline-offset-4",
  "[&_a:hover]:decoration-accent",
  "[&_a:focus-visible]:decoration-accent",

  "[&_blockquote]:my-6 [&_blockquote]:max-w-[68ch] [&_blockquote]:border-l-2 [&_blockquote]:border-border-strong [&_blockquote]:pl-4 [&_blockquote]:text-text-muted",

  // The AI-pipeline write-up embeds a JSON fence, so a code block is real
  // content rather than a nicety. There is no highlighter: one JSON block does
  // not justify shipping prismjs, which the plan bans outright.
  "[&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border [&_pre]:bg-surface [&_pre]:p-4",
  "[&_code]:rounded [&_code]:bg-surface [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm",
  // Inside a fence the block already carries the background and the padding.
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
].join(" ");

export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div data-testid="prose" className={prose}>
      {children}
    </div>
  );
}
