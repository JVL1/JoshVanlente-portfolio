import { visit } from "unist-util-visit";

/**
 * The shape this plugin reads off a hast node. Declared locally rather than
 * imported from `hast`, for the reason rehype-image-dimensions.ts records:
 * velite.config.ts bundles this file with esbuild, so its import list stays
 * short.
 */
type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

/**
 * Markdown puts a newline on each side of a block image, so a paragraph that
 * holds nothing but an image still arrives with whitespace text nodes beside
 * it. Those are layout, not content.
 */
const isWhitespace = (node: HastNode) =>
  node.type === "text" && (node.value ?? "").trim() === "";

/** The children that carry content, with the incidental whitespace dropped. */
const contentOf = (node: HastNode) =>
  (node.children ?? []).filter((child) => !isWhitespace(child));

const isImage = (node: HastNode) => node.type === "element" && node.tagName === "img";

/**
 * Whether an image is the whole of this node's content.
 *
 * An anchor counts as transparent when it too holds nothing but the image, so
 * `[![alt](x)](/href)` — which compiles to `p > a > img` — is a figure, while
 * `[caption ![alt](x)](/href)` is a link with a label and is not.
 */
function isSolelyImage(node: HastNode): boolean {
  const content = contentOf(node);
  if (content.length !== 1) return false;

  const only = content[0];
  if (isImage(only)) return true;
  if (only.type === "element" && only.tagName === "a") return isSolelyImage(only);
  return false;
}

/**
 * Mark a paragraph whose entire content is one image, so Prose can give it the
 * full column while every other paragraph keeps the 68ch reading measure.
 *
 * Prose used to draw that line in CSS, with `p:has(> img:only-child)` and the
 * linked-image variant beside it. Both were wrong in the same way: CSS
 * `:only-child` counts element siblings and ignores text nodes, so a paragraph
 * of prose written as `text ![alt](x) text` has the image as its only *element*
 * and lost the measure the rule existed to protect. There is no CSS fix,
 * because the thing that has to be inspected is a text node.
 *
 * Here the text nodes are still in the tree, so the question is decidable.
 * Deciding it once, at build time, and leaving one attribute behind also means
 * one rule in Prose that means one thing.
 *
 * The marker is a `data-` attribute rather than a class because it states a
 * fact about the paragraph — its content is a figure — rather than naming an
 * appearance. Prose is then free to change what a figure looks like without the
 * transform knowing.
 */
export default function rehypeFigureParagraph() {
  return (tree: unknown) => {
    visit(tree as never, (node: unknown) => {
      const element = node as HastNode;
      if (element.type !== "element" || element.tagName !== "p") return;
      if (!isSolelyImage(element)) return;

      element.properties = { ...element.properties, "data-figure": "" };
    });
  };
}
