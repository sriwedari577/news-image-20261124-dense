// News image for Tuesday 24 November 2026 — refresh revision 3.
// Dense broadsheet: 40 verified stories across 8 regions.
// Draws a 1024x1024 newspaper-style broadsheet with a hand-written
// 5x7 bitmap font and a from-scratch PNG encoder. Node standard
// library only, no network, deterministic output. Hero cards carry
// simple drawn scenes (vector shapes) for the top stories.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const W = 1024;
const H = 1024;

type RGB = [number, number, number];
const PAPER: RGB = [250, 246, 236];
const INK: RGB = [20, 20, 20];
const BODY: RGB = [52, 52, 52];
const GRAY: RGB = [110, 105, 92];
const RED: RGB = [179, 38, 30];
const GREEN: RGB = [30, 107, 52];
const AMBER: RGB = [176, 83, 9];
const WHITE: RGB = [255, 255, 255];
const RULE: RGB = [196, 188, 168];
const MOON: RGB = [250, 222, 130];
const NAVY: RGB = [28, 38, 66];
const SKY: RGB = [196, 216, 232];

// ---------------------------------------------------------------- font
// 5x7 bitmap glyphs, 7 rows of 5 bits each. Text is rendered uppercase.

const GLYPHS: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '01100', '00100', '01000'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  ';': ['00000', '01100', '01100', '00000', '01100', '00100', '01000'],
  "'": ['00100', '00100', '01000', '00000', '00000', '00000', '00000'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'],
  '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  '?': ['01110', '10001', '00001', '00010', '00100', '00000', '00100'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '"': ['01010', '01010', '01010', '00000', '00000', '00000', '00000'],
  '=': ['00000', '00000', '11111', '00000', '11111', '00000', '00000'],
  $: ['00100', '01111', '10100', '01110', '00101', '11110', '00100'],
  '*': ['00000', '10101', '01110', '10101', '00000', '00000', '00000'],
  _: ['00000', '00000', '00000', '00000', '00000', '00000', '11111'],
  '[': ['01110', '01000', '01000', '01000', '01000', '01000', '01110'],
  ']': ['01110', '00010', '00010', '00010', '00010', '00010', '01110'],
};

// ---------------------------------------------------------------- canvas

class Canvas {
  buf = Buffer.alloc(W * H * 3);

  constructor() {
    this.fillRect(0, 0, W, H, PAPER);
  }

  setPx(x: number, y: number, c: RGB): void {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    const i = (y * W + x) * 3;
    this.buf[i] = c[0];
    this.buf[i + 1] = c[1];
    this.buf[i + 2] = c[2];
  }

  fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) this.setPx(xx, yy, c);
    }
  }

  strokeRect(x: number, y: number, w: number, h: number, c: RGB, t: number): void {
    this.fillRect(x, y, w, t, c);
    this.fillRect(x, y + h - t, w, t, c);
    this.fillRect(x, y, t, h, c);
    this.fillRect(x + w - t, y, t, h, c);
  }

  circle(cx: number, cy: number, r: number, c: RGB): void {
    for (let dy = -r; dy <= r; dy++) {
      const dx = Math.floor(Math.sqrt(r * r - dy * dy));
      this.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1, c);
    }
  }

  ring(cx: number, cy: number, r: number, c: RGB, t: number): void {
    for (let a = 0; a < 360; a += 1) {
      const rad = (a * Math.PI) / 180;
      for (let k = 0; k < t; k++) {
        this.setPx(Math.round(cx + (r - k) * Math.cos(rad)), Math.round(cy + (r - k) * Math.sin(rad)), c);
      }
    }
  }

  // Bresenham line with square brush of side `thick`.
  line(x0: number, y0: number, x1: number, y1: number, c: RGB, thick: number): void {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    const half = Math.floor(thick / 2);
    for (;;) {
      this.fillRect(x - half, y - half, thick, thick, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x += sx; }
      if (e2 <= dx) { err += dx; y += sy; }
    }
  }

  textWidth(text: string, scale: number): number {
    const s = text.toUpperCase();
    if (s.length === 0) return 0;
    return s.length * 6 * scale - scale;
  }

  drawText(text: string, x: number, y: number, scale: number, c: RGB): void {
    const s = text.toUpperCase();
    let cx = x;
    for (const ch of s) {
      const glyph = GLYPHS[ch] ?? GLYPHS[' '];
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 5; col++) {
          if (glyph[row][col] === '1') {
            this.fillRect(cx + col * scale, y + row * scale, scale, scale, c);
          }
        }
      }
      cx += 6 * scale;
    }
  }

  drawCentered(text: string, y: number, scale: number, c: RGB): void {
    this.drawText(text, Math.round((W - this.textWidth(text, scale)) / 2), y, scale, c);
  }

  wrap(text: string, maxWidth: number, scale: number): string[] {
    const words = text.toUpperCase().split(' ');
    const lines: string[] = [];
    let cur = '';
    for (const word of words) {
      const trial = cur === '' ? word : cur + ' ' + word;
      if (this.textWidth(trial, scale) <= maxWidth || cur === '') {
        cur = trial;
      } else {
        lines.push(cur);
        cur = word;
      }
    }
    if (cur !== '') lines.push(cur);
    return lines;
  }

  drawWrapped(text: string, x: number, y: number, maxWidth: number, scale: number, c: RGB, pitch: number, maxLines: number): number {
    const lines = this.wrap(text, maxWidth, scale).slice(0, maxLines);
    lines.forEach((line, i) => this.drawText(line, x, y + i * pitch, scale, c));
    return lines.length;
  }
}

// ---------------------------------------------------------------- png

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
  return out;
}

function encodePng(cv: Canvas): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    cv.buf.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolor RGB
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- content

type Story = { region: string; status: 'CONFIRMED' | 'REPORTED'; scene: string; headline: string; body: string };

const HEROES: Story[] = [
  {
    region: 'SCIENCE',
    status: 'CONFIRMED',
    scene: 'moon',
    headline: 'BEAVER SUPERMOON',
    body: 'FULL PHASE 14:53 UTC. FIRST SUPERMOON OF FOUR.',
  },
  {
    region: 'ASIA-PACIFIC',
    status: 'CONFIRMED',
    scene: 'skyline',
    headline: 'CHEN JINING PROBED',
    body: 'POLITBURO MEMBER. FOURTH TO FALL SINCE 2025.',
  },
  {
    region: 'ASIA-PACIFIC',
    status: 'CONFIRMED',
    scene: 'chart',
    headline: 'TAIEX RECORD +8.99%',
    body: 'BIGGEST ONE-DAY POINTS GAIN EVER: +3,310.',
  },
];

const SECONDARY: Story[] = [
  { region: 'AFRICA', status: 'CONFIRMED', scene: '', headline: 'CAS RESTORES SENEGAL AS AFCON CHAMPIONS, 1-0; MOROCCO TO CHALLENGE', body: '' },
  { region: 'ASIA-PACIFIC', status: 'REPORTED', scene: '', headline: 'DEATH SENTENCE FOR SPYING: OFFICIAL MA LEAKED 35 STATE SECRETS', body: '' },
  { region: 'ASIA-PACIFIC', status: 'CONFIRMED', scene: '', headline: 'RUSSIAN JETS IN KOREA AIR ZONE; SEOUL SCRAMBLED FIGHTERS', body: '' },
  { region: 'ASIA-PACIFIC', status: 'CONFIRMED', scene: '', headline: 'KOSPI RECLAIMS 5,000, UP 6.32% AS CHIP STOCKS RALLY IN SEOUL', body: '' },
  { region: 'EUROPE', status: 'CONFIRMED', scene: '', headline: 'SANOFI TO BUY INSMED FOR $41BN, ITS BIGGEST DEAL IN 20 YEARS', body: '' },
  { region: 'EUROPE', status: 'CONFIRMED', scene: '', headline: 'UK HEAT DEATHS HIT RECORD 5,258 IN SUMMER 2026, UKHSA SAYS', body: '' },
  { region: 'MIDDLE EAST', status: 'REPORTED', scene: '', headline: 'IRGC SAYS 3 TANKERS HIT MINES IN HORMUZ; CENTCOM REJECTS CLAIM', body: '' },
  { region: 'NORTH AMERICA', status: 'CONFIRMED', scene: '', headline: 'HUAWEI GUILTY ON 10 OF 12 COUNTS IN US TRIAL; RACKETEERING ACQUITTED', body: '' },
  { region: 'NORTH AMERICA', status: 'CONFIRMED', scene: '', headline: 'DELL REVENUE DOUBLES TO $54.9BN ON AI SERVERS; FORECAST RAISED', body: '' },
  { region: 'EUROPE', status: 'CONFIRMED', scene: '', headline: 'EU PARLIAMENT BACKS ETS BOOST 403-78 IN STRASBOURG VOTES', body: '' },
  { region: 'GLOBAL', status: 'CONFIRMED', scene: '', headline: 'UN: 47,000 WOMEN KILLED BY PARTNERS OR FAMILY IN 2025, 5 AN HOUR', body: '' },
  { region: 'MIDDLE EAST', status: 'CONFIRMED', scene: '', headline: 'HOUTHI DRONE HITS RIYADH TOWER; 11 HURT, SAUDI CIVIL DEFENCE SAYS', body: '' },
  { region: 'AFRICA', status: 'CONFIRMED', scene: '', headline: 'EBOLA WORKERS EVACUATED IN CONGO AFTER 3 DAYS SHELTERING IN HOSPITAL', body: '' },
  { region: 'EUROPE', status: 'CONFIRMED', scene: '', headline: 'SARKOZY AND BRUNI ORDERED TO TRIAL OVER WITNESS-TAMPERING CLAIMS', body: '' },
];

const ALSO_ON: string[] = [
  'PENTAGON: CANADA FLEET 41.9% READY',
  'US BLACKLISTS MEGASPEED OVER CHIPS',
  'ZELENSKY URGES FOUR-PARTY TALKS',
  'ABU DHABI TALKS END; POW SWAP AGREED',
  'US LAWMAKERS PLAN NVIDIA PROBES',
  'UKRAINE, GERMANY AGREE MISSILES',
  'ZAPORIZHZHIA STRIKES KILL 2, HURT 40',
  'UKRAINE WARNS UN ON FOOD SECURITY',
  'GREECE PILOTS UKRAINE FREIGHT ROUTE',
  'NATO SPACE VOW; KREMLIN DENIES',
  'POLAND DRONE INCURSION REPORTED',
  'WONG DEFENDS AUSTRALIA-VANUATU PACT',
  'SHENZHOU-24: FIRST FOREIGN ASTRONAUT',
  'HASINA PLANS RETURN TO BANGLADESH',
  'INDIA INVOKES BENGAL FAMINE AT UN',
  'TURKEYS FREEDOM, FEATHERS PARDONED',
  'GIULIANI GETS MEDAL OF FREEDOM',
  'ANMER HALL BREAK-IN REPORTED, 2 HELD',
  'HANOI GAS BLAST KILLS 6 AT EATERY',
  'GAZA STRIKES KILL HAMAS SECURITY CHIEF',
  'CIA, ODNI BREACH: UNCLASSIFIED DATA',
  'UNAIDS: HIV DEATHS AT 20-YEAR LOW',
  'CHESS GAME 1: GUKESH, SINDAROV DRAW',
];

const TIMELINE: Array<[string, string]> = [
  ['00:30', 'CALL'],
  ['01:00', 'HANOI'],
  ['09:53', 'HEAT'],
  ['14:00', 'CHESS'],
  ['14:53', 'MOON'],
];

// ---------------------------------------------------------------- scenes

function drawScene(cv: Canvas, x: number, y: number, w: number, h: number, kind: string): void {
  if (kind === 'moon') {
    cv.fillRect(x, y, w, h, NAVY);
    cv.fillRect(x + 14, y + 8, 3, 3, WHITE);
    cv.fillRect(x + 52, y + 5, 2, 2, WHITE);
    cv.fillRect(x + 96, y + 10, 3, 3, WHITE);
    cv.fillRect(x + 150, y + 6, 2, 2, WHITE);
    cv.fillRect(x + 210, y + 9, 3, 3, WHITE);
    cv.fillRect(x + 262, y + 6, 2, 2, WHITE);
    cv.circle(x + 218, y + 21, 14, MOON);
    cv.ring(x + 218, y + 21, 14, WHITE, 1);
    cv.fillRect(x, y + h - 12, w, 12, INK);
    cv.fillRect(x + 10, y + h - 26, 34, 26, GRAY);
    cv.fillRect(x + 52, y + h - 34, 26, 34, [70, 70, 70]);
    cv.fillRect(x + 86, y + h - 22, 30, 22, GRAY);
    cv.fillRect(x + 124, y + h - 30, 24, 30, [70, 70, 70]);
  } else if (kind === 'skyline') {
    cv.fillRect(x, y, w, h, SKY);
    cv.fillRect(x + 12, y + 10, 40, h - 10, INK);
    cv.fillRect(x + 60, y + 4, 30, h - 4, RED);
    cv.fillRect(x + 98, y + 14, 44, h - 14, GRAY);
    cv.fillRect(x + 150, y + 8, 34, h - 8, INK);
    cv.fillRect(x + 192, y + 16, 40, h - 16, GRAY);
    cv.fillRect(x + 240, y + 6, 32, h - 6, RED);
    cv.fillRect(x + 278, y + 18, 30, h - 18, INK);
    for (let i = 0; i < 5; i++) {
      cv.fillRect(x + 18, y + 16 + i * 6, 6, 3, MOON);
      cv.fillRect(x + 106, y + 20 + i * 5, 6, 3, WHITE);
      cv.fillRect(x + 198, y + 22 + i * 5, 6, 3, MOON);
    }
    cv.fillRect(x + 66, y + 10, 18, 3, WHITE);
  } else if (kind === 'chart') {
    cv.fillRect(x, y, w, h, WHITE);
    cv.strokeRect(x, y, w, h, INK, 1);
    cv.fillRect(x + 14, y + 8, 30, 26, GREEN);
    cv.fillRect(x + 54, y + 14, 30, 20, GREEN);
    cv.fillRect(x + 94, y + 6, 30, 28, GREEN);
    cv.fillRect(x + 134, y + 12, 30, 22, GREEN);
    cv.fillRect(x + 174, y + 4, 30, 30, GREEN);
    cv.fillRect(x + 214, y + 10, 30, 24, GREEN);
    cv.fillRect(x + 254, y + 2, 30, 32, GREEN);
    cv.line(x + 8, y + h - 8, x + 24, y + h - 20, RED, 3);
    cv.line(x + 24, y + h - 20, x + 70, y + h - 24, RED, 3);
    cv.line(x + 70, y + h - 24, x + 130, y + h - 14, RED, 3);
    cv.line(x + 130, y + h - 14, x + 200, y + h - 18, RED, 3);
    cv.line(x + 200, y + h - 18, x + 292, y + h - 34, RED, 3);
    cv.fillRect(x + 284, y + h - 38, 10, 4, RED);
    cv.fillRect(x + 288, y + h - 42, 4, 10, RED);
  }
}

// ---------------------------------------------------------------- layout

function statusColor(status: string): RGB {
  return status === 'CONFIRMED' ? GREEN : AMBER;
}

function draw(cv: Canvas): void {
  // Masthead.
  cv.fillRect(0, 0, W, 100, INK);
  cv.drawCentered('24 NOVEMBER 2026', 12, 6, WHITE);
  cv.fillRect(180, 60, W - 360, 2, RED);
  cv.drawCentered('TUESDAY - ONE DAY IN THE NEWS - 40 STORIES - 8 REGIONS', 70, 2, [232, 226, 212]);

  // Date check box.
  cv.strokeRect(16, 104, W - 32, 44, RED, 3);
  cv.drawCentered('DATE CHECK - EVERY STORY HAPPENED OR WAS FIRST REPORTED', 110, 2, RED);
  cv.drawCentered('ON 24 NOVEMBER 2026. BORDERLINE ITEMS ARE WORDED AS REPORTED.', 128, 2, INK);

  // UTC timeline strip.
  cv.drawText('24 NOV, UTC', 16, 154, 2, GRAY);
  const tx0 = 190;
  const tx1 = 960;
  const ty = 172;
  cv.fillRect(tx0, ty, tx1 - tx0, 2, INK);
  TIMELINE.forEach(([time, label], i) => {
    const x = tx0 + Math.round((i * (tx1 - tx0)) / (TIMELINE.length - 1));
    cv.fillRect(x - 1, ty - 6, 3, 14, RED);
    cv.drawText(time, x - Math.round(cv.textWidth(time, 2) / 2), 154, 2, INK);
    cv.drawText(label, x - Math.round(cv.textWidth(label, 2) / 2), 180, 2, GRAY);
  });

  // Hero cards: 3 across, each with a drawn scene.
  const heroY = 198;
  const heroH = 150;
  const heroXs = [16, 350, 685];
  const heroWs = [322, 323, 323];
  HEROES.forEach((story, i) => {
    const x = heroXs[i];
    const w = heroWs[i];
    cv.fillRect(x, heroY, w, heroH, WHITE);
    cv.strokeRect(x, heroY, w, heroH, INK, 2);
    drawScene(cv, x + 6, heroY + 6, w - 12, 40, story.scene);
    cv.drawText(`${story.region} - ${story.status}`, x + 12, heroY + 54, 2, statusColor(story.status));
    cv.drawWrapped(story.headline, x + 12, heroY + 70, w - 24, 3, INK, 23, 2);
    cv.drawWrapped(story.body, x + 12, heroY + 116, w - 24, 2, BODY, 15, 2);
  });

  // Secondary cards: 2 columns x 7 rows.
  const secY = 356;
  const secH = 50;
  const secXs = [16, 518];
  SECONDARY.forEach((story, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = secXs[col];
    const y = secY + row * (secH + 2);
    const w = 490;
    cv.fillRect(x, y, w, secH, WHITE);
    cv.strokeRect(x, y, w, secH, RULE, 1);
    cv.fillRect(x, y, 6, secH, statusColor(story.status));
    cv.drawText(`${story.region} - ${story.status}`, x + 14, y + 4, 2, statusColor(story.status));
    cv.drawWrapped(story.headline, x + 14, y + 20, w - 26, 2, INK, 15, 2);
  });

  // Also-on list.
  const listY = 722;
  cv.drawText('ALSO ON 24 NOVEMBER...', 16, listY, 3, INK);
  cv.fillRect(16, listY + 26, W - 32, 2, INK);
  ALSO_ON.forEach((item, i) => {
    const col = i < 12 ? 0 : 1;
    const row = i % 12;
    const numX = col === 0 ? 16 : 508;
    const textX = col === 0 ? 60 : 552;
    const y = listY + 32 + row * 16;
    cv.drawText(`${i + 18}.`, numX, y, 2, RED);
    cv.drawText(item, textX, y, 2, INK);
  });

  // Region bar (two lines) + footer.
  cv.drawCentered('EUROPE 13 - ASIA-PAC 8 - N AMERICA 8 - MIDEAST 4', 953, 2, INK);
  cv.drawCentered('GLOBAL 3 - AFRICA 2 - OCEANIA 1 - SCIENCE 1', 969, 2, INK);
  cv.fillRect(0, 986, W, 38, INK);
  cv.drawCentered('SOURCES: AP - REUTERS - GOV.UK/UKHSA - UN - UNAIDS - CAS - FIDE - EUROPEAN PARLIAMENT - SANOFI - DELL - XINHUA - FOCUS TAIWAN', 992, 1, [232, 226, 212]);
  cv.drawCentered('40 STORIES - 26 CONFIRMED - 14 REPORTED - 0 CLAIM', 1004, 1, [232, 226, 212]);
}

// ---------------------------------------------------------------- main

function main(): void {
  const cv = new Canvas();
  draw(cv);
  const png = encodePng(cv);
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'entry.png'), png);
  const sha = createHash('sha256').update(png).digest('hex');
  console.log(`entry.png ${png.length} bytes sha256=${sha}`);
}

main();
