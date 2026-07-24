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

## Open

- Whether the work list clears the fold at real viewport heights. The `fold` button in the
  switcher measures it live; ~240px was trimmed from the hero to buy room.
- Whether the metric strip should sit below the work list instead, if the fold stays tight.

## Cleanup

Delete `prototypes/` once the winning design is folded into the real build. The variant code
was written under prototype constraints — no tests, no error handling, no accessibility pass.
Rewrite it properly rather than promoting it.
