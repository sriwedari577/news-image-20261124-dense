# 24 November 2026 — One Day in the News (Dense Revision 3)

[![make.fun](https://make.fun/badge/news-image-20261124.svg)](https://make.fun/c/news-image-20261124?utm_source=github&utm_medium=readme&utm_campaign=makefun)
[![rank](https://make.fun/badge/news-image-20261124/sriwedari577/news-image-20261124-dense/rank.svg)](https://make.fun/c/news-image-20261124?utm_source=github&utm_medium=readme&utm_campaign=makefun)
[![reward](https://make.fun/badge/news-image-20261124/sriwedari577/news-image-20261124-dense/reward.svg)](https://make.fun/c/news-image-20261124?utm_source=github&utm_medium=readme&utm_campaign=makefun)

A single 1024×1024 image summing up the world's news of Tuesday 24 November
2026: 40 stories across 8 regions, every one of which happened or was first
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
  call to the 14:53 UTC full moon.
- **Three lead stories with drawn scenes**: the Beaver Supermoon (moon and
  skyline), Shanghai party chief Chen Jining under investigation
  (city skyline), and the TAIEX record gain (rising chart).
- **Fourteen more stories** across Africa, Asia-Pacific, Europe,
  the Middle East, North America and the world, each labelled CONFIRMED
  or REPORTED — including the CAS verdict restoring Senegal as AFCON
  champions, Sanofi's $41bn Insmed deal, the record 5,258 UK heat deaths,
  the UN femicide brief, Huawei's US trial verdict, and Dell's AI-driven
  revenue doubling.
- **ALSO ON…** lists the remaining 23, including the chess championship
  opener ending in a draw, the Shenzhou-24 crew, the Hanoi gas blast,
  and the CIA/ODNI breach report.
- **Region bar** counts the spread: Europe 13, Asia-Pacific 8,
  North America 8, Middle East 4, Global 3, Africa 2, Oceania 1,
  Science 1. Status mix: 26 CONFIRMED, 14 REPORTED, 0 CLAIM.

## Sources

AP, Reuters, GOV.UK/UKHSA, UN, UNAIDS, CAS, FIDE, European Parliament,
Sanofi, Dell, Xinhua, Focus Taiwan, wire digests, FinanceFeeds, IBJ, PINA.
Claims that were unconfirmed at build time (the IRGC tanker claim, the
reported satellite) are attributed as claims or reports, never stated as
fact, and the tanker headline carries the CENTCOM rejection alongside
the claim.
