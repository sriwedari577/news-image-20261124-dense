// One-day news broadsheet: Tuesday 24 November 2026.
// Draws a 1024x1024 PNG with a hand-rolled encoder and a 5x7 bitmap font.
// Node standard library only. Writes to $MAKEFUN_OUTPUT_DIR or /output/entry.png.
import * as fs from "node:fs";
import * as zlib from "node:zlib";
import * as path from "node:path";

const W = 1024;
const H = 1024;
const img = Buffer.alloc(W * H * 3);

type RGB = [number, number, number];
const PAPER: RGB = [247, 243, 232];
const PAPER2: RGB = [238, 232, 214];
const INK: RGB = [24, 24, 24];
const GREY: RGB = [96, 96, 92];
const RED: RGB = [178, 34, 28];
const BLUE: RGB = [28, 74, 130];
const TEAL: RGB = [0, 110, 108];
const GREEN: RGB = [46, 110, 52];
const AMBER: RGB = [168, 104, 0];
const NAVY: RGB = [32, 48, 88];
const SKY: RGB = [196, 216, 232];
const SAND: RGB = [224, 205, 164];
const SEA: RGB = [173, 203, 220];
const WHITE: RGB = [255, 255, 255];
const BLACK: RGB = [12, 12, 12];

function px(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  img[i] = c[0]; img[i + 1] = c[1]; img[i + 2] = c[2];
}
function rect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) px(i, j, c);
}
function hline(x: number, y: number, w: number, c: RGB): void { rect(x, y, w, 1, c); }
function vline(x: number, y: number, h: number, c: RGB): void { rect(x, y, 1, h, c); }
function box(x: number, y: number, w: number, h: number, c: RGB): void {
  hline(x, y, w, c); hline(x, y + h - 1, w, c); vline(x, y, h, c); vline(x + w - 1, y, h, c);
}
function line(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy, x = x0, y = y0;
  for (;;) {
    px(x, y, c);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
}
function circle(cx: number, cy: number, r: number, c: RGB): void {
  for (let dy = -r; dy <= r; dy++) {
    const dx = Math.floor(Math.sqrt(r * r - dy * dy));
    hline(cx - dx, cy + dy, dx * 2 + 1, c);
  }
}
function ellipse(cx: number, cy: number, rx: number, ry: number, c: RGB): void {
  for (let dy = -ry; dy <= ry; dy++) {
    const dx = Math.floor(rx * Math.sqrt(1 - (dy * dy) / (ry * ry)));
    hline(cx - dx, cy + dy, dx * 2 + 1, c);
  }
}
function ring(cx: number, cy: number, r: number, c: RGB): void {
  for (let a = 0; a < 360; a += 3) {
    const rad = (a * Math.PI) / 180;
    px(Math.round(cx + r * Math.cos(rad)), Math.round(cy + r * Math.sin(rad)), c);
  }
}

// 5x7 bitmap font, one row per number, MSB = leftmost pixel.
const FONT: Record<string, number[]> = {
  A: [14, 17, 17, 31, 17, 17, 17], B: [30, 17, 17, 30, 17, 17, 30],
  C: [14, 17, 16, 16, 16, 17, 14], D: [30, 17, 17, 17, 17, 17, 30],
  E: [31, 16, 16, 30, 16, 16, 31], F: [31, 16, 16, 30, 16, 16, 16],
  G: [14, 17, 16, 23, 17, 17, 15], H: [17, 17, 17, 31, 17, 17, 17],
  I: [14, 4, 4, 4, 4, 4, 14], J: [7, 2, 2, 2, 2, 18, 12],
  K: [17, 18, 20, 24, 20, 18, 17], L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17], N: [17, 25, 21, 19, 17, 17, 17],
  O: [14, 17, 17, 17, 17, 17, 14], P: [30, 17, 17, 30, 16, 16, 16],
  Q: [14, 17, 17, 17, 21, 18, 13], R: [30, 17, 17, 30, 20, 18, 17],
  S: [15, 16, 16, 14, 1, 1, 30], T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14], V: [17, 17, 17, 17, 17, 10, 4],
  W: [17, 17, 17, 21, 21, 21, 10], X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 10, 4, 4, 4, 4], Z: [31, 1, 2, 4, 8, 16, 31],
  "0": [14, 17, 19, 21, 25, 17, 14], "1": [4, 12, 4, 4, 4, 4, 14],
  "2": [14, 17, 1, 6, 8, 16, 31], "3": [31, 2, 4, 2, 1, 17, 14],
  "4": [2, 6, 10, 18, 31, 2, 2], "5": [31, 16, 30, 1, 1, 17, 14],
  "6": [6, 8, 16, 30, 17, 17, 14], "7": [31, 1, 2, 4, 8, 8, 8],
  "8": [14, 17, 17, 14, 17, 17, 14], "9": [14, 17, 17, 15, 1, 2, 12],
  " ": [0, 0, 0, 0, 0, 0, 0], ".": [0, 0, 0, 0, 0, 12, 12],
  ",": [0, 0, 0, 0, 12, 4, 8], ":": [0, 12, 12, 0, 12, 12, 0],
  ";": [0, 12, 12, 0, 12, 4, 8], "'": [4, 4, 8, 0, 0, 0, 0],
  "-": [0, 0, 0, 14, 0, 0, 0], "+": [0, 4, 4, 31, 4, 4, 0],
  "/": [1, 2, 2, 4, 8, 8, 16], "(": [2, 4, 8, 8, 8, 4, 2],
  ")": [8, 4, 2, 2, 2, 4, 8], "%": [25, 26, 2, 4, 8, 11, 19],
  "$": [4, 15, 20, 14, 5, 30, 4], "!": [4, 4, 4, 4, 4, 0, 4],
  "?": [14, 17, 1, 6, 4, 0, 4], "&": [12, 18, 20, 8, 21, 18, 13],
  "*": [0, 21, 14, 21, 0, 0, 0], "=": [0, 0, 31, 0, 31, 0, 0],
  "#": [10, 10, 31, 10, 31, 10, 10], '"': [10, 10, 0, 0, 0, 0, 0],
  "_": [0, 0, 0, 0, 0, 0, 31], "[": [14, 8, 8, 8, 8, 8, 14],
  "]": [14, 2, 2, 2, 2, 2, 14],
};

function text(str: string, x: number, y: number, s: number, c: RGB, maxW?: number): void {
  const up = str.toUpperCase();
  let cx = x;
  for (const ch of up) {
    if (maxW !== undefined && cx + 5 * s > x + maxW) break;
    const g = FONT[ch] || FONT[" "];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if ((g[r] >> (4 - col)) & 1) rect(cx + col * s, y + r * s, s, s, c);
      }
    }
    cx += 6 * s;
  }
}
function tw(str: string, s: number): number { return str.length * 6 * s - s; }
function centered(str: string, y: number, s: number, c: RGB, x0: number, w: number): void {
  text(str, x0 + Math.floor((w - tw(str, s)) / 2), y, s, c);
}

const STATUS_COLOR: Record<string, RGB> = {
  CONFIRMED: GREEN, OFFICIAL: BLUE, REPORTED: AMBER, CLAIM: RED,
};

type Story = {
  n: number; region: string; status: string; source: string;
  head: string[]; deck: string[];
};

const HEROES: Story[] = [
  {
    n: 1, region: "MIDDLE EAST", status: "CONFIRMED", source: "REUTERS / INA",
    head: ["BAGHDAD SEIZES OIL", "FIELDS IN 4 PROVINCES"],
    deck: ["FEDERAL TAKEOVER OF FIELDS IN KIRKUK, DIYALA,", "SALAHUDDIN AND NINEVEH, PLUS ALL KURDISH BORDER", "POSTS, AFTER A SMUGGLING PROBE. KURDISH PM SAYS NO."],
  },
  {
    n: 2, region: "OCEANIA", status: "REPORTED", source: "PARLIAMENT RECORD",
    head: ["BOUGAINVILLE VOTE", "ON FREEDOM BEGINS"],
    deck: ["PNG PARLIAMENT STARTS RATIFYING THE 2019 VOTE:", "97.7% BACKED INDEPENDENCE. 89 OF 118 MPS MUST", "AGREE. NO RESULT ANNOUNCED YET."],
  },
  {
    n: 3, region: "EAST ASIA", status: "REPORTED", source: "PARTY STATEMENT",
    head: ["SHANGHAI CHIEF CHEN", "UNDER INVESTIGATION"],
    deck: ["CHEN JINING, THE CITY'S TOP OFFICIAL, FACES A", "PROBE. MARKETS WATCH FOR FALLOUT IN CHINA", "FINANCIAL CAPITAL."],
  },
];

const SECONDARIES: Story[] = [
  { n: 4, region: "EAST ASIA", status: "CONFIRMED", source: "MARKET DATA", head: ["TAIEX JUMPS 8.99% TO", "A NEW RECORD"], deck: ["AI RALLY LIFTS ASIAN", "MARKETS; KOSPI UP TOO."] },
  { n: 5, region: "SOUTH ASIA", status: "CONFIRMED", source: "NEMRC", head: ["M5.6 QUAKE SHAKES", "NEPAL-TIBET BORDER"], deck: ["07:17 LOCAL TIME IN", "TAPLEJUNG. NO DEAD."] },
  { n: 6, region: "SE ASIA", status: "CONFIRMED", source: "AP", head: ["CIKANDE FIRE TOLL", "RISES TO 26 DEAD"], deck: ["28 STILL MISSING AFTER", "SATURDAY CANDY-PLANT BLAZE."] },
  { n: 7, region: "SE ASIA", status: "OFFICIAL", source: "PM ANWAR", head: ["MALAYSIA TO SEND", "HOME 6,500+ PEOPLE"], deck: ["DECEMBER RETURN BY SHIP AND", "AIR, 5 DAYS AFTER ICJ RULING."] },
  { n: 8, region: "EUROPE", status: "CONFIRMED", source: "PARLIAMENT", head: ["PORTUGAL PASSES", "2027 BUDGET"], deck: ["PSD AND CDS-PP BACK IT;", "PS ABSTAINS, CHEGA SAYS NO."] },
  { n: 9, region: "EUROPE", status: "CONFIRMED", source: "REUTERS", head: ["EU CAPS CHINA HYBRID", "IMPORTS AT 350,000"], deck: ["QUOTA FROM DEC 1 FOR", "200 DAYS; ALLIES INCLUDED."] },
  { n: 10, region: "GLOBAL", status: "CONFIRMED", source: "UN", head: ["UN DEBATES AI AND", "THE FUTURE OF WAR"], deck: ["GUTERRES: HUMANS MUST", "KEEP LIFE-OR-DEATH CALLS."] },
  { n: 11, region: "SOUTH ASIA", status: "CONFIRMED", source: "REUTERS", head: ["TEEN, 15, SMASHES 204", "OFF 53 BALLS"], deck: ["SOORYAVANSHI HITS 28", "SIXES; LIST A RECORDS FALL."] },
  { n: 12, region: "EUROPE", status: "CONFIRMED", source: "OFFICIALS", head: ["DAWN STRIKE KILLS 2,", "WOUNDS 40+ IN CITY"], deck: ["BABY AMONG INJURED IN", "ZAPORIZHZHIA ATTACK."] },
  { n: 13, region: "OCEANIA", status: "REPORTED", source: "SMH / ABC", head: ["SOLOMONS TO LET", "CHINA PACT LAPSE"], deck: ["2022 DEAL ENDS APRIL", "2027; AUSTRALIA PACT NEXT."] },
];

const ALSO: { n: number; line: string }[] = [
  { n: 14, line: "#14 RUSSIA CLAIMS 699 DRONES DOWNED, 355 AT MOSCOW - CLAIM - DEFENCE MINISTRY" },
  { n: 15, line: "#15 SHENZHOU-24 CREW NAMED, PAKISTANI FIRST ON TIANGONG - OFFICIAL - CMSA" },
  { n: 16, line: "#16 TRUMP PARDONS TURKEYS FREEDOM AND FEATHERS - CONFIRMED - WHITE HOUSE" },
  { n: 17, line: "#17 GIULIANI GETS MEDAL OF FREEDOM IN OVAL OFFICE - CONFIRMED - REUTERS" },
  { n: 18, line: "#18 KOSPI UP 6.32% TO 5,006 - CONFIRMED - MARKET DATA" },
  { n: 19, line: "#19 SANOFI BUYS INSMED FOR $41BN - CONFIRMED - COMPANY" },
  { n: 20, line: "#20 DELL POSTS RECORD $54.9BN REVENUE, UP 103% - CONFIRMED - COMPANY" },
  { n: 21, line: "#21 HUAWEI SHOWS MATE X8; HARMONYOS TOPS 100M DEVICES - CONFIRMED" },
  { n: 22, line: "#22 ENGLAND HEAT DEATHS 5,258 IN SUMMER 2026 - OFFICIAL - UKHSA" },
  { n: 23, line: "#23 CAS RESTORES SENEGAL AS AFCON CHAMPIONS - OFFICIAL - CAS" },
  { n: 24, line: "#24 CHINESE OFFICIAL GETS DEATH SENTENCE OVER LEAKS - REPORTED - STATE MEDIA" },
  { n: 25, line: "#25 SEOUL PROBES AIR DEFENCE ZONE INCURSION - REPORTED - MILITARY" },
  { n: 26, line: "#26 HORMUZ: 2-3 TANKERS SEIZED, CENTCOM DENIES CLAIM - REPORTED - CENTCOM" },
  { n: 27, line: "#27 EU CARBON MARKET REFORM PASSES 403-78 - OFFICIAL - PARLIAMENT" },
  { n: 28, line: "#28 UN: 47,000 WOMEN KILLED BY PARTNERS OR FAMILY - OFFICIAL - UN" },
  { n: 29, line: "#29 HOUTHI DRONE AT RIYADH DOWNED; CLAIM REJECTED - REPORTED - SAUDI" },
  { n: 30, line: "#30 EBOLA: CONGO EVACUATES EXPOSED HEALTH WORKERS - REPORTED - WHO" },
  { n: 31, line: "#31 SARKOZY AND BRUNI FACE TRIAL OVER LIBYA FUNDS - REPORTED - COURT" },
  { n: 32, line: "#32 CHESS TITLE GAME 1 ENDS IN 38-MOVE DRAW - CONFIRMED - ORGANISERS" },
  { n: 33, line: "#33 SUPERMOON, BRIGHTEST OF 2026, LIGHTS THE SKIES - CONFIRMED" },
  { n: 34, line: "#34 GREECE PLANS GRAIN ROUTE VIA ALEXANDROUPOLIS - REPORTED - TO VIMA" },
  { n: 35, line: "#35 WFP: WAR SHIPPING CHAOS THREATENS AID FOR 7.3M - REPORTED - WFP" },
  { n: 36, line: "#36 INDIA CITES 1943 BENGAL FAMINE AT UN DEBATE - REPORTED - PTI" },
  { n: 37, line: "#37 CIA, ODNI BREACH HITS UNCLASSIFIED SYSTEM - REPORTED - NYT" },
  { n: 38, line: "#38 AUSTRALIA SETS FINES UP TO 5% OF TECH REVENUE - REPORTED - REUTERS" },
  { n: 39, line: "#39 MADAGASCAR SEEKS WARRANTS FOR EX-LEADERS - REPORTED - AFP" },
  { n: 40, line: "#40 COLOMBIA PRESIDENT VISITS BLAST SITE; 23 HURT - REPORTED - PRESIDENCY" },
  { n: 41, line: "#41 POLAND: RUSSIAN DRONE IN AIRSPACE, NATO SENDS AWACS - REPORTED" },
  { n: 42, line: "#42 WISCONSIN REPORTS 3RD MEASLES DEATH IN 2026 - REPORTED - STATE" },
  { n: 43, line: "#43 UAE COACH CRASH KILLS 11 IN RAS AL-KHAIMAH - REPORTED - THE NATIONAL" },
  { n: 44, line: "#44 HOUTHIS ADVANCE ON ADEN AS FORCES DIG IN - REPORTED - AP" },
];

// ---- mini scenes (each draws inside x,y,w,h) ----
function sceneOil(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, SKY);
  rect(x, y + h - 26, w, 26, SAND);
  for (let i = 0; i < 2; i++) {
    const bx = x + 24 + i * 96;
    line(bx, y + h - 26, bx + 14, y + 22, INK);
    line(bx + 28, y + h - 26, bx + 14, y + 22, INK);
    rect(bx + 8, y + 14, 12, 10, INK);
    line(bx + 14, y + 18, bx + 44, y + 44, INK);
  }
  const prov = ["KIRKUK", "DIYALA", "SALAHUDDIN", "NINEVEH"];
  for (let i = 0; i < 4; i++) {
    const bx = x + 8 + i * 78;
    rect(bx, y + h - 22, 72, 16, WHITE);
    box(bx, y + h - 22, 72, 16, INK);
    text(prov[i], bx + 4, y + h - 19, 1, INK);
  }
}
function sceneParliament(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, SKY);
  rect(x + 40, y + 26, w - 80, 10, INK);
  line(x + w / 2, y + 6, x + 40, y + 26, INK);
  line(x + w / 2, y + 6, x + w - 40, y + 26, INK);
  for (let i = 0; i < 5; i++) rect(x + 52 + i * 44, y + 38, 12, h - 52, INK);
  rect(x + 36, y + h - 16, w - 72, 6, INK);
  rect(x + w - 96, y + 8, 52, 30, WHITE);
  box(x + w - 96, y + 8, 52, 30, INK);
  text("97.7%", x + w - 90, y + 16, 1, RED);
  text("YES", x + w - 82, y + 26, 1, INK);
}
function sceneSkyline(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, NAVY);
  const hs = [34, 52, 28, 58, 40, 46, 26];
  for (let i = 0; i < 7; i++) {
    const bx = x + 10 + i * 45, bh = hs[i];
    rect(bx, y + h - 12 - bh, 36, bh, [70, 90, 130]);
    for (let wy = 0; wy < 5; wy++) for (let wx = 0; wx < 3; wx++) px(bx + 6 + wx * 10, y + h - 8 - bh + wy * 12, [255, 220, 120]);
  }
  ring(x + w - 62, y + 34, 24, WHITE);
  line(x + w - 44, y + 52, x + w - 26, y + 70, WHITE);
  rect(x + w - 62, y + h - 12, w, 12, BLACK);
}
function sceneChart(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, WHITE);
  box(x, y, w, h, INK);
  vline(x + 14, y + 4, 30, INK);
  hline(x + 14, y + 34, w - 24, INK);
  const pts: [number, number][] = [[20, 30], [48, 27], [76, 29], [104, 19], [132, 15], [160, 7]];
  for (let i = 0; i < pts.length - 1; i++) line(x + pts[i][0], y + pts[i][1], x + pts[i + 1][0], y + pts[i + 1][1], RED);
  for (const p of pts) circle(x + p[0], y + p[1], 3, RED);
  text("+8.99%", x + w - 52, y + 26, 1, RED);
}
function sceneQuake(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, SKY);
  text("M5.6", x + 8, y + 2, 1, RED);
  line(x + 10, y + h - 6, x + 60, y + 14, INK);
  line(x + 60, y + 14, x + 110, y + h - 6, INK);
  line(x + 80, y + h - 6, x + 130, y + 22, INK);
  line(x + 130, y + 22, x + 180, y + h - 6, INK);
  rect(x, y + h - 6, w, 6, SAND);
  const zz: [number, number][] = [[6, 30], [22, 30], [30, 20], [38, 36], [46, 27], [54, 33], [62, 30], [90, 30], [98, 22], [106, 36], [114, 30], [150, 30], [158, 25], [166, 34], [174, 30]];
  for (let i = 0; i < zz.length - 1; i++) line(x + zz[i][0], y + zz[i][1], x + zz[i + 1][0], y + zz[i + 1][1], RED);
}
function sceneFactory(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, SKY);
  text("26", x + 8, y + 2, 2, RED);
  rect(x + 126, y + 8, 14, 30, INK);
  rect(x + 14, y + 22, 100, 16, [150, 60, 50]);
  line(x + 14, y + 22, x + 44, y + 12, INK);
  line(x + 44, y + 12, x + 74, y + 22, INK);
  line(x + 74, y + 22, x + 104, y + 12, INK);
  line(x + 104, y + 12, x + 114, y + 22, INK);
  rect(x, y + h - 4, w, 4, SAND);
}
function sceneBoats(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, SEA);
  text("6,500+", x + 8, y + 2, 1, INK);
  line(x + 140, y + 8, x + 176, y + 8, INK);
  line(x + 140, y + 8, x + 150, y + 3, INK);
  line(x + 140, y + 8, x + 150, y + 13, INK);
  rect(x + 16, y + 24, 56, 10, INK);
  line(x + 34, y + 24, x + 44, y + 11, INK);
  line(x + 44, y + 11, x + 54, y + 24, INK);
  rect(x + 104, y + 27, 44, 9, [120, 40, 40]);
  line(x + 118, y + 27, x + 126, y + 17, INK);
  line(x + 126, y + 17, x + 134, y + 27, INK);
  hline(x + 6, y + 38, w - 12, WHITE);
}
function sceneVote(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, PAPER2);
  circle(x + 24, y + 14, 8, RED);
  rect(x + 84, y + 6, 28, 18, WHITE);
  box(x + 84, y + 6, 28, 18, INK);
  line(x + 88, y + 16, x + 96, y + 21, GREEN);
  line(x + 96, y + 21, x + 108, y + 10, GREEN);
  text("2,864", x + 140, y + 10, 1, INK);
  rect(x + 48, y + 26, 100, 6, BLUE);
  rect(x + 56, y + 32, 84, 9, BLUE);
}
function sceneCars(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, WHITE);
  box(x, y, w, h, INK);
  text("CAP 350,000", x + 10, y + 3, 1, INK);
  for (let i = 0; i < 3; i++) {
    const bx = x + 14 + i * 58;
    rect(bx + 10, y + 12, 28, 8, [200, 60, 40]);
    rect(bx, y + 20, 48, 10, [200, 60, 40]);
    circle(bx + 12, y + 32, 4, INK);
    circle(bx + 36, y + 32, 4, INK);
  }
  rect(x + 14, y + 37, w - 28, 3, PAPER2);
  rect(x + 14, y + 37, Math.floor((w - 28) * 0.7), 3, RED);
}
function sceneUN(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, SKY);
  text("10278", x + 8, y + 3, 1, INK);
  circle(x + w - 34, y + 14, 11, TEAL);
  ellipse(x + w - 34, y + 14, 11, 5, WHITE);
  rect(x + 30, y + 18, w - 60, 20, WHITE);
  box(x + 30, y + 18, w - 60, 20, INK);
  for (let i = 0; i < 6; i++) vline(x + 44 + i * 22, y + 22, 12, INK);
  rect(x + 74, y + h - 8, 46, 8, [120, 120, 120]);
  rect(x + 84, y + h - 16, 26, 8, [120, 120, 120]);
  line(x + 97, y + h - 16, x + 97, y + h - 22, INK);
  circle(x + 97, y + h - 24, 2, RED);
}
function sceneCricket(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, [140, 190, 120]);
  text("204", x + 118, y + 3, 2, INK);
  text("28 SIXES", x + 118, y + 20, 1, INK);
  line(x + 30, y + 38, x + 66, y + 10, [150, 100, 50]);
  rect(x + 62, y + 4, 10, 10, [150, 100, 50]);
  circle(x + 168, y + 32, 6, RED);
  rect(x, y + h - 4, w, 4, [110, 150, 90]);
}
function sceneStrike(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, SKY);
  text("2 DEAD", x + 8, y + 3, 1, RED);
  circle(x + 76, y + 8, 6, GREY);
  circle(x + 92, y + 4, 4, GREY);
  rect(x + 30, y + 16, 70, 22, [120, 120, 118]);
  rect(x + 110, y + 24, 54, 14, [140, 140, 138]);
  line(x + 30, y + 16, x + 65, y + 6, INK);
  line(x + 65, y + 6, x + 100, y + 16, INK);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) rect(x + 40 + i * 16, y + 22 + j * 8, 8, 5, [60, 60, 60]);
  rect(x, y + h - 4, w, 4, SAND);
}
function sceneIslands(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, SEA);
  ellipse(x + 52, y + 56, 40, 18, SAND);
  ellipse(x + 146, y + 62, 34, 14, SAND);
  circle(x + 52, y + 44, 6, GREEN);
  circle(x + 146, y + 52, 6, GREEN);
  for (let i = 0; i < 5; i++) hline(x + 92 + i * 8, y + 58, 5, WHITE);
  vline(x + 96, y + 30, 28, INK);
  rect(x + 96, y + 30, 20, 12, [200, 40, 40]);
  vline(x + 138, y + 34, 28, INK);
  rect(x + 138, y + 34, 20, 12, [40, 80, 160]);
  text("2027", x + 76, y + 6, 1, INK);
}

const SCENES: Record<number, (x: number, y: number, w: number, h: number) => void> = {
  1: sceneOil, 2: sceneParliament, 3: sceneSkyline, 4: sceneChart, 5: sceneQuake,
  6: sceneFactory, 7: sceneBoats, 8: sceneVote, 9: sceneCars, 10: sceneUN,
  11: sceneCricket, 12: sceneStrike, 13: sceneIslands,
};

function statusLine(x: number, y: number, s: Story, maxW: number): void {
  const c = STATUS_COLOR[s.status] || INK;
  text(s.status, x, y, 1, c);
  text(" - " + s.source, x + tw(s.status, 1) + 6, y, 1, GREY, maxW);
}

function drawHero(s: Story, x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, WHITE);
  box(x, y, w, h, INK);
  rect(x, y, w, 16, INK);
  text("#" + s.n + "  " + s.region, x + 6, y + 5, 1, WHITE);
  SCENES[s.n](x + 1, y + 17, w - 2, 74);
  hline(x, y + 91, w, INK);
  let ty = y + 98;
  for (const ln of s.head) { text(ln, x + 8, ty, 2, INK, w - 16); ty += 16; }
  ty += 2;
  for (const ln of s.deck) { text(ln, x + 8, ty, 1, INK, w - 16); ty += 9; }
  statusLine(x + 8, y + h - 12, s, w - 16);
}

function drawSecondary(s: Story, x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, WHITE);
  box(x, y, w, h, INK);
  rect(x, y, w, 13, INK);
  text("#" + s.n, x + 4, y + 3, 1, WHITE);
  text(s.region, x + 26, y + 3, 1, WHITE, w - 30);
  SCENES[s.n](x + 1, y + 14, w - 2, 42);
  let ty = y + 60;
  for (const ln of s.head) { text(ln, x + 5, ty, 1, INK, w - 10); ty += 9; }
  ty += 1;
  for (const ln of s.deck) { text(ln, x + 5, ty, 1, GREY, w - 10); ty += 9; }
  statusLine(x + 5, y + h - 11, s, w - 10);
}

// ---- page ----
rect(0, 0, W, H, PAPER);

// masthead
rect(0, 0, W, 96, INK);
text("THE WORLD IN ONE DAY  -  A BROADSHEET OF ONE TUESDAY", 10, 10, 1, [200, 200, 200]);
centered("TUESDAY, 24 NOVEMBER 2026", 26, 3, WHITE, 0, W);
text("44 STORIES FROM A SINGLE DAY  -  10 REGIONS  -  EVERY EVENT DATED 24 NOVEMBER 2026", 10, 76, 1, [220, 200, 140]);

// region bar
const REGIONS = "EUROPE 10  -  MIDDLE EAST 5  -  EAST ASIA 6  -  GLOBAL 6  -  NORTH AMERICA 5  -  SOUTH ASIA 3  -  AFRICA 3  -  OCEANIA 3  -  SE ASIA 2  -  SOUTH AMERICA 1";
rect(0, 100, W, 18, RED);
centered(REGIONS, 105, 1, WHITE, 0, W);

// numbers strip
text("THE DAY IN NUMBERS", 10, 126, 1, RED);
const NUMS: [string, string][] = [
  ["699", "DRONES CLAIMED DOWNED"], ["6,500+", "PEOPLE TO GO HOME"],
  ["350,000", "HYBRID IMPORT CAP"], ["5,258", "ENGLAND HEAT DEATHS"],
  ["26", "DEAD IN CIKANDE FIRE"], ["204", "RUNS OFF 53 BALLS"],
];
for (let i = 0; i < NUMS.length; i++) {
  const bx = 10 + i * 168;
  text(NUMS[i][0], bx, 136, 1, INK);
  text(NUMS[i][1], bx + tw(NUMS[i][0], 1) + 8, 136, 1, GREY, 160 - tw(NUMS[i][0], 1) - 8);
}
hline(0, 148, W, INK);

// heroes
const heroX = [8, 347, 686];
for (let i = 0; i < 3; i++) drawHero(HEROES[i], heroX[i], 152, 330, 194);

// secondaries: 2 rows x 5
const secX = [10, 213, 416, 619, 822];
for (let i = 0; i < 10; i++) {
  const r = Math.floor(i / 5), c = i % 5;
  drawSecondary(SECONDARIES[i], secX[c], 352 + r * 130, 192, 122);
}

// map
const mapY = 612, mapH = 112;
text("WHERE IT HAPPENED  -  PIN NUMBER = STORY NUMBER, PIN COLOUR = REGION", 10, mapY + 2, 1, INK);
rect(10, mapY + 14, 1004, mapH - 14, SEA);
ellipse(215, 652, 85, 22, SAND);
ellipse(285, 700, 28, 20, SAND);
ellipse(505, 646, 38, 15, SAND);
ellipse(525, 686, 40, 24, SAND);
ellipse(665, 656, 150, 28, SAND);
ellipse(880, 706, 44, 12, SAND);
ellipse(512, 640, 6, 4, SAND);
for (let gx = 110; gx < 1014; gx += 100) vline(gx, mapY + 14, mapH - 14, [190, 210, 222]);
for (let gy = mapY + 40; gy < mapY + mapH; gy += 26) hline(10, gy, 1004, [190, 210, 222]);
const PINS: [number, number, number, RGB][] = [
  [1, 634, 659, RED], [2, 944, 684, TEAL], [3, 849, 661, BLUE], [4, 865, 673, BLUE],
  [5, 746, 663, [120, 60, 140]], [6, 812, 688, GREEN], [7, 794, 672, GREEN],
  [8, 488, 656, NAVY], [10, 352, 692, GREY], [11, 654, 665, [120, 60, 140]],
  [12, 609, 650, NAVY], [13, 972, 694, TEAL], [15, 788, 655, GREY],
  [16, 298, 656, [90, 110, 130]], [22, 512, 648, NAVY], [23, 465, 671, [200, 120, 0]],
  [26, 686, 664, NAVY], [29, 620, 680, RED], [40, 309, 678, [180, 40, 120]],
];
for (const [n, cx, cy, col] of PINS) {
  circle(cx, cy, 9, col);
  ring(cx, cy, 9, WHITE);
  const label = String(n);
  text(label, cx - Math.floor(tw(label, 1) / 2), cy - 3, 1, WHITE);
}
box(10, mapY + 14, 1004, mapH - 14, INK);

// timeline
text("THE DAY IN UTC", 10, 734, 1, RED);
const TL: [string, string][] = [
  ["01:32", "NEPAL QUAKE"], ["05:46", "699-DRONE CLAIM"], ["14:00", "CHESS GAME 1"],
  ["14:53", "SUPERMOON PEAK"], ["19:00", "TURKEY PARDON"],
];
hline(10, 756, 1004, INK);
for (let i = 0; i < TL.length; i++) {
  const tx = 40 + i * 200;
  circle(tx, 756, 5, RED);
  text(TL[i][0], tx + 10, 746, 1, INK);
  text(TL[i][1], tx + 10, 758, 1, GREY);
}

// date check
const DC1 = "DATE CHECK: EVERY STORY ABOVE HAPPENED OR WAS FIRST REPORTED TUE 24 NOV 2026. LEFT OUT ON PURPOSE:";
const DC2 = "ACROPOLIS MUSEUM REOPENING (23 NOV) - UNITED AIRLINES OUTAGE (16 NOV) - NVIDIA RALLY CLOSE (23 NOV) - TRUMP DEATH-PENALTY MEMO (23 NOV) -";
const DC3 = "KOREA AI-CHEAT REWARD (23 NOV) - CHAPO ISIDRO MEXICO TRIAL CLAIM (23 NOV) - SHENZHOU-24 LAUNCH (25 NOV) - COP31 COLLAPSE (22 NOV) -";
const DC4 = "GUTERRES AI CALL (23 NOV) - HUANG BACK AT NVIDIA (23 NOV) - DENMARK GHETTO LAW (23 NOV) - MANCHESTER EVACUATION (23 NOV).";
rect(10, 770, 1004, 44, [255, 248, 220]);
box(10, 770, 1004, 44, RED);
text(DC1, 16, 774, 1, RED);
text(DC2, 16, 784, 1, INK);
text(DC3, 16, 794, 1, INK);
text(DC4, 16, 804, 1, INK);

// also on
text("ALSO ON THIS DAY  -  31 MORE STORIES, ALL DATED 24 NOVEMBER 2026", 10, 822, 1, RED);
hline(10, 834, 1004, INK);
for (let i = 0; i < ALSO.length; i++) {
  const col = i < 16 ? 0 : 1;
  const row = i < 16 ? i : i - 16;
  const ax = col === 0 ? 10 : 517;
  text(ALSO[i].line, ax, 840 + row * 9, 1, INK, 497);
}

// footer
hline(0, 988, W, INK);
text("CONFIRMED: 2+ OUTLETS  -  OFFICIAL: GOVERNMENT, COURT, COMPANY OR UN STATEMENT  -  REPORTED: ONE OUTLET  -  CLAIM: ONE SIDE, UNVERIFIED.", 10, 994, 1, INK);
text("STATUS + SOURCE SHOWN ON EVERY STORY. MAPS AND DRAWINGS ARE ORIGINAL. NO PHOTOGRAPHS USED.", 10, 1006, 1, GREY);

// ---- PNG encode ----
function makeCrcTable(): number[] {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
}
const CRC_TABLE = makeCrcTable();
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  const crcBuf = Buffer.concat([Buffer.from(type, "ascii"), data]);
  out.writeUInt32BE(crc32(crcBuf), 8 + data.length);
  return out;
}
const raw = Buffer.alloc(H * (1 + W * 3));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 3)] = 0;
  img.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", ihdr),
  chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "entry.png");
fs.writeFileSync(outPath, png);
console.log("wrote " + outPath + " " + png.length + " bytes");
