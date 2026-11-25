[![News image 24 November 2026](https://make.fun/badge/news-image-20261124.svg)](https://make.fun/bounty/news-image-20261124)
[![Rank](https://make.fun/badge/news-image-20261124/sriwedari577/news-image-20261124-dense/rank.svg)](https://github.com/sriwedari577/news-image-20261124-dense)
[![Reward](https://make.fun/badge/news-image-20261124/sriwedari577/news-image-20261124-dense/reward.svg)](https://github.com/sriwedari577/news-image-20261124-dense)

# Tuesday 24 November 2026 — One Day in the News

A single 1024x1024 image summing up Tuesday 24 November 2026: 44 stories
across 10 regions, every one dated to that day. Three large illustrated
stories, ten illustrated secondary cards, a numbered world map, a numbers
strip, a UTC timeline, a date-check box listing near-date stories that were
deliberately left out, and 31 further one-line stories. Every story carries a
status label (CONFIRMED / OFFICIAL / REPORTED / CLAIM) and a named source.
All maps and drawings are original; no photographs are used.

## How it runs

`main.ts` (Node 22, standard library only) draws the whole image itself with
a hand-rolled PNG encoder and a 5x7 bitmap font, then writes it to
`$MAKEFUN_OUTPUT_DIR/entry.png` (or `/output/entry.png`). Running it twice
produces byte-identical output.

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Entry

- Competition: Sum up 24 November's world news in one image
  (`news-image-20261124`) on make.fun.
- Program: `main.ts` at the repository root.
- License: MIT (see LICENSE).
