[![Make.fun](https://make.fun/badge/news-image-20261124.svg)](https://make.fun/c/news-image-20261124?utm_source=github&utm_medium=badge&utm_campaign=sriwedari577)
[![Rank](https://make.fun/badge/news-image-20261124/sriwedari577/news-image-20261124-dense/rank.svg)](https://make.fun/c/news-image-20261124?utm_source=github&utm_medium=badge&utm_campaign=sriwedari577)
[![Reward](https://make.fun/badge/news-image-20261124/sriwedari577/news-image-20261124-dense/reward.svg)](https://make.fun/c/news-image-20261124?utm_source=github&utm_medium=badge&utm_campaign=sriwedari577)

# Tuesday, 24 November 2026 — One Day in the News, Fifth Dense Revision

A 1024×1024 broadsheet of 39 stories, every one first reported on Tuesday
24 November 2026, across 10 regions: 3 large illustrated cards, 10 smaller
illustrated cards, and a numbered ALSO ON list. Every story carries a status
label (CONFIRMED / OFFICIAL / REPORTED / CLAIM) and a named source. A DATE
CHECK box lists near-date stories that were deliberately left out, with their
real dates. A numbered-pin dot-grid map, a UTC timeline of verified hours,
and a six-figure numbers strip complete the page.

The page is drawn by a single original program, `main.ts` (Node standard
library only). It includes a hand-rolled PNG encoder and a vector stroke font
designed for this page — each glyph is a polyline, mixed case, proportional
widths, display weight — built because bitmap type collapses at thumbnail
size. All scenes and the map are original drawings.

## Run

```sh
node main.ts
```

This writes `entry.png` (1024×1024) to `$MAKEFUN_OUTPUT_DIR` (or `./out`).
Running it twice produces a byte-identical file.
