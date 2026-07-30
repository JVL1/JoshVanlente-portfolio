import type { Browser, Page, TestInfo } from "@playwright/test";
import { expect, test } from "@playwright/test";
import sharp from "sharp";

const SITE_URL = "https://www.joshvanlente.com";
const WRITE_UP_SLUGS = [
  "all-in-one-rental-platform",
  "cutting-six-of-seven-steps",
  "deterministic-ai-photo-pipeline",
  "product-led-growth-strategy",
  "smarter-payouts-predictive-model",
] as const;
const PUBLISHED_ROUTES = [
  "/",
  "/work",
  "/about",
  ...WRITE_UP_SLUGS.map((slug) => `/work/${slug}`),
];

function canonicalURL(route: string) {
  return route === "/" ? SITE_URL : new URL(route, SITE_URL).href;
}

async function expectFinalStatus(
  response: Awaited<ReturnType<Page["goto"]>>,
  expected: number,
) {
  expect(response, "navigation did not return a response").not.toBeNull();
  expect(response!.status()).toBe(expected);
}

async function collectJavaScript(
  browser: Browser,
  testInfo: TestInfo,
  path: string,
) {
  const context = await browser.newContext({
    baseURL: testInfo.project.use.baseURL as string,
    extraHTTPHeaders: testInfo.project.use.extraHTTPHeaders as
      | Record<string, string>
      | undefined,
  });
  const page = await context.newPage();
  const bodies = new Map<string, Promise<string | null>>();

  page.on("response", (response) => {
    const url = response.url();
    if (/\.js(?:[?#]|$)/.test(url)) {
      bodies.set(
        url,
        response
          .body()
          .then((body) => body.toString("utf8"))
          .catch(() => null),
      );
    }
  });

  try {
    await expectFinalStatus(await page.goto(path, { waitUntil: "networkidle" }), 200);
    return new Map(
      await Promise.all(
        [...bodies].map(async ([url, body]) => [url, await body] as const),
      ),
    );
  } finally {
    await context.close();
  }
}

test.describe("public routes and metadata", () => {
  test("every published route returns a final 200", async ({ request }) => {
    for (const route of PUBLISHED_ROUTES) {
      const response = await request.get(route);
      expect(response.status(), route).toBe(200);
    }
  });

  test("the permanent draft stays out of routes, indexes, and the sitemap", async ({
    request,
  }) => {
    const draft = await request.get("/work/draft-fixture");
    expect(draft.status()).toBe(404);

    for (const route of ["/", "/work", "/sitemap.xml"]) {
      const response = await request.get(route);
      expect(response.status(), route).toBe(200);
      expect(await response.text(), route).not.toContain("draft-fixture");
    }
  });

  test("removed and localized routes return a final 404", async ({ request }) => {
    const removedRoutes = [
      "/en/",
      "/en/work/AI-Pipeline-for-Real-Estate-Photos",
      "/blog",
      "/gallery",
    ];

    for (const route of removedRoutes) {
      const response = await request.get(route);
      expect(response.status(), route).toBe(404);
    }
  });

  test("the sitemap contains the eight published canonical URLs", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const xml = await response.text();
    const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (match) => match[1],
    );

    expect(locations).toHaveLength(8);
    expect(locations).toEqual(
      expect.arrayContaining(
        PUBLISHED_ROUTES.map(canonicalURL),
      ),
    );
    expect(xml).not.toContain("draft-fixture");
  });

  test("robots allows all crawlers and names the production sitemap", async ({
    request,
  }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const robots = await response.text();

    expect(robots).toMatch(/User-Agent:\s*\*/i);
    expect(robots).toMatch(/Allow:\s*\//i);
    expect(robots).toContain(
      "Sitemap: https://www.joshvanlente.com/sitemap.xml",
    );
  });

  test("the bare Open Graph route is a 1920 by 1080 PNG", async ({ request }) => {
    const response = await request.get("/og");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");

    const metadata = await sharp(await response.body()).metadata();
    expect(metadata.format).toBe("png");
    expect(metadata.width).toBe(1920);
    expect(metadata.height).toBe(1080);
  });

  test("published pages use production canonical URLs", async ({ page }) => {
    for (const route of PUBLISHED_ROUTES) {
      await expectFinalStatus(await page.goto(route), 200);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        canonicalURL(route),
      );
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
        "content",
        canonicalURL(route),
      );
    }
  });
});

test.describe("content evidence and navigation", () => {
  test("the homepage exposes four attributed metrics and unique section anchors", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByTestId("metric")).toHaveCount(4);
    const attributions = await page
      .getByTestId("metric-attribution")
      .allTextContents();
    expect(attributions).toHaveLength(4);
    for (const attribution of attributions) {
      expect(attribution).toMatch(/\S+\s+·\s+\S+/);
    }
    await expect(page.locator("#work")).toHaveCount(1);
    await expect(page.locator("#track")).toHaveCount(1);
  });

  test("the work index exposes one non-empty outcome for each published case", async ({
    page,
  }) => {
    await page.goto("/work");
    const outcomes = page.getByTestId("case-outcome");

    await expect(outcomes).toHaveCount(5);
    for (const outcome of await outcomes.allTextContents()) {
      expect(outcome.trim()).not.toBe("");
    }
  });

  test("each work row links to a live write-up", async ({ page, request }) => {
    await page.goto("/work");
    const hrefs = await page
      .getByRole("main")
      .getByRole("link")
      .evaluateAll((links) =>
        links
          .map((link) => link.getAttribute("href"))
          .filter((href): href is string => Boolean(href?.startsWith("/work/"))),
      );

    expect(hrefs).toHaveLength(5);
    expect(new Set(hrefs).size).toBe(5);
    for (const href of hrefs) {
      expect((await request.get(href)).status(), href).toBe(200);
    }
  });

  test("a case-row link is named by its title alone", async ({ page }) => {
    await page.goto("/work");
    const row = page
      .locator("li")
      .filter({ has: page.getByTestId("case-outcome") })
      .first();
    const title = (await row.getByRole("heading").textContent())!.trim();

    await expect(row.getByRole("link")).toHaveAccessibleName(title);
  });

  test("the first keyboard action can skip to main content", async ({ page }) => {
    await page.goto("/");
    const skipLink = page.getByRole("link", { name: "Skip to content" });

    await page.keyboard.press("Tab");
    await expect(skipLink).toBeFocused();
    const focusRing = await skipLink.evaluate((element) => {
      const style = getComputedStyle(element);
      const probe = document.createElement("span");
      probe.style.color = "var(--color-accent)";
      document.body.append(probe);
      const accent = getComputedStyle(probe).color;
      probe.remove();
      return {
        accent,
        color: style.outlineColor,
        style: style.outlineStyle,
        width: Number.parseFloat(style.outlineWidth),
      };
    });
    expect(focusRing.style).not.toBe("none");
    expect(focusRing.width).toBeGreaterThanOrEqual(2);
    expect(focusRing.color).toBe(focusRing.accent);
    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
  });

  test("the comparison slider supports precise keyboard changes", async ({ page }) => {
    await page.goto("/work/deterministic-ai-photo-pipeline");
    const slider = page.getByRole("slider", { name: "Reveal comparison" });

    await expect(slider).toHaveAttribute("aria-valuenow", "50");
    await slider.press("ArrowRight");
    await expect(slider).toHaveAttribute("aria-valuenow", "51");
    await slider.press("End");
    await expect(slider).toHaveAttribute("aria-valuenow", "100");
  });

  test("the slider client chunk stays off a widget-free write-up", async ({
    browser,
  }, testInfo) => {
    const widgetPage = await collectJavaScript(
      browser,
      testInfo,
      "/work/deterministic-ai-photo-pipeline",
    );
    const widgetFreePage = await collectJavaScript(
      browser,
      testInfo,
      "/work/product-led-growth-strategy",
    );
    const sliderChunks = [...widgetPage]
      .filter(
        ([, body]) =>
          body?.includes("aria-valuenow") || body?.includes("Reveal comparison"),
      )
      .map(([url]) => url);

    expect(sliderChunks, "no slider JavaScript chunk was identified").not.toEqual(
      [],
    );
    expect(
      sliderChunks.filter((url) => widgetFreePage.has(url)),
      "a slider chunk loaded on the widget-free write-up",
    ).toEqual([]);
  });
});

test.describe("responsive layout", () => {
  test("the profile name stays on one line across rail layouts", async ({
    page,
  }) => {
    for (const width of [320, 900]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");

      const name = page.getByTestId("profile-name");
      const dimensions = await name.evaluate((element) => ({
        height: element.getBoundingClientRect().height,
        lineHeight: Number.parseFloat(getComputedStyle(element).lineHeight),
      }));

      expect(await name.textContent()).toBe("Josh Van Lente");
      expect(dimensions.height).toBeCloseTo(dimensions.lineHeight, 0);
    }
  });

  test("a 120-character work title cannot create horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/work");
    await page
      .getByRole("main")
      .getByRole("heading", { level: 2 })
      .first()
      .getByRole("link")
      .evaluate((link) => {
        link.textContent = "x".repeat(120);
      });

    const widths = await page.evaluate(() => ({
      content: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));
    expect(widths.content).toBeLessThanOrEqual(widths.viewport);
  });

  test("the 390 layout keeps navigation and evidence in reach", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const navigation = page.getByRole("navigation", { name: "Sections" });
    for (const name of ["Selected work", "Track record", "About"]) {
      const link = navigation.getByRole("link", { name });
      await expect(link).toBeVisible();
      await expect(link).toBeInViewport();
    }

    const metrics = await page.getByTestId("metric").evaluateAll((items) =>
      items.map((item) => {
        const box = item.getBoundingClientRect();
        return { x: Math.round(box.x), y: Math.round(box.y) };
      }),
    );
    expect(new Set(metrics.map(({ x }) => x)).size).toBe(2);
    expect(new Set(metrics.map(({ y }) => y)).size).toBe(2);

    const firstRow = page
      .locator("li")
      .filter({ has: page.getByTestId("case-outcome") })
      .first();
    await expect(firstRow.locator(":scope > div > span")).toBeHidden();
    const thumbnail = await firstRow.locator("img").boundingBox();
    expect(thumbnail).not.toBeNull();
    expect(thumbnail!.width).toBeCloseTo(90, 0);

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
      390,
    );
  });

  test("the 320 layout stacks each work row", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/work");
    const firstRow = page
      .locator("li")
      .filter({ has: page.getByTestId("case-outcome") })
      .first();
    const image = await firstRow.locator("img").boundingBox();
    const title = await firstRow.getByRole("heading").boundingBox();

    expect(image).not.toBeNull();
    expect(title).not.toBeNull();
    expect(image!.width).toBeGreaterThan(200);
    expect(title!.y).toBeGreaterThanOrEqual(image!.y + image!.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
      320,
    );
  });

  test("at least half the first homepage thumbnail is above the desktop fold", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const firstRow = page
      .locator("li")
      .filter({ has: page.getByTestId("case-outcome") })
      .first();
    const thumbnail = await firstRow.locator("img").boundingBox();

    expect(thumbnail).not.toBeNull();
    const visibleHeight = Math.max(
      0,
      Math.min(thumbnail!.y + thumbnail!.height, 800) - Math.max(thumbnail!.y, 0),
    );
    expect(visibleHeight / thumbnail!.height).toBeGreaterThanOrEqual(0.5);
  });
});

test.describe("motion and type safeguards", () => {
  test("rendered leaf text never falls below 12 pixels", async ({ page }) => {
    const routes = [...PUBLISHED_ROUTES, "/work/does-not-exist"];

    for (const route of routes) {
      await page.goto(route);
      const undersized = await page.evaluate(() => {
        const ignored = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"]);
        const offenders: Array<{ fontSize: number; text: string; tag: string }> = [];

        for (const element of document.body.querySelectorAll<HTMLElement>("*")) {
          if (ignored.has(element.tagName)) continue;
          const style = getComputedStyle(element);
          if (style.display === "none" || style.visibility === "hidden") continue;

          for (const node of element.childNodes) {
            if (node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) continue;
            const range = document.createRange();
            range.selectNodeContents(node);
            if (![...range.getClientRects()].some((rect) => rect.width && rect.height)) {
              continue;
            }
            const fontSize = Number.parseFloat(style.fontSize);
            if (fontSize < 12) {
              offenders.push({
                fontSize,
                tag: element.tagName.toLowerCase(),
                text: node.textContent.trim().slice(0, 80),
              });
            }
          }
        }

        return offenders;
      });

      expect(undersized, route).toEqual([]);
    }
  });

  test("reduced motion removes meaningful transitions", async ({ browser }, testInfo) => {
    const context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL as string,
      extraHTTPHeaders: testInfo.project.use.extraHTTPHeaders as
        | Record<string, string>
        | undefined,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();

    try {
      await page.goto("/");
      const motion = await page.evaluate(() => {
        const toMilliseconds = (value: string) =>
          value.endsWith("ms")
            ? Number.parseFloat(value)
            : Number.parseFloat(value) * 1000;
        let longestTransition = 0;
        const passiveAnimations = new Set<string>();

        for (const element of document.body.querySelectorAll<HTMLElement>("*")) {
          for (const pseudo of [null, "::before", "::after"] as const) {
            const style = getComputedStyle(element, pseudo);
            for (const duration of style.transitionDuration.split(",")) {
              longestTransition = Math.max(
                longestTransition,
                toMilliseconds(duration.trim()),
              );
            }
            for (const name of style.animationName.split(",")) {
              if (name.trim() !== "none") passiveAnimations.add(name.trim());
            }
          }
        }

        return { longestTransition, passiveAnimations: [...passiveAnimations] };
      });

      expect(motion.longestTransition).toBeLessThanOrEqual(0.01);
      expect(motion.passiveAnimations).toEqual([]);
    } finally {
      await context.close();
    }
  });
});
