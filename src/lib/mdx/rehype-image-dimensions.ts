import { existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { visit } from "unist-util-visit";

type Options = { dir?: string };

/**
 * The shape this plugin reads off a hast element. Declared locally rather than
 * imported from `hast`, because velite.config.ts bundles this file with esbuild
 * and the plan holds its import list to four entries.
 */
type HastElement = {
  type: "element";
  tagName: string;
  properties?: Record<string, unknown>;
};

/**
 * Body images live in public/ and are written as absolute paths, so Velite's
 * s.image() never sees them and they reach the page with no intrinsic size.
 * next/image then cannot reserve layout space, and the reflow when each one
 * loads costs Cumulative Layout Shift — the metric the performance criterion
 * is scored on. Stamping width and height here gives it real dimensions.
 *
 * A missing file throws rather than passing through, so a typo'd image path
 * fails the build instead of shipping a broken image.
 */
export default function rehypeImageDimensions({ dir = "public" }: Options = {}) {
  return async (tree: unknown) => {
    const jobs: Promise<void>[] = [];

    visit(tree as never, "element", (node: unknown) => {
      const element = node as HastElement;
      if (element.tagName !== "img") return;

      const properties = element.properties;
      if (!properties) return;

      const src = properties.src;
      // A protocol-relative "//cdn/a.png" also starts with "/" and is remote.
      if (typeof src !== "string" || !src.startsWith("/") || src.startsWith("//")) return;
      if (properties.width && properties.height) return;

      const file = join(dir, src);
      if (!existsSync(file)) {
        throw new Error(
          `rehype-image-dimensions: no such image "${src}" (looked in ${file})`,
        );
      }

      jobs.push(
        sharp(file)
          .metadata()
          .then(({ width, height }) => {
            if (!width || !height) {
              throw new Error(`rehype-image-dimensions: no dimensions in "${src}"`);
            }
            properties.width = width;
            properties.height = height;
          }),
      );
    });

    await Promise.all(jobs);
  };
}
