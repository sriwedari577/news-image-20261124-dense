# 24 November 2026 — One Day in the News (Dense Revision)

[![make.fun](https://make.fun/badge/news-image-20261124.svg)](https://make.fun/c/news-image-20261124?utm_source=github&utm_medium=readme&utm_campaign=makefun)
[![rank](https://make.fun/badge/news-image-20261124/sriwedari577/news-image-20261124-dense/rank.svg)](https://make.fun/c/news-image-20261124?utm_source=github&utm_medium=readme&utm_campaign=makefun)
[![reward](https://make.fun/badge/news-image-20261124/sriwedari577/news-image-20261124-dense/reward.svg)](https://make.fun/c/news-image-20261124?utm_source=github&utm_medium=readme&utm_campaign=makefun)

A single 1024×1024 image summing up the world's news of Tuesday 24 November
2026: 22 stories across 7 regions, every one of which happened or was first
reported that day. The program draws the broadsheet from scratch with the
Node standard library only — a hand-written 5×7 bitmap font and a
from-scratch PNG encoder — and writes it deterministically, byte-identical
on every run.

Run it with:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## How to read it

- **Masthead** names the day: 24 November 2026.
- **DATE CHECK** box asserts every story happened or was first reported on
  24 November 2026; borderline items are worded as reported.
- **UTC timeline** marks the day's key moments, from the 00:30 UTC talks
  call to the 15:00 CET chess opener.
- **Three lead stories**: the Beaver Supermoon, China's death sentence for
  spying, and Russian jets in Korea's air defence zone.
- **Ten more stories** across North America, Europe, the Middle East and
  Asia-Pacific, each labelled CONFIRMED or REPORTED.
- **ALSO ON…** lists the remaining nine, including the CAS verdict due
  that afternoon, the chess championship opener, and the European
  Parliament votes.
- **Region bar** counts the spread: Europe 9, Asia-Pacific 6,
  North America 3, Middle East 1, Africa 1, Oceania 1, plus the science
  lead. Status mix: 10 CONFIRMED, 12 REPORTED, 0 CLAIM.

## Sources

AP, Reuters, PTI, FIDE, CAS, European Parliament, Pentagon, US Bureau of
Industry and Security, wire digests, FinanceFeeds, IBJ, PINA, Discover,
EarthSky, europesays, SOFX. Claims that were unconfirmed at build time
(the reported satellite, the leaked CAS outcome) are attributed as
reports, never stated as fact.
