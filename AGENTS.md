# AGENTS.md

Instructions for coding agents working in this repository.

## What this project is

Josh Van Lente's personal portfolio site. It is being rebuilt from the Once UI
`magic-portfolio` template into a site he owns end to end: a typed content
pipeline that fails the build on bad frontmatter, a three-token colour scale, and
a homepage that gives a hiring manager the name, positioning, four attributed
metrics, and visible case-study evidence inside 20 seconds.

The rebuild is executed from `docs/plans/2026-07-24-portfolio-rebuild.md`, against
the design doc `docs/plans/2026-07-24-portfolio-rebuild-design.md`. If you are
implementing a task, the orchestrator has already pasted its full text into your
dispatch. Read those files only when your dispatch tells you to.

**The tree is mid-rebuild.** Until Task 2 of that plan lands, the repository still
holds the old template: `src/app/[locale]/`, `src/once-ui/`, SCSS modules, and
`next-intl`. Everything below describes the target state.

## Stack

| Piece | Version | Note |
|---|---|---|
| Node | 24 LTS | pinned in `.nvmrc` and `package.json` `engines` |
| Next.js | 16.2.11 | App Router, Turbopack, no `[locale]` segment |
| React | 19.2.8 | Server Components by default |
| Tailwind CSS | 4.3.3 | `@theme` tokens in `src/styles/globals.css`, no `tailwind.config.js` |
| Velite | 0.4.0 | pinned exactly, no caret — pre-1.0 with a parallel 1.0-alpha line |
| Zod | 4.4.3 (app) / **3 (Velite)** | two versions, deliberately — see below |
| Vitest | ^3 | unit tests |
| Playwright | ^1.56 | e2e, runs against a deployed preview |
| Lighthouse CI | ^0.15 | accessibility and performance gates |

## Architecture

Content lives in `content/work/*.mdx`, decoupled from routing.

- **`velite.config.ts`** — one schema that is both the TypeScript type and the
  build-time validator. It owns per-file shape rules: slug format and uniqueness,
  the `outcomes` minimum, exactly-one-of `roleId` / `org`+`role`.
- **`src/lib/content-rules.ts`** — pure predicates. Imports `profile.ts` and
  nothing else. Never imports `#content`.
- **`src/lib/content.ts`** — the only module that imports Velite's generated
  output (`#content`), and the only place drafts are filtered. Owns cross-source
  rules (`roleId` → `profile.ts`, `headlineOutcome.slug` → a published write-up)
  and throws at module scope, so `next build` fails with the file and field named.
- **`src/data/profile.ts`** — career data, Zod-parsed at module scope. Imports
  nothing but `zod`, so it stays importable from any build-time context.
- **MDX bodies** evaluate in a React Server Component via `new Function(code)`.
  Only `BeforeAfterSlider` carries a client boundary.

Path aliases: `@/*` → `./src/*`, `#content` → `./.velite`. Both are declared in
`tsconfig.json` **and** mirrored in `vitest.config.ts` — Vitest does not read
tsconfig paths on its own. If you add an alias, add it in both places.

**Unit tests run in two Vitest projects**, declared in `vitest.config.ts`. The
`node` project covers `tests/unit/**/*.test.ts` and anything under `src/`; those
suites spawn Velite and read the tree off disk, and a DOM would only slow them
down. The `dom` project covers `tests/component/**/*.test.tsx` on jsdom, with
`tests/component/setup.ts` supplying the two APIs jsdom omits that the widgets
read: the `PointerEvent` constructor and the pointer-capture methods on
`Element`. Put a test for a component in `tests/component`, and give it a `.tsx`
extension or the `dom` project will not collect it.

**There are two Zods in this repo and they are not interchangeable.**
`velite.config.ts` uses `s.*`, which is Velite's own bundled **zod 3** — Velite
declares no `zod` dependency and ships its own inside the bundle. Everything
under `src/` uses the repo's **zod 4**. Consequences:

- In `velite.config.ts`, zod 4 API does not exist. No `.check()`, no
  `z.looseObject`, no `z.strictObject`. Use `.strict()`, `.superRefine()`, and
  the other zod 3 idioms.
- In `src/`, use zod 4: top-level `z.email()` and `z.url()`, not the deprecated
  `z.string().email()` method forms.
- **Never hand a schema built with the repo's `zod` to Velite.** Velite calls
  zod 3 internals directly (`schema._parse({ data, path, meta, parent })`), which
  a zod 4 object does not implement. `src/lib/content-rules.ts` may import zod
  freely because it validates plain objects itself and never passes a schema to
  Velite.

## Commands

```bash
npm run dev         # velite build --strict, then a velite watcher alongside next dev
npm run build       # velite build --clean --strict && next build
npm run test        # velite build --strict && vitest run
npm run typecheck   # velite build --strict && tsc --noEmit
npm run lint        # eslint .   (NOT `next lint` — removed in Next 16)
npm run e2e         # playwright test, needs PREVIEW_URL
npm run lighthouse  # lhci autorun
```

`.velite/` is generated and gitignored, so `test`, `build`, and `typecheck` all
regenerate it first. On a clean checkout, `#content` resolves to nothing until
Velite has run, and a bare `tsc --noEmit` fails with `TS2307: Cannot find module
'#content'` rather than with anything pointing at the missing build step.

Until Task 5 writes `velite.config.ts`, all three of those scripts fail by
design. Verify with `npx next build`, `npx vitest run`, and `npx tsc --noEmit`
directly, and do not weaken the scripts to make them run early.

The `dev` script is `velite build --strict && (velite --watch --strict & next dev)`,
and every piece of that earns its place.

`--strict` is what makes the MDX guards bite in the dev loop. Without it Velite
reports a rejected body, exits 0, and writes a `work.json` with that entry
dropped, so the write-up disappears from the dev site and nothing fails. With it
the initial build exits 1 and prints the rejection, and a rebuild that fails
during watch leaves the last good `work.json` in place rather than overwriting
it — the watcher catches the error and logs it, so it survives the failed edit.

The separate `velite build --strict` in front is what lets the failure reach the
author. `&` yields the status of the command after it, so in `velite --watch
--strict & next dev` a Velite exit of 1 was discarded: the watcher was gone, the
script reported success, and `next dev` served the last good content forever
with nothing rebuilding. `sh -c 'false & sleep 0.2'` exits 0, which is the whole
of it. Running the build first costs about half a second on a dev start and
turns a rejected body into a non-zero `npm run dev` that never reaches
`next dev`. `tests/unit/dev-loop.test.ts` runs the script whole, with a stub in
place of `next dev`, and asserts both halves.

**`npm run dev` can orphan the Velite watcher.** Ctrl-C kills both, because Node
installs its own SIGINT handler. But when `next dev` exits on its own — port
already in use, a crash, a config error — nothing signals the watcher; it
reparents to init and keeps running. The subshell does not change this: it exits
with `next dev` and leaves its background job behind. Retry a failed start a few
times and several watchers end up rewriting `.velite/` and `public/static/` at
once, which races the schema fixture tests. If a dev start fails, check before
retrying:

```bash
pgrep -f 'velite --watch'    # kill any survivors first
```

This is a known, accepted trade. Fixing the process lifetime properly would mean
adding `concurrently` as a dependency for a hazard that only appears after a
failed start.

## Rules

**Never invent content.** Metrics, outcomes, dates, and narrative copy come from
Josh. If a write-up needs a number he has not supplied, stop and say so. A
plausible-looking number on a page whose entire job is credibility is the worst
failure this project has. Placeholders in the plan are written as `<JOSH>` and
must not be filled in by guessing.

**Never weaken a test to make it pass.** Several assertions in this repo look
strict on purpose:
- The token contrast test reads `globals.css` directly rather than a duplicated
  copy, so the assertion cannot drift from what ships.
- The schema fixture tests assert stderr is *not* an environment error, so a
  missing binary cannot masquerade as a caught schema failure.
- The Lighthouse thresholds are acceptance criteria. Lowering one converts a
  failure into a silent scope reduction.

If a test fails, fix the code or report the failure with its output.

**TDD.** Write the failing test first, run it, capture the RED output, then
implement. Report the RED output — it is how the orchestrator knows the test was
written before the code.

**The build is green at the end of every task.** The one exception is stated in
the plan: Tasks 2 through 6 verify with `npx next build` and `npx vitest run`
rather than `npm run build` and `npm run test`, because both npm scripts invoke
Velite against content that is not valid until Task 7.

**Three things exist to prevent drift, not to be tidy.** `profile.ts` is the
single source of role metadata. The token file is read by its own contrast test.
Frontmatter references a `roleId` rather than an org string. If you find yourself
fighting one of these, the fight is the feature — do not route around it.

**An unreferenced file is not automatically a dead file.** A hand-authored or
higher-resolution source stays in the tree even when nothing imports it, because
it is the only editable version of something the site ships. The two chart SVGs
under `public/images/blog/pipeline-drift/` are the example: their PNG exports are
embedded in a write-up, so deleting the SVGs as "unreferenced" threw away the
only way to edit a diagram that is on the site. Before deleting an unreferenced
asset, check whether it is the source of one that is referenced.

## Conventions

- **Colour and type come from tokens only.** Use `var(--color-text)`,
  `var(--text-sm)`, and the Tailwind utilities generated from the `@theme` block.
  Do not introduce a raw hex value or an arbitrary Tailwind colour — the contrast
  test cannot see them, and the palette is three neutral steps plus one accent by
  design.
- **The accent (`--color-accent`, acid green) is spent in exactly four places:**
  the headline italic, hover and focus states, the primary CTA, and the single
  payoff figure in a chart. Nowhere else.

  The fourth was added on 2026-07-27, on Josh's call, when the two
  `pipeline-drift` charts were recoloured for the dark palette. A chart makes one
  claim — passes dropping from 5.5–9 to 3 — and an all-neutral version rendered
  the before- and after-numbers at identical weight, so the payoff read flat.
  **One accent mark per chart, on the number the chart exists to show.** A second
  mark in the same image spends the budget: `generative-passes.svg` lifts its
  "One combined edit" box with a brighter border (`#4a4f4b`) instead.

  Chart SVGs hard-code the token hex values rather than referencing
  `var(--color-*)`, because sharp rasterizes them outside the browser and cannot
  resolve a CSS custom property. That is the one sanctioned place a raw hex
  appears; it does not license one in `src/`.
- **No rendered text below 12px** (`--text-xs`). This is an acceptance criterion,
  asserted by both a unit test and a Playwright sweep.
- **Every interactive element needs a `:focus-visible` style** distinct from the
  browser default. The base layer supplies one; verify it is not clipped by an
  `overflow: hidden` ancestor.
- **Dark mode only.** There is no light theme; the accent fails contrast on white.
- **Test selectors use `data-testid`**, never Tailwind class names.
- **No auto-playing animated media.** Motion is gated behind
  `prefers-reduced-motion`.

## Commit style

Conventional-commit prefixes: `feat:`, `fix:`, `test:`, `chore:`, `content:`,
`design:`. Subject in the imperative, lowercase after the prefix. Explain *why*
in the body when the reason is not obvious from the diff. Commit each plan task
separately.

## Writing style

Prose in docs, comments, and commit messages follows the same standard as the
rest of the repo: plain words over jargon, whole sentences, one idea per
paragraph, and a concrete example for every abstract claim. Say what a thing is
rather than what it is not. A comment should explain the reason a line exists,
not restate what the line does.
