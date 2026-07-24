# Portfolio Rebuild

**Status:** approved — converged after two rounds of multi-model design review (Claude, Gemini, Codex), exiting at 0 critical and 1 major, all addressed
**Prototype:** `prototypes/homepage.html` (variant E) — verdict in `prototypes/NOTES.md`

## Problem

The site is Once UI's `magic-portfolio` template with a thin layer of customization on top. Adding a widget means editing a flat registry that ships every widget to every page. Restyling means fighting a vendored design system of 52 components, of which 21 are used and three — `Flex`, `Text`, `Heading` — account for 76% of all usage. The content model has no field for the accomplishments the site exists to showcase, so every quantified win lives in prose or in hardcoded JSX inside `content.js`.

The content is also a year stale. The live site shows Azibo as the current job and is missing both Built and Evernest. Meanwhile much of the shipped surface area serves nobody: internationalization is fully wired but switched off, the blog route is disabled and holds only template stock posts, the gallery shows 14 template photographs, and `src/pages/api` holds a password-protection feature whose `protectedRoutes` map is empty. An orphaned Yahoo fantasy-sports app was removed from this branch in `72081cb`.

## Goals

1. Josh owns every line of the presentation layer and can retheme the site from one token file.
2. A write-up's accomplishments are structured data, rendered consistently wherever they appear, authored once.
3. Publishing is: add a markdown file to `content/work/`, fill the required frontmatter, open a pull request. Malformed or incomplete frontmatter fails the build.
4. A hiring manager skimming for 20 seconds gets the name, the positioning, four attributed metrics, and visible evidence that case studies exist — on a phone as well as a laptop.
5. Rich embeds stay easy to add, and ship only to the write-ups that use them.

## Non-Goals

- **No content management system.** The MDX-in-git workflow demonstrably works — four case studies shipped through it, including one with a hand-built interactive widget.
- **No second content type.** No short-form blog and no notes surface. In 19 months Josh wrote four project write-ups and zero short-form posts.
- **No internationalization.** Single locale and no `[locale]` segment.
- **No redirects for existing `/en/*` URLs.** Deliberate: see the decision note under Migration. Every currently indexed URL will 404.
- **No hosted résumé.** Email is the contact path, by choice.
- **No light mode.** The design's identity is acid green on near-black; the accent fails contrast on white and would need to become a different color.
- **Not a component library.** shadcn primitives get pulled in only where behavior demands it.

## Acceptance Criteria

**Removal and hygiene**

- [ ] `grep -r once-ui src/` returns nothing, and `src/once-ui/` is deleted.
- [ ] `npm ci` succeeds, and none of `next-intl`, `yahoo-fantasy`, `sass`, `@types/cookie`, `cookie`, `react-masonry-css`, `next-themes`, `prismjs`, `@types/prismjs`, `remixicon`, `@floating-ui/react-dom`, `classnames`, `@csstools/postcss-global-data`, `postcss-custom-media`, `postcss-flexbugs-fixes`, `postcss-preset-env`, or `autoprefixer` appears in `package.json` or `package-lock.json`.
- [ ] `next.config.*` is a single file.

**Content pipeline**

- [ ] A write-up missing `outcomes` fails the build with a non-zero exit code and a message naming the file and the failing field. Verified by a fixture test that corrupts frontmatter and asserts both.
- [ ] A write-up with no `slug` fails the build; two write-ups with the same slug fail the build.
- [ ] A write-up with both `roleId` and a literal `org`/`role` pair fails the build, as does one with neither.
- [ ] A `roleId` that matches no `profile.ts` role fails the build.
- [ ] A write-up with `draft: true` is absent from the index, the sitemap, and `generateStaticParams`, and returns 404 at its URL.
- [ ] Every non-empty `headlineOutcome.slug` resolves to a published write-up, checked at build time.
- [ ] `profile.ts` declaring other than exactly four `headlineOutcomes` fails the build.

**Rendering**

- [ ] The homepage metric strip and Track record render from typed data in `src/data/profile.ts`; write-up cards render outcomes from frontmatter. Neither is hardcoded JSX.
- [ ] A production build of a write-up that embeds no widget does not request the `BeforeAfterSlider` chunk. Verified by a Playwright network assertion.
- [ ] Track record matches this list exactly (transcribed from the July 2026 résumé, which stays out of the repo — committing it would publish a phone number permanently in git history):

  | Org | Title | Dates |
  |---|---|---|
  | Evernest | Staff Product Manager, AI/LLM Initiatives | Sep 2025 – present |
  | Built | Principal Product Manager | Mar 2025 – Aug 2025 |
  | Azibo | Senior Manager, Product Management | Mar 2023 – Mar 2025 |
  | Azibo | Senior Product Manager | Feb 2022 – Mar 2023 |
  | Upstart | Product Manager | Jul 2019 – Sep 2021 |
  | Twitter | Product Manager | 2018 – 2019 |
  | Ampush | Senior Product Manager | 2013 – 2018 |

- [ ] At 390×844 (iPhone 14 viewport) the rail is collapsed, all navigation is reachable, and no horizontal scroll occurs.
- [ ] At 1280×800, at least half of the first case-study thumbnail is visible without scrolling.
- [ ] `/en/*` returns 404 (pinning the deliberate no-redirect decision, so it is a choice rather than an accident).

**Quality**

- [ ] Lighthouse CI, run against the production build in headless Chrome with the default desktop preset, median of three runs, scores ≥ 95 for both Accessibility and Performance on the homepage, the work index, and a write-up.

## Architecture

Content is decoupled from routing. MDX moves out of the router to `content/work/` at the repo root. A single Zod schema in `velite.config.ts` serves as both the TypeScript type and the build-time validator, emitting typed data to a gitignored `.velite/`.

```
content/work/*.mdx           content, decoupled from routing
velite.config.ts             Zod schema: types and validation, one definition
src/
  app/                       routes only; no content, no [locale]
  components/ui/             shadcn primitives, owned source, added on demand
  components/site/           Rail, MetricStrip, CaseRow, SectionHeader, Prose
  components/mdx/            MDXContent evaluator, registry, and widgets
  data/profile.ts            typed career data, replaces content.js
  lib/content.ts             async loader: draft filtering, sorting, lookup
  styles/globals.css         @theme token block
```

### The loader is the seam, and it is async

`src/lib/content.ts` is the only module that imports from `.velite/generated`. It exists because draft filtering has to happen in one place — if pages filtered drafts themselves, a draft would eventually leak into the sitemap or `generateStaticParams`. It is not a speculative abstraction; it has a job.

Its functions are `async` even though Velite's output is a synchronous import. Velite emits synchronous data, but every plausible replacement — `gray-matter` with `next-mdx-remote/rsc`, or raw `fs` — is asynchronous. Declaring the boundary async from the start means a replacement changes the function bodies rather than the signature of every calling component. The cost is one keyword.

There is no repository class or content service beyond this. Pages call `getWorkItems()` and `getWorkItem(slug)`.

### Write-up bodies render on the server

Velite compiles MDX to a function-body string, which is evaluated with `new Function(code)(runtime)`. This runs in a React Server Component — it is the pattern Velite's own Next.js example uses, with no `use client` directive.

Only interactive widgets carry a client boundary. `BeforeAfterSlider` is a client component passed into the evaluator through the registry; the surrounding prose stays on the server. This keeps the MDX runtime and every compiled body out of the browser bundle, makes the "widgets ship only where used" criterion literally true, and avoids needing `unsafe-eval` in a Content Security Policy later.

*(Corrected from round 1, which incorrectly claimed the entire write-up body had to be a client component.)*

### Replacement cost, stated honestly

Replacing Velite touches three things: `velite.config.ts`, the `MDXContent` evaluator (which is coupled to Velite's compile-to-function-body output contract), and the body of `src/lib/content.ts`. Consuming components are unaffected because the loader's signature already returns promises. That is the real blast radius — small, but larger than the "one config file and two import sites" claimed in round 1, and it is the number a spike-failure decision gets made against.

### Two data sources

Career-level facts and per-write-up facts live in different places. `src/data/profile.ts` holds the roles that feed Track record and the `headlineOutcomes` that feed the metric strip. Frontmatter holds each write-up's own outcomes.

The outcomes genuinely do not overlap: three of the four homepage metrics are Azibo career outcomes, the Upstart figure belongs to no write-up, and none of the four existing write-ups carries a quantified outcome today. Sourcing the strip from frontmatter would mean fabricating write-ups or dropping metrics.

The *role metadata* would overlap if frontmatter restated it, which is exactly the duplication that let "Prouct Manager" sit misspelled for a year. So it does not restate it: employed work carries a `roleId` that resolves `org` and `title` from `profile.ts` at load time, making drift structurally impossible rather than merely tested against. Independent work, which has no `profile.ts` role, supplies `org` and `role` literally.

```ts
type Role = {
  id: string;              // stable key referenced by frontmatter roleId
  org: string;
  title: string;
  start: string;           // "2025-09"
  end: string | null;      // null = current
  achievements: string[];
}

type HeadlineOutcome = {
  metric: string;          // "2.8×"
  label: string;           // "Monetized users"
  org: string;             // "Azibo"      — structured, not free text
  period: string;          // "2023—25"
  slug?: string;           // optional link to a write-up
}
```

`headlineOutcomes` is validated as exactly four entries. The metric strip is a four-column layout; three would leave a hole and five would wrap. Making the count a schema rule rather than a convention means the homepage cannot silently degrade, and `org` and `period` are separate fields so attribution cannot be omitted or free-texted away.

### Content schema

Employed work references a role in `profile.ts` rather than restating it:

```yaml
---
slug: "envoy-agent-platform"     # required, authored, unique within 'work'
title: "Envoy: an agent platform with humans in the loop"
summary: "One sentence. Shows on the card and in search results."
publishedAt: "2026-07-24"
updatedAt: "2026-08-01"          # optional
roleId: "evernest-staff-pm"      # resolves org + title from profile.ts
timeframe: "Sep 2025 — Feb 2026" # PROJECT dates, not employment dates
tags: ["AI/LLM", "Platform", "0→1"]
outcomes:                        # required, minimum 1
  - metric: "~50%"
    label: "Modeled cut in operational workload"
cover: "/images/work/envoy/cover.png"
draft: false                     # true keeps it out of every published surface
---
```

Independent work carries `org` and `role` literally instead of `roleId`, since no `profile.ts` role exists for it. Exactly one of `roleId` or the `org`/`role` pair must be present, enforced by the schema.

`slug` is authored and validated by `s.slug('work')`, which checks format and uniqueness within the collection. It is deliberately not derived from the filename, so renaming a file cannot silently change a live URL — but that means every write-up must declare one, including the four being ported.

`timeframe` always describes the project, never the employment period. Employment dates live only in `profile.ts`. This removes the ambiguity that made a naive cross-check impossible: Azibo has two roles with different titles and dates, and a write-up spanning both would have had no correct answer.

Drafts stay in Velite's generated output and are filtered by `src/lib/content.ts`, not excluded at the schema level. Filtering in the loader keeps one place responsible for the rule and leaves room for a preview mechanism later. `cover` uses Velite's `s.image()`, which parses local files and emits intrinsic `width` and `height` — the `next/image` dimensions the Lighthouse criterion depends on.

`outcomes` requires a minimum of one, not two to three. Round 1 required two to three, which would have forced weak or invented metrics into narrative write-ups such as the all-in-one rental platform vision. One real number beats three padded ones.

### Metadata and SEO

`app/layout.tsx` exports the root `metadata` with the site title template, description, and default OpenGraph image. Each write-up's `generateMetadata` maps frontmatter to metadata directly: `title` → title, `summary` → description and `og:description`, `cover` → `og:image` with the existing `/og` route as fallback, `publishedAt`/`updatedAt` → `article:published_time`/`article:modified_time`, and a canonical URL built from `baseURL` and the slug. `sitemap.ts` and `robots.ts` consume the same loader as the pages, so drafts cannot leak.

All frontmatter-driven images render through `next/image` with explicit dimensions, which the Lighthouse criterion depends on.

## Responsive behavior

The sticky rail is a desktop layout and does not survive narrow viewports. Below 900px the shell collapses to a single column: the rail becomes a static header carrying the name and role, navigation moves to a horizontal row beneath it, and contact links move to the footer. The metric strip goes from four columns to two. Case rows drop the year column and shrink the thumbnail to 90px.

This is the one layout question the prototype answers only approximately — its media queries were written to keep the mock honest, not to be a specification. The mobile layout gets its own prototype pass before implementation.

## Stack

| Choice | Version | Note |
|---|---|---|
| Node.js | 22 LTS, pinned | `.nvmrc`, `package.json` `engines`, and the Vercel project setting must agree — Next 16 requires ≥20.9, and an unpinned version lets local and Vercel builds diverge |
| Next.js | 16.2.11 | Fresh scaffold, App Router, Turbopack default |
| React | 19.2.8 | |
| Tailwind CSS | 4.3.3 | `@theme` block is the token layer |
| Velite | 0.4.0 pinned exactly | Pre-1.0, published 2026-06-17; a 1.0-alpha line runs in parallel |
| shadcn/ui | on demand | Initialized when the first behavioral widget needs it |

### Velite integration and the spike

Velite's `VeliteWebpackPlugin` does not work with Turbopack, which Next 16 enables by default. The integration therefore runs Velite as its own process rather than as a bundler plugin: `velite --watch` alongside `next dev`, and `velite build --clean --strict` before `next build`.

`strict: true` is mandatory, not optional. Velite's `strict` defaults to `false`, under which schema failures log a warning and the build continues — which would silently defeat Goal 3 and the build-failure acceptance criterion.

The spike is task one and gates everything after it. It passes only if, starting with `.velite/` deleted, all of the following hold:

1. A production build succeeds under Turbopack on the pinned Node version.
2. A Vercel preview build succeeds.
3. In dev, adding, editing, and deleting a content file regenerates output and updates the page.
4. Invalid frontmatter exits non-zero and names the file and the failing field. (Velite's error formatting naming the field is an assumption to verify, not a given.)
5. A write-up embedding a client widget renders and hydrates.
6. TypeScript types are emitted and resolve.

**Fallback if the spike fails:** `gray-matter` for parsing, Zod for the schema, and `next-mdx-remote/rsc` for rendering, behind the same `src/lib/content.ts` signature. This is roughly 80 lines and was the round-1 recommendation; naming it here means a spike failure has a next move instead of a stall.

The fallback loses one thing worth budgeting for: Velite's `s.image()` emits intrinsic image dimensions automatically, and `gray-matter` does not. Recovering the `next/image` dimensions the Lighthouse criterion depends on means adding `rehype-img-size` or reading dimensions in the loader — perhaps twenty more lines, but it is not free.

shadcn is the decided answer for behavioral widgets, but nothing in the current component list needs Radix — the rail is links, the metric strip is text, and case rows are anchors. It gets initialized when the first widget appears; an image lightbox on write-ups is the likely candidate.

## Design

Variant E from the prototype. A sticky left identity rail carries the name, navigation, and contact details permanently on screen. The main column runs an editorial headline with a serif italic accent, then a metric strip, then case rows with thumbnails near the fold, then the track record.

Acid green `#c8ff2e` is spent in exactly three places — the headline italic, hover states, and the availability indicator — because an accent used everywhere stops being an accent. Metric numerals are set in light Instrument Serif rather than bold sans, which reads closer to an annual report than a startup dashboard. Every metric is attributed with company and year, since an unattributed number reads as a claim and an attributed one reads as evidence.

Fonts load through `next/font` — Inter for text, Instrument Serif for numerals and the headline italic, JetBrains Mono for labels. Full rationale in `prototypes/NOTES.md`.

## Components and data flow

| Component | Source |
|---|---|
| `Rail` | `profile.ts` |
| `MetricStrip` | `profile.ts` → `headlineOutcomes` |
| `TrackRecord` | `profile.ts` → `roles` |
| `CaseRow` | `lib/content.ts` |
| `SectionHeader` | props, used three times |
| `Prose` | props |
| `MDXContent` | server-side evaluator; registry supplies widgets |

## Error handling

Schema violations fail the build under `--strict` and name the offending file and field. Unknown or draft slugs call `notFound()`. Drafts are filtered inside `lib/content.ts` rather than at the page, so they cannot reach the sitemap, the OG route, or `generateStaticParams`.

## Testing

Vitest covers the pure functions: draft filtering, date formatting, headline-outcome slug resolution, and `roleId` resolution against `profile.ts`. Fixture tests assert that the build exits non-zero and names the field for each schema rule above — missing slug, duplicate slug, missing outcomes, both-or-neither `roleId`, unresolvable `roleId`, and a headline-outcome count other than four.

Playwright covers the criteria that only hold in a real build:

- Every route returns 200; a draft returns 404; `/en/*` returns 404.
- The metric strip renders exactly four items, each showing an organization and a period.
- A widget-free write-up never requests the `BeforeAfterSlider` chunk.
- At 390×844: every navigation link is reachable and `document.scrollWidth` does not exceed the viewport width.
- At 1280×800: the first case-study thumbnail's bounding box is at least 50% above the fold.

Accessibility and performance are measured by Lighthouse CI rather than axe, so the number in the criteria and the number the tests produce are the same.

## Build order

1. **Velite spike.** Prove the six conditions above. Throwaway; do not build on it until it passes.
2. **Scaffold and clear.** Fresh `package.json`, Next 16, Tailwind `@theme` tokens — and in the same step delete `src/app/[locale]`, `middleware.ts`, `src/once-ui`, `src/pages`, and the duplicate `next.config`, keeping only `public/images` and the MDX to port. The old tree imports `next-intl`, SCSS modules, and React 18-era dependencies, so leaving it in place means nothing compiles until it is removed. The build must be green at the end of every step from here on.
3. **Content layer.** Schema, `lib/content.ts`, `profile.ts` with role `id`s, and port the four existing write-ups. Porting means authoring frontmatter that does not exist today: a `slug`, a `roleId` (or literal `org`/`role` for the freelance piece), `timeframe`, `tags`, `cover`, and at least one honest `outcome` per file. Confirm each of the four has a real metric before freezing the schema — if one genuinely has none, that is a signal about the write-up, not about the schema.
4. **Write-up page.** `MDXContent` evaluator, registry, `BeforeAfterSlider` as a client component, `Prose` typography, and code-block rendering (the AI pipeline write-up contains JSON fences).
5. **Work index.**
6. **Homepage** (variant E) and `profile.ts`.
7. **About.**
8. **Site chrome and SEO.** Root metadata, `generateMetadata`, `sitemap.ts`, `robots.ts`, the `/og` route, favicon, and fonts.
9. **Responsive pass.** Prototype the mobile layout, then implement it.
10. **Verification sweep.** Run every acceptance criterion: the greps, `npm ci`, the dependency audit, Lighthouse CI, and the Playwright suite.
11. **Cutover.** Record the current production deployment as the rollback target, verify the Vercel preview against a URL matrix covering retained and removed routes plus sitemap, robots, canonical tags, and social previews. Merge, verify joshvanlente.com, then delete `prototypes/`.

## Decision notes

**Dropping `/en/*` redirects.** Every live URL currently sits under `/en/*` because `localePrefix` is `always`, so removing i18n 404s every indexed and previously shared link — including any a hiring manager holds. All three reviewers flagged this; the mitigation is about six lines in `next.config`. Josh weighed it and chose to accept the loss. Recorded here so the decision is visible, with an acceptance criterion pinning the resulting behavior.

## Open Questions

- **Where the metric strip sits relative to the work list.** Roughly 240px was trimmed from the hero to keep case-study thumbnails near the fold. If the 1280×800 criterion cannot be met with the strip above the work list, the strip moves below it and becomes the closer.
- **About page content.** The shape is settled — narrative plus supporting credentials, with work history staying on the homepage. The copy is not written.

## Known content gaps

Content problems, not design problems; the rebuild does not fix them.

- No write-up covers Evernest or Built. The strongest and most current work exists only as résumé bullets. Drafts are in progress.
- None of the four existing write-ups carries a quantified outcome, so step 3 involves real authoring, not mechanical porting.
- `content.js` shows a Once UI template stock image (`alt: 'Once UI Project'`) inside the Azibo, Upstart, Twitter, and Ampush entries.
- "Product Manager" is misspelled "Prouct Manager" three times, Ampush is understated as PM rather than Senior PM, and the education minor is listed as Environmental Economics rather than Sustainability.
- The author of the product-led growth write-up is recorded as `"  Lente"`.
