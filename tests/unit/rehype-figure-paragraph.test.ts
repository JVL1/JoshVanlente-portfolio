import { describe, expect, it } from "vitest";
import { rehype } from "rehype";
import rehypeFigureParagraph from "@/lib/mdx/rehype-figure-paragraph";

async function run(html: string) {
  return String(await rehype().use(rehypeFigureParagraph).process(html));
}

/** Whether the marker landed on the first paragraph of the output. */
async function marked(html: string) {
  return /<p data-figure/.test(await run(html));
}

/**
 * The rule this plugin exists to express: a paragraph whose entire content is
 * one image is a figure and gets the full column; a paragraph of prose that
 * merely contains an image keeps the 68ch measure.
 *
 * CSS cannot draw that line. `:only-child` counts element siblings and ignores
 * text nodes, so `text ![alt](x) text` is a paragraph whose only *element* is
 * the image — indistinguishable in CSS from a paragraph holding nothing else.
 * Here the text nodes are visible, so the distinction is decidable.
 */
describe("rehypeFigureParagraph", () => {
  it("marks a paragraph holding nothing but an image", async () => {
    expect(await marked('<p><img src="/a.png" alt="x"></p>')).toBe(true);
  });

  // Markdown routinely leaves a newline on each side of a block image, so
  // whitespace beside the image still counts as the image being alone.
  it("marks a paragraph whose image is surrounded only by whitespace", async () => {
    expect(await marked('<p>\n  <img src="/a.png" alt="x">\n</p>')).toBe(true);
  });

  // The hole this plugin closes. `:only-child` matches here; the marker does not.
  it("leaves a paragraph with text on both sides of the image unmarked", async () => {
    expect(await marked('<p>before <img src="/a.png" alt="x"> after</p>')).toBe(false);
  });

  it("leaves a paragraph with text on one side of the image unmarked", async () => {
    expect(await marked('<p>before <img src="/a.png" alt="x"></p>')).toBe(false);
  });

  // `[![alt](x)](/href)` compiles to `p > a > img`, and a linked figure is still
  // a figure.
  it("marks a paragraph holding nothing but a linked image", async () => {
    expect(await marked('<p><a href="/x"><img src="/a.png" alt="x"></a></p>')).toBe(true);
  });

  it("leaves a paragraph with text beside a linked image unmarked", async () => {
    expect(
      await marked('<p>see <a href="/x"><img src="/a.png" alt="x"></a></p>'),
    ).toBe(false);
  });

  // The anchor is only transparent when it too holds nothing but the image;
  // `[caption ![alt](x)](/href)` is a link with a label, not a figure.
  it("leaves a link that carries text alongside its image unmarked", async () => {
    expect(
      await marked('<p><a href="/x">caption <img src="/a.png" alt="x"></a></p>'),
    ).toBe(false);
  });

  it("leaves a paragraph of plain prose unmarked", async () => {
    expect(await marked("<p>just words</p>")).toBe(false);
  });

  // Two images side by side are a strip, not the single figure the measure
  // exception was written for, so they are left inside the measure.
  it("leaves a paragraph holding two images unmarked", async () => {
    expect(
      await marked('<p><img src="/a.png" alt="a"><img src="/b.png" alt="b"></p>'),
    ).toBe(false);
  });

  it("leaves an image outside a paragraph alone", async () => {
    expect(await run('<div><img src="/a.png" alt="x"></div>')).not.toContain(
      "data-figure",
    );
  });

  // The marker is what Prose selects on, so its exact spelling is part of the
  // contract between this plugin and src/components/site/Prose.tsx.
  it("marks with a bare data-figure attribute", async () => {
    expect(await run('<p><img src="/a.png" alt="x"></p>')).toContain('<p data-figure=""');
  });
});
