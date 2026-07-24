# Portfolio Rebuild

**Status:** approved, ready for planning
**Prototype:** `prototypes/homepage.html` (variant E) — verdict in `prototypes/NOTES.md`

## Problem

The site is Once UI's `magic-portfolio` template with a thin layer of customization on top. Adding a widget means editing a flat registry that ships every widget to every page. Restyling means fighting a vendored design system of roughly 80 components, of which 21 are used and three — `Flex`, `Text`, `Heading` — account for 76% of all usage. The content model has no field for the accomplishments the site exists to showcase, so every quantified win lives in prose or in hardcoded JSX inside `content.js`.

The content is also a year stale. The live site shows Azibo as the current job and is missing both Built and Evernest. Meanwhile half the shipped surface area serves nobody: internationalization is fully wired but switched off, the blog route is disabled and holds only template stock posts, the gallery shows 14 template photographs, and `/fantasy` is an orphan route reachable only by direct URL.

## Goals

1. Josh owns every line of the presentation layer and can retheme the site from one token file.
2. A write-up's accomplishments are structured data, rendered consistently wherever they appear, authored once.
3. Publishing is: add a markdown file to `content/work/`, fill the required frontmatter, open a pull request. Malformed or incomplete frontmatter fails the build.
4. A hiring manager skimming for 20 seconds gets the name, the positioning, four attributed metrics, and visible evidence that case studies exist.
5. Rich embeds stay easy to add, and ship only to the write-ups that use them.

## Non-Goals

- **No content management system.** The MDX-in-git workflow demonstrably works — four case studies shipped through it, including one with a hand-built interactive widget.
- **No second content type.** No short-form blog and no notes surface. In 19 months Josh wrote four project write-ups and zero short-form posts.
- **No internationalization.** Single locale, no `[locale]` segment, and no redirects preserving the existing `/en/*` URLs.
- **No hosted résumé.** Email is the contact path, by choice.
- **No light mode.** The design's identity is acid green on near-black; the accent fails contrast on white and would need to become a different color.
- **Not a component library.** shadcn primitives get pulled in only where behavior demands it.

## Acceptance Criteria

- [ ] `grep -r once-ui src/` returns nothing, and `src/once-ui/` is deleted.
- [ ] A write-up missing `outcomes` fails `npm run build` with a message naming the file and the field.
- [ ] A write-up with `draft: true` is absent from the index and returns 404 at its URL.
- [ ] The homepage metric strip and Track record render from typed data in `src/data/profile.ts`; write-up cards render outcomes from frontmatter. Neither is hardcoded JSX.
- [ ] `next.config` is a single file, and `next-intl`, `yahoo-fantasy`, and other unused dependencies are gone from `package.json`.
- [ ] Track record shows Evernest, Built, Azibo (two roles), Upstart, Twitter, and Ampush with résumé-accurate titles and dates.
- [ ] Adding an MDX component touches one registry file, and the component ships only to write-ups that embed it.
- [ ] Lighthouse accessibility scores 95 or above on the homepage, the work index, and a write-up.

## Architecture

Content is decoupled from routing. MDX moves out of the router to `content/work/` at the repo root. A single Zod schema in `velite.config.ts` serves as both the TypeScript type and the build-time validator, emitting typed data to a gitignored `.velite/`.

There is no repository layer over Velite. Pages import `work` from `.velite/generated` directly. A content-service wrapper would forward calls and relocate the real logic to its one caller, which fails the deletion test. If Velite has to be replaced, the blast radius is one config file and two import sites.

```
content/work/*.mdx           content, decoupled from routing
velite.config.ts             Zod schema: types and validation, one definition
src/
  app/                       routes only; no content, no [locale]
  components/ui/             shadcn primitives, owned source, added on demand
  components/site/           Rail, MetricStrip, CaseRow, SectionHeader, Prose
  components/mdx/            registry and widgets (BeforeAfterSlider)
  data/profile.ts            typed career data, replaces content.js
  styles/globals.css         @theme token block
```

The MDX registry stays a single file, but heavy widgets are wired through `next/dynamic` so a write-up that does not embed `BeforeAfterSlider` does not ship it.

Everything renders as a React Server Component except write-up bodies, which are client components because Velite compiles MDX to a function body evaluated at render time.

### Two data sources, two domains

Career-level facts and per-write-up facts are different things and live in different places.

`src/data/profile.ts` holds the career record: the roles that feed Track record, and `headlineOutcomes` for the metric strip. Frontmatter holds each write-up's own outcomes, which feed its card and its header. Each is authored once in its own domain.

This matters because the two do not overlap. Three of the four homepage metrics are Azibo career outcomes and the Upstart figure belongs to no write-up at all, so sourcing the strip from frontmatter would mean either fabricating write-ups or silently dropping metrics. A `headlineOutcome` may carry an optional `slug`, which makes metrics that do have a case study clickable without coupling the two sources.

### Content schema

```yaml
---
title: "Envoy: an agent platform with humans in the loop"
summary: "One sentence. Shows on the card and in search results."
publishedAt: "2026-07-24"
updatedAt: "2026-08-01"          # optional
org: "Evernest"
role: "Staff Product Manager, AI/LLM Initiatives"
timeframe: "2025—2026"
tags: ["AI/LLM", "Platform", "0→1"]
outcomes:                        # required, 2-3 entries
  - metric: "~50%"
    label: "Modeled cut in operational workload"
cover: "/images/work/envoy/cover.png"
draft: false                     # true excludes from the build entirely
---
```

## Stack

| Choice | Version | Note |
|---|---|---|
| Next.js | 16.2.11 | Fresh scaffold, App Router |
| React | 19.2.8 | |
| Tailwind CSS | 4.3.3 | `@theme` block is the token layer |
| Velite | 0.4.0 | Pre-1.0; compatibility with Next 16 is verified first |
| shadcn/ui | on demand | Initialized when the first behavioral widget needs it |

Velite is pre-1.0 and Next 16 is recent, so proving the two work together is the first task and gates everything built on top of it.

shadcn is the decided answer for behavioral widgets, but nothing in the current component list needs Radix — the rail is links, the metric strip is text, and case rows are anchors. Installing it up front would ship a component system with zero components, which is a smaller version of the mistake being corrected. It gets initialized when the first widget appears; an image lightbox on write-ups is the likely candidate.

## Design

Variant E from the prototype. A sticky left identity rail carries the name, navigation, and contact details permanently on screen. The main column runs an editorial headline with a serif italic accent, then a metric strip, then case rows with thumbnails near the fold, then the track record.

Acid green `#c8ff2e` is spent in exactly three places — the headline italic, hover states, and the availability indicator — because an accent used everywhere stops being an accent. Metric numerals are set in light Instrument Serif rather than bold sans, which reads closer to an annual report than a startup dashboard and carries the "experienced" half of the positioning. Every metric is attributed with company and year, since an unattributed number reads as a claim and an attributed one reads as evidence.

Full rationale, including what was rejected and why, is in `prototypes/NOTES.md`.

## Components and data flow

| Component | Source |
|---|---|
| `Rail` | `profile.ts` |
| `MetricStrip` | `profile.ts` → `headlineOutcomes` |
| `TrackRecord` | `profile.ts` → `roles` |
| `CaseRow` | `.velite/generated` |
| `SectionHeader` | props, used three times |
| `Prose` | props |
| MDX registry | static map; `next/dynamic` for heavy widgets |

## Error handling

Schema violations fail the build and name the offending file and field. Unknown or draft slugs call `notFound()`. Drafts are filtered at the loader rather than at the page, so they cannot leak into the sitemap, the OG image route, or `generateStaticParams`.

## Testing

Vitest covers the pure functions: date formatting, draft filtering, and headline-outcome resolution. A small Playwright suite covers the acceptance criteria directly — every route returns 200, a draft returns 404, the metric strip renders, and axe reports no violations. The Velite schema is the highest-value test in the project and runs on every build at no cost.

## Build order

1. Prove Velite builds on Next 16 as a throwaway spike.
2. Scaffold the app and the `@theme` token layer.
3. Content layer and schema; port the four existing MDX files.
4. Write-up page, MDX registry, and `BeforeAfterSlider`.
5. Work index.
6. Homepage (variant E).
7. About.
8. Delete Once UI, i18n, the gallery, `src/pages/api`, and the duplicate `next.config`.
9. Content accuracy pass against the résumé.

## Open Questions

- **Where the metric strip sits relative to the work list.** Adding the strip pushed case-study thumbnails toward the fold, which was the reason variant E won over variant A. Roughly 240px was trimmed from the hero to buy room. If the thumbnails still fall below the fold at real viewport heights, the strip moves below the work list and becomes the closer.
- **About page detail.** Settled as narrative plus supporting credentials — how Josh works, what he is looking for, skills, education, and awards — with work history staying on the homepage. The specific content is not yet written.

## Known content gaps

These are content problems, not design problems, and the rebuild does not fix them.

- No write-up covers Evernest or Built. The strongest and most current work — Envoy, the context-management layer, the AI estimating pipeline — exists only as résumé bullets. Drafts are in progress.
- `content.js` shows a Once UI template stock image (`alt: 'Once UI Project'`) inside the Azibo, Upstart, Twitter, and Ampush experience entries.
- "Product Manager" is misspelled "Prouct Manager" three times, the Ampush role is understated as PM rather than Senior PM, and the education minor is listed as Environmental Economics rather than Sustainability.
- The author of the product-led growth case study is recorded as `"  Lente"`.
