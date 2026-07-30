# Homepage prototype — verdict

**Question:** What should the homepage look like, given a hiring manager skimming ~20 seconds
and a positioning of "forward-thinking, experimental, yet experienced"?

**Answer: variant E.** Structure from D, discipline from A.

## What won and why

| Element | Decision | Reason |
|---|---|---|
| Layout | Sticky left identity rail + scrolling content | Keeps name, nav, and contact permanently on screen; lets work thumbnails sit near the fold |
| Work list | Thumbnails + title + summary + tags, as rows | Images near the fold were the deciding factor over variant A's text-only index |
| Accent | Acid green `#c8ff2e`, spent in three places only | Headline italic, hover states, availability dot. Rare is what makes it land |
| Metric numerals | Light Instrument Serif, not bold sans | Reads annual-report rather than startup-dashboard — carries the "experienced" half of the positioning |
| Metric strip | Own section, centered cells, company + year under each number | Unattributed numbers read as claims; attributed ones read as evidence |
| Hover | Row slides right, bottom rule lights green | Borrowed from variant A; makes the list feel like an index you move through |
| CTAs | "Email me" (mailto) + "LinkedIn ↗" | No résumé PDF by choice — email is the intended path |
| Neutrals | Cooled from purple-tinted to green-tinted grays | Original palette was tuned for orange; green went muddy against it |

## Rejected

- **A (Editorial)** — braver typographically, but text-only work index put nothing visual near the fold.
- **B (Instrument panel)** — most credible numbers (attribution came from here), but reads cold for a product-leadership audience.
- **C (Kinetic)** — memorable if someone engages; actively fights a 20-second skim.
- **Numbered `01–04` index** — redundant signal alongside thumbnails, pure visual noise.
- **"Open to work" chip** — reads as actively hunting.

## Changed after the UX critique (Claude + Gemini + Codex, 2026-07-24)

Scored 27/40 on Nielsen's heuristics before fixes. Applied to variant E:

- **Neutral scale cut from six greys to three.** `#565a56` (2.81:1) and `#6d716c` (3.97:1) both
  failed WCAG AA. The first rendered the email address and every metric attribution — the
  contact path and the evidence, in the least legible ink on the page. Now `#eceeec` / `#adb1ac`
  / `#8a8e89`, measuring 16.90 / 9.07 / 5.92.
- **`:focus-visible` mirrors every hover treatment**, plus a skip link. The whole interaction
  language was mouse-only; keyboard users got a browser default ring.
- **`prefers-reduced-motion`** gates the row slide and thumbnail zoom.
- **Real anchors** — nav pointed at three dead `#`s.
- **Rail scrolls** — below ~420px of viewport height the contact links clipped unreachably.
- **Azibo's two roles split apart.** The prototype had merged them under the later title,
  contradicting the seven-role table in the design doc.

## Open

- Whether the work list clears the fold at real viewport heights. The `fold` button in the
  switcher measures it live; ~240px was trimmed from the hero to buy room.
- Whether the metric strip should sit below the work list instead, if the fold stays tight.
- Four copy questions (headline framing, metric label wording, attribution format, and whether
  case summaries lead with mechanism instead of judgment) — recorded in the design doc, not
  decided, because they are Josh's voice.
- Whether the design's identity survives the Swap Test. One reviewer's verdict: it clears the
  AI-slop bar, but the identity lives in the serif numerals, the metric attribution, and the
  headline voice rather than the layout — "swap in another product person's content and nothing
  breaks." Protect those three in the rebuild.

## Mobile layout prototype — verdict

**Question:** When the desktop identity rail collapses, where should navigation and contact links
go on a phone?

**Answer: variant A.** Josh chose it after comparing all three variants and a revised variant C
that moved the section navigation above the outcome cards.

Variant A uses this document order:

1. Identity masthead
2. Section navigation
3. Headline and positioning
4. Outcome cards
5. Selected work
6. Track record
7. Contact links in the footer

At 390 pixels, each case-study row keeps a 90-pixel thumbnail beside its text. At 320 pixels, the
thumbnail stacks above the text. The outcome cards use two columns at both widths.

## Cleanup

Delete `prototypes/` once the winning design is folded into the real build. The variant code
was written under prototype constraints — no tests, no error handling, no accessibility pass.
Rewrite it properly rather than promoting it.
