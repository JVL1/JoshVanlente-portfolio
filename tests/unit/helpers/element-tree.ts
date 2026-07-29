import { isValidElement, type ReactNode } from "react";

/**
 * Two readers for a React element tree, so a test can assert what a tree
 * contains instead of matching the source file that builds it.
 *
 * A string match on source is defeated from both directions. A comment carrying
 * the right value satisfies an assertion the shipped code violates, and a comment
 * mentioning the wrong one fails an assertion the code satisfies. Neither is
 * possible against the values below: comments are gone by the time the module is
 * a tree.
 */

type ElementProps = { children?: ReactNode; style?: Record<string, unknown> };

function props(node: ReactNode): ElementProps {
  return (node as { props: ElementProps }).props;
}

/**
 * Every string the tree renders, outermost first and in render order. Numbers
 * are included as the text they draw, so a hard-coded figure in the tree shows up
 * here rather than slipping past a check that only looks at strings.
 */
export function stringLeaves(node: ReactNode): string[] {
  if (typeof node === "string") return [node];
  if (typeof node === "number") return [String(node)];
  if (Array.isArray(node)) return node.flatMap(stringLeaves);
  if (isValidElement(node)) return stringLeaves(props(node).children);
  return [];
}

/** Every `style` object in the tree, outermost first. */
export function styleObjects(node: ReactNode): Record<string, unknown>[] {
  if (Array.isArray(node)) return node.flatMap(styleObjects);
  if (!isValidElement(node)) return [];
  const { style, children } = props(node);
  return [...(style ? [style] : []), ...styleObjects(children)];
}
