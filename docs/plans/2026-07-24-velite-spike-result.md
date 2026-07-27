# Velite spike result

**Run:** 2026-07-26, in a throwaway worktree at `/tmp/velite-spike` on branch `spike/velite`.
**Stack under test:** Node 24.18.0, npm 11.16.0, Next 16.2.11 (Turbopack), React 19.2.8, Velite 0.4.0, sharp 0.34.5, esbuild 0.25.12.

**Verdict: all eight conditions pass.** Nothing in the spike contradicts the plan's architecture, so Task 2 proceeds with Velite.

## Conditions

| # | Condition | Result |
|---|---|---|
| 1 | Production build under Turbopack on Node 24 | **PASS** |
| 2 | Vercel preview build succeeds | **PASS** |
| 3 | Dev watch regenerates on add, edit, and delete | **PASS** |
| 4 | Invalid frontmatter exits non-zero, naming file and field | **PASS** |
| 5 | A client widget renders and hydrates | **PASS** |
| 6 | TypeScript types are emitted and resolve | **PASS** |
| 7 | `velite.config.ts` imports local TypeScript and a native module | **PASS** |
| 8 | A widget-free page does not ship the widget's chunk | **PASS**, one strategy only |

### 1 — Production build

`npm run build` exits 0. `.velite/index.js`, `.velite/index.d.ts`, and `.velite/work.json` are all emitted. Both content routes prerender as SSG through `generateStaticParams`.

### 2 — Vercel preview

Josh set the project's Node version to 24.x, confirmed through the API as `"nodeVersion": "24.x"`. Preview deploys for non-default branches were already enabled — the project carried a `-git-` branch preview domain from earlier work, and no branch allowlist is configured.

`spike/velite` was pushed and Vercel built **that exact commit**, verified by SHA rather than by "a deployment succeeded":

- Deployment `dpl_anFAUPeFLfmGVFNpMKDMNoDydiuZ`, `readyState: READY`, `bundler: turbopack`, built in 18 seconds.
- `githubCommitSha: df18b63e19682fd8d14c4be42e0a41fd13b32629`, matching `git rev-parse HEAD` in the spike worktree.
- The build log shows `Cloning … (Branch: spike/velite, Commit: df18b63)`, then Velite running, then five static pages.

Because `.velite/` and `public/static/` were gitignored, Vercel had to run Velite itself rather than build against checked-in output — so this is a real test of the content pipeline on their infrastructure, not just of `next build`. The log confirms it:

```
16:01:53  [noop-plugin] loaded; sharp resolved as function
16:01:53  [VELITE] build finished in 338.72ms
```

**`sharp` resolves inside Velite's esbuild-bundled config on Vercel too**, which is condition 7 re-proven in the deploy environment rather than only locally.

**The npm allowlist did not bite on Vercel.** Their install printed `added 153 packages in 8s` with no `allow-scripts` warning, on Vercel CLI 56.5.0. Either their npm predates the gate or the committed `allowScripts` block satisfied it — the block was in this commit's `package.json` either way. Task 2 should still carry the block, since the local install demonstrably needs it.

### 3 — Dev watch

The `&`-backgrounded launcher works: `"dev": "velite --watch & next dev"`. All three propagate with no manual restart — adding `three.mdx` made it appear on the index, editing its title updated the index, and deleting it removed it. The documented `next.config.ts` `build({ watch: isDev })` alternative was **not needed**; keep the `&` form.

### 4 — Invalid frontmatter

This was the condition the plan flagged as most likely to fail. **It names both the file and the field.** Deleting the `outcomes` block from `one.mdx` and running `velite build --clean --strict` gives exit code 1 and, verbatim:

```
[VELITE] issues:
content/work/one.mdx
 error Required  outcomes

✖ 1 error 
[VELITE] Schema validation failed.
```

The acceptance criterion "names the file and the failing field" holds with no wrapper and no relaxation.

Two details Task 5's fixture harness depends on:

- **`--strict` is what makes it fail.** The same build without `--strict` prints the identical `issues:` block and then reports `build finished in 208.90ms`, exiting 0. The plan's insistence on an explicit `--strict` in the build script is correct and load-bearing.
- **A bad `s.image()` also names its field.** An earlier run with a corrupt PNG reported `error Input buffer has corrupt header … cover` against each file, so image failures are as legible as shape failures.

### 5 — Client widget

The counter's markup is in the server-rendered HTML for `/work/two`, and clicking it in a real browser moves the label from `Clicked 0 times` to `Clicked 1 times`. The page itself carries no `use client`; only the widget does. Velite's compile-to-function-body output evaluates in a Server Component through `new Function(code)({ ...runtime }).default` exactly as the plan describes.

### 6 — TypeScript types

`npx tsc --noEmit` exits 0. The typing is real rather than `any`: a probe assigning `const probe: number = work[0].title` fails with `TS2322: Type 'string' is not assignable to type 'number'`, and removing the probe returns the typecheck to green.

### 7 — Local TypeScript and a native module in the config

**Task 9's rehype plugin can live at `src/lib/mdx/` as planned.** A trivial plugin at `src/lib/mdx/noop-plugin.ts` that imports `sharp`, registered as `s.mdx({ rehypePlugins: [noopPlugin] })`, survives Velite's esbuild config bundling. The build exits 0 and prints:

```
[noop-plugin] loaded; sharp resolved as function
[noop-plugin] ran over an MDX tree
```

once per content file. No inlining into `velite.config.ts` and no precompute script are needed.

### 8 — Widget chunk isolation

**Only strategy 1 isolates the chunk.** All three were measured on the same two-page build, identifying the counter's chunk by a marker string in its body rather than by filename.

| Strategy | Counter chunk reaches the widget-free page? | Verdict |
|---|---|---|
| 1. A `"use client"` wrapper owns the `next/dynamic` import | no | **isolates** |
| 2. `next/dynamic` called in the server-side registry | yes | leaks |
| 3. A static `import { Counter }` in the registry | yes | leaks |

Strategy 2 leaking confirms Next's documented limitation — automatic code splitting is not supported when a Server Component dynamically imports a Client Component — against this repo's observed behavior rather than a doc sentence.

Measured two independent ways, both agreeing:

- **Build output.** Under strategy 1 the marker chunk `3wo5pw76wk6bp.js` is referenced nowhere in `/work/one`'s HTML and the counter's markup is absent; `/work/two` carries both. Under strategies 2 and 3 the marker chunk is referenced from `/work/one` as well.
- **Runtime, in fresh browser contexts.** The browser was fully closed between pages so the second measurement could not be served from cache. `/work/one` requested 8 JavaScript files, none of them the marker chunk. `/work/two` requested the same 8 plus `3wo5pw76wk6bp.js`.

**Task 9 implements strategy 1** — the `BeforeAfterSliderLazy.tsx` wrapper the plan already sketches. The per-page component map fallback is not needed.

## Findings the plan did not anticipate

Three things surfaced that change what Task 2 must write. None of them threatens the architecture.

### npm 11 blocks the install scripts that Velite and sharp need

npm 11.16 gates package install scripts behind an `allowScripts` allowlist. A plain `npm install` prints:

```
npm warn allow-scripts 2 packages have install scripts not yet covered by allowScripts:
npm warn allow-scripts   sharp@0.34.5 (install: node install/check.js || npm run build)
npm warn allow-scripts   esbuild@0.25.12 (postinstall: node install.js)
```

and **leaves both native binaries unbuilt**. Velite bundles its config with esbuild, so without this the content pipeline does not run at all — and the failure arrives as a confusing missing-binary error rather than anything pointing at the allowlist.

`npm approve-scripts sharp esbuild` writes the allowlist into `package.json`:

```json
"allowScripts": {
  "esbuild@0.25.12": true,
  "sharp@0.34.5": true
}
```

**Task 2 must include this block in the `package.json` it writes**, or its Step 8 `npm install` produces a tree that cannot build. It also affects Task 21's `rm -rf node_modules && npm ci` and, depending on the npm version Vercel runs, the deploy — which is one more reason condition 2 is worth resolving early.

The version-pinned keys mean the block needs updating whenever `sharp` or `esbuild` moves. That is a real maintenance cost and the honest alternative — `--no-allow-scripts-pin` for unpinned keys — trades it for a weaker guarantee. Pinned is the right default here.

### Next 16 rewrites two tsconfig fields on first build

The plan's `tsconfig.json` sets `"jsx": "preserve"`. Next 16 overrides it on the first build and says so:

```
The following mandatory changes were made to your tsconfig.json:
  - jsx was set to react-jsx (next.js uses the React automatic runtime)
```

It also appends `.next/dev/types/**/*.ts` to `include`. Both edits are written to disk. Task 2 can write `"jsx": "preserve"` as planned and let Next correct it, but the executor should **expect a dirty `tsconfig.json` after the first build and commit the corrected version** rather than treating it as an unexplained diff. Writing `"jsx": "react-jsx"` directly is the cleaner option.

### Preview deployments are behind Vercel SSO, which will block Tasks 22 and 23

Every request to the preview URL returns `302` to `https://vercel.com/sso-api?...`, with an `x-robots-tag: noindex`. The deployment is `READY`; the redirect is Vercel's deployment protection, not a build failure.

**This breaks two later tasks as written**, and both assume an anonymously reachable preview:

- **Task 22** runs `PREVIEW_URL=… npx playwright test`. Every `request.get()` would see a 302 to an SSO page, so `expect(status).toBe(200)` fails on all five routes and the 404 assertions pass for the wrong reason — a 302 is not a 404, but a test asserting "not 200" would still go green in some formulations. The route sweep would be measuring the auth wall.
- **Task 23 Step 3** runs the Manual Test Checklist against the preview, and Step 4 re-runs the e2e suite there. Same wall. Its LinkedIn social-preview check also fails, because LinkedIn's crawler cannot authenticate.

Three ways out, in the order worth trying:

1. **A protection bypass token.** Vercel issues an automation bypass secret; Playwright sends it as the `x-vercel-protection-bypass` header, and the checklist appends `?x-vercel-set-bypass-cookie=true`. Keeps protection on for humans and is the intended mechanism for exactly this.
2. **Set protection to "Only Preview Deployments" off**, so previews are public. Simplest, and the repo is public anyway, but it publishes every in-progress build.
3. **Run the suite against a local `npm run start`** instead. `playwright.config.ts` already defaults `baseURL` to `http://localhost:3000`, so this needs no code change — but it stops testing the artifact that actually ships, which is the point of running it post-deploy.

**This is Josh's decision and it is not urgent**, since nothing before Task 22 touches a preview. Raise it at Task 20, so the answer exists before Task 22 needs it.

### The spike's own strip list was incomplete

Task 1's `git rm` list — `src middleware.ts next.config.js next.config.mjs package.json package-lock.json` — leaves `i18n.config.ts` and `messages/` behind, and the spike's first typecheck failed on `next-intl/server`. This is a defect in **Task 1's** command only. Task 2's deletion list already includes both, so nothing there needs changing.

## What this means for the plan

- **Proceed to Task 2 with Velite.** The fallback table in Task 1 Step 11 is not triggered.
- **Task 2** adds the `allowScripts` block to `package.json`, and should expect Next to rewrite `tsconfig.json`'s `jsx` field on first build.
- **Task 9** implements strategy 1, the `"use client"` wrapper owning the `next/dynamic` import. The `widgets: string[]` frontmatter fallback is not needed.
- **Task 9's rehype plugin** lives at `src/lib/mdx/rehype-image-dimensions.ts` and imports `sharp`, as written.
- **Tasks 22 and 23** need the preview-protection question answered first. Raise it at Task 20.
