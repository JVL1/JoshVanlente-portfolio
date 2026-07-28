import { existsSync } from "node:fs";
import { resolve, sep } from "node:path";
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
 * A raw `<img />` written as JSX in an MDX body. MDX keeps these as their own
 * node types rather than lowering them to `element`, so they are invisible to
 * the `element` visit below — see the rejection in the visitor for why that
 * matters enough to fail the build.
 */
type MdxJsxElement = {
  type: "mdxJsxFlowElement" | "mdxJsxTextElement";
  name: string | null;
};

/**
 * Resolve an absolute site path such as `/images/a.png` to a file under `dir`.
 *
 * The src is a URL, not a path: it can carry a query string, a fragment, and
 * percent-encoding. Reading it as a path made `/images/my%20chart.png` and
 * `/images/chart.png?v=2` fail the build even though the file was right there.
 * Parsing it as a URL first and decoding the pathname fixes both.
 *
 * Parsing also confines the result to `dir`. The previous `join(dir, src)` let
 * `/images/../../secrets.png` walk out of the public root; URL parsing folds
 * dot segments — percent-encoded ones included — so the path that reaches the
 * filesystem is the one the browser would have fetched. The explicit check
 * below is a backstop, not the mechanism.
 */
function resolveUnderRoot(dir: string, src: string): string {
  const root = resolve(dir);

  let pathname: string;
  try {
    pathname = decodeURIComponent(new URL(src, "file:///").pathname);
  } catch {
    throw new Error(
      `rehype-image-dimensions: cannot read image src "${src}" as a URL`,
    );
  }

  const file = resolve(root, `.${pathname}`);
  if (file !== root && !file.startsWith(root + sep)) {
    throw new Error(
      `rehype-image-dimensions: image src "${src}" resolves outside ${root}`,
    );
  }
  return file;
}

/**
 * Body images live in public/ and are written as absolute paths, so Velite's
 * s.image() never sees them and they reach the page with no intrinsic size.
 * next/image then cannot reserve layout space, and the reflow when each one
 * loads costs Cumulative Layout Shift — the metric the performance criterion
 * is scored on. Stamping width and height here gives it real dimensions.
 *
 * A missing file throws rather than passing through, so a typo'd image path
 * fails the build instead of shipping a broken image.
 *
 * Every error found during the walk is collected rather than thrown from inside
 * the visitor. A throw out of the visitor skips the `await` below, so a sharp
 * job already running rejects with nobody listening, and Node kills the build on
 * the unhandled rejection — printing sharp's anonymous "unsupported image
 * format" instead of the message naming the file the author got wrong. Two bad
 * images in one body was enough to hit it.
 */
export default function rehypeImageDimensions({ dir = "public" }: Options = {}) {
  return async (tree: unknown) => {
    const jobs: Promise<void>[] = [];
    const errors: Error[] = [];

    const visitNode = (node: unknown) => {
      const candidate = node as HastElement | MdxJsxElement;

      // A raw `<img />` in an MDX body is an mdxJsxFlowElement or
      // mdxJsxTextElement, never an `element`, so it slips past this plugin:
      // no dimensions, and — worse — no missing-file check, which is the whole
      // reason a typo'd path is supposed to fail the build. It also compiles to
      // a literal `_jsx("img", …)` rather than through the MDX component
      // registry, so it bypasses next/image too. Rejecting it keeps one
      // authoring path for body images instead of two that behave differently.
      if (
        (candidate.type === "mdxJsxFlowElement" ||
          candidate.type === "mdxJsxTextElement") &&
        candidate.name === "img"
      ) {
        errors.push(
          new Error(
            "rehype-image-dimensions: write body images as markdown " +
              "(![alt](/images/…)), not as a raw <img /> — a raw tag skips both " +
              "the missing-file check and next/image",
          ),
        );
        return;
      }

      if (candidate.type !== "element") return;
      const element = candidate as HastElement;
      if (element.tagName !== "img") return;

      const properties = element.properties;
      if (!properties) return;

      const src = properties.src;
      // A protocol-relative "//cdn/a.png" also starts with "/" and is remote.
      if (typeof src !== "string" || !src.startsWith("/") || src.startsWith("//")) return;

      // The file is resolved and checked before any dimension is considered, so
      // a typo'd path fails the build whatever the author wrote alongside it.
      // Checking after the dimension guard let `<img src="/tpyo.png" width="300">`
      // skip the check entirely, and that check is the guarantee this plugin
      // exists to give.
      let file: string;
      try {
        file = resolveUnderRoot(dir, src);
      } catch (error) {
        errors.push(error as Error);
        return;
      }

      if (!existsSync(file)) {
        errors.push(
          new Error(
            `rehype-image-dimensions: no such image "${src}" (looked in ${file})`,
          ),
        );
        return;
      }

      // Usable, not merely present. registry.tsx hands next/image
      // `Number(width)`, and next/image needs a positive finite number in both
      // slots — it derives neither from the other. Anything else arrives as NaN
      // and next/image throws `invalid "width" property`. Presence was the wrong
      // test twice over: hast turns both `width=""` and a valueless `width` into
      // the empty string, and `width="0"` is a number next/image rejects, yet
      // all three suppressed the stamp and shipped an image that cannot render.
      const usable = (value: unknown) => {
        const n = Number(value);
        return Number.isFinite(n) && n > 0;
      };
      const hasWidth = usable(properties.width);
      const hasHeight = usable(properties.height);
      if (hasWidth && hasHeight) return;

      jobs.push(
        sharp(file)
          .metadata()
          .then(({ width, height }) => {
            if (!width || !height) {
              throw new Error(`rehype-image-dimensions: no dimensions in "${src}"`);
            }
            // A single usable dimension is still an authored choice, so it is
            // kept and its partner is derived from the intrinsic aspect ratio.
            // That derivation is the work next/image does not do, and it is why
            // stamping the intrinsic size over the author's half was wrong.
            if (hasWidth) {
              properties.height = Math.round((Number(properties.width) * height) / width);
            } else if (hasHeight) {
              properties.width = Math.round((Number(properties.height) * width) / height);
            } else {
              properties.width = width;
              properties.height = height;
            }
          })
          // sharp names the format it could not read but never the file, so its
          // bare error sends the author looking through every image in the body.
          .catch((cause: Error) => {
            throw new Error(
              `rehype-image-dimensions: cannot read image "${src}": ${cause.message}`,
              { cause },
            );
          }),
      );
    };

    // The walk is wrapped because the settle loop below is what keeps an
    // in-flight sharp job from rejecting unattached. Every throw the visitor
    // raises on purpose is already a push onto `errors`, so this catch is for
    // the ones nobody planned — a malformed tree, or a later edit that puts a
    // throw back. Either way the jobs still get settled.
    try {
      visit(tree as never, visitNode);
    } catch (error) {
      errors.push(error as Error);
    }

    // Every job is settled before anything throws, so none is left rejecting
    // unattached. The walk's own errors come first: they name what the author
    // wrote, while a job error is usually a consequence of it.
    for (const settled of await Promise.allSettled(jobs)) {
      if (settled.status === "rejected") errors.push(settled.reason as Error);
    }

    // Every bad image is named at once. Throwing only the first made three
    // typos cost three build cycles, each revealing the next.
    if (errors.length === 1) throw errors[0];
    if (errors.length > 1) {
      throw new AggregateError(errors, errors.map((error) => error.message).join("\n"));
    }
  };
}
