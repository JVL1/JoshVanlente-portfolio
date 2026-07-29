import { Fragment, isValidElement, type ReactNode } from "react";

/**
 * Two readers for a React element tree, so a test can assert what a tree
 * contains instead of matching the source file that builds it.
 *
 * A string match on source is defeated from both directions. A comment carrying
 * the right value satisfies an assertion the shipped code violates, and a comment
 * mentioning the wrong one fails an assertion the code satisfies. Neither is
 * possible against the values below: comments are gone by the time the module is
 * a tree.
 *
 * **Both readers refuse a tree they cannot fully walk.** An earlier version
 * returned `[]` for anything it did not recognise, which made silence
 * indistinguishable from absence and turned every "and nothing else" assertion
 * into a filter. Four constructs went through it, each shipping a visibly wrong
 * card with the whole suite green: a component-typed child hid its entire subtree
 * (`<Tagline/>` printing `AVAILABLE FOR HIRE` in red), the SVG presentation
 * attributes `fill` and `stroke` carried colour outside any `style` object, `tw`
 * set any property `style` left unset, and a `Set` as a child rendered text these
 * readers never saw.
 *
 * So the readers accept exactly what they can genuinely read and throw on
 * everything else. An allowlist of colour-bearing props is a list somebody has to
 * keep complete forever, and the component-typed child defeats even a complete
 * one; a refusal is correct by default and fails loudly the first time the card
 * grows a construct nobody anticipated. Widening it is a deliberate edit here,
 * with the reasoning written down, rather than a silent gap.
 */

/** A tree these readers cannot honestly walk. */
export class UnreadableTree extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnreadableTree";
  }
}

/**
 * The only props these readers understand. `style` is where the colour
 * assertions look, and `children` is the walk itself. Anything else can change
 * what renders in a way no reader below would see, `tw` being the example: on the
 * name element `tw="text-red-500"` moved the card's prerender hash while every
 * assertion stayed green.
 */
const READABLE_PROPS = new Set(["children", "style"]);

/** What one walk of a tree collected, in render order, outermost first. */
type Reading = {
  strings: string[];
  styles: Record<string, unknown>[];
};

const EMPTY: Reading = { strings: [], styles: [] };

function concat(readings: Reading[]): Reading {
  return {
    strings: readings.flatMap((r) => r.strings),
    styles: readings.flatMap((r) => r.styles),
  };
}

/** How to name an element type in an error message. */
function describeType(type: unknown): string {
  if (typeof type === "string") return `<${type}>`;
  if (typeof type === "function") return `<${type.name || "anonymous"}>`;
  return `<${String(type)}>`;
}

function readStyle(style: unknown, at: string): Record<string, unknown> {
  if (typeof style !== "object" || style === null || Array.isArray(style)) {
    throw new UnreadableTree(
      `${at} has a style that is not a plain object, so its colours cannot be read`,
    );
  }
  for (const [prop, value] of Object.entries(style)) {
    // A `url(...)` brings colour in as bytes from somewhere else, exactly as an
    // <img> does, and no reader of this tree can see what is in it.
    if (/url\(/i.test(String(value))) {
      throw new UnreadableTree(
        `${at} sets ${prop} to "${String(value)}", and an image's colours are in ` +
          `its bytes rather than in this tree`,
      );
    }
  }
  return style as Record<string, unknown>;
}

function readElement(node: ReactNode): Reading {
  const { type, props } = node as {
    type: unknown;
    props: Record<string, unknown>;
  };

  if (type !== Fragment && typeof type !== "string") {
    throw new UnreadableTree(
      `${describeType(type)} is a component, and these readers never call it, so ` +
        `everything it renders is invisible to them. Inline what it draws, or ` +
        `assert on the component's own tree.`,
    );
  }

  const at = type === Fragment ? "a fragment" : describeType(type);

  if (type === "img") {
    throw new UnreadableTree(
      `${at} draws colour from image bytes, which this tree does not contain`,
    );
  }

  // A fragment renders no box, so a style on one styles nothing and would only
  // mislead a reader of the assertions.
  const readable = type === Fragment ? new Set(["children"]) : READABLE_PROPS;
  const unreadable = Object.keys(props).filter((p) => !readable.has(p));
  if (unreadable.length > 0) {
    throw new UnreadableTree(
      `${at} carries ${unreadable.join(", ")}. These readers understand style ` +
        `and children only, and refuse the rest rather than guess which props ` +
        `are harmless: fill, stroke, stopColor, floodColor and lightingColor set ` +
        `colour as attributes, and tw sets any property style leaves unset, so ` +
        `none of them reaches a style object. Teach the readers the prop, or ` +
        `take it off the tree.`,
    );
  }

  const style =
    props.style === undefined ? undefined : readStyle(props.style, at);

  return concat([
    { strings: [], styles: style ? [style] : [] },
    read(props.children as ReactNode),
  ]);
}

/** Walk a tree, refusing anything these readers cannot fully see. */
function read(node: ReactNode): Reading {
  if (node === null || node === undefined || typeof node === "boolean") {
    return EMPTY;
  }
  if (typeof node === "string") return { strings: [node], styles: [] };
  if (typeof node === "number") return { strings: [String(node)], styles: [] };
  if (Array.isArray(node)) return concat(node.map(read));
  if (isValidElement(node)) return readElement(node);
  if (typeof node === "object" && Symbol.iterator in node) {
    throw new UnreadableTree(
      `a non-array iterable child (${node.constructor?.name ?? "unknown"}) is ` +
        `rendered by React and Satori and skipped by these readers. Spread it ` +
        `into an array.`,
    );
  }
  throw new UnreadableTree(
    `a child of type ${typeof node} is outside what these readers can walk`,
  );
}

/**
 * Every string the tree renders, outermost first and in render order. Numbers
 * are included as the text they draw, so a hard-coded figure in the tree shows up
 * here rather than slipping past a check that only looks at strings.
 *
 * Throws `UnreadableTree` on any construct the reader cannot walk, so an empty
 * result means the tree renders no text rather than that the walk gave up.
 */
export function stringLeaves(node: ReactNode): string[] {
  return read(node).strings;
}

/**
 * Every `style` object in the tree, outermost first.
 *
 * Throws `UnreadableTree` on the same constructs `stringLeaves` refuses, and on a
 * `url(...)` in a style value, so a caller counting the colours in this list is
 * counting all of them.
 */
export function styleObjects(node: ReactNode): Record<string, unknown>[] {
  return read(node).styles;
}
