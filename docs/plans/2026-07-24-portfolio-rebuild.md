# Portfolio Rebuild Implementation Plan

> **For Claude:** You MUST invoke the Skill tool with `skill="evernest-superpowers:executing-plans"` before starting any task. Do NOT execute tasks directly — the skill handles Linear tracking, code review, and batch checkpoints.

**Design doc:** `docs/plans/2026-07-24-portfolio-rebuild-design.md` (approved; read it before Task 1)

---

## Execution status — last updated 2026-07-29

**Tasks 0 through 17 are complete and reviewed. Task 18 is next.** Read decisions 20 through 23 first. Between them they record that a plan instruction was unusable as written, that a recorded content correction was itself wrong, that a task's spec described a feature nothing on the site used, and that three review rounds were needed before that task's tests actually guarded anything.

Work happens in the worktree at `/Users/joshvanlente/Development/JoshVanlente-portfolio-impl` on `feat/portfolio-rebuild-impl`, 36 commits ahead of `feat/portfolio-rebuild`. The original checkout at `/Users/joshvanlente/Development/JoshVanlente-portfolio` stays on `feat/portfolio-rebuild` as a deliberate untouched copy of the old MDX tree — **do not modify it**.

| Task | State | Review |
|---|---|---|
| 0. Worktree and branch | done | exempt |
| 1. Velite spike | done | exempt — 8/8 conditions passed |
| 2. Scaffold Next 16 | done | 3 models, quorum 3/3, 9 fixes applied |
| 3. Design tokens and fonts | done | 3 models, quorum 3/3, 20 fixes across the 3–4 group |
| 4. `src/data/profile.ts` | done | reviewed with Task 3 |
| 5. `velite.config.ts` + fixtures | done | 3 models, quorum 3/3, **2 criticals** found and fixed |
| 6. Content loader | done | 3 models, quorum 3/3, **2 majors** found and fixed |
| 7. Frontmatter for five write-ups | done | reviewed with Task 8 |
| 8. Image asset pass | done | 3 models, quorum 3/3, 13 findings, 10 fixed, 3 escalated to Josh and resolved |
| 9. MDX rendering | done | **4 rounds**, 7 commits — see decision 13 |
| 10. Write-up route and 404 | done | reviewed with Task 11 |
| 11. Work index and `CaseRow` | done | 3 models, quorum 3/3, 5 majors — all fixed in `c645119` |
| 12. `Rail` and the skip link | done | reviewed with Tasks 13–14 |
| 13. `MetricStrip`, `TrackRecord` | done | reviewed with Tasks 12–14 |
| 14. Homepage | done | 3 models, quorum 3/3, 26 findings (0 critical, 5 major), 11 fixed in `6790a48`, 2 more in `54a43fa` |
| 15. About page | done | reviewed with Task 16 |
| 16. Metadata | done | 3 models, quorum 3/3, 20 findings (0 critical, 6 major), 11 fixed in `64a0687`, 5 more in `af150ee` |
| 17. `sitemap.ts`, `robots.ts`, OG route | done | **3 rounds**, 34 findings; see decision 23 |
| 18 onward | not started | — |

Suite is **236 tests green across 29 files** (77 at the start of Task 9, 195 at the start of Task 17). `npm run build`, `npm run test`, `npm run typecheck`, and `npm run lint` are all green.

**The Tasks 12–14 review found three majors that a green build hid, and all three are the same shape: a thing that looks implemented and reaches nothing.** The rail hardcoded its navigation, so the section labels and the `work`/`track` anchor ids each lived in two files and a rename would have silently orphaned the anchor. `--color-accent-hover` was pinned by two `tokens.test.ts` rows under "CTA hover" while no element used it — a green contrast test vouching for a colour that never shipped. And the two linked metric cells were pixel-identical to the two plain ones, so the homepage's only route into the write-ups was invisible. The review also established that the obvious fix for the third is a no-op: `hover:text-accent` on the `<Link>` compiles and does nothing, because each child span sets its own colour and wins on specificity. **Check the built CSS, not the class list.**

### Decisions taken during execution, in addition to the three at the top of this file

1. **Node re-pinned from 22 to 24 LTS** (Josh's call). Node 22 is out of active LTS, and neither it nor a version manager was installed. Every pin in this plan reads 24. Homebrew's `node@24` is now the machine's default `node`; `brew unlink node@24 && brew link --overwrite node` reverts it.
2. **`AGENTS.md` was written at the repo root** before Task 2, because the executing-plans safety gate stops every Codex dispatch without one — 18 of the 24 tasks route to Codex. It carries the conventions, the two-Zod rule, and the `npm run dev` watcher hazard. **Read it before any task.**
3. **Task 2 was re-routed from Codex to a Claude subagent** (Josh's call) because its deletion list included `src/pages/api/{authenticate,check-auth}.ts` and the safety gate stops on auth-adjacent reach. Later tasks route as annotated.
4. **`typecheck` now regenerates Velite output first** — `velite build --strict && tsc --noEmit`. See the note under Task 2 Step 4.
5. **Task 21's dependency criterion was amended**, with `cookie` via `@lhci/cli` recorded as an accepted exception. See the Acceptance Criteria section.
6. **The `dev` script keeps the `&` form**, with its watcher-orphaning hazard documented in `AGENTS.md` rather than fixed with a new dependency.
7. **`@theme static`** in `globals.css` — without `static`, Tailwind 4 tree-shook 11 of 16 tokens out of the shipped CSS, and Tasks 9 and 13 reference tokens through raw `var()`, which Tailwind cannot see.
9. **Images are split across two scripts, and the split is load-bearing.** `scripts/resize-images.mjs` was a one-time photo migration: it deletes each source after converting, and all ten sources are already gone, so it cannot re-run without `git checkout 7a8489b -- public/images content/work` first. `scripts/export-charts.mjs` and `scripts/make-smarter-payouts-cover.mjs` are re-runnable generators that delete nothing. **Never route a hand-authored source through the resize script** — doing that destroyed the two chart SVGs once already. A new photograph goes through a trimmed `JOBS` list; a new chart or generated card gets a generator.
10. **The comparison slider's two frames are processed identically, and two tests enforce it.** They ship at 1280×720 and the same WebP quantizer index. Task 8 originally squeezed each under the 300KB budget independently, landing them at quality 59 and 78 — which degraded the *unenhanced* frame more than the enhanced one, in the one widget whose job is letting a reader judge the enhancement. `tests/unit/helpers/webp-quantizer.ts` reads the quality back out of the VP8 header, because sharp can write a quality but cannot read one. Task 9 renders this slider; do not re-encode either frame alone.
11. **Charts spend the accent once, on the payoff number.** `AGENTS.md`'s accent rule now names four places rather than three. Both `pipeline-drift` charts were drawn light-mode and would have rendered as white slabs on `#0a0b0b`; they are recoloured to the tokens, with hex values hard-coded because sharp rasterizes them outside the browser and cannot resolve a CSS custom property. Task 9 is the first task that actually renders them.
12. **Task 6 ships two deviations from its own written implementation**, both from its review, and both there to make a claimed invariant provable. `resolveRole` and `filterPublished` are now composed by `resolveAndFilter` in `content-rules.ts` rather than sequenced inline in `content.ts`, because the plan's version of the "resolve drafts before filtering" test called `resolveRole` directly — and `resolveRole` never reads `draft`, so the test passed whichever order the loader used. `assertHeadlineSlugs` takes an optional third argument, every item including drafts, so a headline slug pointing at a real-but-drafted write-up says so instead of reading like a misspelling. Neither changes the loader's runtime behaviour. Both are the two-module split doing its job, so do not "restore" the plan text over them.
13. **Task 9 took seven commits and four review rounds, and the pattern is worth knowing before Task 17.** Each round's findings were real and mostly invisible to a green build: an `import` in an MDX body compiled clean and threw an anonymous `SyntaxError` at render; a raw `<img />` in MDX bypassed the dimension plugin entirely; a throw inside the tree walk orphaned in-flight sharp promises and buried the good error message; Tailwind 4 kept its default `--text-*--line-height` siblings so every heading rendered at leading nobody chose. Two rounds also *introduced* defects that the next round caught. **Do not read a green `npm run build` as evidence that a dynamic-boundary task is done.**
14. **The review grace cap is 2400s on `Review: high` tasks** (Josh's call, 2026-07-27), and 900s elsewhere. On Task 9 the two fast legs finished in 102–350s, agreed with each other, and were wrong about mechanism three separate times — twice filing a Major that did not exist. The slow native leg took 1050–1260s because it compiled bodies, built probe routes, and read the emitted CSS, and it found every build-integrity bug. **Task 17 is the only remaining `Review: high` task.** Its findings-only reviewer must not finalise on a fast 2-of-3 majority.
15. **The test suite now runs two Vitest projects.** `node` keeps the original globs and environment; `dom` runs `tests/component/**/*.test.tsx` on jsdom, with `tests/component/setup.ts` polyfilling `PointerEvent` and pointer capture. Do not flip the whole suite to jsdom — `schema.test.ts` and `dev-loop.test.ts` spawn real processes and must not run in a DOM.
16. **Two plan claims that "no unit test is possible here" were false, and both are now tested.** Task 9 said the slider's pointer and font-swap behaviour could not be unit-tested because jsdom does no layout; Task 10 said importing the route into Vitest would fail at import time on `next/navigation` and `next/image`. Both premises were true in isolation and neither conclusion followed — `aria-valuenow` is a clean observable, and `tests/component/BeforeAfterSlider.test.tsx` already renders `next/image` unmocked with no `vi.mock` anywhere. **A test that passes identically before and after a fix is the thing to avoid; "hard to test" is not the same as "impossible".**
17. **No route renders a `<main>` any more, and Task 12 must add one.** All three routes rendered their own, which would have nested `<main>` inside Task 12's `layout.tsx` wrapper and pointed the skip link at the wrong element. They now render a plain `<div>`. **Task 12 adds `<main id="main" tabIndex={-1}>` to `layout.tsx`** — until it does, the detail page's `<header>` claims the `banner` landmark, because it is a direct child of `<body>`. Task 12's `<main>` demotes it automatically.
18. **`SectionHeader` and `CaseRow` both take a heading-level prop.** `SectionHeader` is `level?: 1 | 2`, default 2; `CaseRow` is `level?: 2 | 3`, default 3. `/work` passes 1 and 2 respectively. The defaults are correct under a homepage that owns its own `<h1>`, so **Task 14 should not need to pass either** — but check the rendered outline, because giving `/work` an `<h1>` is exactly what exposed a skipped h1 → h3 level the first time.
19. **A figure paragraph is marked during the MDX transform, not matched in CSS.** `src/lib/mdx/rehype-figure-paragraph.ts` stamps `data-figure` on a paragraph whose entire content is one image; `Prose` selects `[&_p[data-figure]]:max-w-none`. The two `:has(… :only-child)` rules it replaced were both wrong the same way — CSS `:only-child` counts element siblings and ignores text nodes, so `text ![alt](x) text` lost the 68ch measure. **`registry.tsx` does not override `p`, which is the only reason the marker survives to the DOM.** If a `p` component is ever added there without spreading props, every figure silently reverts and nothing catches it.
20. **Task 12 specified a class the repo's own guard forbids, and the guard won.** The task text puts `focus:outline-none` on `<main>`, but `tests/unit/tokens.test.ts` bans `outline-none` anywhere in `src/` — added in Task 3, because the base ring is an acceptance criterion. Omitting it was correct, and the consequence was real: activating the skip link painted the ring around `<main>`, which is the whole page column at 2404px against an 800px viewport, so it rendered as a green line down the left edge that survived scrolling. The fix is `#main:focus-visible { outline: none }` in the base layer, scoped to that one programmatic, non-interactive target. **The review's proposed `outline-offset: -2px` was refuted rather than adopted** — insetting a 2404px-tall rectangle leaves a 2404px-tall rectangle, so the line would have stayed. A reviewer separately proposed evading the ban by writing the CSS longhand; the guard now bans `outline: none` and `outline: 0` in components too, exempting `globals.css` where the sanctioned exception lives and is pinned by its own test.
21. **The fold criterion missed at 0.4605 and was fixed by trimming the hero, not by the recorded fallback.** The design doc's declared variable was moving the metric strip below the work list; Josh chose the hero trim instead (2026-07-29). The gap was **3.66px**, not the ~40px first estimated from the ratio — at 92.5px thumbnail height, 0.5 needs `top ≤ 753.75` against a measured 757.41. 24px came out of the container and the hero's bottom padding, and the ratio is now **0.7416**. The review and the QA pass measured 0.4605 independently and agreed to four decimal places, which is why the number was trusted. **Type sizes and the 12px floor stay fixed; vertical space is the only variable.**
22. **`src/app/layout.tsx` has no automated coverage, and that is a knowing gap.** It imports `@/lib/fonts`, which uses `next/font/google` and needs the Next SWC transform, so a jsdom test fails at import with `TypeError: (0, Inter) is not a function`. Covering it means mocking an internal module, which no test in this repo does. The file carries `<main id="main" tabIndex={-1}>` — the single attribute making the skip link work — and **Tasks 16 and 19 both edit it**. Task 22's Playwright suite is the right home for the assertion, since it runs against a real browser: add "Tab, Enter on the skip link, `document.activeElement.id === 'main'`" there.
23. **Task 17 took three review rounds and three commits, and every round found that the previous round's tests did not reach the thing they named.** Read this before writing a test for anything that renders.

    The feature question came first. The route was specified to take its title from a `?title=` query parameter, and **nothing on the site ever passed one**: `site.ts` links a bare `/og`, and every write-up overrides `og:image` with its own required `cover`. So every card served was the fallback, which printed the name and role three times over at three sizes. Josh chose to delete the parameter. That dissolved five of round 1's sixteen findings rather than fixing them, including a character cap that bounded characters while the canvas bounded height (CJK overran vertically at the cap; any unbroken token overran horizontally at about 27 characters) and an emoji fallback path that sent the title text to `fonts.googleapis.com` and could fan out to roughly 120 third-party requests per hit. **Deleting an unused input is worth more than hardening it.**

    Then the test question, three times, each a level up from the last:
    - **Round 2** found the new assertions regexed the route's **source text**. A comment reading `weight: 700` kept a test green while the code shipped `400`; setting the background to the text colour, which renders the card invisible, passed every token assertion as long as the right hex sat in a comment. A source-text assertion is satisfied by a comment and broken by one.
    - **Round 3** found the repair asserted on **exported values** with nothing proving the shipped code used them. Replacing `ImageResponse`'s first argument with an inline tree shipped the word HIJACKED in red, at 57905 bytes against the real 68864, with all 22 assertions green. **Assert identity: `expect(captured).toBe(ogCard)`, because `toEqual` against a rebuilt tree is defeated by a copy.**
    - Round 3 also found the tree readers returned `[]` for anything they could not walk, so "and nothing else" was a claim they could not make. Four channels each shipped a visibly wrong card with a green suite: a component-typed child, which hides its whole subtree and defeats any prop allowlist; SVG `fill`; Satori's `tw` prop; and a non-array iterable child. **A reader that cannot read something must throw, not return empty.** An allowlist of colour-bearing props is a list someone has to keep complete forever.

    Two process notes. The `tw` channel escapes only where `style` leaves that property unset, because an explicit `style` value wins, so the obvious mutation looks inert and the real one does not. And **agent reports were wrong three times and re-verification caught each**: a mutation leg claimed an assertion could never fail when deleting the fallback did fail it, claimed a dimension change went green when `metadata.test.ts` already pinned it, and a review orchestrator twice returned a progress note that read like a finished review. The tell remains the missing `Reviewers:`/`Quorum:` block. On round 3 the Gemini leg ran 1417 seconds and wrote zero bytes, so that round is an honest 2 of 3.

**Task 17's `?title=` parameter is deleted, and the three amendments this section used to carry are void.** They are recorded here only so a reader of Task 17's own text knows why it says what it says. The section previously observed that `src/lib/site.ts` points every cover-less page's `og:image` at a bare `/og`, so a route taking its title from a query parameter would receive `null`, and it prescribed a fallback string, a no-parameter verification case, and a length cap. The first review round drew the further conclusion: if nothing ever passes the parameter, the parameter should not exist. Josh chose deletion on 2026-07-29. `/og` is now one prerendered static card that says his name and his role, once each, from `profile.ts`. **Task 17's Step 3 text still describes the query parameter; ignore it, and do not restore the parameter.** See decision 23.

`/og` is live and every page that advertises it resolves. The old instruction not to deploy to a public origin before Task 17 is satisfied.

**An em dash sweep is owed, and Josh deferred it to later (2026-07-29).** He asked for em dashes out of the About narrative when he approved it, and the same objection applies to prose elsewhere on the site. Seven reader-visible instances remain in two places: **the homepage lede** (one, in copy the design doc froze as final and `home-page.test.tsx` asserts character for character) and **published write-up bodies** (six, across `cutting-six-of-seven-steps`, `all-in-one-rental-platform`, and `product-led-growth-strategy`). Swapping each for a comma, colon, or full stop is the fix, and touching the lede means updating its golden-record assertion in the same commit. **The date ranges are a separate class and stay** — `2023—2025` and `2025—now` use the em dash as a range separator, which is standard typography rather than a writing tic, and the same goes for the `"%s — Josh Van Lente"` title template. A reviewer proposed sweeping those too and was rejected; applying that "fix" would have broken the title template. **Task 21's sweep is the natural home**, since it already reads every file.

### Blockers and open questions

- **All content inputs for Tasks 7 and 8 are answered and shipped** — see "Content inputs, as answered" below. **Task 15's About inputs arrived on 2026-07-29** — see "About page inputs" below. **Josh signed the narrative off on 2026-07-29** with one change — em dashes replaced by a comma and a colon — and it shipped in `36fb7a4`. `tests/unit/about.test.ts` now holds it as a golden record, transcribed longhand, so a later edit is a deliberate act.

### About page inputs, as answered on 2026-07-29

Josh's answers to the three open questions. Task 15 writes these; it does not improve on them.

| Input | Answer |
|---|---|
| Narrative | Keep the old site's intro as the base and extend it. Three additions in his words: he enjoys **big, hard problems that need systems thinking**; lately that has meant **"rethinking what is required of users to produce value vs can be done via automation or agents"** — he rejected a first draft's "rethinking how customers experience our product, with AI at the forefront" as too vague, so **do not restore the generic version**; and a personal close covering **two kids and his wife**, experiencing things through their eyes, plus **hiking, backpacking, and golf**. A three-paragraph draft was agreed in conversation and awaits his final wording. |
| Education | **San Diego State University, B.S. Finance, minor Environmental Economics.** No graduation year. |
| Supporting credentials | **Drop the three university bullets** (Associated Students representative, Environmental Business Club finance officer, Cricket Wireless internship) — they read junior at this career stage. **Drop the six "Skills" cards** entirely. Education is the only supporting credential. |

**Task 15 Step 2's third correction is void.** That step lists three résumé errors to fix, the third being that the education minor "was listed as Environmental Economics; it is Sustainability." Josh was asked directly and chose to keep **Environmental Economics** (2026-07-29). The other two corrections stand: the "Prouct Manager" misspelling, and Ampush understated as Product Manager rather than Senior Product Manager. **A correction recorded in a plan is not automatically right — this one had been carried since the design doc and was wrong.**
- **The image budget test now scans all of `public/`, not just `public/images/`.** Task 10's OG route and any favicon export land inside that scope, so an oversized card fails the suite rather than shipping quietly. Task 17's OG route turned out not to touch that scope at all: it is prerendered into `.next/`, not written to `public/`, so the budget test never sees it. The card is 68KB.
- **A draft's cover image is publicly served, and no route-level guard covers assets.** Velite copies every cover into `public/static/` before the loader's draft filtering exists, so `draft-fixture`'s cover ships as `/static/cover-845fcd12.webp`. Today that is harmless: it is an 86-byte, 64×40 placeholder. The mechanism is not harmless. A real draft with a real cover photograph would be publicly readable at a hashed URL before the write-up is published. Nothing links or indexes it, so it is not a search-engine leak, and the sitemap containment Task 17 proves for **routes** does not extend to **assets**. **Task 21.**
- **`public/fonts/Inter.ttf` is a second, unlinked copy of the site typeface**, 415KB, now read only by the OG card, while every page loads Inter through `next/font/google` in `src/lib/fonts.ts`. The two are not even the same weight: the bundled file is a static Bold face. Changing the site's typeface would silently leave the card behind. Consolidating means touching the font loading every page depends on, which is why it is **Task 21** rather than Task 17.
- **`/og` is served with `cache-control: public, max-age=0, must-revalidate`, and that is accepted.** Next discards `ImageResponse`'s own `immutable, max-age=31536000` and records the revalidating header for the prerendered file. Correctness is fine and a redeploy invalidates cleanly; browsers and crawlers simply revalidate rather than cache a 68KB PNG. There is no supported override while the route stays `force-static`, and static is worth more than the header.
- **Vercel preview deployments sit behind SSO**, which breaks Tasks 22 and 23 as written — Playwright and the manual checklist would both test the auth wall, and LinkedIn's crawler cannot authenticate. Three options are written up in the spike result doc. **Raise it with Josh at Task 20**, so the answer exists before Task 22 needs it.
- **`README.md` still sells the Once UI template**, including a Deploy button pointing at `once-ui-system/magic-portfolio`. No task owns it, and Task 21's hygiene grep is scoped to `src/` so it reports green regardless. Rewriting it needs Josh's voice.
- A hard-killed test run leaks a fixture directory under `tests/.tmp/`. Gitignored and inert, but they accumulate; a `globalSetup` that clears the directory would sweep them.
- **`npm install` reports 21 vulnerabilities, 18 of them high**, all pre-existing and none introduced by this rebuild. Three packages also have install scripts pending `allowScripts` approval (`fsevents` ×2, `unrs-resolver`). **Task 21's hygiene sweep is the natural home.**
- **`/work` and `/about` appear in no metadata task.** Task 16 names the write-up route and the homepage, so those two will inherit the root default rather than the `"%s — Josh Van Lente"` template. A plan gap, not a diff defect — fix it when Task 16 runs.
- **`tsconfig.json` has no `noUncheckedIndexedAccess`.** `CaseRow` carries a runtime guard on `outcomes[0]` because the schema's `.min(1)` does not reach the type system — Zod 4's `.min()` returns `this`, so `WorkItem` infers `Outcome[]` rather than a non-empty tuple. Turning the flag on would surface the same class of bug repo-wide, at the cost of a sweep well outside any current task.

**Tasks 15 and 16 both shipped beyond their stated file lists, deliberately.** Task 16's list named `layout.tsx`, `work/[slug]/page.tsx`, and `site.ts`; it also touched `work/page.tsx` and `about/page.tsx` to close the recorded gap where those two routes had no metadata. The follow-up fix in `af150ee` additionally touched `profile.ts`, `page.tsx`, and `SectionHeader.tsx`. Every one is recorded in a commit body.

Two findings from the Tasks 15–16 review remain open and are assigned:

- **The page-shell class string `mx-auto w-full max-w-[75rem] px-4 py-16 sm:px-8 sm:py-24` is identical in three routes.** The homepage deliberately differs (documented, fold criterion) and `not-found` differs again, so a shared shell would cover three of five call sites. Marginal now; revisit if a fourth route lands. **Task 21 at the earliest.**

Findings from the Tasks 12–14 review that its own scope could not fix. Each names where it belongs:

- **`/work` is unreachable from every page.** The rail's three nav links are `/#work`, `/#track`, and `/about`; "Selected work" points at the homepage section, not the work index. The route exists and no page links to it. **Assigned to Task 19**, which owns the rail's responsive treatment and is the natural place to decide whether it gains a fourth link or the homepage's "Selected work" header links through. Sharper after Task 16: `/work` now carries its own metadata and canonical, and Task 17 will list it in the sitemap, so it will be indexable and still unreachable by a human. This is a plan gap — no task ever assigned the link.
- **`/about` is a live 404 on every route until Task 15 lands**, because the rail links it from every page. Expected, and the reason Task 15 cannot be deferred.
- **The `↗` in "LinkedIn ↗" is inside the accessible name**, pinned by `home-page.test.tsx`, so a screen reader says "LinkedIn up-right arrow". The glyph also conventionally signals a new tab, which the link does not open. **Task 16's accessibility pass** should either `aria-hidden` the glyph or add `target="_blank"` with `rel="noopener"` — both change a pinned test, so it needs a deliberate call.
- **Two component tests assert facts about their own fixtures.** `MetricStrip.test.tsx` re-implements `getHeadlineOutcomes`' href contract in its fixture, so it would keep passing against a contract the app no longer uses; `TrackRecord.test.tsx` duplicates `dates.test.ts` with the component barely involved. **Task 21's sweep** is the place to tighten them.
- **`globals.css`'s `@theme static` comment is now half-false** — it cites Task 13's serif numerals as reaching tokens through raw `var()`, and they use utilities. The `static` keyword is still load-bearing for other reasons. **Task 21.**
- **CTA tap targets are 41/43px** where `not-found.tsx` deliberately uses `min-h-11` (44px). **Task 19**, where touch is the subject.
- **`<aside>` for the rail leaves the site with no `banner` landmark.** Subjective, raised by one reviewer. **Task 16 or 19** if it is worth addressing at all.

Three findings from the Tasks 10–11 review were deferred to **Task 19**, where responsive behaviour is the actual subject rather than a side effect:

- At 320px a wrapped `CaseRow` title makes the focus ring fragment into five stacked boxes, one per line box. It satisfies the rule and reads as a rendering bug. Moving the ring to the `<li>` would give one rectangle and pair with the padding treatment already there.
- `SectionHeader`'s accessible name is `"WORK"`, not `"Work"` — Chrome folds `text-transform: uppercase` into the computed name, and some screen readers spell all-caps letter by letter. Applies site-wide.
- The shipped responsive treatment is an 80px thumbnail at a 640px breakpoint with the year column kept; the design doc specifies 90px and dropping the year below 900px. At 320px the first row is 445px tall with the year floating at its midpoint, far from its title. **Task 19 will need to unwind this rather than build on it.**

Four items came out of Task 6's review that its own three-file scope could not fix. Each names where it belongs. (The `s.isodate()` one has already served its purpose — Task 7's dates are all canonical — but the schema is still loose, so it stays listed for Task 5's file.)

- **`s.isodate()` accepts a date that parses in local time, and Task 7 is where that bites.** The schema only requires `Date.parse` not to return `NaN`, so `2026-1-1` is accepted and resolves against the machine's timezone — in Tokyo it lands in the previous year. Every canonical `YYYY-MM-DD` date is unaffected, so today's content is safe. **Write every `publishedAt` in Task 7 as a full `YYYY-MM-DD`**, and consider tightening the schema to a regex.
- **`s.path()` also strips a trailing `/index`.** A file at `content/work/index.mdx` arrives as `sourcePath === "work"`, so the filename-mismatch error would name `content/work.mdx` and advise a rename in a circle. The fix is `s.path({ removeIndex: false })` in `velite.config.ts` — Task 5's file, one line. No write-up is named `index`, so this is a trap rather than a live bug.
- **Nothing stops a page importing `work` from `#content` directly** and rendering drafts, which would route around the single filtering point the loader exists to be. About six lines of `no-restricted-imports` in `eslint.config.mjs` would enforce it. **Task 21's hygiene sweep is the natural home.**
- **`Rawish` in `content-rules.ts` is a hand-written shadow of the schema**, and its optional properties mean renaming `roleId` in `velite.config.ts` typechecks clean and fails at runtime blaming the content author. This is a real cost of the two-module split, accepted knowingly rather than overlooked.

### Content inputs, as answered on 2026-07-27

Josh answered four of the five blocking inputs. Task 7 writes these verbatim; it does not improve on them.

| Input | Answer |
|---|---|
| `deterministic-ai-photo-pipeline` outcome | `metric: "Cost parity"` / `label: "Matched the incumbent vendor, in-house"`, plus `metric: "Per-step"` / `label: "Audit log for every enhancement"`. **This write-up has no win metric, and that is the finding, not a gap to paper over.** Josh's account: the goal was to cut cost, the pipeline roughly matched the outgoing vendor's cost, and quality improved — but he never benchmarked the vendor's photos, so the quality gain is unmeasured and must not be given a number. The `BeforeAfterSlider` already in the body carries that claim by showing it. Cost parity is a real result: it brought the pipeline in-house, which is what made the sequel's 50% reduction possible. The plan's claim that this write-up "contains no numbers" was also wrong — its Results section carries "+0.05–0.12 increase in mean luminance … keeping SSIM within our target threshold". That line stays in the body; it was declined as a headline metric because a reader cannot calibrate it, not because it is untrue. |
| `product-led-growth-strategy` outcome | `metric: "#1"` / `label: "Growth channel by new users and units"`, plus `metric: "Lowest"` / `label: "Acquisition cost of any channel"`. Neither is new: the write-up's Outcome section says "#1 Growth Channel … top source of new users and units", and `profile.ts` says "Activated the company's #1 growth channel via a PLG initiative". A rank is not a measure, and that limitation is accepted knowingly. |
| Smarter Payouts cover | A typographic cover built in the site's three-token palette from the write-up's own Outcomes section — "35% faster payouts", "<0.1% added clawbacks", "Azibo · 2024". Every figure is verbatim from the body. It is a real designed asset, not a placeholder, and it replaces `mindblown-wow.gif` (864KB, auto-playing, a reaction meme). Built in Task 8; Task 7 writes the path. |
| `timeframe` for all five | Derived from the role each write-up maps to and the periods already in `headlineOutcomes`, **not** from the year in `publishedAt`. That documented default is wrong for at least three of five — `product-led-growth-strategy` is published 2024-04 but the work sits in `azibo-senior-pm`, which ended 2023-03, and `all-in-one-rental-platform` is published 2024-04 while its own headline metric reads 2023—2025. Shipped values, all using an em dash to match `profile.ts`: PLG `2022—2023`, all-in-one `2023—2025`, smarter-payouts `2024`, photo pipeline `2025`, cutting-six `2025—2026`. |
| `cutting-six-of-seven-steps` cost figure | **Corrected after Task 7 ran, twice.** The file shipped with the title claiming "58% cheaper" and the summary claiming "58% of the cost" — the same digits meaning a 58% cut and a 42% cut, both on one card. Then Josh corrected the starting cost from `$0.40` to `$0.34`. `$0.17 ÷ $0.34` is exactly one half, so the title, the summary, and the outcome metric all read **50%** and the body reads `$0.34 → $0.17`. `$0.34` appears nowhere in either repo or in git history — it came from Josh directly, which is why it could not have been caught by reading the tree. |
| `product-led-growth-strategy` → `azibo-senior-pm` | **Confirmed by the repo, no longer a question.** `profile.ts` attaches "Activated the company's #1 growth channel via a PLG initiative" to `azibo-senior-pm` (2022-02 → 2023-03). |

### Verification

**From Task 7 onward the normal commands work.** `npm run test`, `npm run build`, and `npm run typecheck` are all green, and they are what to use. Each regenerates `.velite/` first, so they exercise the real content tree.

Before Task 7 all three failed by design, because they invoke Velite against frontmatter that was not valid yet, and the workaround was to call `npx next build`, `npx vitest run`, `npx tsc --noEmit`, and `npx eslint .` directly. That period is over — the note survives only so a reader of the earlier task text knows why it says what it says.

A correction worth keeping: the plan asserted `deterministic-ai-photo-pipeline` "contains no numbers". It does — its Results section carries a mean-luminance and SSIM figure. Verify a claim like that against the file before acting on it.

Recovery tags `pre-task-3` through `pre-task-8` mark the commit before each of those tasks.

**Goal:** Replace the Once UI `magic-portfolio` template with a site Josh owns end to end — a typed content pipeline that fails the build on bad frontmatter, a three-token colour scale, and a homepage that gives a hiring manager the name, positioning, four attributed metrics, and visible case-study evidence inside 20 seconds on a phone or a laptop.

**Non-Goals** *(verbatim from the design doc — this is the scope contract)*:

- **No content management system.** The MDX-in-git workflow demonstrably works — four case studies shipped through it, including one with a hand-built interactive widget.
- **No second content type.** No short-form blog and no notes surface. In 19 months Josh wrote four project write-ups and zero short-form posts.
- **No internationalization.** Single locale and no `[locale]` segment.
- **No redirects for existing `/en/*` URLs.** Deliberate: see the decision note under Migration. Every currently indexed URL will 404.
- **No hosted résumé.** Email is the contact path, by choice.
- **No light mode.** The design's identity is acid green on near-black; the accent fails contrast on white and would need to become a different color.
- **Not a component library.** shadcn primitives get pulled in only where behavior demands it.

**Architecture:** Content lives in `content/work/*.mdx`, decoupled from routing. One Zod schema in `velite.config.ts` is both the TypeScript type and the build-time validator; `src/lib/content.ts` is the only module that imports Velite's generated output and the only place drafts are filtered. Write-up bodies evaluate in a React Server Component; only `BeforeAfterSlider` carries a client boundary.

**Tech Stack:** Node 24 LTS (pinned), Next.js 16.2.11 (App Router, Turbopack), React 19.2.8, Tailwind CSS 4.3.3 (`@theme` tokens), Velite 0.4.0 (pinned exactly), Vitest, Playwright, Lighthouse CI. All four npm versions verified to exist as of 2026-07-24.

*(Node re-pinned from 22 to 24 at execution time, 2026-07-26, on Josh's call. Node 22 is out of active LTS and neither 22 nor a version manager was installed on the machine; 24 is the current active LTS and is what Vercel should build. Every pin site below — `.nvmrc`, `engines`, `@types/node`, Task 1's condition 1, and the Vercel dashboard setting — reads 24.)*

**Verification mode:** default. The rebuilt repo has one small Vitest suite and one Playwright suite; narrowing per-task commands would add annotation burden without shortening a run that takes seconds. Not targeted, deliberately.

**Linear:** not pushed. The only Linear workspace connected to this session is the Evernest work team; a personal portfolio epic does not belong in an employer's workspace. Tasks are tracked from this file. Say so if you want it pushed anyway.

---

## Decisions taken during planning

Three things the design doc left open or under-specified, resolved so the tasks below are executable:

1. **Five write-ups, not four.** `src/app/[locale]/blog/posts/en/cutting-six-of-seven-steps.mdx` already carries an `outcomes:` block and reads as an Evernest work write-up. It ports into `content/work/` as a published fifth item (Josh's call). It is the only Evernest-authored write-up, and it gives the homepage's "9% faster time to lease" metric a write-up to link to.
2. **No write-up uses the literal `org`/`role` branch.** All five resolve a `roleId` against `profile.ts`. The schema still enforces exactly-one-of, per the design's acceptance criterion; it just has no consumer yet. The prototype's "Freelance" tag on the AI-pipeline write-up is a prototype error and gets dropped.
3. **Referential integrity lives in the loader, not the Velite schema.** Velite's schema owns per-file shape rules (slug format and uniqueness, `outcomes` minimum, exactly-one-of). `src/lib/content.ts` owns cross-source rules (`roleId` → `profile.ts`, `headlineOutcome.slug` → a published write-up) and throws at module scope, so `next build` still fails with the file and field named. One rule, one place — and it avoids betting on whether Velite's esbuild config can import a TypeScript module out of `src/`.

## Content inputs required from Josh

These block specific tasks and nothing else. Tasks 2–6 and 9–14 run without them.

| Input | Blocks | Default if unanswered |
|---|---|---|
| A real quantified outcome for `deterministic-ai-photo-pipeline` — its body contains no numbers | Task 7 | **stops the task** |
| A real quantified outcome for `product-led-growth-strategy` — its body contains no numbers | Task 7 | **stops the task** |
| A static replacement cover for the Smarter Payouts write-up (`mindblown-wow.gif` — a reaction meme, 864KB, auto-playing) | Tasks 7 and 8 | **stops the task** — `cover` is a required field, so Task 7 cannot write valid frontmatter without it |
| About-page narrative copy | Task 15 | **stops the task** |
| Project `timeframe` for each of the five write-ups (project dates, not employment dates) | Task 7 | proceeds with the year in `publishedAt` |
| Confirm `product-led-growth-strategy` maps to `azibo-senior-pm` (the 2022–23 role), not `azibo-senior-manager` | Task 7 | proceeds with `azibo-senior-pm` |
| Vercel project Node version set to 24.x, and preview deploys enabled for non-default branches | Task 1 condition 2 | condition 2 defers to Task 2's first push, recorded explicitly |

The first four stop execution. The last three have honest defaults and do not — a wrong `timeframe` is a one-line correction, a missing metric is a fabrication.

The design doc's guidance on a missing metric applies: *"if one genuinely has none, that is a signal about the write-up, not about the schema."* Task 7 does not invent numbers.

## Acceptance Criteria

Carried from the design doc. Two adjustments are marked.

**Removal and hygiene**

- [ ] `grep -r once-ui src/` returns nothing, and `src/once-ui/` is deleted.
- [ ] `npm ci` succeeds, and none of `next-intl`, `yahoo-fantasy`, `sass`, `@types/cookie`, `cookie`, `react-masonry-css`, `next-themes`, `prismjs`, `@types/prismjs`, `remixicon`, `@floating-ui/react-dom`, `classnames`, `@csstools/postcss-global-data`, `postcss-custom-media`, `postcss-flexbugs-fixes`, `postcss-preset-env`, or `autoprefixer` appears as a **direct dependency in `package.json`**, or in `package-lock.json` other than inside a pinned build tool's own dependency tree.

  *(Amended 2026-07-27 during Task 2's review, on Josh's call. The original banned these from `package-lock.json` outright, and that criterion fails the moment Task 2 lands: `@lhci/cli@0.15.1 → express@4.22.2 → cookie@0.7.2` puts `cookie` in the lockfile. Pinning `@lhci/cli` instead of fetching it with `npx` was a deliberate choice recorded in Task 2 Step 4, and Task 21's own guidance already says not to force-remove a framework's transitive dependency. The criterion's intent is that no Once UI template leftover survives, not that npm's graph is policed. **`cookie` via `@lhci/cli` is a recorded, accepted exception.** Any other lockfile hit is still a failure, and must be traced with `npm ls <package>` before anyone accepts it.)*
- [ ] `next.config.*` is a single file.

**Content pipeline**

- [ ] A write-up missing `outcomes` fails the build with a non-zero exit code and a message naming the file and the failing field. Verified by a fixture test that corrupts frontmatter and asserts both.
- [ ] A write-up with no `slug` fails the build; two write-ups with the same slug fail the build.
- [ ] A write-up with both `roleId` and a literal `org`/`role` pair fails the build, as does one with neither.
- [ ] A `roleId` that matches no `profile.ts` role fails the build.
- [ ] A write-up with `draft: true` is absent from the index, the sitemap, and `generateStaticParams`, and returns 404 at its URL. Verified against `content/work/draft-fixture.mdx`, a permanent committed draft — a temporary one proves the rule once and then stops guarding it.
- [ ] A write-up whose filename does not match its `slug` fails the build.
- [ ] Every non-empty `headlineOutcome.slug` resolves to a published write-up, checked at build time.
- [ ] `profile.ts` declaring other than exactly four `headlineOutcomes` fails the build.

**Rendering**

- [ ] The homepage metric strip and Track record render from typed data in `src/data/profile.ts`; write-up cards render outcomes from frontmatter. Neither is hardcoded JSX.
- [ ] A production build of a write-up that embeds no widget does not request the `BeforeAfterSlider` chunk. Verified by a Playwright assertion that identifies the chunk by its contents, having first proven the widget-bearing page loads one — a name match alone would filter to empty on both pages and pass while measuring nothing.
- [ ] The rail's `#work` and `#track` links resolve to elements that exist, and the skip link moves keyboard focus into `<main>` rather than only scrolling to it.
- [ ] Track record data in `profile.ts` matches this list exactly, asserted by a unit test over `org`, `title`, `start`, and `end`. *(Adjustment: the criterion is on the data, not the rendered string — the rail renders the prototype's compact form, `2025—now`. The table below is transcribed from the July 2026 résumé, which stays out of the repo.)*

  | Org | Title | Dates |
  |---|---|---|
  | Evernest | Staff Product Manager, AI/LLM Initiatives | Sep 2025 – present |
  | Built | Principal Product Manager | Mar 2025 – Aug 2025 |
  | Azibo | Senior Manager, Product Management | Mar 2023 – Mar 2025 |
  | Azibo | Senior Product Manager | Feb 2022 – Mar 2023 |
  | Upstart | Product Manager | Jul 2019 – Sep 2021 |
  | Twitter | Product Manager | 2018 – 2019 |
  | Ampush | Senior Product Manager | 2013 – 2018 |

- [ ] At 390×844 (iPhone 14 viewport) the rail is collapsed, all navigation is reachable, no horizontal scroll occurs, and the headline appears above the contact links in DOM order.
- [ ] At 320px wide, a 120-character case-study title causes no horizontal overflow.
- [ ] At 1280×800, at least half of the first case-study thumbnail is visible without scrolling.
- [ ] Every interactive element has a `:focus-visible` style distinct from the browser default, and a skip link is the first focusable element.
- [ ] Every text colour used at any size clears 4.5:1 against its background, asserted two ways: a unit test over every declared foreground/background pair in the token file, and Lighthouse's `color-contrast` audit scoring 1 on every route. The token test cannot see arbitrary Tailwind colours or opacity; the audit cannot run in a unit test.
- [ ] No rendered text is smaller than 12px.
- [ ] No `.gif` is referenced from `content/` or `src/`; the total transferred image weight on the homepage is under 500KB.
- [ ] `/en/*` returns 404 (pinning the deliberate no-redirect decision, so it is a choice rather than an accident).

**Quality**

- [ ] Lighthouse CI, run against the production build in headless Chrome with the default desktop preset, median of three runs, scores ≥ 95 for both Accessibility and Performance on the homepage, the work index, and a write-up.
- [ ] All five write-ups are published and reachable. *(Adjustment: five, not four — `cutting-six-of-seven-steps` ports as a fifth item.)*

---

## Pre-implementation: workspace setup

### Task 0: Create worktree and feature branch

**Executor:** orchestrator *(coordination — user-visible setup, and it needs Josh's decision about his uncommitted edits)*

**Review:** exempt *(coordination — no reviewable product diff)*

**Depends On:** none

**Step 1: Resolve the uncommitted working tree — BLOCKING, ask Josh**

`git status` currently shows uncommitted edits to `src/app/[locale]/blog/posts/en/cutting-six-of-seven-steps.mdx`, two `public/images/blog/pipeline-drift/*.jpg` files, `src/app/[locale]/work/projects/en/AI-Pipeline-for-Real-Estate-Photos.mdx`, and an untracked `public/images/blog/pipeline-drift/drift-budget.png`.

Task 7 ports `cutting-six-of-seven-steps.mdx` and needs the current version of it. **Ask Josh to commit them to `feat/portfolio-rebuild`, and wait.** Do not stage, commit, or revert on his behalf.

**Committing is the only option that works — stashing is not.** A stash belongs to the repository, not to a branch, so a new worktree checks out the branch without it and Task 7 silently ports the older MDX while the current version sits invisible in the stash. The untracked `public/images/blog/pipeline-drift/drift-budget.png` would not come across either.

Run: `git status --porcelain`
Expected: empty output before proceeding.

After the worktree exists (Step 2), confirm the content actually arrived:

```bash
git -C /path/to/worktree log --oneline -1
ls /path/to/worktree/public/images/blog/pipeline-drift/drift-budget.png
grep -c "drift-budget" "/path/to/worktree/src/app/[locale]/blog/posts/en/cutting-six-of-seven-steps.mdx"
```
Expected: the commit containing Josh's edits, the PNG present, and a non-zero grep count.

**Step 2: Create the worktree**

Use the `evernest-superpowers:using-git-worktrees` skill. Branch off the current epic branch:

- Base: `feat/portfolio-rebuild`
- New branch: `feat/portfolio-rebuild-impl`

The design work (design doc, prototype, copy) is already committed on `feat/portfolio-rebuild`, so the worktree carries it. Keeping the original checkout on `feat/portfolio-rebuild` is deliberate: Task 7 reads the old MDX tree, which Task 2 deletes inside the worktree, and having an untouched copy on disk removes any risk of losing content mid-port.

At cutover (Task 23), `feat/portfolio-rebuild-impl` merges into `feat/portfolio-rebuild`, which opens one PR against `main`.

**Acceptance (BLOCKING):** worktree on disk on `feat/portfolio-rebuild-impl` off `feat/portfolio-rebuild`, with a clean `git status`, BEFORE any implementation task runs. All tasks dispatch into this same worktree. (Read-only review snapshots are permitted and are not implementation worktrees.)

---

## Task 1: Velite spike

**Executor:** orchestrator *(main's clear advantage: the task's real output is a go/no-go architectural decision that may need Josh, and condition 2 needs a git push plus the Vercel dashboard — a one-shot delegate can return a result but cannot have that conversation)*

**Review:** exempt *(throwaway; nothing from the spike is promoted)*

**Depends On:** Task 0

**This task gates every task after it. Do not start Task 2 until all eight conditions pass or Josh accepts the fallback.**

Build a minimal throwaway app — Next 16.2.11, React 19.2.8, Velite 0.4.0 — that answers eight questions. Two conditions were added after the design review: the config-imports-local-TypeScript bet (condition 7) and the widget chunk isolation the "widgets ship only where used" criterion depends on (condition 8). Both are cheap here and expensive to discover mid-implementation.

**Build it in a throwaway git worktree of this repo, not in `/tmp`.** Condition 2 requires a Vercel preview, which requires a pushable branch — a directory under `/tmp` cannot be pushed. A worktree on a scratch branch is isolated *and* pushable.

```bash
git worktree add /tmp/velite-spike -b spike/velite feat/portfolio-rebuild
cd /tmp/velite-spike
git rm -rq src middleware.ts next.config.js next.config.mjs package.json package-lock.json
```

**Files (the complete spike tree — create all of it before running any condition):**

```
/tmp/velite-spike/
  package.json          scripts + pinned deps, per Step 1
  tsconfig.json         paths: {"@/*": ["./src/*"], "#content": ["./.velite"]}
  next.config.ts        empty NextConfig
  velite.config.ts      per Step 2
  content/work/one.mdx  frontmatter + prose, no widget
  content/work/two.mdx  frontmatter + prose + <Counter />
  content/work/cover.png  any small PNG, for s.image()
  src/app/layout.tsx    html/body shell
  src/app/page.tsx      lists work[], links to each slug
  src/app/work/[slug]/page.tsx   generateStaticParams + MDXContent
  src/components/MDXContent.tsx  new Function evaluator, server component
  src/components/Counter.tsx     "use client", a button that increments
  docs/…                (inherited from the branch; ignore)
```

Delete the worktree and the branch at the end of the task. Nothing here is promoted.

**Step 1: Scaffold the spike**

```bash
npm init -y
npm i next@16.2.11 react@19.2.8 react-dom@19.2.8
npm i -D velite@0.4.0 typescript @types/react @types/node
```

Pin Velite exactly — `"velite": "0.4.0"`, no caret. It is pre-1.0 with a 1.0-alpha line running in parallel.

**Step 2: Write the spike's Velite config**

Two collections' worth of surface is unnecessary; one is enough, but it must exercise `s.slug`, `s.image`, `s.mdx`, and a `.refine` that can fail:

```ts
// /tmp/velite-spike/velite.config.ts
import { defineConfig, s } from 'velite'

export default defineConfig({
  root: 'content',
  collections: {
    work: {
      name: 'Work',
      pattern: 'work/*.mdx',
      schema: s.object({
        slug: s.slug('work'),
        title: s.string(),
        outcomes: s.array(s.object({ metric: s.string(), label: s.string() })).min(1),
        cover: s.image(),
        code: s.mdx(),
      }),
    },
  },
})
```

Scripts — Velite runs as its own process, because `VeliteWebpackPlugin` does not work with the Turbopack that Next 16 enables by default:

```json
"scripts": {
  "dev": "velite --watch & next dev",
  "build": "velite build --clean --strict && next build"
}
```

`--strict` is mandatory. Velite's `strict` defaults to `false`, under which a schema failure logs a warning and the build ships anyway.

**Step 3: Condition 1 — production build under Turbopack on Node 22**

```bash
rm -rf .velite
node --version   # must be 24.x
npm run build
echo "exit=$?"
```
Expected: `exit=0`, and `.velite/index.js` plus `.velite/index.d.ts` exist.

**Step 4: Condition 3 — dev watch regenerates on add, edit, and delete**

Run `npm run dev`. With the dev server up, in a second shell: add a third content file, confirm the page reflects it; edit its title, confirm; delete it, confirm it disappears without a manual restart.
Expected: all three propagate. If watch mode does not pick up changes, try Velite's documented `next.config.ts` top-level `build({ watch: isDev })` hook as an alternative to the `&`-backgrounded script — same separate-process semantics, different launcher. Record which one worked.

**Step 5: Condition 4 — invalid frontmatter exits non-zero and names the file and the field**

Delete the `outcomes` block from one content file, then:

```bash
npm run build; echo "exit=$?"
```
Expected: non-zero exit, and stderr contains both the content file's path and the string `outcomes`.

**This is the condition most likely to fail.** The design doc flags it: Velite's error formatting naming the *field* is an assumption to verify, not a given. If Velite names the file but not the field, that is a partial pass — record the exact message verbatim and raise it with Josh, because acceptance criterion "names the file and the failing field" then needs either a wrapper that reformats Velite's error or a relaxation.

**Step 6: Condition 5 — a client widget renders and hydrates**

Add a trivial `"use client"` counter component, pass it through the components map to an MDX-evaluating server component (`new Function(code)({...runtime}).default`, no `use client` on the page), and click it in a browser.
Expected: the page HTML contains the widget's server-rendered markup, and clicking increments the counter.

**Step 7: Condition 6 — TypeScript types are emitted and resolve**

```bash
npx tsc --noEmit
```
Expected: exit 0, with the content import typed (hover/`tsc` error if you assign a wrong field type — prove it by temporarily assigning `const x: number = work[0].title` and confirming `tsc` fails).

**Step 8: Condition 7 — `velite.config.ts` can import local TypeScript and a native module**

Task 9 adds `import rehypeImageDimensions from "./src/lib/mdx/rehype-image-dimensions"` to the config, and that plugin imports `sharp`. Velite bundles its config with esbuild, so whether a local TS import and a native dependency survive that bundling is a real question — and the decision to keep referential integrity in the loader was partly made to avoid betting on it.

Write a trivial local plugin at `src/lib/mdx/noop-plugin.ts` that imports `sharp`, register it in `s.mdx({ rehypePlugins: [noopPlugin] })`, and rebuild.

Expected: build exits 0 and the plugin's `console.log` appears. If this fails, Task 9's rehype plugin needs a different home — inline it in `velite.config.ts`, or precompute dimensions in a separate script — and Task 9 gets revised before it starts.

**Step 9: Condition 8 — a widget-free page does not ship the widget's chunk**

This is the mechanism the "widgets ship only where used" acceptance criterion rests on, and no other condition covers it. `one.mdx` has no widget; `two.mdx` renders `<Counter />`.

Load the production build of both pages in **separate browser contexts** — reusing one lets the second navigation serve JS from cache and measure nothing — and compare the JavaScript each requests. Identify the counter's chunk **by its content** (search the chunk bodies for a string unique to `Counter.tsx`), not by filename; production chunk names are opaque hashes.

Expected: a chunk containing the counter's code is requested on `two` and not on `one`.

Measure three strategies in this order and record which isolates the chunk:

1. **A `"use client"` wrapper that owns the `next/dynamic` import.** The documented approach and the expected winner.
2. **`next/dynamic` called directly in the server-side registry.** Expected to FAIL — Next's docs state that automatic code splitting is not currently supported when a Server Component dynamically imports a Client Component. Measure it anyway, so the plan's claim rests on this repo's observed behavior rather than on a doc sentence.
3. **A static `import { Counter }` in the registry.** The naive version, expected to ship on both pages.

Task 9 implements whichever isolated it. If none does, the criterion needs a per-page component map keyed off a frontmatter `widgets` field — real extra machinery, and worth telling Josh about before Task 2 rather than discovering it at Task 22.

**Step 10: Condition 2 — Vercel preview build succeeds**

**Commit the spike first.** Everything built so far is untracked or unstaged in the worktree, so a bare `git push` would send the unchanged base commit and Vercel would build the old template — a green preview proving nothing.

```bash
git -C /tmp/velite-spike add -A
git -C /tmp/velite-spike commit -m "spike: velite + next 16 scaffold (throwaway)"
git -C /tmp/velite-spike push -u origin spike/velite
```

Then confirm Vercel built *that* commit — check the deployment's SHA against `git -C /tmp/velite-spike rev-parse HEAD`, not just that a deployment succeeded.

Two prerequisites, both Josh's: the Vercel project's Node version must be set to 22.x in the dashboard, and preview deployments must be enabled for non-default branches.

If either is unavailable, **do not silently skip**. Record condition 2 as *deferred to Task 2's first push* in the spike result doc, tell Josh explicitly, and treat Task 2's first Vercel preview as the gate instead.

**Step 11: Record the result and decide**

Write the result to `docs/plans/2026-07-24-velite-spike-result.md` **in the epic worktree, not in the spike worktree** — Step 12 deletes the spike worktree with `--force`, which would take an uncommitted file inside it with no warning.

One line per condition, pass/fail/deferred, with the verbatim error text for condition 4, the launcher that worked for condition 3, and the strategy that isolated the chunk in condition 8.

- **All eight pass** → proceed to Task 2 with Velite.
- **Any fail** → **stop. Task 2 does not start.** Present the result to Josh and get an explicit decision.

**The fallback is a plan revision, not a branch this plan already contains.** Every task from 2 onward installs Velite, runs its CLI, imports `#content`, uses `s.image()`, and evaluates Velite's compiled function body — so "fall back to `gray-matter`" is not something the executor can just do. If Josh chooses the fallback, these tasks are rewritten before implementation resumes:

| Task | What changes |
|---|---|
| 2 | Drop `velite` and the `velite build` scripts; add `gray-matter`, `next-mdx-remote`, `zod`; drop the `#content` alias |
| 5 | Zod schema over `gray-matter` frontmatter; the fixture harness runs a validation script instead of `velite build` |
| 6 | Loader reads and parses files with `fs` + `gray-matter`; genuinely async now |
| 7 | Covers move back to `public/` with absolute paths; no `s.image()` |
| 9 | `next-mdx-remote/rsc` replaces the `new Function` evaluator; the rehype dimension plugin must now cover covers as well as body images |

That last row is the cost worth budgeting: `s.image()` emits intrinsic dimensions for free and `gray-matter` does not, so the `next/image` dimensions the Lighthouse criterion depends on need roughly twenty more lines. Naming the rows means a spike failure produces a revision task, not a stall.

Replacing Velite *after* implementation touches exactly three things: `velite.config.ts`, the `MDXContent` evaluator (coupled to Velite's compile-to-function-body contract), and the body of `src/lib/content.ts`. Consuming components are unaffected because the loader already returns promises. That is the blast radius a later swap is measured against — smaller than the pre-implementation revision above, because by then the loader's signature is protecting everything downstream.

**Step 12: Clean up and commit the result**

```bash
git worktree remove --force /tmp/velite-spike
git branch -D spike/velite
git push origin --delete spike/velite   # only if Step 10 pushed it
git add docs/plans/2026-07-24-velite-spike-result.md
git commit -m "spike: record Velite 0.4.0 verification result"
```

---

## Task 2: Scaffold Next 16 and delete the old tree

**Executor:** codex

**Codex effort:** high *(multi-file, deletes and recreates the whole application tree; the interaction between what is preserved and what is removed is the whole risk)*

**Review:** high *(build configuration, cross-module, and it is the one task that can lose content permanently)*

**Depends On:** Task 1 *(the stack is not committed to until the spike passes)*

The old tree imports `next-intl`, SCSS modules, and React 18-era dependencies. Leaving it in place means nothing compiles, so the deletion and the scaffold are one step. **The build must be green at the end of this task and every task after it.**

**Files:**
- Create: `package.json` (replaced wholesale), `.nvmrc`, `tsconfig.json` (replaced), `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `vitest.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/styles/globals.css` *(not `velite.config.ts` — Task 5 owns it)*
- Move: the five MDX files listed in Step 2 into `content/work/`
- Delete: everything listed in Step 3
- Test: `src/lib/__tests__/scaffold.test.ts` (one smoke test so the runner is proven wired)

**Step 1: Write the failing test**

Write it first, run it in Step 8. Vitest does not exist until Step 4's `package.json` and Step 8's install, so this is the one task where the test is authored before it can execute. This is also the only place a trivial test is the right test — everything after this task tests real behavior.

```ts
// src/lib/__tests__/scaffold.test.ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("scaffold", () => {
  it("pins Node 24 in .nvmrc and package.json engines", () => {
    expect(readFileSync(".nvmrc", "utf8").trim()).toBe("24");
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    expect(pkg.engines.node).toBe(">=24.0.0 <25");
  });

  it("pins velite exactly, with no range specifier", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    expect(pkg.devDependencies.velite).toBe("0.4.0");
  });

  it("carries none of the removed template dependencies", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    const all = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const banned of [
      "next-intl", "yahoo-fantasy", "sass", "@types/cookie", "cookie",
      "react-masonry-css", "next-themes", "prismjs", "@types/prismjs",
      "remixicon", "@floating-ui/react-dom", "classnames",
      "@csstools/postcss-global-data", "postcss-custom-media",
      "postcss-flexbugs-fixes", "postcss-preset-env", "autoprefixer",
    ]) {
      expect(all, `${banned} must not be a dependency`).not.toHaveProperty(banned);
    }
  });
});
```

**Step 2: Preserve the content before deleting anything**

Move the five write-ups out of the router first. Use `git mv` so history follows the file.

```bash
mkdir -p content/work
git mv "src/app/[locale]/work/projects/en/AI-Pipeline-for-Real-Estate-Photos.mdx"                  content/work/deterministic-ai-photo-pipeline.mdx
git mv "src/app/[locale]/blog/posts/en/cutting-six-of-seven-steps.mdx"                             content/work/cutting-six-of-seven-steps.mdx
git mv "src/app/[locale]/work/projects/en/vision-for-a-all-in-one-rental-platform.mdx"             content/work/all-in-one-rental-platform.mdx
git mv "src/app/[locale]/work/projects/en/smarter-payouts-leveraging-ai-for-predictive-model.mdx"  content/work/smarter-payouts-predictive-model.mdx
git mv "src/app/[locale]/work/projects/en/a-unique-product-led-growth-strategy.mdx"                content/work/product-led-growth-strategy.mdx
```

Their frontmatter is still the old template shape and will not satisfy the schema. That is Task 7's job. `velite.config.ts` is written in Task 5, so nothing validates these files yet and the build stays green.

Also preserve, untouched: `public/images/avatar.jpeg`, `public/images/projects/`, `public/images/blog/`, `public/fonts/Inter.ttf`, `public/trademark/`, `src/app/favicon.ico`, `docs/`, `prototypes/`, `LICENSE`, `README.md`.

`src/components/BeforeAfterSlider.tsx` is ported in Task 9 rather than preserved in place — it references Once UI CSS variables and has to be rewritten against the new tokens. Read it from git history there; it does not survive Step 3.

**Step 3: Delete the old tree**

```bash
git rm -r --quiet \
  "src/app/[locale]" src/app/resources src/app/og src/app/sitemap.ts src/app/robots.ts \
  src/components src/once-ui src/pages src/i18n src/middleware.ts \
  middleware.ts i18n.config.ts messages \
  next.config.js next.config.mjs postcss.config.js .eslintrc.json \
  public/images/gallery
```

Notes on three of these:

- Both `middleware.ts` and `src/middleware.ts` exist. Delete both; Next only ever used one and the other was dead.
- `next.config.js` and `next.config.mjs` are the duplicate config the acceptance criterion names. Both go; `next.config.ts` replaces them.
- `public/images/gallery` is 2.6MB of Once UI template photographs. The gallery is a Non-Goal, so the assets go with it.

`src/pages/api/{authenticate,check-auth}.ts` is the password-protection feature whose `protectedRoutes` map is empty. It goes with `src/pages`.

**Step 4: Write the new `package.json`**

```json
{
  "name": "joshvanlente-portfolio",
  "version": "1.0.0",
  "private": true,
  "engines": { "node": ">=24.0.0 <25" },
  "scripts": {
    "dev": "velite --watch & next dev",
    "build": "velite build --clean --strict && next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "velite build --strict && tsc --noEmit",
    "test": "velite build --strict && vitest run",
    "test:watch": "vitest",
    "lighthouse": "lhci autorun",
    "e2e": "playwright test"
  },
  "dependencies": {
    "next": "16.2.11",
    "react": "19.2.8",
    "react-dom": "19.2.8",
    "sharp": "^0.34.5"
  },
  "devDependencies": {
    "@lhci/cli": "^0.15",
    "@playwright/test": "^1.56",
    "@tailwindcss/postcss": "4.3.3",
    "@types/node": "^24",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.11",
    "tailwindcss": "4.3.3",
    "typescript": "^5",
    "unist-util-visit": "^5",
    "velite": "0.4.0",
    "vitest": "^3",
    "zod": "^4"
  }
}
```

Three of these are answers to specific traps:

- **`"lint": "eslint ."`, not `"next lint"`.** Next removed `next lint` in 16 (deprecated in 15.5). The scaffold would ship a lint script that errors on first use, and Task 21's sweep would report a failure unrelated to any acceptance criterion. `eslint-config-next` still ships and supports the flat config this task writes.
- **`"test"` and `"typecheck"` both regenerate Velite output first.** `.velite/` is gitignored, so on a clean checkout `#content` resolves to nothing and every suite importing the loader fails at module load. `typecheck` needs the same treatment for the same reason: once Task 6's `src/lib/content.ts` imports `#content`, a bare `tsc --noEmit` on a fresh clone or a cold CI job dies with `TS2307: Cannot find module '#content'`. *(Corrected 2026-07-27 during Task 2's review. The original wrote `"typecheck": "tsc --noEmit"`, which only appeared to work because Task 21 Step 2 happens to run `npm run test` on the line above it — reorder those two lines and it fails.)*
- **`@playwright/test` and `@lhci/cli` are pinned here, not fetched by `npx` in Tasks 20 and 22.** Both tasks run these tools; leaving them undeclared means an executor invents the install mid-task and gets an unpinned version.

`velite` is a devDependency: it runs at build time, generating `.velite/` — which the app imports and which Step 7 gitignores, so it is regenerated rather than committed. `sharp` stays a runtime dependency for `next/image` optimization.

If the spike's Step 4 concluded that the `&`-backgrounded `velite --watch` was unreliable, use the `next.config.ts` hook instead and drop it from the `dev` script — but keep `velite build --clean --strict` explicit in `build` either way, so `--strict` is visible in the script rather than buried in a config option that defaults to off.

**Step 5: Write `.nvmrc`, `tsconfig.json`, and the configs**

`.nvmrc`:
```
24
```

`tsconfig.json` — the two path aliases matter:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"],
      "#content": ["./.velite"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`next.config.ts`:
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { formats: ["image/avif", "image/webp"] },
};

export default nextConfig;
```

The old config set `formats: ['image/jpeg']`, which defeats `next/image` entirely. AVIF and WebP are what the ≥95 performance criterion needs.

There is deliberately no `redirects()` block. `/en/*` 404s, which is the design's recorded decision, and Task 22 pins it with a test so it stays a choice rather than becoming an accident.

`postcss.config.mjs`:
```js
export default { plugins: { "@tailwindcss/postcss": {} } };
```

`eslint.config.mjs` — flat config, `next/core-web-vitals`.

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/__tests__/**/*.test.ts", "tests/unit/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": new URL("./src/", import.meta.url).pathname,
      // src/lib/content.ts imports Velite's output through this alias; without it
      // every loader test fails to resolve rather than failing on behavior.
      "#content": new URL("./.velite/", import.meta.url).pathname,
    },
  },
});
```

Both aliases must mirror `tsconfig.json`'s `paths`. Vitest does not read `tsconfig` paths on its own.

**Step 6: Write a placeholder app so the build is green**

`src/styles/globals.css` — just the Tailwind import for now; the `@theme` block is Task 3:
```css
@import "tailwindcss";
```

`src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = { title: "Josh Van Lente" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

`src/app/page.tsx`:
```tsx
export default function Home() {
  return <main>Scaffold</main>;
}
```

**Step 7: Add `.velite/` to `.gitignore`**

Append:
```
# velite — generated at build time, never committed
/.velite
/public/static

# fixture scratch space for the schema tests
/tests/.tmp
```

**Step 8: Install and verify**

```bash
rm -rf node_modules package-lock.json
npm install
npx vitest run
npx tsc --noEmit
npm run lint
npx next build
grep -r once-ui src/ ; echo "grep exit=$?"
ls next.config.*
```
Expected: the three scaffold tests pass, typecheck and lint are clean, `npx next build` exits 0, the grep exits 1 with no output, and `ls` shows exactly `next.config.ts`.

`npm run build` and `npm run test` are deliberately **not** in that list: both invoke Velite, and `velite.config.ts` does not exist until Task 5. Run `npx next build` and `npx vitest run` directly here to prove the Next and Vitest sides. The two npm scripts become *runnable* at Task 5 and *green* at Task 7, once real content satisfies the schema. Do not weaken either script to make it run today.

**Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next 16 and remove the Once UI template tree"
```

---

## Task 3: Design tokens and fonts

**Executor:** codex

**Review:** high *(defines the token contract every component in Tasks 9–19 consumes)*

**Depends On:** Task 2 *(needs `src/styles/globals.css` and the layout)*

The token file is the single source of truth for colour and type, and the contrast test reads it directly rather than a duplicate — so the assertion cannot drift from what ships.

**Note a deliberate deviation from the prototype:** variant E sets metric labels, attribution, tags, and years in 10px and 11px JetBrains Mono. The design raises the floor to 12px. Every one of those sizes becomes `--text-xs` (12px) in the implementation. The layout gets denser than the prototype looks; that is expected and correct.

**Files:**
- Modify: `src/styles/globals.css`, `src/app/layout.tsx`
- Create: `src/lib/fonts.ts`, `tests/unit/helpers/contrast.ts`, `tests/unit/tokens.test.ts`

**Step 1: Write the failing test**

```ts
// tests/unit/tokens.test.ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { contrastRatio } from "./helpers/contrast";

const css = readFileSync("src/styles/globals.css", "utf8");

function theme(): Record<string, string> {
  const block = css.match(/@theme\s*\{([\s\S]*?)\n\}/);
  if (!block) throw new Error("no @theme block in globals.css");
  const out: Record<string, string> = {};
  for (const [, k, v] of block[1].matchAll(/(--[\w-]+):\s*([^;]+);/g)) out[k] = v.trim();
  return out;
}

/**
 * Every foreground/background pair the components actually render.
 * The criterion is "against its background" — testing every text token against
 * --color-bg alone would miss the code fences and slider labels that sit on
 * --color-surface, and the near-black text on the accent-filled primary CTA.
 */
const PAIRS: [fg: string, bg: string, where: string][] = [
  ["--color-text",         "--color-bg",      "headings, body"],
  ["--color-text-muted",   "--color-bg",      "lede, nav, metric labels, summaries"],
  ["--color-text-subtle",  "--color-bg",      "attribution, years, tags, achievements"],
  ["--color-accent",       "--color-bg",      "headline italic, hover and focus"],
  ["--color-accent-hover", "--color-bg",      "CTA hover"],
  ["--color-text",         "--color-surface", "code fences, slider labels"],
  ["--color-text-muted",   "--color-surface", "code fence comments"],
  ["--color-bg",           "--color-accent",  "primary CTA label on its fill"],
  ["--color-bg",           "--color-accent-hover", "primary CTA label, hovered"],
];

// Tokens that never render text and never sit under it. Rules and dividers only.
const NON_TEXT_TOKENS = ["--color-border", "--color-border-strong", "--color-border-cta"];

describe("colour tokens", () => {
  it("clears WCAG AA 4.5:1 for every rendered foreground/background pair", () => {
    const t = theme();
    for (const [fg, bg, where] of PAIRS) {
      const ratio = contrastRatio(t[fg], t[bg]);
      expect(ratio, `${fg} on ${bg} (${where}) measured ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("accounts for every colour token", () => {
    const declared = Object.keys(theme()).filter((k) => k.startsWith("--color-"));
    const used = new Set([...PAIRS.flatMap(([fg, bg]) => [fg, bg]), ...NON_TEXT_TOKENS]);
    const unaccounted = declared.filter((k) => !used.has(k));
    expect(unaccounted, "a new colour token must appear in PAIRS or NON_TEXT_TOKENS").toEqual([]);
  });
});

describe("type scale", () => {
  it("renders no text below 12px", () => {
    const t = theme();
    for (const [name, value] of Object.entries(t)) {
      if (!name.startsWith("--text-")) continue;
      const px = value.endsWith("rem") ? parseFloat(value) * 16 : parseFloat(value);
      expect(px, `${name} is ${px}px`).toBeGreaterThanOrEqual(12);
    }
  });
});
```

The second test is the one that earns its keep: it fails when someone adds a colour token without deciding whether text sits on it, so the contrast assertion can never quietly stop covering the palette.

A token test cannot see arbitrary Tailwind colours, opacity, or a pair no one declared, so it is a floor rather than a proof. Task 20 closes the gap by asserting Lighthouse's `color-contrast` audit scores 1 on every route — the rendered check the token file cannot give.

`tests/unit/helpers/contrast.ts` — WCAG 2.x relative luminance:

```ts
function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const h = hex.trim().replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error(`not a hex colour: ${hex}`);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
```

**Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/tokens.test.ts`
Expected: FAIL with `no @theme block in globals.css`.

**Step 3: Write the token block**

```css
/* src/styles/globals.css */
@import "tailwindcss";

@theme {
  /* Colour — three neutral steps, not six. Contrast against #0a0b0b in comments. */
  --color-bg:            #0a0b0b;
  --color-surface:       #171918;  /* thumbnail placeholder */
  --color-text:          #eceeec;  /* 16.90 — headings, body */
  --color-text-muted:    #adb1ac;  /*  9.07 — lede, nav, metric labels, summaries */
  --color-text-subtle:   #8a8e89;  /*  5.92 — attribution, years, tags, achievements */
  --color-accent:        #c8ff2e;  /* 16.70 — headline italic, hover/focus, primary CTA */
  --color-accent-hover:  #d8ff63;
  --color-border:        #1d1f1e;
  --color-border-strong: #262a27;
  --color-border-cta:    #2c302d;

  /* Type — 12px floor. The prototype's 10px and 11px mono both become --text-xs. */
  --text-xs:   0.75rem;    /* 12px */
  --text-sm:   0.8125rem;  /* 13px */
  --text-base: 0.875rem;   /* 14px */
  --text-md:   0.9375rem;  /* 15px */
  --text-lg:   1rem;       /* 16px */
  --text-xl:   1.125rem;   /* 18px */

  --font-sans:  var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-serif: var(--font-instrument-serif), Georgia, serif;
  --font-mono:  var(--font-jetbrains-mono), ui-monospace, monospace;
}

@layer base {
  html { -webkit-font-smoothing: antialiased; scroll-behavior: smooth; }
  body {
    background: var(--color-bg);
    color: var(--color-text);
    font-family: var(--font-sans);
  }
  a { color: inherit; text-decoration: none; }
  img { display: block; max-width: 100%; }

  /* Every focusable element gets a visible ring distinct from the browser default. */
  :focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 3px;
    border-radius: 2px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

**Step 4: Wire the fonts**

```ts
// src/lib/fonts.ts
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-instrument-serif",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});
```

Instrument Serif ships one weight (400). The design calls for "light Instrument Serif" numerals; 400 at the sizes used reads light against the sans, which is the effect the prototype achieved — do not fake a lighter weight with `font-weight: 300`, which either synthesizes or silently falls back.

Apply the variables in `src/app/layout.tsx`:
```tsx
<html lang="en" className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}>
```

**Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/tokens.test.ts`
Expected: PASS, 3 tests — nine colour pairs and the type scale, all clearing their floors.

Then `npx next build` — expected exit 0, with the three fonts in the build output.

**Step 6: Commit**

```bash
git add src/styles/globals.css src/app/layout.tsx src/lib/fonts.ts tests/unit
git commit -m "feat: add the @theme token layer, fonts, and a contrast floor test"
```

---

## Task 4: `src/data/profile.ts`

**Executor:** codex

**Review:** high *(defines the career-data contract Tasks 6, 12, 13, and 15 consume, and it is where the résumé-accuracy criterion is enforced)*

**Depends On:** Task 2

The Zod parse runs at module scope, so an invalid `profile.ts` throws the moment any page imports it — which is what makes "fails the build" true rather than aspirational.

`profile.ts` imports nothing but `zod`. Keep it that way: it has to stay importable from anywhere, including a build-time context.

**Files:**
- Create: `src/data/profile.ts`, `src/lib/dates.ts`
- Test: `tests/unit/profile.test.ts`, `tests/unit/dates.test.ts`

**Step 1: Write the failing tests**

```ts
// tests/unit/profile.test.ts
import { describe, expect, it } from "vitest";
import { profile } from "@/data/profile";

// Transcribed from the July 2026 résumé. The résumé itself stays out of the repo —
// committing it would publish a phone number permanently in git history.
const RESUME = [
  { org: "Evernest", title: "Staff Product Manager, AI/LLM Initiatives", start: "2025-09", end: null },
  { org: "Built",    title: "Principal Product Manager",                 start: "2025-03", end: "2025-08" },
  { org: "Azibo",    title: "Senior Manager, Product Management",        start: "2023-03", end: "2025-03" },
  { org: "Azibo",    title: "Senior Product Manager",                    start: "2022-02", end: "2023-03" },
  { org: "Upstart",  title: "Product Manager",                           start: "2019-07", end: "2021-09" },
  { org: "Twitter",  title: "Product Manager",                           start: "2018",    end: "2019" },
  { org: "Ampush",   title: "Senior Product Manager",                    start: "2013",    end: "2018" },
];

describe("profile.roles", () => {
  it("matches the résumé exactly, in reverse-chronological order", () => {
    expect(profile.roles.map((r) => ({ org: r.org, title: r.title, start: r.start, end: r.end }))).toEqual(RESUME);
  });

  it("gives every role a unique id", () => {
    const ids = profile.roles.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every role at least one achievement", () => {
    for (const r of profile.roles) expect(r.achievements.length).toBeGreaterThan(0);
  });
});

describe("profile.headlineOutcomes", () => {
  it("declares exactly four", () => {
    expect(profile.headlineOutcomes).toHaveLength(4);
  });

  it("attributes every metric with a structured org and period", () => {
    for (const o of profile.headlineOutcomes) {
      expect(o.org).toBeTruthy();
      expect(o.period).toBeTruthy();
    }
  });
});
```

```ts
// tests/unit/dates.test.ts
import { describe, expect, it } from "vitest";
import { formatRoleDates } from "@/lib/dates";

describe("formatRoleDates", () => {
  it("renders a current role as ending in 'now'", () => {
    expect(formatRoleDates({ start: "2025-09", end: null })).toBe("2025—now");
  });

  it("renders a closed role as a year range", () => {
    expect(formatRoleDates({ start: "2023-03", end: "2025-03" })).toBe("2023—2025");
  });

  it("accepts year-only dates", () => {
    expect(formatRoleDates({ start: "2013", end: "2018" })).toBe("2013—2018");
  });

  it("collapses a range inside one year to a single year", () => {
    expect(formatRoleDates({ start: "2025-03", end: "2025-08" })).toBe("2025");
  });

  it("rejects a malformed date rather than rendering NaN", () => {
    expect(() => formatRoleDates({ start: "March 2025", end: null })).toThrow(/YYYY/);
  });
});
```

The last two cases are the ones worth having. Built's Mar–Aug 2025 role collapses to `2025`, matching the prototype; and a malformed date throws instead of quietly rendering `NaN—now`.

**Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/unit/profile.test.ts tests/unit/dates.test.ts`
Expected: FAIL — cannot resolve `@/data/profile` or `@/lib/dates`.

**Step 3: Implement `src/lib/dates.ts`**

```ts
const DATE = /^(\d{4})(?:-(\d{2}))?$/;

function year(value: string): string {
  const m = DATE.exec(value);
  if (!m) throw new Error(`expected YYYY or YYYY-MM, got "${value}"`);
  return m[1];
}

export function formatRoleDates({ start, end }: { start: string; end: string | null }): string {
  const from = year(start);
  if (end === null) return `${from}—now`;
  const to = year(end);
  return from === to ? from : `${from}—${to}`;
}
```

**Step 4: Implement `src/data/profile.ts`**

```ts
import { z } from "zod";

const dateish = z.string().regex(/^\d{4}(-\d{2})?$/, "expected YYYY or YYYY-MM");

const roleSchema = z.object({
  id: z.string().min(1),
  org: z.string().min(1),
  title: z.string().min(1),
  start: dateish,
  end: dateish.nullable(),
  achievements: z.array(z.string().min(1)).min(1),
});

const headlineOutcomeSchema = z.object({
  metric: z.string().min(1),
  label: z.string().min(1),
  org: z.string().min(1),
  period: z.string().min(1),
  slug: z.string().min(1).optional(),
});

const profileSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  disciplines: z.string().min(1),
  // Zod 4: the top-level z.email()/z.url() replace the deprecated
  // z.string().email() / z.string().url() method forms.
  email: z.email(),
  links: z.object({ linkedin: z.url(), github: z.url() }),
  roles: z
    .array(roleSchema)
    .min(1)
    .refine((rs) => new Set(rs.map((r) => r.id)).size === rs.length, {
      message: "src/data/profile.ts: field 'roles' contains a duplicate id",
    }),
  headlineOutcomes: z.array(headlineOutcomeSchema).length(4, {
    message:
      "src/data/profile.ts: field 'headlineOutcomes' must contain exactly four entries — " +
      "the metric strip is a four-column layout; three leaves a hole and five wraps",
  }),
});

export type Role = z.infer<typeof roleSchema>;
export type HeadlineOutcome = z.infer<typeof headlineOutcomeSchema>;
export type Profile = z.infer<typeof profileSchema>;

export const profile: Profile = profileSchema.parse({
  name: "Josh Van Lente",
  role: "Staff Product Manager",
  disciplines: "Vertical SaaS · FinTech · AI",
  email: "Josh@vanlente.net",
  links: {
    linkedin: "https://www.linkedin.com/in/josh-van-lente/",
    github: "https://github.com/JVL1",
  },
  roles: [
    {
      id: "evernest-staff-pm",
      org: "Evernest",
      title: "Staff Product Manager, AI/LLM Initiatives",
      start: "2025-09",
      end: null,
      achievements: [
        "Defined Envoy, an agent-based property platform, and secured exec funding for an 18-month roadmap against a modeled ~50% cut in operational workload.",
      ],
    },
    {
      id: "built-principal-pm",
      org: "Built",
      title: "Principal Product Manager",
      start: "2025-03",
      end: "2025-08",
      achievements: [
        "Re-architected budgeting into a recursive model with unlimited depth, so developers could trace an overrun down to timber prices. Helped close Tishman Speyer.",
      ],
    },
    {
      id: "azibo-senior-manager",
      org: "Azibo",
      title: "Senior Manager, Product Management",
      start: "2023-03",
      end: "2025-03",
      achievements: [
        "Led 3 PMs and 1 QA. 2.8× monetized users, 3.5× gross margin per user, and a 7-product suite.",
      ],
    },
    {
      id: "azibo-senior-pm",
      org: "Azibo",
      title: "Senior Product Manager",
      start: "2022-02",
      end: "2023-03",
      achievements: [
        "Activated the company's #1 growth channel via a PLG initiative, and led a UX overhaul that earned industry awards.",
      ],
    },
    {
      id: "upstart-pm",
      org: "Upstart",
      title: "Product Manager",
      start: "2019-07",
      end: "2021-09",
      achievements: [
        "Scaled loan servicing to hundreds of millions in monthly payments. Grew TAM 10% with a Spanish-language loan product.",
      ],
    },
    {
      id: "twitter-pm",
      org: "Twitter",
      title: "Product Manager",
      start: "2018",
      end: "2019",
      achievements: [
        "Built the multi-team roadmap for Business Manager, closing adoption gaps with large brands and agencies.",
      ],
    },
    {
      id: "ampush-senior-pm",
      org: "Ampush",
      title: "Senior Product Manager",
      start: "2013",
      end: "2018",
      achievements: [
        "Launched AMP, a cross-publisher media-buying platform optimizing $300M+ in annual ad spend.",
      ],
    },
  ],
  headlineOutcomes: [
    { metric: "2.8×",   label: "Monetized users",        org: "Azibo",    period: "2023—25" },
    { metric: "$300M+", label: "Annual payment volume",  org: "Azibo",    period: "2023—25" },
    { metric: "1→7",    label: "Products in the suite",  org: "Azibo",    period: "2023—25", slug: "all-in-one-rental-platform" },
    { metric: "9%",     label: "Faster time to lease",   org: "Evernest", period: "2025—26", slug: "cutting-six-of-seven-steps" },
  ],
});
```

Three notes on this data, all traceable to the design doc's Voice section:

- **"Monetized users" stays** rather than becoming "paying". Those users were not all paying directly, and some were monetized through other channels. On a page whose entire job is credibility, the plainer word would be the less accurate one.
- **Three consecutive `Azibo · 2023—25` attributions are the honest result** and worth keeping. Read straight, they say one sustained run with compounding results.
- **The design doc's prose mentions an Upstart figure among the four metrics.** That predates commit `01227ab`, which replaced it with Evernest's 9% time-to-lease. The prototype and the commits are newer, so the four above are correct. If Josh wants the Upstart figure back, it displaces one of the three Azibo entries — the count is fixed at four.

Two of the four carry a `slug`. The other two are Azibo career outcomes with no write-up, so they render unlinked; the loader in Task 6 must not require one.

**Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/profile.test.ts tests/unit/dates.test.ts`
Expected: PASS, 10 tests — five in `profile.test.ts`, five in `dates.test.ts`.

**Step 6: Commit**

```bash
git add src/data/profile.ts src/lib/dates.ts tests/unit/profile.test.ts tests/unit/dates.test.ts
git commit -m "feat: add typed career data with a résumé-accuracy test"
```

---

## Task 5: `velite.config.ts` and its schema fixtures

**Executor:** codex

**Codex effort:** high *(the fixture harness — spawning a real build against a corrupted content tree and asserting on stderr — is the non-obvious part, and getting it wrong produces a test that passes vacuously)*

**Review:** high *(schema and serialization boundary; this is the contract Goal 3 rides on, and it is consumed by Tasks 6, 9, and 10)*

**Depends On:** Task 2

Velite's schema owns per-file shape rules. Cross-source rules — `roleId` against `profile.ts`, `headlineOutcome.slug` against published content — belong to the loader in Task 6, per the planning decision recorded at the top of this plan.

**Files:**
- Create: `velite.config.ts`, `tests/fixtures/schema/*` (corrupted content trees), `tests/unit/schema.test.ts`
- Modify: `.gitignore` — add `/public/static`, where Velite copies `s.image()` assets at build time. It is generated output and must not be committed; leaving it tracked means every cover resize produces a spurious diff.

**Step 1: Make the content root and output dir configurable, so fixtures need no second config**

This is the design decision the harness depends on, and the reason it works at all. `velite.config.ts` reads its content root and **both** output directories from the environment:

```ts
root:   process.env.VELITE_CONTENT_ROOT ?? "content",
output: {
  data:   process.env.VELITE_OUTPUT_DIR ?? ".velite",
  assets: process.env.VELITE_ASSETS_DIR ?? "public/static",
  clean:  true,
},
```

**`assets` must be overridable too, not just `data`.** `output.assets` defaults to `public/static` and `clean: true` cleans the output directories — so a fixture build that redirected only `data` would wipe the real site's generated assets out of `public/static` every time the unit suite ran, and would race a `velite --watch` running alongside `next dev`. A test suite that deletes build output is a worse bug than the one this harness was written to fix.

Fixture builds then run **from the repo root**, with the real `velite.config.ts` and the real `node_modules`, pointed at a throwaway content directory. Three problems disappear:

- **Module resolution works.** A config copied into `/tmp` cannot resolve `velite` itself, let alone the local rehype plugin Task 9 adds to it — Node would walk up from `/tmp` and find no `node_modules`.
- **The tests keep testing the real config.** A fixture-only copy of the schema would drift from the shipped one, and the drift would be invisible.
- **Task 9's edit cannot break these tests**, because there is no copy to go stale.

**Step 2: Write the failing fixture tests**

Each case writes a throwaway content tree, runs a real `velite build --strict` against it, and asserts on the exit code, on stderr naming the field, **and on stderr not being an environment error**. That third assertion is the one that matters: without it, a missing binary or an unresolvable import produces a non-zero exit, every negative case passes, and the suite reports green while testing nothing.

```ts
// tests/unit/schema.test.ts
import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const REPO = process.cwd();
const VELITE = join(REPO, "node_modules", ".bin", "velite");

// Environment failures that must never be mistaken for schema failures.
const ENV_ERROR = /Cannot find module|command not found|ENOENT|MODULE_NOT_FOUND|is not recognized/i;

const VALID = `---
slug: "valid-item"
title: "A valid write-up"
summary: "One sentence."
publishedAt: "2026-01-01"
roleId: "evernest-staff-pm"
timeframe: "2026"
tags: ["Test"]
outcomes:
  - metric: "1×"
    label: "Something real"
cover: "./cover.png"
draft: false
---

Body.
`;

/**
 * Frontmatter variants are written out in full rather than regex-patched.
 * A regex like /outcomes:\n(  - .*\n)+/ matches the two-space "- metric:" line
 * but not the four-space "label:" line under it, so it would leave an orphaned
 * key and test YAML parsing instead of the schema rule.
 */
function withoutField(field: string): string {
  const lines = VALID.split("\n");
  const start = lines.findIndex((l) => l.startsWith(`${field}:`));
  if (start === -1) throw new Error(`fixture has no field '${field}'`);
  let end = start + 1;
  while (end < lines.length && /^\s+/.test(lines[end]) && lines[end].trim() !== "") end++;
  return [...lines.slice(0, start), ...lines.slice(end)].join("\n");
}

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

/** Run the real velite.config.ts against a throwaway content root. */
function buildWith(files: Record<string, string>) {
  // Inside the repo, so Node resolution reaches the repo's node_modules.
  mkdirSync(join(REPO, "tests", ".tmp"), { recursive: true });
  const root = mkdtempSync(join(REPO, "tests", ".tmp", "fixture-"));
  dirs.push(root);
  mkdirSync(join(root, "work"), { recursive: true });
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(root, "work", name), body);
  }
  // s.image() needs a real file to parse; reuse a small committed asset.
  copyFileSync("tests/fixtures/schema/cover.png", join(root, "work", "cover.png"));

  const env = {
    ...process.env,
    VELITE_CONTENT_ROOT: root,
    VELITE_OUTPUT_DIR: join(root, ".velite-out"),
    // Must be redirected too — otherwise `clean: true` wipes public/static.
    VELITE_ASSETS_DIR: join(root, ".assets-out"),
  };
  try {
    execFileSync(VELITE, ["build", "--clean", "--strict"], {
      cwd: REPO, encoding: "utf8", stdio: "pipe", env,
    });
    return { status: 0, stderr: "" };
  } catch (e: any) {
    return { status: e.status ?? 1, stderr: `${e.stderr ?? ""}${e.stdout ?? ""}` };
  }
}

/** Assert a real schema rejection: non-zero exit, right field, not an env error. */
function expectSchemaFailure(r: { status: number; stderr: string }, ...expected: RegExp[]) {
  expect(r.status, "expected a non-zero exit").not.toBe(0);
  expect(r.stderr, `environment error masquerading as a schema failure:\n${r.stderr}`)
    .not.toMatch(ENV_ERROR);
  for (const re of expected) expect(r.stderr).toMatch(re);
}

describe("content schema, under --strict", () => {
  it("accepts a valid write-up", () => {
    const r = buildWith({ "valid-item.mdx": VALID });
    expect(r.status, r.stderr).toBe(0);
  });

  it("rejects a missing 'outcomes', naming the file and the field", () => {
    expectSchemaFailure(buildWith({ "valid-item.mdx": withoutField("outcomes") }),
      /valid-item\.mdx/, /outcomes/);
  });

  it("rejects an empty 'outcomes' array", () => {
    expectSchemaFailure(
      buildWith({ "valid-item.mdx": withoutField("outcomes").replace("tags:", "outcomes: []\ntags:") }),
      /outcomes/);
  });

  it("rejects a missing 'slug'", () => {
    expectSchemaFailure(buildWith({ "valid-item.mdx": withoutField("slug") }), /slug/);
  });

  it("rejects two write-ups sharing a slug", () => {
    // Both files declare slug "valid-item"; one filename must differ to exist.
    expectSchemaFailure(buildWith({ "valid-item.mdx": VALID, "other.mdx": VALID }),
      /slug|duplicate|unique/i);
  });

  it("rejects both roleId and a literal org/role pair", () => {
    expectSchemaFailure(buildWith({
      "valid-item.mdx": VALID.replace('roleId: "evernest-staff-pm"\n',
        'roleId: "evernest-staff-pm"\norg: "Somewhere"\nrole: "Consultant"\n'),
    }), /roleId/);
  });

  it("rejects neither roleId nor an org/role pair", () => {
    expectSchemaFailure(buildWith({ "valid-item.mdx": withoutField("roleId") }), /roleId/);
  });
});
```

Commit a small (< 5KB) PNG at `tests/fixtures/schema/cover.png` so `s.image()` has something real to parse. Add `tests/.tmp/` to `.gitignore`.

**The `filename === slug` rule is deliberately not a case in this suite.** It closes a real hole — `lib/content.ts` reports problems as `content/work/<slug>.mdx`, but a slug is authored and need not match the filename, so that path could name a file that does not exist — and requiring the match also strengthens the original reason for authoring slugs, because renaming a file then fails the build loudly rather than silently changing a live URL.

But it cannot be tested here. `buildWith()` runs `velite build`, and that command never imports `src/lib/content.ts`, which is where the rule lives. A fixture case for it would sit red permanently while looking like a real assertion. It is covered instead by the `assertFilenamesMatchSlugs` unit tests in Task 6 and by the real `next build` check in **Task 10 Step 5**.

The schema's job here is only to carry `sourcePath` (via `s.path()`) into the generated data, so the loader can compare filename to slug per entry.

**Step 3: Run the tests to verify they fail**

Run: `npx vitest run tests/unit/schema.test.ts`
Expected: FAIL — no `velite.config.ts`.

**Step 4: Write `velite.config.ts`**

```ts
import { defineConfig, s } from "velite";

const outcome = s.object({
  metric: s.string().min(1),
  label: s.string().min(1),
});

export default defineConfig({
  // Overridable so the fixture tests can point a real build at a throwaway tree.
  root: process.env.VELITE_CONTENT_ROOT ?? "content",
  output: {
    data: process.env.VELITE_OUTPUT_DIR ?? ".velite",
    // Overridable so a fixture build's clean cannot wipe the real public/static.
    assets: process.env.VELITE_ASSETS_DIR ?? "public/static",
    base: "/static/",
    // Deliberately false. Cleaning is opt-in through the --clean flag, which
    // only the build script passes. If it were true here, `npm run test` —
    // which runs velite against the REAL content to regenerate .velite — would
    // wipe and repopulate public/static as a side effect of running tests, and
    // would race a `velite --watch` running beside `next dev`.
    clean: false,
  },
  collections: {
    work: {
      name: "Work",
      pattern: "work/*.mdx",
      schema: s
        .object({
          slug: s.slug("work"),
          title: s.string().min(1).max(160),
          summary: s.string().min(1).max(300),
          publishedAt: s.isodate(),
          updatedAt: s.isodate().optional(),

          // Exactly one of: roleId, or the org/role pair. Refined below.
          roleId: s.string().min(1).optional(),
          org: s.string().min(1).optional(),
          role: s.string().min(1).optional(),

          timeframe: s.string().min(1),
          tags: s.array(s.string().min(1)).min(1),
          outcomes: s.array(outcome).min(1),
          cover: s.image(),
          draft: s.boolean().default(false),
          code: s.mdx(),
          // The file this entry was parsed from, so the loader can check
          // filename against slug per entry rather than set-to-set.
          sourcePath: s.path(),
        })
        .superRefine((d, ctx) => {
          const hasRoleId = Boolean(d.roleId);
          const hasLiteral = Boolean(d.org && d.role);
          if (hasRoleId === hasLiteral) {
            ctx.addIssue({
              code: "custom",
              path: ["roleId"],
              message:
                "field 'roleId': supply exactly one of roleId (employed work, resolves org and " +
                "title from src/data/profile.ts) or the org/role pair (independent work)",
            });
          }
        }),
    },
  },
});
```

Five notes:

- **`draft` is not filtered here.** Drafts stay in the generated output and `src/lib/content.ts` filters them, so one module owns the rule and a preview mechanism stays possible later.
- **`slug` is authored, not derived from the filename**, via `s.slug("work")` — which validates format and uniqueness within the collection. Renaming a file therefore cannot silently change a live URL, at the cost of every write-up having to declare one.
- **The `filename === slug` rule lives in `src/lib/content.ts`, not here** — the schema only supplies `sourcePath` for it. Task 6 enforces it and Task 10 Step 5 proves it fails a real build. That is what makes the loader's `content/work/<slug>.mdx` error paths name a file that actually exists.
- **`cover` uses `s.image()`**, which parses the local file and emits intrinsic `width` and `height`. Those are the `next/image` dimensions the Lighthouse criterion depends on, which is why Task 7 co-locates cover images next to their MDX rather than leaving them in `public/`.
- **`s.mdx()` takes no rehype plugins yet.** Task 9 adds the image-dimension plugin — and because the fixtures run the real config from the repo root, that edit cannot break them.

**Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/schema.test.ts`
Expected: PASS, 7 tests, all green — this task ships no knowingly-red suite.

If the `--strict` failure message names the file but not the field, the spike's Step 5 already surfaced it and Josh already decided. Apply that decision here — do not weaken the assertion to make the test green.

**Step 6: Verify against the real content tree**

```bash
npx velite build --clean --strict; echo "exit=$?"
```
Expected: non-zero. The five files in `content/work/` still carry template frontmatter, so this *should* fail — and the failure output is Task 7's starting point. Capture it.

**Two things about that output, both established during this task's review. Task 7 needs them or it will chase phantoms.**

- **It is a starting point, not a complete worklist.** Zod skips `.superRefine` whenever the base object aborts, so the exactly-one-of `roleId` rule is invisible on any file that is also missing a required field — which is all five today. None of them has a `roleId`, `org`, or `role`, yet no `roleId` error appears. A second wave arrives once the first is fixed. Re-run until it is clean rather than treating one pass as the whole job.
- **`slug` is listed twice per file, and that is one problem, not two.** Velite's `s.slug()` is `.and(unique(...))`, an intersection of two string schemas parsed against one shared context, so a missing value fails both branches and prints twice. The headline count is inflated: 29 rows, 24 distinct problems.

**Step 7: Commit**

```bash
git add velite.config.ts tests/fixtures/schema tests/unit/schema.test.ts .gitignore
git commit -m "feat: add the content schema with a fixture test per rule"
```

---

## Task 6: `src/lib/content.ts` and `src/lib/content-rules.ts`

**Executor:** codex

**Review:** high *(the loader is the seam every page, the sitemap, and the OG route consume, and it owns the draft-filtering invariant)*

**Depends On:** Task 4 *(resolves `roleId` against `profile.ts`)*, Task 5 *(imports Velite's generated output)*

The loader exists because draft filtering has to happen in exactly one place. If pages filtered drafts themselves, a draft would eventually leak into the sitemap or `generateStaticParams`. It is not a speculative abstraction; it has a job.

Its functions are `async` even though Velite's output is a synchronous import. Every plausible replacement — `gray-matter` with `next-mdx-remote/rsc`, or raw `fs` — is asynchronous, so declaring the boundary async now means a replacement changes function bodies rather than the signature of every calling component. The cost is one keyword.

**Two modules, for a reason that is about testability, not layering.** `content-rules.ts` holds the pure predicates and imports only `profile.ts`. `content.ts` imports the generated Velite output, applies those predicates at module scope, and exposes the loaders.

The split exists because a single module cannot be unit-tested at this point in the plan: `content.ts` imports `#content`, which resolves to `.velite/` — and `.velite/` holds nothing valid until Task 7 authors real frontmatter. A test importing the predicates through `content.ts` would fail at module load with an unresolved import, not on behavior, and the tempting fix under time pressure is to lazy-load or delete the module-scope checks, which are exactly what the "fails the build" criteria ride on. Two modules keeps the predicates testable now and the checks eager.

**Files:**
- Create: `src/lib/content-rules.ts`, `src/lib/content.ts`
- Test: `tests/unit/content-rules.test.ts`

**Step 1: Write the failing test**

Test the predicates directly, against `content-rules.ts`. The real-content integration suite belongs to Task 7, where valid content exists — no task in this plan ships a suite it knows to be red.

```ts
// tests/unit/content-rules.test.ts
import { describe, expect, it } from "vitest";
import {
  filterPublished, resolveRole, assertHeadlineSlugs, assertFilenamesMatchSlugs,
} from "@/lib/content-rules";

const item = (over: Record<string, unknown> = {}) => ({
  slug: "a", title: "A", summary: "s", publishedAt: "2026-01-01",
  roleId: "evernest-staff-pm", timeframe: "2026", tags: ["T"],
  outcomes: [{ metric: "1×", label: "L" }],
  cover: { src: "/static/a.png", width: 100, height: 60 },
  draft: false, code: "", ...over,
});

describe("filterPublished", () => {
  it("drops drafts", () => {
    expect(filterPublished([item({ slug: "a" }), item({ slug: "b", draft: true })]).map((i) => i.slug)).toEqual(["a"]);
  });

  it("sorts published items newest first", () => {
    const out = filterPublished([
      item({ slug: "old", publishedAt: "2024-01-01" }),
      item({ slug: "new", publishedAt: "2026-01-01" }),
      item({ slug: "mid", publishedAt: "2025-01-01" }),
    ]);
    expect(out.map((i) => i.slug)).toEqual(["new", "mid", "old"]);
  });
});

describe("resolveRole", () => {
  it("resolves org and role from a roleId", () => {
    expect(resolveRole(item({ roleId: "azibo-senior-pm" }))).toEqual({
      org: "Azibo", role: "Senior Product Manager",
    });
  });

  it("passes through a literal org/role pair", () => {
    expect(resolveRole(item({ roleId: undefined, org: "Self", role: "Consultant" }))).toEqual({
      org: "Self", role: "Consultant",
    });
  });

  it("throws naming the file and the field for an unresolvable roleId", () => {
    expect(() => resolveRole(item({ slug: "ghost", roleId: "no-such-role" })))
      .toThrow(/ghost.*roleId.*no-such-role/s);
  });

  it("validates a DRAFT's roleId too, not just published ones", () => {
    // Drafts are filtered for display, but a bad reference in one is still a
    // bad reference — and it becomes a live 404 the moment the flag flips.
    expect(() => resolveRole(item({ slug: "d", draft: true, roleId: "no-such-role" })))
      .toThrow(/no-such-role/);
  });
});

// sourcePath values here are extension-LESS, because that is what s.path()
// emits. Writing "work/a.mdx" in a fixture would make these tests green against
// a shape the build never produces.
describe("assertFilenamesMatchSlugs", () => {
  it("accepts a matching pair", () => {
    expect(() => assertFilenamesMatchSlugs([item({ slug: "a", sourcePath: "work/a" })]))
      .not.toThrow();
  });

  it("throws naming both the file and the slug when they differ", () => {
    expect(() => assertFilenamesMatchSlugs([item({ slug: "a", sourcePath: "work/wrong-name" })]))
      .toThrow(/wrong-name\.mdx.*"a"/s);
  });

  it("throws on swapped slugs, which a set comparison would accept", () => {
    // a.mdx declares "b" and b.mdx declares "a". The two SETS are equal, so a
    // set-to-set check passes while both URLs are wrong. Per-entry catches it.
    expect(() => assertFilenamesMatchSlugs([
      item({ slug: "b", sourcePath: "work/a" }),
      item({ slug: "a", sourcePath: "work/b" }),
    ])).toThrow(/a\.mdx.*"b"/s);
  });
});

describe("assertHeadlineSlugs", () => {
  it("accepts outcomes whose slugs resolve to published items", () => {
    expect(() => assertHeadlineSlugs(
      [{ metric: "1×", label: "L", org: "O", period: "P", slug: "a" }],
      [item({ slug: "a" })],
    )).not.toThrow();
  });

  it("accepts outcomes with no slug at all", () => {
    expect(() => assertHeadlineSlugs(
      [{ metric: "1×", label: "L", org: "O", period: "P" }], [],
    )).not.toThrow();
  });

  it("throws when a slug points at nothing", () => {
    expect(() => assertHeadlineSlugs(
      [{ metric: "1×", label: "L", org: "O", period: "P", slug: "missing" }], [item({ slug: "a" })],
    )).toThrow(/headlineOutcomes.*missing/s);
  });

  it("throws when a slug points at a draft", () => {
    expect(() => assertHeadlineSlugs(
      [{ metric: "1×", label: "L", org: "O", period: "P", slug: "d" }],
      filterPublished([item({ slug: "d", draft: true })]),
    )).toThrow(/headlineOutcomes.*d/s);
  });
});
```

The draft-slug case is the one that matters most: a headline metric linking to a draft would render a live homepage link straight into a 404.

**Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/content-rules.test.ts`
Expected: FAIL — cannot resolve `@/lib/content-rules`.

**Step 3: Implement `src/lib/content-rules.ts`**

Pure predicates. Imports `profile.ts` and nothing else — in particular, not `#content`.

```ts
import { profile, type HeadlineOutcome, type Role } from "@/data/profile";

type Rawish = { slug: string; draft: boolean; publishedAt: string; roleId?: string; org?: string; role?: string };

/** Drop drafts and sort newest first. The only place drafts are filtered. */
export function filterPublished<T extends { draft: boolean; publishedAt: string }>(items: T[]): T[] {
  return items
    .filter((i) => !i.draft)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/**
 * Employed work carries a roleId that resolves org and title from profile.ts,
 * so the two can't drift. Independent work supplies them literally.
 */
export function resolveRole(item: Pick<Rawish, "slug" | "roleId" | "org" | "role">): { org: string; role: string } {
  if (item.roleId) {
    const match: Role | undefined = profile.roles.find((r) => r.id === item.roleId);
    if (!match) {
      throw new Error(
        `content/work/${item.slug}.mdx: field 'roleId' is "${item.roleId}", which matches no role id in ` +
          `src/data/profile.ts. Known ids: ${profile.roles.map((r) => r.id).join(", ")}`,
      );
    }
    return { org: match.org, role: match.title };
  }
  if (item.org && item.role) return { org: item.org, role: item.role };
  throw new Error(`content/work/${item.slug}.mdx: needs either 'roleId' or both 'org' and 'role'`);
}

/**
 * The loader reports problems as content/work/<slug>.mdx, so a slug that does
 * not match its filename would make every error message name a file that does
 * not exist. Requiring the match also means renaming a file fails the build
 * loudly rather than silently changing a live URL.
 */
export function assertFilenamesMatchSlugs(items: { slug: string; sourcePath: string }[]): void {
  // Compare PER ENTRY, not set-to-set. A set comparison would accept a.mdx
  // declaring slug "b" while b.mdx declares slug "a" — the two sets are equal
  // and both URLs are silently wrong. sourcePath comes from s.path() in the
  // schema, so each entry carries the file it was actually parsed from.
  // s.path() STRIPS the extension: a file at content/work/a.mdx arrives as
  // "work/a", not "work/a.mdx". Verified against velite 0.4.0 during Task 5's
  // review. So the stem needs no .replace(), and the error message has to append
  // the extension itself — otherwise it names content/work/a, a path that does
  // not exist, which is the exact failure this rule was written to prevent.
  for (const { slug, sourcePath } of items) {
    const stem = sourcePath.split("/").pop()!;
    if (stem !== slug) {
      throw new Error(
        `content/${sourcePath}.mdx: filename does not match its declared slug "${slug}". ` +
          `Rename the file to ${slug}.mdx, or change the slug to "${stem}".`,
      );
    }
  }
}

/** Every non-empty headlineOutcome.slug must resolve to a published write-up. */
export function assertHeadlineSlugs(outcomes: HeadlineOutcome[], published: { slug: string }[]): void {
  const slugs = new Set(published.map((i) => i.slug));
  for (const o of outcomes) {
    if (o.slug && !slugs.has(o.slug)) {
      throw new Error(
        `src/data/profile.ts: field 'headlineOutcomes' has slug "${o.slug}" (metric "${o.metric}"), ` +
          `which is not a published write-up. Published: ${[...slugs].join(", ") || "none"}`,
      );
    }
  }
}
```

**Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/content-rules.test.ts`
Expected: PASS, 13 tests.

**Step 5: Implement `src/lib/content.ts`**

```ts
import { work } from "#content";
import { profile, type HeadlineOutcome, type Role } from "@/data/profile";
import {
  assertFilenamesMatchSlugs, assertHeadlineSlugs, filterPublished, resolveRole,
} from "@/lib/content-rules";

type RawWork = (typeof work)[number];

export type WorkItem = RawWork & { org: string; role: string };
export type ResolvedHeadlineOutcome = HeadlineOutcome & { href: string | null };

// ---------------------------------------------------------------------------
// Module scope: every check below runs the moment anything imports this file.
// Pages, the sitemap, robots, the OG route, and generateStaticParams all import
// it, so `next build` fails on a bad reference rather than shipping a dead link.
// ---------------------------------------------------------------------------

// Filenames must match slugs, so every error message below names a real file.
// Each entry carries its own sourcePath from s.path(), so this needs no fs read.
assertFilenamesMatchSlugs(work);

// Resolve roles across EVERY item, drafts included, BEFORE filtering. A bad
// roleId in a draft is still a bad reference; validating only what is published
// would let it sit until someone flips the flag and shipped a broken page.
const resolved: WorkItem[] = work.map((item) => ({ ...item, ...resolveRole(item) }));

const published: WorkItem[] = filterPublished(resolved);

assertHeadlineSlugs(profile.headlineOutcomes, published);

export async function getWorkItems(): Promise<WorkItem[]> {
  return published;
}

export async function getWorkItem(slug: string): Promise<WorkItem | null> {
  return published.find((i) => i.slug === slug) ?? null;
}

export async function getAllWorkSlugs(): Promise<string[]> {
  return published.map((i) => i.slug);
}

export async function getHeadlineOutcomes(): Promise<ResolvedHeadlineOutcome[]> {
  return profile.headlineOutcomes.map((o) => ({ ...o, href: o.slug ? `/work/${o.slug}` : null }));
}

export async function getRoles(): Promise<Role[]> {
  return profile.roles;
}
```

There is no repository class and no content service beyond this. Pages call `getWorkItems()` and `getWorkItem(slug)`.

There is no filesystem read at module scope. `sourcePath` rides along in the generated data, so the loader stays a pure transform over Velite's output and works identically under Vitest, `next build`, and a server request.

**Step 6: Note where the wiring gets proved, and why it is not here**

Steps 1–5 cover the predicates. They do not cover the wiring — that the module-scope calls actually abort a build — and that is what the "fails the build" acceptance criteria are written against.

That proof cannot happen in this task, for two independent reasons:

1. `content/work/` still holds template frontmatter until Task 7, so `velite build --strict` fails and `.velite` has no valid output. A `next build` here dies on an unresolved `#content` import, not on a referential-integrity message.
2. Nothing imports `src/lib/content.ts` yet. `src/app/page.tsx` is still Task 2's placeholder, and the first real consumer is Task 10. Module-scope code in a module no one imports never runs, so even with valid output the build would come back green.

The wiring is therefore proved in **Task 10 Step 5**, the first point where both conditions hold. Task 7's `content-tree.test.ts` provides earlier coverage as a side effect — it imports the loader, so a bad reference throws at module load under Vitest — but a passing Vitest import is not the same claim as a failing `next build`, and the criteria say build.

Do not attempt a break-the-build check in this task. It will fail for the wrong reason and the natural response is to weaken the checks it is meant to validate.

**Step 7: Commit**

```bash
git add src/lib/content.ts src/lib/content-rules.ts tests/unit/content-rules.test.ts
git commit -m "feat: add the content loader with draft filtering and referential-integrity checks"
```

---

## Task 7: Author frontmatter for the five write-ups

**Executor:** codex

**Review:** low

**Depends On:** Task 5 *(the schema defines what to write)*, Task 6 *(the loader this task's integration suite exercises)*

**BLOCKING:** five of the seven rows in "Content inputs required from Josh" gate this task — including the Smarter Payouts cover, because `cover` is a required field and there is no valid frontmatter to write without it. If a required metric is missing, **stop and ask**. Do not invent a number. The design doc is explicit: *"if one genuinely has none, that is a signal about the write-up, not about the schema."*

Porting is authoring, not migration. None of these files has `outcomes`, a `slug`, or a `roleId` today.

**Files:**
- Modify: all five `content/work/*.mdx`
- Create: `content/work/<slug>/cover.*` (co-located cover images), `content/work/draft-fixture.mdx`, `tests/unit/content-tree.test.ts`

**Step 1: Co-locate cover images**

`s.image()` resolves relative to the content file and emits intrinsic `width` and `height`. Public absolute paths do not get that treatment, so covers move next to their MDX. Body images stay in `public/images/...` with absolute paths — Task 9's rehype plugin handles their dimensions.

```bash
mkdir -p content/work/{deterministic-ai-photo-pipeline,cutting-six-of-seven-steps,all-in-one-rental-platform,smarter-payouts-predictive-model,product-led-growth-strategy}
```

Cover sources, and their state:

| Slug | Cover source | Note |
|---|---|---|
| `deterministic-ai-photo-pipeline` | `public/images/projects/ai-re-photos/cover.png` | 6.0MB, 2048×1499 — Task 8 resizes |
| `cutting-six-of-seven-steps` | `public/images/blog/pipeline-drift/staging-comparison.jpg` | 384KB — Task 8 resizes |
| `all-in-one-rental-platform` | `public/images/projects/project-01/azibo-all-in-one.jpg` | 672KB, 2572×1522 — Task 8 resizes |
| `smarter-payouts-predictive-model` | **none** — currently `mindblown-wow.gif` | blocked on Josh; Task 8 |
| `product-led-growth-strategy` | `public/images/projects/project-01/rhawa.jpg` | 88KB, 776×394 — acceptable as-is |

Copy each into its slug directory as `cover.<ext>` and reference it as `cover: "./<slug>/cover.png"`. Leave the originals in `public/` for this task; Task 8 resizes the co-located copies and then deletes any original that no longer has a reader.

For Smarter Payouts, if Josh has not supplied a static cover, **stop**. `cover` is a required field, so there is no valid frontmatter to write.

**Step 2: Author the frontmatter**

Frontmatter for each file, replacing the old `images`/`team`/`tag` blocks entirely. Delete the `team` block — the author-name field is where `"  Lente"` came from, and a single-author portfolio does not need it.

`content/work/deterministic-ai-photo-pipeline.mdx`:
```yaml
---
slug: "deterministic-ai-photo-pipeline"
title: "A deterministic AI pipeline for real-estate photos"
summary: "Chose a deterministic pipeline over a single generative pass, so every enhancement is reproducible and nothing ships distorted."
publishedAt: "2025-11-12"
roleId: "evernest-staff-pm"
timeframe: "<JOSH: project dates>"
tags: ["AI/LLM", "Pipeline"]
outcomes:
  - metric: "<JOSH>"
    label: "<JOSH>"
cover: "./deterministic-ai-photo-pipeline/cover.png"
draft: false
---
```

`content/work/cutting-six-of-seven-steps.mdx` — this one already has `outcomes` in the right shape; keep all three.

**Superseded on 2026-07-27: every `58%` below is now `50%`, and the body's starting cost is `$0.34`, not `$0.40`.** Josh corrected the starting cost after the task ran. The three fields below carried two different readings of the same figure — the title said "58% cheaper" while the summary said "58% of the cost", which is a 42% cut — and the body's `$0.40 → $0.17` supported neither once the real starting cost arrived. `$0.17 ÷ $0.34` is exactly one half, so the title, the summary, and the outcome metric all read 50%. The block below is left as-authored because it is the record of what the task was given, not what ships.
```yaml
---
slug: "cutting-six-of-seven-steps"
title: "Cutting six of seven steps made photos 58% cheaper and leasing 9% faster"
summary: "An automated research loop showed my seven-step photo pipeline was obsolete. Collapsing it to one generative pass held quality at 58% of the cost, and made room for tenant item removal and virtual staging."
publishedAt: "2026-07-24"
roleId: "evernest-staff-pm"
timeframe: "<JOSH: project dates>"
tags: ["AI/LLM", "Cost"]
outcomes:
  - metric: "58%"
    label: "Lower cost per enhanced photo"
  - metric: "7 → 1"
    label: "Generative passes per photo"
  - metric: "9%"
    label: "Faster time to lease"
cover: "./cutting-six-of-seven-steps/cover.jpg"
draft: false
---
```

`content/work/all-in-one-rental-platform.mdx` — the body already carries three real numbers (`2.8x increase in monetized users`, `3.5x growth in gross margin per user`, `over $300M in annual rent payments`):
```yaml
---
slug: "all-in-one-rental-platform"
title: "Vision for an all-in-one rental platform"
summary: "Made the case for the platform bet, then shipped it — one product became seven, and margin per user tripled."
publishedAt: "2024-04-08"
roleId: "azibo-senior-manager"
timeframe: "<JOSH: project dates>"
tags: ["Strategy", "0→1"]
outcomes:
  - metric: "1→7"
    label: "Products in the suite"
  - metric: "3.5×"
    label: "Gross margin per user"
  - metric: "2.8×"
    label: "Monetized users"
cover: "./all-in-one-rental-platform/cover.jpg"
draft: false
---
```

`content/work/smarter-payouts-predictive-model.mdx` — the body carries `Accelerated payouts delivered within two days by 35%` and `less than a 0.1% increase in payout clawbacks`:
```yaml
---
slug: "smarter-payouts-predictive-model"
title: "Smarter payouts: training a predictive model"
summary: "Predicted which payouts would fail before they did, so fewer transactions bounced."
publishedAt: "2024-04-08"
roleId: "azibo-senior-manager"
timeframe: "<JOSH: project dates>"
tags: ["ML", "Payments"]
outcomes:
  - metric: "35%"
    label: "More payouts delivered within two days"
  - metric: "<0.1%"
    label: "Increase in clawbacks"
cover: "./smarter-payouts-predictive-model/cover.<ext>"
draft: false
---
```

The design doc flags this write-up's summary as describing a system rather than a decision, and notes the underlying write-up has the same gap — so it is a content fix, not a copy fix, and it **stays as written above** until the write-up itself names a decision. Every other case summary leads with the decision. Do not rewrite it here to sound better than the write-up supports.

`content/work/product-led-growth-strategy.mdx`:
```yaml
---
slug: "product-led-growth-strategy"
title: "A unique product-led growth strategy"
summary: "Bet on partnerships over paid acquisition; it became the largest and highest-margin lead source in company history."
publishedAt: "2024-04-01"
roleId: "azibo-senior-pm"
timeframe: "<JOSH: project dates>"
tags: ["Growth", "Partnerships"]
outcomes:
  - metric: "<JOSH>"
    label: "<JOSH>"
cover: "./product-led-growth-strategy/cover.jpg"
draft: false
---
```

`roleId: "azibo-senior-pm"` because the PLG initiative belongs to the 2022–23 Senior PM role per the track record, even though the write-up was published in 2024. Confirm with Josh; `timeframe` describes the project, `publishedAt` describes the post.

**Step 3: Rewrite the internal cross-link**

`content/work/cutting-six-of-seven-steps.mdx` line 16 links to `/work/AI-Pipeline-for-Real-Estate-Photos`, which no longer exists:

```diff
-A year ago I published a [case study](/work/AI-Pipeline-for-Real-Estate-Photos) arguing that
+A year ago I published a [case study](/work/deterministic-ai-photo-pipeline) arguing that
```

Then sweep for any other stale internal link:
```bash
grep -rn "/work/\|/blog/\|/en/" content/
```
Expected: only `/work/deterministic-ai-photo-pipeline`, plus `/images/blog/pipeline-drift/*` asset paths.

**Step 4: Add a permanent draft fixture**

The `draft: true` acceptance criterion has four legs — absent from the index, absent from the sitemap, absent from `generateStaticParams`, and 404 at its URL — and none of them can be verified repeatably against a content tree with no drafts in it. A temporary draft added by hand and deleted proves the rule once, then stops guarding it. Every automated check would stay green while the invariant the plan itself calls the silent leak that "publishes an unfinished write-up to Google" quietly regressed.

So the fixture is a permanent, committed part of the content tree:

```yaml
---
slug: "draft-fixture"
title: "Draft fixture — never published"
summary: "A permanent draft. It exists so the draft-containment tests have something to contain."
publishedAt: "2020-01-01"
roleId: "azibo-senior-pm"
timeframe: "2020"
tags: ["Fixture"]
outcomes:
  - metric: "0"
    label: "Times this should appear on the site"
cover: "./draft-fixture/cover.webp"
draft: true
---

If you are reading this on the live site, draft filtering is broken.
```

Give it a copy of the < 5KB `tests/fixtures/schema/cover.png`, **converted to `cover.webp`** and referenced as `cover: "./draft-fixture/cover.webp"`. Writing it as WebP here rather than PNG keeps Task 8's "no raster reference in `content/` is anything but `.webp`" check exact, instead of needing a carve-out for the one file Task 8 does not resize.

Its `publishedAt` is deliberately the oldest date in the tree, so a sort bug cannot hide it at position zero.

This makes the content tree six files and five published items. Downstream tasks assert on both numbers, and Task 8's cover-count expectation becomes 6.

**Step 5: Write the real-content integration suite**

```ts
// tests/unit/content-tree.test.ts
import { describe, expect, it } from "vitest";
import { getAllWorkSlugs, getHeadlineOutcomes, getWorkItem, getWorkItems } from "@/lib/content";
import { work } from "#content";
import { profile } from "@/data/profile";

describe("the real content tree", () => {
  it("generates six items, of which exactly one is a draft", () => {
    expect(work).toHaveLength(6);
    expect(work.filter((i) => i.draft).map((i) => i.slug)).toEqual(["draft-fixture"]);
  });

  it("never returns a draft from any surface", async () => {
    const items = await getWorkItems();
    expect(items).toHaveLength(5);
    expect(items.every((i) => i.draft === false)).toBe(true);
    expect(await getAllWorkSlugs()).toEqual(items.map((i) => i.slug));
    expect(await getWorkItem("draft-fixture")).toBeNull();
  });

  it("returns null for an unknown slug", async () => {
    expect(await getWorkItem("no-such-write-up")).toBeNull();
  });

  it("resolves org and role on every item", async () => {
    for (const i of await getWorkItems()) {
      expect(i.org, i.slug).toBeTruthy();
      expect(i.role, i.slug).toBeTruthy();
    }
  });

  it("gives every item at least one outcome, per the schema", async () => {
    for (const i of await getWorkItems()) expect(i.outcomes.length, i.slug).toBeGreaterThan(0);
  });

  it("resolves every headline outcome that declares a slug", async () => {
    const resolved = await getHeadlineOutcomes();
    expect(resolved).toHaveLength(profile.headlineOutcomes.length);
    for (const o of resolved) {
      if (o.slug) expect(o.href).toBe(`/work/${o.slug}`);
      else expect(o.href).toBeNull();
    }
  });
});
```

**Step 6: Verify the schema accepts the tree**

```bash
npx velite build --clean --strict; echo "exit=$?"
```
Expected: `exit=0`, and `.velite/index.js` contains six `work` entries.

**Step 7: Run every content test**

Run: `npx vitest run tests/unit/`
Expected: PASS, every suite. This is the first point where `npm run test` is green end to end. `getHeadlineOutcomes()` now resolves both declared slugs (`all-in-one-rental-platform` and `cutting-six-of-seven-steps`), which is what the module-scope `assertHeadlineSlugs` call guards.

**Step 8: Commit**

```bash
git add content/ tests/
git commit -m "content: author frontmatter for the five ported write-ups, add a draft fixture"
```

---

## Task 8: Image asset pass

**Executor:** codex

**Review:** low

**Depends On:** Task 7 *(operates on the co-located covers)*

**BLOCKING:** needs a static replacement cover for Smarter Payouts from Josh.

The four prototype thumbnails currently total 7.6MB and display at roughly 148px wide. `next/image` cannot fix a 6.0MB source: the ≥95 performance criterion is unreachable until the source assets are resized too. This is a hard requirement, not an optimization.

**Files:**
- Modify: `content/work/*/cover.*`, `public/images/blog/pipeline-drift/*`, `public/images/projects/ai-re-photos/*`, the image references in `content/work/*.mdx`
- Delete: `public/images/projects/smarter-payouts/mindblown-wow.gif`
- Create: `scripts/resize-images.mjs`, `tests/unit/assets.test.ts`

**Step 1: Write the failing test**

```ts
// tests/unit/assets.test.ts
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { globSync, statSync } from "node:fs"; // fs.globSync requires Node 22+

describe("image assets", () => {
  it("references no .gif from content/ or src/", () => {
    const hits = execFileSync("bash", ["-c", "grep -rl '\\.gif' content/ src/ || true"], { encoding: "utf8" }).trim();
    expect(hits).toBe("");
  });

  it("ships no .gif under public/", () => {
    expect(globSync("public/**/*.gif")).toEqual([]);
  });

  it("keeps every cover under 300KB", () => {
    const covers = globSync("content/work/*/cover.*");
    expect(covers.length).toBe(6); // five published write-ups plus the draft fixture
    for (const c of covers) {
      expect(statSync(c).size, `${c} is ${Math.round(statSync(c).size / 1024)}KB`).toBeLessThan(300 * 1024);
    }
  });

  it("keeps every body image under 300KB", () => {
    for (const f of globSync("public/images/**/*.{png,jpg,jpeg,webp,avif}")) {
      expect(statSync(f).size, `${f} is ${Math.round(statSync(f).size / 1024)}KB`).toBeLessThan(300 * 1024);
    }
  });
});
```

300KB per file is the working budget that makes the homepage's under-500KB total reachable — covers render at ~148px on desktop and `next/image` serves a much smaller derivative, but the source has to be sane for the build to be fast and the repo to stay small.

**Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/assets.test.ts`
Expected: FAIL on all four — the GIF exists and is referenced, and several sources exceed 300KB.

**Step 3: Write the resize script**

Use the already-installed `sharp` rather than `npx sharp-cli`, which is undeclared, unpinned, and whose flag syntax the plan has not verified. About fifteen lines, and it is repeatable:

```js
// scripts/resize-images.mjs — run once; kept in the repo so it can run again.
import { unlink } from "node:fs/promises";
import sharp from "sharp";

// [source, width]. The output path is derived, so it cannot drift from the source.
const JOBS = [
  ["content/work/deterministic-ai-photo-pipeline/cover.png",     1200],
  ["content/work/cutting-six-of-seven-steps/cover.jpg",          1200],
  ["content/work/all-in-one-rental-platform/cover.jpg",          1200],
  ["content/work/smarter-payouts-predictive-model/cover.jpg",    1200],
  ["content/work/product-led-growth-strategy/cover.jpg",         1200],
  ["public/images/blog/pipeline-drift/staging-comparison.jpg",   1600],
  ["public/images/blog/pipeline-drift/declutter-comparison.jpg", 1600],
  ["public/images/blog/pipeline-drift/generative-passes.png",    1600],
  ["public/images/blog/pipeline-drift/drift-budget.png",         1600],
  ["public/images/projects/ai-re-photos/photo45-original.png",   1600],
  ["public/images/projects/ai-re-photos/photo45-enhnaced.png",   1600],
];

for (const [src, width] of JOBS) {
  // photo45-enhnaced.png is a committed typo; fix the name on the way out.
  const out = src.replace(/\.(png|jpe?g)$/i, ".webp").replace("enhnaced", "enhanced");
  await sharp(src).resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toFile(out);
  await unlink(src);
  console.log(`${src} -> ${out}`);
}
```

Adjust the Smarter Payouts extension to whatever Josh's replacement cover actually is.

Covers display at 148px on desktop and 90px below 900px, so 1200px covers 2× DPR with room to spare. Body images render full-column at roughly 760px, so 1600px does the same.

Two things the inventory now includes that the first draft missed: `generative-passes.png` and `drift-budget.png`, both body images in `cutting-six-of-seven-steps.mdx`. And note the typo in the committed filename `photo45-enhnaced.png` — fixed on the way out.

**Step 4: Run it, before anything reads the new names**

```bash
node scripts/resize-images.mjs
```

Run it exactly once, here. The script deletes each source after converting it, so a second run fails on missing inputs — restore the sources from git first if you need to re-run.

Every step below reads or verifies the converted filenames. Updating references or rebuilding before this point would rewrite paths to files that do not exist yet.

**Step 5: Update every reference to the renamed files**

This is the step whose absence would have surfaced as a confusing Task 9 failure. The rehype plugin from Task 9 throws on a missing image, so a stale `.jpg` reference becomes a build error attributed to the wrong task.

Update, in order:
1. The `cover:` path in each of the six frontmatter blocks, to the new extension.
2. The four markdown image links in `content/work/cutting-six-of-seven-steps.mdx`.
3. The `beforeSrc`/`afterSrc` props in `content/work/deterministic-ai-photo-pipeline.mdx`, including the `enhnaced` → `enhanced` correction.

Then prove nothing dangles:
```bash
grep -rn -E '\.(jpg|jpeg|png|gif)' content/
```
Expected: no hits — every raster asset referenced from `content/` is now `.webp`, including the draft fixture's cover, which Task 7 wrote as WebP for exactly this reason. The two committed SVGs under `pipeline-drift/` are vector and stay as they are; if they are unreferenced, delete them.

Re-run `npx velite build --clean --strict` — `s.image()` re-reads each cover, so the emitted `width`/`height` change with the resize.

**Step 6: Replace the animated GIF**

`mindblown-wow.gif` is the live cover for the Smarter Payouts write-up. It auto-plays, cannot be paused, is the only motion on the page, and a reaction meme undercuts the register the serif numerals establish. An animated GIF also cannot be gated behind `prefers-reduced-motion` and has no pause control, which fails WCAG 2.2.2 for motion over five seconds.

Use Josh's static replacement, run it through the resize script, then:
```bash
git rm public/images/projects/smarter-payouts/mindblown-wow.gif
```

The rule going forward: no auto-playing animated media. Where motion genuinely helps, use a `<video>` with a poster frame that plays on hover or focus.

**Step 7: Delete the originals that no longer have a reader**

Task 7 copied covers out of `public/` into `content/work/<slug>/`, so those `public/` originals are unreferenced — and the 6.0MB `cover.png` among them would fail this task's own body-image budget test.

```bash
grep -rn "ai-re-photos/cover\|project-01/azibo-all-in-one\|project-01/rhawa" content/ src/
```

For each, if the only hits are the co-located `content/work/<slug>/cover.webp` paths, delete the `public/` original. `staging-comparison` is the exception — it is both the `cutting-six-of-seven-steps` cover *and* a body image in that write-up, so its `public/` copy stays (resized) and is referenced from the body.

**Step 8: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/assets.test.ts`
Expected: PASS, 4 tests.

Then: `npx velite build --clean --strict && npx next build`
Expected: exit 0.

**Step 9: Commit**

```bash
git add -A content public tests scripts
git commit -m "content: resize source images and drop the animated GIF cover"
```

`scripts/` is in the `git add` deliberately — the resize script is committed, not a throwaway, so the conversion is repeatable when a new image arrives.

---

## Task 9: MDX rendering — evaluator, registry, widgets, and prose

**Executor:** codex

**Codex effort:** high *(the `new Function` evaluator, the RSC boundary, and a custom rehype plugin interacting with the build — non-obvious interactions, and getting the client boundary wrong silently defeats an acceptance criterion)*

**Review:** high *(dynamic boundary — the evaluator is coupled to Velite's compile-to-function-body output contract, and it is one of the three things a Velite replacement touches)*

**Depends On:** Task 3 *(tokens for prose and widget styling)*, Task 5 *(`s.mdx()` output contract; this task adds rehype plugins to it)*, Task 7 *(Step 8 renders a real write-up, which needs valid frontmatter)*, Task 8 *(the slider props reference the renamed `.webp` images, and the rehype plugin throws on a missing file)*

**Velite compiles MDX to a function-body string, which evaluates in a React Server Component.** This is the pattern Velite's own Next.js example uses, with no `use client` directive. Only interactive widgets carry a client boundary. That keeps the MDX runtime and every compiled body out of the browser bundle, makes "widgets ship only where used" literally true, and avoids needing `unsafe-eval` in a CSP later.

**Files:**
- Create: `src/components/mdx/MDXContent.tsx`, `src/components/mdx/registry.tsx`, `src/components/mdx/BeforeAfterSlider.tsx`, `src/components/mdx/BeforeAfterSliderLazy.tsx`, `src/components/site/Prose.tsx`, `src/lib/mdx/rehype-image-dimensions.ts`
- Modify: `velite.config.ts` (register the rehype plugin)
- Test: `tests/unit/rehype-image-dimensions.test.ts`

**Step 1: Write the failing test for the rehype plugin**

Body images are absolute `/images/...` paths, so Velite's `s.image()` never sees them and they render without dimensions — which costs CLS, and therefore the Performance criterion. The plugin resolves each absolute `src` against `public/` and stamps `width` and `height` onto the node, so `next/image` gets real dimensions. About twenty lines, no new dependency, and testable.

```ts
// tests/unit/rehype-image-dimensions.test.ts
import { describe, expect, it } from "vitest";
import { rehype } from "rehype";
import rehypeImageDimensions from "@/lib/mdx/rehype-image-dimensions";

async function run(html: string, dir = "tests/fixtures/schema") {
  return String(await rehype().use(rehypeImageDimensions, { dir }).process(html));
}

describe("rehypeImageDimensions", () => {
  it("stamps intrinsic width and height on an absolute image src", async () => {
    const out = await run('<img src="/cover.png" alt="x">');
    expect(out).toMatch(/width="\d+"/);
    expect(out).toMatch(/height="\d+"/);
  });

  it("leaves an existing width and height alone", async () => {
    const out = await run('<img src="/cover.png" alt="x" width="10" height="20">');
    expect(out).toContain('width="10"');
    expect(out).toContain('height="20"');
  });

  it("leaves a remote src alone rather than throwing", async () => {
    const out = await run('<img src="https://example.com/a.png" alt="x">');
    expect(out).not.toMatch(/width=/);
  });

  it("throws naming the src when a local file is missing", async () => {
    await expect(run('<img src="/nope.png" alt="x">')).rejects.toThrow(/nope\.png/);
  });
});
```

The last case is the one that earns its keep: a typo'd image path becomes a build failure instead of a silently broken image.

**Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/rehype-image-dimensions.test.ts`
Expected: FAIL — module not found.

**Step 3: Implement the plugin**

```ts
// src/lib/mdx/rehype-image-dimensions.ts
import { existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { visit } from "unist-util-visit";

type Options = { dir?: string };

/**
 * Body images live in public/ with absolute paths, so Velite's s.image() never
 * sees them. Stamp intrinsic dimensions so next/image can reserve layout space.
 */
export default function rehypeImageDimensions({ dir = "public" }: Options = {}) {
  return async (tree: unknown) => {
    const jobs: Promise<void>[] = [];
    visit(tree as never, "element", (node: any) => {
      if (node.tagName !== "img") return;
      const src: unknown = node.properties?.src;
      if (typeof src !== "string" || !src.startsWith("/")) return;
      if (node.properties.width && node.properties.height) return;

      const file = join(dir, src);
      if (!existsSync(file)) {
        throw new Error(`rehype-image-dimensions: no such image "${src}" (looked in ${file})`);
      }
      jobs.push(
        sharp(file).metadata().then(({ width, height }) => {
          if (!width || !height) throw new Error(`rehype-image-dimensions: no dimensions in "${src}"`);
          node.properties.width = width;
          node.properties.height = height;
        }),
      );
    });
    await Promise.all(jobs);
  };
}
```

Add `unist-util-visit` and, for the test only, `rehype` as devDependencies. `sharp` is already a runtime dependency.

Register it in `velite.config.ts`:
```ts
import rehypeImageDimensions from "./src/lib/mdx/rehype-image-dimensions";
// ...
code: s.mdx({ rehypePlugins: [[rehypeImageDimensions, { dir: "public" }]] }),
```

**Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/rehype-image-dimensions.test.ts`
Expected: PASS, 4 tests.

**Step 5: Write the evaluator and registry**

`src/components/mdx/MDXContent.tsx` — a server component. No `use client`.

```tsx
import * as runtime from "react/jsx-runtime";
import { components } from "./registry";

function evaluate(code: string) {
  // Velite compiles MDX to a function body. Evaluating it in an RSC keeps the
  // MDX runtime and every compiled body out of the client bundle.
  return new Function(code)({ ...runtime }).default;
}

export function MDXContent({ code }: { code: string }) {
  const Component = evaluate(code);
  return <Component components={components} />;
}
```

`src/components/mdx/registry.tsx` — the map, and the only place a widget is wired in:

```tsx
import Image from "next/image";
import type { ImageProps } from "next/image";
// A thin "use client" wrapper, NOT the slider itself and NOT next/dynamic here.
import { BeforeAfterSlider } from "./BeforeAfterSliderLazy";

/** Body images route through next/image; dimensions come from the rehype plugin. */
function MdxImage({ src, alt, width, height }: ImageProps) {
  return (
    <Image
      src={src}
      alt={alt ?? ""}
      width={Number(width)}
      height={Number(height)}
      sizes="(max-width: 900px) 100vw, 760px"
      loading="lazy"
      className="my-8 h-auto w-full rounded-lg"
    />
  );
}

export const components = {
  img: MdxImage,
  BeforeAfterSlider,
};
```

And the wrapper, which is the whole trick:

```tsx
// src/components/mdx/BeforeAfterSliderLazy.tsx
"use client";
import dynamic from "next/dynamic";

// next/dynamic only code-splits when the dynamic import lives in a CLIENT
// component. Next's docs are explicit: "When a Server Component dynamically
// imports a Client Component, automatic code splitting is not currently
// supported." registry.tsx is a server module, so calling dynamic() there
// would ship the slider on every write-up route while looking correct.
//
// This wrapper is a few lines and does ship everywhere; the slider itself
// stays behind the dynamic import and loads only where it renders.
const Slider = dynamic(() => import("./BeforeAfterSlider").then((m) => m.BeforeAfterSlider));

export function BeforeAfterSlider(props: React.ComponentProps<typeof Slider>) {
  return <Slider {...props} />;
}
```

Do not pass `ssr: false` — it is an error inside a Server Component and unnecessary here; the default server-renders the widget.

**Implement whichever strategy Task 1's condition 8 actually proved.** The wrapper above is the documented approach and the expected winner, but condition 8 measures it rather than assuming it. If the wrapper does not isolate the chunk, the fallback is a per-write-up component map: `MDXContent` takes a `components` prop, frontmatter gains a `widgets: string[]` field, and the page passes only what its body uses. That is real extra machinery, so it is the second choice, not the first.

**Where the isolation gets verified.** Task 1's condition 8 already proved the mechanism on a two-page spike, which is why this task can commit to one strategy rather than guessing. The real write-up routes do not exist until Task 10, so the on-the-real-pages check belongs there — Task 10 Step 4 adds it alongside the route-count assertion:

```bash
npx next build
npx next start
# Load /work/deterministic-ai-photo-pipeline and /work/product-led-growth-strategy
# in separate browser contexts and compare the JS each requests.
```

Task 22 then asserts the same property against the deployed build, identifying the chunk by its contents rather than by name.

**Step 6: Port `BeforeAfterSlider`**

Recover the original from git history — it was deleted in Task 2:
```bash
git show feat/portfolio-rebuild:src/components/BeforeAfterSlider.tsx > src/components/mdx/BeforeAfterSlider.tsx
```

The component's behavior is sound — pointer capture, `role="slider"` with `aria-valuenow`, arrow/Home/End/PageUp/PageDown keys, a `ResizeObserver` for label collision. Keep all of it. Two changes:

1. **Replace the Once UI CSS variables**, which no longer exist. `--neutral-background-medium` → `var(--color-surface)`; `--neutral-border-strong` → `var(--color-accent)` for the divider (the accent's third sanctioned use is hover and focus, and the divider is the drag affordance — if that reads as over-spending the accent, use `--color-border-strong`); `--neutral-border-medium` and `--neutral-border-weak` → `var(--color-border-strong)`; `--page-background` → `var(--color-bg)`; `--neutral-on-background-strong` → `var(--color-text)`; `--neutral-alpha-weak` → `var(--color-surface)`.
2. **Raise the 12px labels to `--text-xs`** and confirm the handle has a `:focus-visible` ring — the base layer in Task 3 supplies one, but verify it is not clipped by `overflow: hidden` on the container. If it is, move the ring to an inset `box-shadow`.

Keep `"use client"` at the top. It is the only client component on a write-up page.

**Step 7: Write `Prose`**

`src/components/site/Prose.tsx` wraps a write-up body with typography. It takes children and nothing else.

Element styles to cover, because the ported write-ups use all of them: `h2`, `h3`, `p`, `ul`/`ol`/`li`, `strong`, `a`, `blockquote`, `pre`, `code`, and `img` (already handled by the registry). Body text is `--color-text`, `--text-lg`, `max-width: 68ch`; headings are `--color-text` in the sans; links are `--color-text` with a `--color-border-strong` underline that becomes `--color-accent` on hover and focus.

`AI-Pipeline-for-Real-Estate-Photos` contains a ```json fence, so `pre` and `code` need real styling: `--color-surface` background, `--font-mono` at `--text-sm`, `overflow-x: auto`, a `--color-border` rule. No syntax-highlighting library — `prismjs` is on the banned-dependency list and one JSON block does not justify a highlighter.

**Step 8: Verify a real write-up renders**

```bash
npm run dev
```
Open `http://localhost:3000/work/deterministic-ai-photo-pipeline` — this needs Task 10's route, so if Task 10 has not landed, render it from a temporary scratch page and delete that page before committing. Confirm: the prose renders, the JSON fence is styled, the slider drags with the mouse and moves with arrow keys, and body images have `width` and `height` in the DOM.

```bash
npx next build
grep -rc "use client" .next/server/app/work/*.html || true
```
Expected: build exits 0.

**Step 9: Commit**

```bash
git add src/components/mdx src/components/site/Prose.tsx src/lib/mdx velite.config.ts tests/unit/rehype-image-dimensions.test.ts package.json
git commit -m "feat: render MDX bodies on the server, with a client-boundary slider"
```

---

## Task 10: Write-up page route and 404

**Executor:** codex

**Review:** low

**Depends On:** Task 6 *(loader)*, Task 9 *(`MDXContent`, `Prose`)*

**Files:**
- Create: `src/app/work/[slug]/page.tsx`, `src/app/not-found.tsx`

**Step 1: Note what verifies this task, and what does not**

There is deliberately no unit test here. `generateStaticParams` is a one-line delegation to `getAllWorkSlugs()`, which Task 6 already tests against the real content tree — including the assertion that it never emits a draft. Importing this `page.tsx` into Vitest to re-test the delegation would pull in `next/navigation` and `next/image` and fail at import time rather than on behavior, which is a test that reports the wrong thing.

What verifies this task instead, explicitly:

- Step 4's build output — five statically generated `/work/<slug>` routes and no sixth.
- Task 22's Playwright route sweep — every write-up returns 200 and an unknown slug returns 404.

**Step 2: Implement the route**

```tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import { MDXContent } from "@/components/mdx/MDXContent";
import { Prose } from "@/components/site/Prose";
import { getAllWorkSlugs, getWorkItem } from "@/lib/content";

export async function generateStaticParams() {
  return (await getAllWorkSlugs()).map((slug) => ({ slug }));
}

export default async function WorkItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getWorkItem(slug);
  if (!item) notFound();
  // ...header (title, org · role, timeframe, outcomes), cover, then <Prose><MDXContent/></Prose>
}
```

`getWorkItem` already filters drafts, so a draft slug falls through to `notFound()` without the page knowing what a draft is. That is the point of the loader.

Render `item.outcomes` from frontmatter — the same metric/label treatment as the homepage strip (serif numeral, mono label at `--text-xs`) so an outcome looks like an outcome wherever it appears. Attribution here is `item.org · item.timeframe`, resolved by the loader.

Note that Next 16 `params` is a Promise. Await it.

**Step 3: Add the 404 page**

Task 2 deleted `src/app/[locale]/not-found.tsx` and nothing replaced it, so an unknown slug currently renders Next's unstyled default on a white background — jarring against a near-black site, and the manual checklist requires a styled 404 with a route back to `/work`.

Create `src/app/not-found.tsx`: a short line in `--color-text`, a `--color-text-muted` explanation, and a link back to `/work` styled as the outlined CTA.

It renders bare until Task 12 puts the shell into `layout.tsx`, at which point it picks up the rail and skip link with no further change. The status code is 404 either way, so Step 4's check is valid now.

**Step 4: Verify all five routes, and that the draft is not a sixth**

```bash
npx next build
```
Expected: exactly five `/work/<slug>` entries in the route output, all statically generated. `draft-fixture` must not be among them — that is the `generateStaticParams` leg of the draft acceptance criterion, and the permanent fixture from Task 7 is what makes it a real check rather than a vacuous one.

```bash
npx next start
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/work/does-not-exist
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/work/draft-fixture
```
Expected: `404` from both.

Then verify the widget chunk isolation Task 9 built, now that both write-up routes exist. In separate browser contexts, load `/work/deterministic-ai-photo-pipeline` and `/work/product-led-growth-strategy` and compare the JavaScript each requests: no chunk containing the slider's code may appear on the second. Separate contexts matter — reusing one lets the second page serve JS from cache and measure nothing. Task 22 automates this against the deployed build.

**Step 5: Prove the module-scope checks actually fail the build**

This is the first point in the plan where both preconditions hold: `velite build --strict` is green (Task 7) and a real page imports `src/lib/content.ts` (this task). Until now the loader's module-scope checks were never executed by a build, so this is the step that turns "fails the build" from a design claim into an observed fact. Task 6 Step 6 explains why it could not run earlier.

Three checks, each edited in, observed, then reverted:

```bash
# 1. A headline outcome pointing at a slug that does not exist.
#    Edit src/data/profile.ts, then:
npx velite build --clean --strict && npx next build; echo "exit=$?"
```
Expected: non-zero, naming `src/data/profile.ts`, `headlineOutcomes`, and the bogus slug.

```bash
# 2. An unresolvable roleId in a content file.
#    Edit content/work/product-led-growth-strategy.mdx, then rebuild.
```
Expected: non-zero, naming the file, `roleId`, and the unknown id.

```bash
# 3. A filename that does not match its slug.
git mv content/work/product-led-growth-strategy.mdx content/work/wrong-name.mdx
npx velite build --clean --strict && npx next build; echo "exit=$?"
```
Expected: non-zero, naming `wrong-name.mdx`. This is the leg the Task 5 fixture suite deliberately does not cover, because `velite build` never imports the loader.

Revert all three and confirm the build returns to green. Record the three error messages verbatim in the commit message — they are the evidence for four acceptance criteria, and a later reader should not have to re-derive them.

**Step 6: Commit**

```bash
git add src/app/work src/app/not-found.tsx
git commit -m "feat: add the write-up page route and a styled 404"
```

---

## Task 11: Work index and `CaseRow`

**Executor:** codex

**Review:** low

**Depends On:** Task 10 *(links to write-up routes)*

`CaseRow` is used by both this index and the homepage, so its semantics get decided once, here.

**Files:**
- Create: `src/components/site/CaseRow.tsx`, `src/components/site/SectionHeader.tsx`, `src/app/work/page.tsx`

**Step 1: Get the semantics right**

The list is a `<ul>` of `<li>`. The title is a real `<h3>`. **The anchor wraps the title only**, with the hit area stretched by an `::after` pseudo-element over the row. Wrapping the whole row makes the link's accessible name the concatenation of title, summary, tags, and year — which is what a screen reader would then read out for every row.

```tsx
<li className="relative grid grid-cols-[148px_1fr_auto] items-center gap-6 border-b border-border py-5">
  <div className="aspect-[16/10] overflow-hidden rounded-lg bg-surface">
    <Image src={item.cover.src} width={item.cover.width} height={item.cover.height}
           alt="" sizes="148px" className="h-full w-full object-cover opacity-[0.78]" />
  </div>
  <div className="min-w-0">
    <h3 className="text-xl font-semibold tracking-tight">
      <a href={`/work/${item.slug}`} className="after:absolute after:inset-0 after:content-['']">
        {item.title}
      </a>
    </h3>
    <p className="text-base text-text-muted [overflow-wrap:anywhere]">{item.summary}</p>
    {/* The leading outcome from frontmatter — an acceptance criterion, not decoration. */}
    <p data-testid="case-outcome" className="mt-2 text-sm">
      <span className="font-serif text-lg text-text">{item.outcomes[0].metric}</span>{" "}
      <span className="text-text-subtle">{item.outcomes[0].label}</span>
    </p>
    <ul>{item.tags.map(...)}</ul>
  </div>
  <span className="font-mono text-xs text-text-subtle">{item.publishedAt.slice(0, 4)}</span>
</li>
```

Four details that the acceptance criteria depend on:

- **The leading outcome renders from `item.outcomes[0]`.** The criterion reads "write-up cards render outcomes from frontmatter" — without this the card ships the title, summary, tags, and year only, and the requirement is quietly unmet. One outcome, not all of them: the schema's minimum is one and some write-ups have three, so a card rendering all of them would be a different height per row. Task 22 asserts the rendered metric matches the frontmatter.
- `alt=""` on the cover. The thumbnail is decorative — the adjacent title says everything it does, and a duplicate accessible name is noise.
- `min-w-0` on the text column and `[overflow-wrap:anywhere]` on the text. Without both, a long unbroken title forces horizontal overflow at 320px.
- The `::after` hit area needs `position: relative` on the `<li>`, which is why it is there.

**Below 600px** the outcome line stays — it is the evidence the row exists to carry — and the tag list is what drops if vertical space gets tight. Task 19 owns that call.

Hover and focus, mirrored: the row slides right (`padding-left: 16px`), the bottom rule lights `--color-accent`, the title goes `--color-accent`, and the thumbnail reaches full opacity with a `scale(1.06)`. Both the `:hover` and `:focus-visible` states, never a bare browser default. The slide and the zoom are gated by the `prefers-reduced-motion` block from Task 3.

**Step 2: `SectionHeader`**

Props: `title`, a `count` (rendered as a zero-padded string, `04`), and an optional `id` that lands on the rendered element so the rail's `#work` and `#track` links have targets. A mono `--text-xs` uppercase title with `letter-spacing: 0.2em` on a `--color-text` bottom rule. Used three times — the metric strip, the work list, and the track record.

**Step 3: `src/app/work/page.tsx`**

```tsx
export default async function WorkIndex() {
  const items = await getWorkItems();
  // SectionHeader + <ul> of CaseRow
}
```

**Step 4: Verify**

```bash
npm run dev
```
Open `/work`. Confirm five rows, each linking to a live page; tab through and confirm every row shows the focus treatment; check the tab order reaches the title anchor and not a whole-row link.

**Step 5: Commit**

```bash
git add src/components/site src/app/work/page.tsx
git commit -m "feat: add the work index and the case row"
```

---

## Task 12: `Rail` and the skip link

**Executor:** codex

**Review:** low

**Depends On:** Task 4 *(`profile.ts`)*, Task 3 *(tokens)*

**Files:**
- Create: `src/components/site/Rail.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Implement the rail**

A sticky left identity rail, 330px, `height: 100vh`, `overflow-y: auto`, `border-right: 1px solid var(--color-border)`, `display: flex; flex-direction: column; justify-content: space-between`. All content from `profile.ts` — name, role, disciplines, navigation, and contact links. No hardcoded strings.

```tsx
export function Rail() {
  return (
    <aside className="sticky top-0 flex h-screen flex-col justify-between overflow-y-auto border-r border-border p-11 px-9">
      <div>
        <p className="text-lg font-bold leading-tight tracking-tight">
          {first}<span className="block text-text-muted">{rest}</span>
        </p>
        <p className="mt-3.5 font-mono text-xs uppercase leading-relaxed tracking-[0.12em] text-text-subtle">
          {profile.role}<br />{profile.disciplines}
        </p>
      </div>
      <nav aria-label="Sections">{/* Selected work, Track record, About */}</nav>
      <div className="font-mono text-xs text-text-subtle">{/* LinkedIn, GitHub, email */}</div>
    </aside>
  );
}
```

Derive `first` and `rest` from `profile.name` — `const [first, ...tail] = profile.name.split(" "); const rest = tail.join(" ")` — rather than hardcoding `Josh` / `Van Lente`. One source of truth, and it is the same field the OG route and the metadata title read.

`overflow-y: auto` is load-bearing: the rail is `100vh` with `space-between`, and below roughly 420px of viewport height the contact links clipped unreachably in the prototype.

Navigation links point at real targets — `#work`, `#track`, `/about`. The prototype had three dead `#`s, and an anchor to an ID nobody assigns is the same dead link with extra steps: **Task 14 must put `id="work"` on the selected-work `SectionHeader` and `id="track"` on the track-record one.** Task 22 asserts both resolve.

The rail renders on `/work`, `/about`, and write-up pages too, where `#work` and `#track` do not exist. Point those two at `/#work` and `/#track` rather than bare fragments, so they navigate home and scroll rather than doing nothing.

Nav hover and focus: a 20px `--color-accent` rule grows from `width: 0` via `::before`, and the label goes `--color-text`. Both states, same treatment.

**Step 2: Skip link**

The rail puts six links ahead of the content on every load, so a skip link is the **first focusable element in the document**. Put it in `layout.tsx` above the rail, not inside it.

```tsx
<a href="#main" className="absolute left-[-9999px] focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-accent focus:px-[18px] focus:py-2.5 focus:text-base focus:font-semibold focus:text-bg">
  Skip to content
</a>
```

Target `#main`, which the shell's `<main id="main">` supplies — not `#work`, so the skip link works on `/about` and a write-up page too.

**Step 3: Build the shell into the layout**

`layout.tsx` renders: skip link, then a `grid-cols-[330px_1fr]` shell with `max-width: 1440px; margin: 0 auto`, the rail, and:

```tsx
<main id="main" tabIndex={-1} className="min-w-0 focus:outline-none">{children}</main>
```

Two attributes, both load-bearing:

- **`tabIndex={-1}`** makes `<main>` a valid focus target. Without it most browsers scroll to the anchor but leave focus on the skip link, so the next Tab returns to the rail's first nav link — the six links the skip link exists to skip. The link would look like it works and do nothing.
- **`min-w-0`**, or a wide code fence in a write-up pushes the grid past the viewport.

**Step 4: Verify**

`npm run dev`, then: Tab once from a fresh page load and confirm the skip link appears; Tab again and confirm the rail's first nav link shows its focus treatment; press Enter on the skip link and confirm focus actually moved, not just the scroll position:

```js
document.activeElement.id   // expect "main"
```

Then Tab once more and confirm the next focused element is inside the content, not back in the rail.

**Step 5: Commit**

```bash
git add src/components/site/Rail.tsx src/app/layout.tsx
git commit -m "feat: add the identity rail, shell, and skip link"
```

---

## Task 13: `MetricStrip` and `TrackRecord`

**Executor:** codex

**Review:** low

**Depends On:** Task 4 *(`profile.ts`, `formatRoleDates`)*, Task 6 *(`getHeadlineOutcomes`, `getRoles`)*

Both render from typed data. Neither is hardcoded JSX — that is an acceptance criterion, and it is the whole reason `profile.ts` exists.

**Files:**
- Create: `src/components/site/MetricStrip.tsx`, `src/components/site/TrackRecord.tsx`

**Step 1: `MetricStrip`**

Four columns, `border-bottom: 1px solid var(--color-border)`, each cell centered with a right rule except the last.

Add the test hooks now, not in Task 22: `data-testid="metric"` on each cell and `data-testid="metric-attribution"` on the `{org} · {period}` line. Task 22 runs against a deployed preview, so a hook added there would not exist in the build under test — and selecting on Tailwind classes instead produces a test that breaks on the next restyle and gets deleted.

Per cell:
- **Numeral** — `--font-serif` at weight 400, `clamp(32px, 3.7vw, 48px)`, `letter-spacing: -0.035em`, `--color-text`. Light Instrument Serif rather than bold sans: it reads closer to an annual report than a startup dashboard, and it carries the "experienced" half of the positioning.
- **Label** — `--font-mono`, `--text-xs`, uppercase, `letter-spacing: 0.11em`, `--color-text-muted`. Written for a non-technical recruiter with no translation step.
- **Attribution** — `--font-mono`, `--text-xs`, `--color-text-subtle`, rendered as `{org} · {period}`. Uniformly `Org · period`, never a project descriptor: one slot means one thing. An unattributed number reads as a claim; an attributed one reads as evidence.

Where `href` is non-null, the numeral and label become a link to the write-up. Two of the four have no write-up and render as plain text — do not fabricate a link, and do not hide the two that lack one.

The count is fixed at four by `profile.ts`'s schema, so this component never has to handle three or five. It should not defensively try.

**Step 2: `TrackRecord`**

`grid-cols-[140px_1fr_120px]`, one row per role, `border-bottom: 1px solid var(--color-border)`, baseline-aligned. Org at `--text-lg` semibold; title at `--text-base` in `--color-text-muted` with the achievement below it as a `<small>` block at `--text-sm` in `--color-text-subtle`; dates right-aligned in `--font-mono` at `--text-xs` via `formatRoleDates(role)`.

Seven rows. Azibo appears twice, with its two roles and dates separate — the prototype merged them under the later title, which contradicted the résumé.

Semantics: a `<ul>` of `<li>`, not a table. There is no column relationship a table would express; it is a list of roles.

**Step 3: Verify**

Render both from a scratch page and check: exactly four metric cells, each with a visible org and period; seven track-record rows with `2025—now`, `2025`, `2023—2025`, `2022—2023`, `2019—2021`, `2018—2019`, `2013—2018`.

**Step 4: Commit**

```bash
git add src/components/site/MetricStrip.tsx src/components/site/TrackRecord.tsx
git commit -m "feat: add the metric strip and track record, both data-driven"
```

---

## Task 14: Homepage

**Executor:** codex

**Review:** low

**Depends On:** Task 11 *(`CaseRow`, `SectionHeader`)*, Task 12 *(shell)*, Task 13 *(`MetricStrip`, `TrackRecord`)*

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Compose the page**

Order: hero (headline, lede, two CTAs) → `Selected outcomes` + `MetricStrip` → `Selected work` + case rows → `Track record`.

**Assign the two section IDs the rail links to.** `SectionHeader` takes an optional `id` prop; pass `id="work"` on the Selected work header and `id="track"` on the Track record header. Without them the rail's `#work` and `#track` links scroll nowhere — the prototype's three dead `#`s in a new costume. Task 22 asserts both elements exist.

The copy below is final, from the design doc's Voice section. Do not paraphrase it.

**Headline:** *I find the bet worth making, then earn the right to finish it.*

`finish it` is the serif italic in `--color-accent` — one of the accent's three sanctioned uses.

```tsx
<h1 className="max-w-[19ch] text-[clamp(38px,5.2vw,68px)] font-bold leading-none tracking-[-0.045em]">
  I find the bet worth making, then earn the right to{" "}
  <em className="font-serif font-normal italic tracking-[-0.015em] text-accent">finish it</em>.
</h1>
```

**Lede:** Ten years building 0→1 products and platforms in vertical SaaS and fintech. Mostly that means research, collaboration, and working out when a bet is actually worth making — then shipping proof along the way that earns the next step. Currently building **an AI agent platform** at Evernest.

`an AI agent platform` is `<strong>` in `--color-text`. Singular — one platform, not several.

**CTAs:** `Email me` (primary, `--color-accent` background, `--color-bg` text, `mailto:` from `profile.email`) and `LinkedIn ↗` (outlined, `--color-border-cta`). No résumé PDF — email is the intended path, by choice.

There is no availability indicator and no "open to work" chip. Both were cut: the chip reads as actively hunting, and the accent is spent in exactly three places — the headline italic, hover and focus states, and the primary CTA. An accent used everywhere stops being an accent.

**Step 2: Watch the fold**

At 1280×800 at least half the first case-study thumbnail must be visible without scrolling. Roughly 240px was already trimmed from the hero to buy that room.

Measure it: `npm run dev`, resize to exactly 1280×800, and evaluate

```js
const t = document.querySelector('li img').getBoundingClientRect();
(Math.min(t.bottom, innerHeight) - t.top) / t.height
```
Expected: ≥ 0.5.

If it does not clear, the design's recorded fallback applies: **the metric strip moves below the work list and becomes the closer.** Do not shrink type or tighten the 12px floor to buy pixels — those are hard constraints, and the strip's position is the declared variable.

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: build the homepage on variant E"
```

---

## Task 15: About page

**Executor:** codex

**Review:** low

**Depends On:** Task 12 *(shell)*, Task 4 *(`profile.ts`)*

**BLOCKING:** needs the About narrative copy from Josh. The design doc records the shape as settled and the copy as unwritten. Do not write it — the whole page is Josh's voice. Stop and ask.

The page cannot be deferred: the rail links to `/about` on every load, and a 404 behind a nav link is worse than a thin page.

**Files:**
- Create: `src/app/about/page.tsx`, `src/data/about.ts`

**Step 1: Structure**

Narrative first, then supporting credentials. Work history stays on the homepage — do not duplicate `TrackRecord` here.

`src/data/about.ts` holds the narrative as an array of paragraph strings plus education. Same pattern as `profile.ts`: a Zod parse at module scope, so an empty narrative fails the build rather than shipping a blank page.

**Step 2: Fix the résumé errors the old content carried**

Three, all recorded in the design doc's Known content gaps, and all in content that gets retyped here:

- "Product Manager" was misspelled "Prouct Manager" three times.
- Ampush was understated as Product Manager rather than Senior Product Manager (already correct in `profile.ts` from Task 4).
- ~~The education minor was listed as Environmental Economics; it is Sustainability.~~ **Void — do not apply.** Josh was asked directly on 2026-07-29 and chose to keep **Environmental Economics**. This "correction" was carried from the design doc and was itself the error.

**Step 3: Verify and commit**

`npm run dev`, open `/about`, confirm the rail link resolves and the narrative renders at `--color-text` with a `68ch` measure.

```bash
git add src/app/about src/data/about.ts
git commit -m "feat: add the about page"
```

---

## Task 16: Metadata

**Executor:** codex

**Review:** low

**Depends On:** Task 10 *(the write-up route `generateMetadata` attaches to)*, Task 6 *(loader)*

**Files:**
- Modify: `src/app/layout.tsx`, `src/app/work/[slug]/page.tsx`
- Create: `src/lib/site.ts`

**Step 1: Site constants**

`src/lib/site.ts` — `baseURL: "https://www.joshvanlente.com"` and the default OpenGraph image path. The old `config.js` stored it as a bare `'www.joshvanlente.com'` and string-concatenated `'https://' + baseURL` at each use site; store the full origin once.

**Step 2: Root metadata**

In `layout.tsx`:
```ts
export const metadata: Metadata = {
  metadataBase: new URL(site.baseURL),
  title: { default: "Josh Van Lente — Staff Product Manager", template: "%s — Josh Van Lente" },
  description: "…",
  openGraph: { type: "website", siteName: "Josh Van Lente", images: [site.defaultOgImage] },
  twitter: { card: "summary_large_image" },
};
```

`metadataBase` is what makes the relative canonical URLs below resolve.

**Step 3: Per-write-up metadata**

```ts
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getWorkItem(slug);
  if (!item) return {};
  return {
    title: item.title,
    description: item.summary,
    alternates: { canonical: `/work/${item.slug}` },
    openGraph: {
      type: "article",
      title: item.title,
      description: item.summary,
      url: `/work/${item.slug}`,
      images: [{ url: item.cover.src, width: item.cover.width, height: item.cover.height }],
      publishedTime: item.publishedAt,
      modifiedTime: item.updatedAt ?? item.publishedAt,
    },
  };
}
```

`getWorkItem` filters drafts, so a draft returns `{}` and inherits the root metadata rather than leaking a title. It 404s anyway.

**Step 4: Favicon**

`src/app/favicon.ico` was preserved in Task 2. Confirm it is served at `/favicon.ico`.

**Step 5: Verify**

```bash
npx next build && npx next start
curl -s localhost:3000/work/cutting-six-of-seven-steps | grep -o '<meta property="og:[^>]*>'
curl -s localhost:3000/work/cutting-six-of-seven-steps | grep -o '<link rel="canonical"[^>]*>'
```
Expected: `og:title`, `og:description`, `og:image` with width and height, `article:published_time`, and a canonical of `https://www.joshvanlente.com/work/cutting-six-of-seven-steps`.

**Step 6: Commit**

```bash
git add src/lib/site.ts src/app/layout.tsx "src/app/work/[slug]/page.tsx"
git commit -m "feat: wire root and per-write-up metadata"
```

---

## Task 17: `sitemap.ts`, `robots.ts`, and the OG route

**Executor:** codex

**Review:** high *(dynamic boundary — these are the three public surfaces a draft could leak into, and the leak would be silent)*

**Depends On:** Task 16 *(site constants)*, Task 6 *(loader)*

Solo checkpoint. This is the draft-containment invariant, and a leak here publishes an unfinished write-up to Google.

**Files:**
- Create: `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/og/route.tsx`
- Test: `tests/unit/sitemap.test.ts`

**Step 1: Write the failing test**

```ts
// tests/unit/sitemap.test.ts
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { getWorkItems } from "@/lib/content";
import { work } from "#content";

describe("sitemap", () => {
  it("lists every published write-up", async () => {
    const urls = (await sitemap()).map((e) => e.url);
    for (const i of await getWorkItems()) {
      expect(urls).toContain(`https://www.joshvanlente.com/work/${i.slug}`);
    }
  });

  it("lists no draft, even one Velite generated", async () => {
    const drafts = work.filter((i) => i.draft);
    // Guard against a vacuous pass: with no drafts in the tree this loop would
    // assert nothing while reporting green. The permanent fixture from Task 7
    // is what gives this test something to catch.
    expect(drafts.length, "the draft fixture is missing from content/work/").toBeGreaterThan(0);

    const urls = (await sitemap()).map((e) => e.url);
    for (const d of drafts) {
      expect(urls.some((u) => u.includes(d.slug)), `draft ${d.slug} leaked`).toBe(false);
    }
  });

  it("lists the static routes", async () => {
    const urls = (await sitemap()).map((e) => e.url);
    for (const p of ["", "/work", "/about"]) {
      expect(urls).toContain(`https://www.joshvanlente.com${p}`);
    }
  });
});
```

The draft test reads Velite's raw output, not the loader — so it fails if the sitemap ever bypasses the loader, which is exactly the mistake worth catching. Task 7's permanent `draft-fixture` is what gives it a draft to catch; the guard assertion above fails loudly if that fixture is ever removed, rather than letting the test go quiet.

**Step 2: Run to verify it fails**

Run: `npx vitest run tests/unit/sitemap.test.ts`
Expected: FAIL — module not found.

**Step 3: Implement all three**

`sitemap.ts` and `robots.ts` consume the same loader as the pages, so drafts cannot leak.

```ts
// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { getWorkItems } from "@/lib/content";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const items = await getWorkItems();
  return [
    { url: site.baseURL, changeFrequency: "monthly", priority: 1 },
    { url: `${site.baseURL}/work`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${site.baseURL}/about`, changeFrequency: "yearly", priority: 0.5 },
    ...items.map((i) => ({
      url: `${site.baseURL}/work/${i.slug}`,
      lastModified: i.updatedAt ?? i.publishedAt,
      priority: 0.7,
    })),
  ];
}
```

`robots.ts`: allow all, `sitemap: ${site.baseURL}/sitemap.xml`.

`src/app/og/route.tsx`: rewrite from scratch. The old one imported `next-intl`'s `getTranslations` and Once UI's `renderContent`, both gone. Keep the shape — `ImageResponse`, 1920×1080, `runtime: "edge"`, the local `public/fonts/Inter.ttf` — and take the title from a query parameter with `profile.name` and `profile.role` below it. Match the new palette: `--color-bg` background, `--color-text` text.

> **This paragraph is superseded and is kept only as the record of what was specified.** As shipped, the route takes **no query parameter** and is **not** an edge function: it is prerendered static, and it prints `profile.name` with `profile.role` beneath it. The card's tree and options live in `src/lib/og-card.tsx` so the tests can assert on real values. **Do not restore `?title=`, the edge runtime, or a second copy of the dimensions.** See decision 23.

The design doc has each write-up's `cover` serve as its `og:image` with this route as the fallback, so the route only renders for pages with no cover — the homepage, the work index, and About.

**Step 4: Run to verify it passes**

Run: `npx vitest run tests/unit/sitemap.test.ts`
Expected: PASS, 3 tests.

> **As shipped, `sitemap.test.ts` holds 10 tests, not 3**, and the task also added `tests/unit/og-route.test.ts`, `tests/unit/robots.test.ts`, and `tests/unit/helpers/element-tree.ts`. The three the plan named are all present and unchanged, the draft-leak test and its `draft-fixture` guard among them.

**Step 5: Verify end to end**

```bash
npx next build && npx next start
curl -s localhost:3000/sitemap.xml
curl -s localhost:3000/robots.txt
curl -sI "localhost:3000/og?title=Test" | head -3
```
Expected: eight URLs in the sitemap (three static plus five published write-ups), no `draft-fixture`, a valid robots.txt with the sitemap line, and a `200` with `content-type: image/png` from `/og`.

**Step 6: Commit**

```bash
git add src/app/sitemap.ts src/app/robots.ts src/app/og tests/unit/sitemap.test.ts
git commit -m "feat: add sitemap, robots, and the OG route, all through the loader"
```

---

## Task 18: Mobile layout prototype

**Executor:** orchestrator *(main's clear advantage: this is iterative design work with Josh in the loop, and a one-shot delegate cannot have that conversation)*

**Review:** exempt *(throwaway; `prototypes/` is deleted at cutover)*

**Depends On:** Task 14 *(the desktop layout being adapted)*

The design doc is explicit that this is the one layout question the desktop prototype answers only approximately, and that the mobile layout gets its own prototype pass before implementation.

Use the `evernest-superpowers:prototype` skill. Produce `prototypes/mobile.html` with two or three variants of the collapsed layout at 390×844 and 320×568, and get Josh's pick.

**The question to answer:** the desktop layout puts positioning and evidence before chrome. The prototype's single 900px breakpoint inverted that on a phone — the full navigation and all three contact links sat ahead of the headline. What ordering keeps the priority intact when the rail cannot be a rail?

The design's starting answer, to be confirmed or replaced:

- **Below 900px** — single column. The rail becomes a static header carrying name and role; navigation moves to a horizontal row beneath it; contact links move to the footer rather than staying above the hero. The metric strip goes four columns to two. Case rows drop the year column and shrink the thumbnail to 90px.
- **Below 600px** — case rows stack the thumbnail above the text. At 320px the side-by-side layout leaves roughly 148px for title and summary, which is not a readable measure.

Record the verdict in `prototypes/NOTES.md` under a new heading, then commit.

---

## Task 19: Responsive implementation

**Executor:** codex

**Review:** low

**Depends On:** Task 18 *(the chosen layout)*, Tasks 12–14 *(the components being adapted)*

**Files:**
- Modify: `src/app/layout.tsx`, `src/components/site/{Rail,MetricStrip,CaseRow,TrackRecord}.tsx`

**Step 1: Implement two breakpoints, not one**

Per Task 18's verdict. The ordering rule at every width: **positioning and evidence come before chrome.** On a phone the headline must precede the contact links in DOM order — not just visually, since that is what a screen reader and a keyboard follow.

Reordering with `order:` alone is wrong here: it changes the visual order and leaves DOM order inverted, which is exactly the failure the UX critique flagged. Restructure the shell so the collapsed layout renders the header, then `<main>`, then the contact footer, in that source order.

**Step 2: Overflow guards**

Grid columns use `minmax(0, 1fr)` and text uses `overflow-wrap: anywhere`, so a long unbroken title cannot force horizontal overflow.

Test it with a real string, not by inspection: temporarily set one write-up's title to a 120-character unbroken run, load at 320px, and confirm `document.documentElement.scrollWidth <= window.innerWidth`. Revert the title.

**Step 3: Verify at both viewports**

At 390×844: the rail is collapsed, every navigation link is reachable, `document.documentElement.scrollWidth` does not exceed the viewport width, and the `<h1>` precedes the contact links in `document.body.textContent`.

At 320px: a 120-character title causes no horizontal overflow.

At 1280×800: the fold check from Task 14 still passes — the responsive pass must not have pushed the thumbnail down.

**Step 4: Commit**

```bash
git add src/app src/components
git commit -m "feat: collapse the layout at 900px and 600px, evidence before chrome"
```

---

## Task 20: Lighthouse CI

**Executor:** claude-subagent *(carve-out: acceptance is only verifiable with headless Chrome, which the Codex sandbox lacks)*

**Review:** low

**Depends On:** Task 19 *(measures the finished layout)*

**Files:**
- Create: `lighthouserc.json`
- Modify: `package.json` (a `lighthouse` script)

**Step 1: Configure**

Accessibility and performance are measured by Lighthouse CI rather than axe, so the number in the acceptance criteria and the number the tests produce are the same number.

```json
{
  "ci": {
    "collect": {
      "staticDistDir": null,
      "startServerCommand": "npm run start",
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/work",
        "http://localhost:3000/work/cutting-six-of-seven-steps"
      ],
      "numberOfRuns": 3,
      "settings": { "preset": "desktop" }
    },
    "assert": {
      "assertions": {
        "categories:accessibility": ["error", { "minScore": 0.95, "aggregationMethod": "median" }],
        "categories:performance":   ["error", { "minScore": 0.95, "aggregationMethod": "median" }],
        "color-contrast":           ["error", { "minScore": 1 }],
        "resource-summary:image:size": ["error", { "maxNumericValue": 500000 }]
      }
    }
  }
}
```

Two of these assertions do specific jobs beyond the category scores:

- **`resource-summary:image:size`** is the "total transferred image weight on the homepage is under 500KB" criterion, measured rather than eyeballed.
- **`color-contrast` at `minScore: 1`** is the rendered half of the WCAG AA criterion. A category score of 0.95 does not require the contrast audit to pass — accessibility is a weighted average, so a genuine contrast failure can hide inside a 95. Task 3's token test covers declared pairs; this covers what actually rendered, including arbitrary Tailwind colours and opacity the token file cannot see.

**Step 2: Run it**

```bash
npm run build
npx lhci autorun
```
Expected: median accessibility ≥ 95 and median performance ≥ 95 on all three URLs, and homepage image weight under 500KB.

**Step 3: Fix what fails, and report honestly**

Likely failures and their real fixes:

- **Image weight or LCP** — a source asset Task 8 missed, or a `sizes` attribute that does not match the real display width. Fix the `sizes`; do not add `priority` to everything.
- **Contrast** — should not happen; Task 3's unit test covers the token file. If Lighthouse disagrees with the unit test, one of them is wrong about the actual rendered background, and that is worth understanding rather than patching.
- **Font layout shift** — `display: "swap"` on all three fonts is set in Task 3; if CLS is still high, `adjustFontFallback` is the lever.

If a score cannot reach 95, **say so with the report output**. Do not lower the threshold in `lighthouserc.json` to make it pass — the threshold is an acceptance criterion, and moving it converts a failure into a silent scope reduction.

**Step 4: Commit**

```bash
git add lighthouserc.json package.json
git commit -m "test: gate accessibility and performance at 95 with Lighthouse CI"
```

---

## Task 21: Static verification sweep

**Executor:** codex

**Codex model:** terra *(verification sweep — mechanical pass/fail checks the sandbox can run)*

**Review:** low

**Depends On:** Task 20

Run every acceptance criterion that does not need a browser or a deploy, and report each as pass or fail with the command output. This is a QA pass, not an implementation task — fix only what is trivially mechanical, and report anything else rather than redesigning it.

**Step 1: Removal and hygiene**

```bash
grep -r once-ui src/ ; echo "exit=$?"     # expect exit 1, no output
ls -d src/once-ui 2>&1                    # expect: no such file
ls next.config.*                          # expect exactly one file
rm -rf node_modules && npm ci; echo "exit=$?"
```

Then the dependency audit against both manifests — the criterion covers `package-lock.json` too, because a transitive reintroduction still ships the bytes:

```bash
for p in next-intl yahoo-fantasy sass @types/cookie cookie react-masonry-css \
         next-themes prismjs @types/prismjs remixicon @floating-ui/react-dom classnames \
         @csstools/postcss-global-data postcss-custom-media postcss-flexbugs-fixes \
         postcss-preset-env autoprefixer; do
  grep -q "\"$p\"" package.json && echo "FAIL package.json (direct): $p"
  grep -q "\"node_modules/$p\"" package-lock.json && echo "FAIL package-lock.json: $p"
done
echo "audit done"
```

The lockfile grep is the half that matters and the one an `npm ls --depth=0` cannot do: the criterion bans these packages from `package.json` **or** `package-lock.json`, and a transitive reintroduction lives only in the lockfile. Depth-limited `npm ls` would report the criterion green while the bytes still ship.

When the lockfile grep hits, resolve which case it is before acting:

```bash
npm ls <package>   # no --depth, so the full path to the root is visible
```

A package pulled in by `next` or `tailwindcss` is a different fact from Josh's code depending on it. Report which one it is, and do not force-remove a framework's transitive dependency — the criterion is about the template's leftovers, not about npm's graph.

**One hit is already known and accepted:** `cookie@0.7.2`, via `@lhci/cli@0.15.1 → express@4.22.2`. Confirmed with `npm ls cookie` during Task 2's review. Report it as the recorded exception rather than as a failure, and do not try to remove it — dropping `@lhci/cli` would mean Task 20 fetches an unpinned Lighthouse CI at run time, which is the problem pinning it was meant to avoid. Every *other* lockfile hit is still a real failure.

**Step 2: Content pipeline**

```bash
npm run test                              # every Vitest suite
npx velite build --clean --strict; echo "exit=$?"
npm run typecheck
npm run lint
```

**Step 3: Assets**

```bash
grep -rl '\.gif' content/ src/ ; echo "exit=$?"   # expect exit 1
find public -name '*.gif'                          # expect no output
du -sh public/images content/work
```

**Step 4: Report**

Write the results as a checklist mapped one-to-one onto this plan's Acceptance Criteria section, with the command output for each. Mark anything not covered here as "browser-verified in Task 22" or "Lighthouse-verified in Task 20" — do not mark it passed. A silent gap reads as coverage.

**Step 5: Commit any mechanical fixes**

```bash
git commit -am "chore: static verification sweep fixes"
```

---

## Manual Test Checklist

> **For Claude:** Run this checklist via agent-browser on the Vercel preview URL after Task 23's preview deploy succeeds. Report pass/fail for each item. Do not merge until every item passes.

### Happy path

- [ ] Navigate to `/` at 1280×800 → the headline, lede, two CTAs, four metric cells, and at least one case-study thumbnail are visible without scrolling
- [ ] Measure the first thumbnail: `const t=document.querySelector('li img').getBoundingClientRect(); (Math.min(t.bottom,innerHeight)-t.top)/t.height` → ≥ 0.5
- [ ] Count metric cells → exactly 4, each showing an org and a period
- [ ] Click the `1→7 / Products in the suite` metric → lands on `/work/all-in-one-rental-platform`
- [ ] Click the `9% / Faster time to lease` metric → lands on `/work/cutting-six-of-seven-steps`
- [ ] Count case rows on `/` → 5, each with a thumbnail, title, summary, and tags
- [ ] Click each case row title → the write-up page loads with prose and outcomes
- [ ] Navigate to `/work` → 5 rows, all linking to live pages
- [ ] Navigate to `/work/deterministic-ai-photo-pipeline` → the `BeforeAfterSlider` renders; drag it → the reveal moves; the JSON code fence is styled, not raw
- [ ] Navigate to `/work/cutting-six-of-seven-steps` → four body images render, each with `width` and `height` in the DOM
- [ ] Click the `case study` link in that write-up's first paragraph → lands on `/work/deterministic-ai-photo-pipeline`, not a 404
- [ ] Navigate to `/about` → the narrative renders; count track-record rows → 0 (work history stays on the homepage)
- [ ] Count track-record rows on `/` → 7; Azibo appears twice with different titles and dates
- [ ] Click `Email me` → opens a `mailto:` to `Josh@vanlente.net`

### Keyboard and screen reader

- [ ] Load `/`, press Tab once → the skip link is visible and is the first focusable element
- [ ] Press Enter on the skip link → focus moves into `<main>`, past the rail
- [ ] Tab through the rail → every nav link shows the green rule and the label brightens; no bare browser ring anywhere
- [ ] Tab to a case row → the row slides right, the bottom rule and title go green — the same treatment as hover
- [ ] Tab to the `BeforeAfterSlider` handle → it has a visible focus ring; press ArrowRight → the reveal moves; press End → it goes to 100%
- [ ] Inspect a case row's link → its accessible name is the title alone, not title + summary + tags + year
- [ ] Inspect a case row thumbnail → `alt=""` (decorative)

### Responsive

- [ ] At 390×844 → the rail is collapsed to a header; `document.documentElement.scrollWidth <= window.innerWidth`
- [ ] At 390×844 → every nav link is reachable
- [ ] At 390×844 → the `<h1>` appears before the contact links in `document.body.textContent`
- [ ] At 390×844 → the metric strip is two columns; case rows show a 90px thumbnail and no year
- [ ] At 320×568 → case rows stack the thumbnail above the text; `document.documentElement.scrollWidth <= window.innerWidth`
- [ ] At any viewport → no rendered text computes below 12px

*(The 120-character-title overflow check is not here: content is baked into the deploy, so a title cannot be "temporarily set" against a preview. Task 19 checks it in dev, and Task 22 makes it repeatable by injecting the string with `page.evaluate`.)*

### Error states and removed routes

- [ ] `/work/does-not-exist` → 404, styled, with a route back to `/work`
- [ ] `/en/` → 404
- [ ] `/en/work/AI-Pipeline-for-Real-Estate-Photos` → 404 (the deliberate no-redirect decision)
- [ ] `/blog` → 404
- [ ] `/gallery` → 404
- [ ] `/sitemap.xml` → 8 URLs, no draft slugs
- [ ] `/robots.txt` → allows all, names the sitemap
- [ ] `/og?title=Test` → a 1920×1080 PNG on the near-black background

### Motion

- [ ] With `prefers-reduced-motion: reduce` → the case-row slide and thumbnail zoom do not animate
- [ ] Nothing on any page auto-plays or animates without user input

---

## Task 22: Playwright e2e (post-deploy)

> **Sequencing:** Execute this task after **Task 23 Step 3** (the preview deploy) and after the Manual Test Checklist passes, then hand back to Task 23 Step 4. Playwright tests encode user flows; writing them before manual verification risks encoding a pre-fix state, and `PREVIEW_URL` needs a deployment that exists.

**Executor:** claude-subagent *(carve-out: acceptance needs a browser and a deployed URL, neither available in the Codex sandbox)*

**Review:** low

**Depends On:** Task 23 *(step 3 — the preview deploy; the manual checklist runs against it first)*

**Files:**
- Create: `tests/e2e/site.spec.ts`, `playwright.config.ts`

**Step 1: Point Playwright at the preview, and recon it**

The suite runs against a deployed URL, so the base URL is an input rather than a constant:

```ts
// playwright.config.ts
export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: process.env.PREVIEW_URL ?? "http://localhost:3000" },
});
```

Every test below uses a relative path, so the same suite runs against a local `npm run start` and against the preview. Export `PREVIEW_URL` before running.

Install the browser binaries once — `@playwright/test` is already a devDependency from Task 2, but the browsers are a separate download:

```bash
npx playwright install --with-deps chromium
```

Then recon the deployed preview with the `evernest-superpowers:agent-browser-delegation` skill.

**The test hooks must already be in the deployed build.** `data-testid="metric"` and `data-testid="metric-attribution"` ship in Task 13; `data-testid="case-outcome"` ships in Task 11. If recon shows they are missing from the preview, the preview predates them — push and redeploy before writing assertions against them, rather than adding hooks here where the deployed build cannot pick them up.

**Step 2: Convert the checklist into tests**

The Manual Test Checklist above is the single source of truth for coverage. The five the design doc calls out by name, because they only hold in a real build:

```ts
const PUBLISHED = [
  "deterministic-ai-photo-pipeline",
  "cutting-six-of-seven-steps",
  "all-in-one-rental-platform",
  "smarter-payouts-predictive-model",
  "product-led-growth-strategy",
];

test("every published route returns 200", async ({ request }) => {
  for (const p of ["/", "/work", "/about", ...PUBLISHED.map((s) => `/work/${s}`)]) {
    expect((await request.get(p)).status(), p).toBe(200);
  }
});

test("the draft fixture 404s and appears on no published surface", async ({ page, request }) => {
  expect((await request.get("/work/draft-fixture")).status()).toBe(404);

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("draft-fixture");

  for (const p of ["/", "/work"]) {
    await page.goto(p);
    expect(await page.content(), p).not.toContain("draft-fixture");
  }
});

test("removed routes 404 — the deliberate no-redirect decision", async ({ request }) => {
  for (const p of ["/en/", "/en/work/AI-Pipeline-for-Real-Estate-Photos", "/blog", "/gallery"]) {
    expect((await request.get(p)).status(), p).toBe(404);
  }
});

test("the metric strip renders exactly four attributed items", async ({ page }) => {
  await page.goto("/");
  const cells = page.locator("[data-testid=metric]");
  await expect(cells).toHaveCount(4);
  for (let i = 0; i < 4; i++) {
    await expect(cells.nth(i).locator("[data-testid=metric-attribution]")).toContainText("·");
  }
});

test("every case row shows an outcome from frontmatter", async ({ page }) => {
  await page.goto("/work");
  const outcomes = page.locator("[data-testid=case-outcome]");
  await expect(outcomes).toHaveCount(5);
  for (let i = 0; i < 5; i++) await expect(outcomes.nth(i)).not.toBeEmpty();
});

test("the rail's section anchors resolve to real targets", async ({ page }) => {
  await page.goto("/");
  for (const id of ["work", "track"]) {
    await expect(page.locator(`#${id}`), `#${id} has no target`).toHaveCount(1);
  }
});

test("the skip link moves focus, not just scroll position", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  expect(await page.evaluate(() => document.activeElement?.id)).toBe("main");
});

test("a 120-character unbroken title causes no overflow at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/work");
  // Inject rather than editing content: the deployed build is immutable, and
  // this makes the check repeatable instead of a once-and-reverted manual edit.
  await page.evaluate(() => {
    const h = document.querySelector("li h3 a")!;
    h.textContent = "A".repeat(120);
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("a widget-free write-up never requests the BeforeAfterSlider chunk", async ({ browser, request }) => {
  // Each route gets a FRESH context. Reusing one page lets the second
  // navigation serve JS from cache, emitting no request events — which would
  // make the widget-free page look clean because nothing was measured.
  const jsOn = async (path: string) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const urls: string[] = [];
    page.on("request", (r) => { if (r.url().endsWith(".js")) urls.push(r.url()); });
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await ctx.close();
    return urls;
  };

  const withWidget = await jsOn("/work/deterministic-ai-photo-pipeline");
  const withoutWidget = await jsOn("/work/product-led-growth-strategy");

  // Identify slider chunks by CONTENT across ALL of the widget page's JS —
  // not across the set already filtered to "only on the widget page", which
  // would make the final assertion true by construction.
  const bodies = await Promise.all(withWidget.map((u) => request.get(u).then((r) => r.text())));
  const sliderChunks = withWidget.filter((_, i) => /aria-valuenow|Reveal comparison/.test(bodies[i]));

  // If no chunk anywhere on the widget page contains the slider, the test has
  // measured nothing and must fail rather than report green.
  expect(sliderChunks.length, "no chunk on the widget page contained the slider — test is not measuring anything")
    .toBeGreaterThan(0);

  const leaked = sliderChunks.filter((u) => withoutWidget.includes(u));
  expect(leaked, `slider chunk(s) shipped to a widget-free page: ${leaked.join(", ")}`).toEqual([]);
});
```

Two things make this test real rather than merely green. **Fresh contexts** stop the browser cache from silently emptying the second measurement. And **`sliderChunks` is computed from the widget page's full JS set**, then intersected with the widget-free set — if the slider lives in a shared chunk both pages load, that chunk appears in both lists and `leaked` is non-empty. Deriving the candidate set from "chunks only the widget page loaded" would have excluded the shared-chunk case by construction, which is precisely the failure the criterion exists to catch.

```ts
test("a case row link's accessible name is the title alone", async ({ page }) => {
  await page.goto("/work");
  // The anchor wraps the title only, with the hit area stretched by ::after.
  // Wrapping the whole row would make the name title + summary + tags + year.
  const first = page.locator("li h3 a").first();
  const name = await first.evaluate((el) => el.textContent?.trim() ?? "");
  const summary = await page.locator("li p").first().textContent();
  expect(name).not.toContain(summary!.slice(0, 20));
  expect(name.length).toBeLessThan(160);
});

test("at 390x844 nothing overflows and every nav link is reachable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  for (const name of ["Selected work", "Track record", "About"]) {
    await expect(page.getByRole("link", { name })).toBeVisible();
  }
});

test("at 1280x800 half the first thumbnail is above the fold", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const visible = await page.evaluate(() => {
    const t = document.querySelector("li img")!.getBoundingClientRect();
    return (Math.min(t.bottom, window.innerHeight) - t.top) / t.height;
  });
  expect(visible).toBeGreaterThanOrEqual(0.5);
});

test("no rendered text is smaller than 12px", async ({ page }) => {
  for (const p of ["/", "/work", "/work/cutting-six-of-seven-steps", "/about"]) {
    await page.goto(p);
    const tooSmall = await page.evaluate(() =>
      [...document.querySelectorAll("*")]
        .filter((el) => el.textContent?.trim() && !el.children.length)
        .map((el) => ({ tag: el.tagName, px: parseFloat(getComputedStyle(el).fontSize) }))
        .filter((x) => x.px < 12));
    expect(tooSmall, `on ${p}`).toEqual([]);
  }
});
```

All selectors use `data-testid`, never class names — Tailwind classes change when the design does, and a test that breaks on a restyle is a test people delete. Those hooks ship in Tasks 11 and 13, not here; this task only consumes them.

**Step 3: Run against the preview**

```bash
PREVIEW_URL=https://<the-preview>.vercel.app npx playwright test
```
Expected: all PASS.

**Step 4: Commit**

```bash
git add tests/e2e playwright.config.ts
git commit -m "test: add the e2e suite from the manual checklist"
```

Then hand back to Task 23 Step 4, which pushes this suite and lets the preview redeploy, so the deployment that gets merged is one the suite has actually run against.

---

## Task 23: Cutover

**Executor:** orchestrator *(main's clear advantage: user-visible coordination, an outward-facing deploy, and a decision point that needs Josh)*

**Review:** exempt *(no product diff)*

**Depends On:** Task 21

**Step 1: Record the rollback target**

Note the current production deployment's Vercel ID and commit SHA, in writing, before anything ships. A rollback plan discovered during an outage is not a rollback plan.

**Step 2: Delete the prototypes**

Before the PR, not after. `prototypes/` is deleted as part of the branch so the deletion is in the merge — a commit made after the merge would need its own second PR and deploy, which is how "cleanup" quietly never happens.

```bash
git rm -r prototypes
git commit -m "chore: remove the throwaway prototypes"
```

The prototype code was written under prototype constraints — no tests, no error handling, no accessibility pass. It was rewritten properly rather than promoted, and the design decisions it settled now live in the design doc and this plan.

**Step 3: Deploy a preview and verify a URL matrix**

Push `feat/portfolio-rebuild-impl`. Against the preview URL, check: every retained route, every removed route, `/sitemap.xml`, `/robots.txt`, canonical tags, and social previews (paste a write-up URL into LinkedIn's post composer and confirm the card).

Then run the Manual Test Checklist in full, and hand off to Task 22.

**Step 4: Land Task 22's suite, then re-verify**

Task 22 commits `tests/e2e/` and `playwright.config.ts`. Push those too and let the preview redeploy, so the deployment that gets merged is the one the e2e suite actually ran against. Re-run `PREVIEW_URL=… npx playwright test` against that final preview.

**Step 5: Merge**

```bash
git checkout feat/portfolio-rebuild
git merge --no-ff feat/portfolio-rebuild-impl
```

Then open one PR from `feat/portfolio-rebuild` to `main`. Use the `evernest-superpowers:finishing-a-development-branch` skill.

**Step 6: Verify production**

After the merge deploys, re-run the URL matrix against `joshvanlente.com`. **Confirm that `/en/*` 404s in production** — that is the deliberate decision, and this is the last moment to change Josh's mind about it before every indexed link breaks for real. The mitigation, if he wants it, is about six lines in `next.config.ts`.

**Step 7: Clean up the worktree**

Remove the `feat/portfolio-rebuild-impl` worktree and delete the branch, local and remote.

---

## Execution Order

1. Task 0: Create worktree and feature branch *(orchestrator; blocking on Josh's uncommitted edits)*
2. Task 1: Velite spike *(depends on Task 0 — **gates every task below**)*
3. Task 2: Scaffold Next 16 and delete the old tree *(depends on Task 1 — the stack is not committed to until the spike passes)*
4. Task 3: Design tokens and fonts *(depends on Task 2 — needs globals.css and the layout)*
5. Task 4: `src/data/profile.ts` *(depends on Task 2)*
6. Task 5: `velite.config.ts` and schema fixtures *(depends on Task 2)*
7. Task 6: `src/lib/content.ts` and `content-rules.ts` *(depends on Tasks 4 and 5 — resolves roleId against profile.ts, imports Velite output)*
8. Task 7: Author frontmatter for the five write-ups *(depends on Tasks 5 and 6; blocking on Josh's metrics)*
9. Task 8: Image asset pass *(depends on Task 7; blocking on Josh's Smarter Payouts cover)*
10. Task 9: MDX rendering *(depends on Tasks 3, 5, 7, 8 — Step 8 renders real content, and the slider props point at Task 8's renamed images)*
11. Task 10: Write-up page route and 404 *(depends on Tasks 6 and 9)*
12. Task 11: Work index and `CaseRow` *(depends on Task 10)*
13. Task 12: `Rail` and the skip link *(depends on Tasks 3 and 4)*
14. Task 13: `MetricStrip` and `TrackRecord` *(depends on Tasks 4 and 6)*
15. Task 14: Homepage *(depends on Tasks 11, 12, 13)*
16. Task 15: About page *(depends on Tasks 4 and 12; blocking on Josh's narrative)*
17. Task 16: Metadata *(depends on Tasks 6 and 10)*
18. Task 17: `sitemap.ts`, `robots.ts`, OG route *(depends on Tasks 6 and 16)*
19. Task 18: Mobile layout prototype *(orchestrator; depends on Task 14)*
20. Task 19: Responsive implementation *(depends on Tasks 18, 12, 13, 14)*
21. Task 20: Lighthouse CI *(depends on Task 19)*
22. Task 21: Static verification sweep *(depends on Task 20)*
23. Task 23: Cutover *(orchestrator; depends on Task 21)*
24. Task 22: Playwright e2e *(depends on Task 23 Step 3 — the preview deploy; runs after the manual checklist, then hands back to Task 23 Step 4)*

Tasks 22 and 23 are numbered in dependency order rather than execution order: Task 22 runs against the preview Task 23 deploys, so **Task 23 Steps 1–3 come first, then Task 22, then Task 23 Steps 4–7.**

### Review checkpoints

1. **Task 2 — scaffold and deletion (solo).** Build configuration and a full-tree deletion; it gets its own round. Seam: Task 3 styles what this created. QA surface: `npx next build` exits 0 and `npx next dev` serves the placeholder — `npm run dev` runs `velite --watch`, which has no config until Task 5.
2. **Tasks 3–4 — design tokens and career data.** Both define contracts; disjoint files. Seam: Task 5's fixture harness and Task 6's loader consume `profile.ts`. QA surface: `npx vitest run tests/unit/{tokens,profile,dates}.test.ts` and a dev-server render showing the three fonts loading.
3. **Task 5 — content schema (solo).** Serialization boundary and the contract Goal 3 rides on. Seam: Task 6 imports the generated output. QA surface: the seven fixture cases, plus a real `velite build --strict` whose failure output is Task 7's worklist.
4. **Task 6 — content loader (solo).** The seam every page, the sitemap, and the OG route consume, and the owner of draft filtering. Seam: Task 7 authors the content it validates. QA surface: `npx vitest run tests/unit/content-rules.test.ts`. The module-scope *wiring* cannot be proved here — nothing imports the loader until Task 10 — so that proof is Task 10 Step 5, and Task 6 Step 6 says so explicitly rather than attempting a check that would fail for the wrong reason.
5. **Tasks 7–8 — content authoring and assets.** All low; overlappable, findings-only. Seam: Tasks 10–11 render this content. QA surface: `velite build --strict` exits 0 on the real tree, `npx vitest run tests/unit/` fully green for the first time, and `du -sh public/images content/work` shows the budget met.
6. **Task 9 — MDX rendering (solo).** Dynamic boundary: `new Function` against Velite's output contract, plus the client-boundary decision an acceptance criterion depends on. QA surface: a write-up body rendering in dev, with the slider dragging, body images carrying dimensions, and the widget-free page loading no slider chunk.
7. **Tasks 10–11 — write-up page, 404, and work index.** All low; overlappable. Seam: Task 14 reuses `CaseRow`. QA surface: `/work`, all five `/work/<slug>`, `/work/draft-fixture` (404), and `/work/does-not-exist` in agent-browser, including a keyboard pass.
8. **Tasks 12–14 — homepage.** All low; overlappable. Seam: Task 16 attaches metadata over these routes. QA surface: `/` at 1280×800 in agent-browser, including the fold measurement, the `#work`/`#track` anchors, and the skip link moving focus.
9. **Tasks 15–16 — About and metadata.** All low; overlappable. Seam: Task 17 consumes the site constants. QA surface: `/about` renders, and `curl` on a write-up shows canonical and OG tags.
10. **Task 17 — sitemap, robots, OG (solo).** Dynamic boundary: the three public surfaces a draft could leak into. QA surface: `/sitemap.xml`, `/robots.txt`, and `/og`, which as shipped takes no query parameter.
11. **Task 19 — responsive implementation.** Low. Task 18 is a prototype and sits outside groups. QA surface: 390×844 and 320×568 in agent-browser, plus a re-check of the 1280×800 fold.
12. **Tasks 20–21 — Lighthouse and the static sweep.** Low; overlappable. QA surface: the Lighthouse report and the sweep's criterion-by-criterion output.

Task 0, Task 1, Task 18, the Manual Test Checklist, Task 22, and Task 23 sit outside checkpoint groups.

**No lanes.** After Task 6 the graph does split into a content/write-up chain (7–11) and a homepage chain (12–15), each with enough tasks to clear the admission bar on count. But `CaseRow` lands in `src/components/site/` in Task 11 and Task 14 consumes it, so the two chains are not path-disjoint without moving `CaseRow` and splitting the ownership of one directory. The saving does not justify that restructuring on a single-author project, so this plan is single-lane, deliberately.

---

## Notes for whoever executes this

**The build is green at the end of every task from Task 2 onward, and no task ships a knowingly-red test.** The one accommodation is stated in the task itself: Tasks 2 through 6 verify with `npx next build`, `npx vitest run`, and `npx tsc --noEmit` rather than `npm run build`, `npm run test`, and `npm run typecheck`, because all three npm scripts invoke Velite against real content that is not valid until Task 7. That is a sequencing fact, not a license to leave failing tests behind. *(`typecheck` joined that list on 2026-07-27 — see the note under Task 2 Step 4.)*

**Three checks are deliberately placed later than the code they verify**, because earlier they would fail for the wrong reason and train an executor to weaken them: the module-scope build-failure proof (Task 10 Step 5, the first point where Velite output is valid *and* a page imports the loader), the widget chunk isolation on real pages (Task 9 Step 5), and the whole e2e suite (Task 22, post-deploy). Each says at its own site where its proof lives.

**Three things exist to prevent drift, not to be tidy.** `profile.ts` is the single source of role metadata because restating it in frontmatter is what let "Prouct Manager" sit misspelled for a year. The token file is read by its own contrast test rather than duplicated in TypeScript. Frontmatter references a `roleId` rather than an org string. If a task seems to be fighting one of these, the fight is the feature.

**Do not invent content.** Two write-ups need a metric Josh has not supplied, one needs a cover image, and the About page needs a narrative. Stop and ask. A plausible-looking number on a page whose entire job is credibility is the worst possible failure mode here.
