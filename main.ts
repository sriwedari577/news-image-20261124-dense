// News image for Tuesday 24 November 2026 — refresh revision.
// Dense broadsheet: 22 verified stories across 7 regions.
// Draws a 1024x1024 newspaper-style broadsheet with a hand-written
// 5x7 bitmap font and a from-scratch PNG encoder. Node standard
// library only, no network, deterministic output.

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

type Story = { region: string; status: 'CONFIRMED' | 'REPORTED'; headline: string; body: string };

const HEROES: Story[] = [
  {
    region: 'SCIENCE',
    status: 'CONFIRMED',
    headline: 'BEAVER SUPERMOON',
    body: 'FULL PHASE 14:53 UTC. FIRST OF FOUR SUPERMOONS, CLOSEST FULL MOON OF THE YEAR.',
  },
  {
    region: 'ASIA-PACIFIC',
    status: 'REPORTED',
    headline: 'DEATH SENTENCE FOR SPYING',
    body: 'CHINESE OFFICIAL MA SENTENCED TO DEATH FOR LEAKING 35 STATE SECRETS TO A FOREIGN COUNTRY.',
  },
  {
    region: 'ASIA-PACIFIC',
    status: 'CONFIRMED',
    headline: 'RUSSIAN JETS IN KOREA AIR ZONE',
    body: 'SEOUL SCRAMBLED FIGHTERS AS RUSSIAN PLANES ENTERED ITS AIR DEFENCE ZONE, THEN WITHDREW.',
  },
];

const SECONDARY: Story[] = [
  { region: 'NORTH AMERICA', status: 'CONFIRMED', headline: 'PENTAGON REBUKES CANADA: ONLY 41.9% OF ITS AIR FLEET SERVICEABLE', body: '' },
  { region: 'NORTH AMERICA', status: 'CONFIRMED', headline: 'US BLACKLISTS MEGASPEED IN NVIDIA CHIP-SMUGGLING SCANDAL', body: '' },
  { region: 'EUROPE', status: 'REPORTED', headline: "ZELENSKY URGES FOUR-PARTY TALKS 'AS SOON AS POSSIBLE'", body: '' },
  { region: 'MIDDLE EAST', status: 'REPORTED', headline: 'ABU DHABI TALKS END WITHOUT BREAKTHROUGH; POW SWAP AGREED', body: '' },
  { region: 'ASIA-PACIFIC', status: 'REPORTED', headline: 'ASIAN CHIP STOCKS RALLY AS NVIDIA FEARS EASE', body: '' },
  { region: 'NORTH AMERICA', status: 'REPORTED', headline: 'US LAWMAKERS PREPARE EXPANDED NVIDIA INVESTIGATIONS', body: '' },
  { region: 'EUROPE', status: 'CONFIRMED', headline: 'UKRAINE, GERMANY AGREE EXTRA INTERCEPTOR MISSILES', body: '' },
  { region: 'EUROPE', status: 'CONFIRMED', headline: 'RUSSIAN STRIKES ON ZAPORIZHZHIA KILL 2, INJURE DOZENS', body: '' },
  { region: 'EUROPE', status: 'CONFIRMED', headline: 'UKRAINE WARNS UN: PORT ATTACKS THREATEN FOOD SECURITY', body: '' },
  { region: 'EUROPE', status: 'REPORTED', headline: 'GREECE PILOTS UKRAINE FREIGHT ROUTE VIA ALEXANDROUPOLIS', body: '' },
];

const ALSO_ON: string[] = [
  "CAS RULES TODAY ON SENEGAL'S AFCON APPEAL (REPORTS: MOROCCO KEEPS IT)",
  'WORLD CHESS GAME 1 OPENS: GUKESH VS SINDAROV, GENEVA',
  'EUROPEAN PARLIAMENT VOTES TODAY ON ETS, OMNIBUS IV',
  'NATO VOWS SPACE DEFENCE; KREMLIN DENIES SATELLITE REPORT',
  'RUSSIAN DRONE ENTERED POLISH AIRSPACE LATE MONDAY (REPORTED TUESDAY)',
  'WONG DEFENDS AUSTRALIA-VANUATU PACT AMID CLIMATE ROW',
  'CHINA UNVEILS SHENZHOU-24 CREW; PAKISTANI ASTRONAUT FIRST',
  'OUSTED PM HASINA PLANS RETURN TO BANGLADESH ON 16 DEC',
  'INDIA INVOKES 1943 BENGAL FAMINE AT UN SECURITY COUNCIL',
];

const TIMELINE: Array<[string, string]> = [
  ['00:30', 'CALL'],
  ['01:04', 'KADIZ'],
  ['05:35', 'STRIKES'],
  ['06:37', 'MISSILES'],
  ['14:53', 'MOON'],
  ['15:00', 'CHESS'],
];

// ---------------------------------------------------------------- layout

function statusColor(status: string): RGB {
  return status === 'CONFIRMED' ? GREEN : AMBER;
}

function draw(cv: Canvas): void {
  // Masthead.
  cv.fillRect(0, 0, W, 106, INK);
  cv.drawCentered('24 NOVEMBER 2026', 14, 6, WHITE);
  cv.fillRect(180, 66, W - 360, 2, RED);
  cv.drawCentered('TUESDAY - ONE DAY IN THE NEWS - 22 STORIES - 7 REGIONS', 76, 2, [232, 226, 212]);

  // Date check box.
  cv.strokeRect(16, 116, W - 32, 38, RED, 3);
  cv.drawCentered('DATE CHECK - EVERY STORY HAPPENED OR WAS FIRST REPORTED', 123, 2, RED);
  cv.drawCentered('ON 24 NOVEMBER 2026. BORDERLINE ITEMS ARE WORDED AS REPORTED.', 139, 2, INK);

  // UTC timeline strip.
  cv.drawText('24 NOV, UTC', 16, 168, 2, GRAY);
  const tx0 = 190;
  const tx1 = 960;
  const ty = 186;
  cv.fillRect(tx0, ty, tx1 - tx0, 2, INK);
  TIMELINE.forEach(([time, label], i) => {
    const x = tx0 + Math.round((i * (tx1 - tx0)) / (TIMELINE.length - 1));
    cv.fillRect(x - 1, ty - 6, 3, 14, RED);
    cv.drawText(time, x - Math.round(cv.textWidth(time, 2) / 2), 164, 2, INK);
    cv.drawText(label, x - Math.round(cv.textWidth(label, 2) / 2), 194, 2, GRAY);
  });

  // Hero cards: 3 across.
  const heroY = 222;
  const heroH = 186;
  const heroXs = [16, 350, 685];
  const heroWs = [322, 323, 323];
  HEROES.forEach((story, i) => {
    const x = heroXs[i];
    const w = heroWs[i];
    cv.fillRect(x, heroY, w, heroH, WHITE);
    cv.strokeRect(x, heroY, w, heroH, INK, 2);
    cv.fillRect(x, heroY, w, 6, INK);
    cv.drawText(`${story.region} - ${story.status}`, x + 12, heroY + 16, 2, statusColor(story.status));
    if (i === 0) {
      cv.circle(x + w - 30, heroY + 24, 15, MOON);
      cv.ring(x + w - 30, heroY + 24, 15, GRAY, 2);
    }
    cv.drawWrapped(story.headline, x + 12, heroY + 42, w - 24, 3, INK, 24, 3);
    cv.drawWrapped(story.body, x + 12, heroY + 118, i === 0 ? w - 24 : w - 24, 2, BODY, 16, 4);
  });

  // Secondary cards: 2 columns x 5 rows.
  const secY = 418;
  const secH = 60;
  const secXs = [16, 518];
  SECONDARY.forEach((story, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = secXs[col];
    const y = secY + row * (secH + 6);
    const w = 490;
    cv.fillRect(x, y, w, secH, WHITE);
    cv.strokeRect(x, y, w, secH, RULE, 1);
    cv.fillRect(x, y, 6, secH, statusColor(story.status));
    cv.drawText(`${story.region} - ${story.status}`, x + 14, y + 7, 2, statusColor(story.status));
    cv.drawWrapped(story.headline, x + 14, y + 25, w - 26, 2, INK, 16, 2);
  });

  // Also-on list.
  const listY = 748;
  cv.drawText('ALSO ON 24 NOVEMBER...', 16, listY, 3, INK);
  cv.fillRect(16, listY + 28, W - 32, 2, INK);
  ALSO_ON.forEach((item, i) => {
    const y = listY + 36 + i * 19;
    cv.drawText(`${i + 14}.`, 16, y, 2, RED);
    cv.drawText(item, 64, y, 2, INK);
    if (i < ALSO_ON.length - 1) cv.fillRect(16, y + 17, W - 32, 1, RULE);
  });

  // Region bar + numbers strip.
  const barY = 954;
  cv.drawCentered('EUROPE 9 - ASIA-PAC 6 - N AMERICA 3 - MIDEAST 1 - AFRICA 1 - OCEANIA 1 - SCIENCE 1', barY, 2, INK);
  cv.drawCentered('22 STORIES - 10 CONFIRMED - 12 REPORTED - 0 CLAIM', barY + 16, 2, GRAY);

  // Footer sources band.
  cv.fillRect(0, 990, W, 34, INK);
  cv.drawCentered('SOURCES: AP - REUTERS - PTI - FIDE - CAS - EUROPEAN PARLIAMENT - PENTAGON - US BIS', 996, 1, [232, 226, 212]);
  cv.drawCentered('WIRE DIGESTS - FINANCEFEEDS - IBJ - PINA - DISCOVER - EARTHSKY - EUROPESAYS - SOFX', 1008, 1, [232, 226, 212]);
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
