import { describe, expect, it } from "vitest";
import WorkItemPage, { generateStaticParams } from "@/app/work/[slug]/page";

/**
 * These two live in the `node` project rather than `tests/component` because
 * neither one renders anything: `generateStaticParams` returns a plain array,
 * and the 404 path throws before the page returns any JSX. A DOM would only add
 * setup cost to a pair of assertions about return values.
 */

/** What `notFound()` throws, matched by Next's error boundary. */
const NOT_FOUND_DIGEST = "NEXT_HTTP_ERROR_FALLBACK;404";

/** The five write-ups under content/work that are not drafts. */
const PUBLISHED_SLUGS = [
  "all-in-one-rental-platform",
  "cutting-six-of-seven-steps",
  "deterministic-ai-photo-pipeline",
  "product-led-growth-strategy",
  "smarter-payouts-predictive-model",
];

async function digestFromRendering(slug: string): Promise<unknown> {
  try {
    await WorkItemPage({ params: Promise.resolve({ slug }) });
  } catch (error) {
    return (error as { digest?: unknown }).digest;
  }
  throw new Error(`/work/${slug} rendered a page instead of a 404`);
}

describe("the /work/[slug] route", () => {
  it("prerenders every published slug and no draft", async () => {
    const params = await generateStaticParams();

    expect(params.map((p) => p.slug).toSorted()).toEqual(PUBLISHED_SLUGS);
  });

  // content/work/draft-fixture.mdx is committed on purpose and must never reach
  // a page. Until now the only thing checking that was a curl against a running
  // server, which nothing re-runs.
  it.each(["draft-fixture", "no-such-write-up"])(
    "404s on /work/%s",
    async (slug) => {
      expect(await digestFromRendering(slug)).toBe(NOT_FOUND_DIGEST);
    },
  );
});
