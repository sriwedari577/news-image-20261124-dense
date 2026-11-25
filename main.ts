// One day in the news: Tuesday 24 November 2026. Original program.
// Draws a 1024x1024 PNG broadsheet with a hand-rolled PNG encoder and a
// vector stroke font designed for this page (glyph = polyline, mixed case,
// proportional widths, display weight). Node stdlib only.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

// ---- vector stroke font ----
// Grid: x 0..w, y 0..14 (cap top 0, baseline 14), descenders to y 18.
const GLYPHS = {
  'A': { w: 9, s: [[[0,14],[4.5,0],[9,14]], [[2.3,9],[6.7,9]]] },
  'B': { w: 8, s: [[[0,0],[0,14]], [[0,0],[4.5,0],[7,2],[7,5],[4.5,7],[0,7]], [[0,7],[4.5,7],[7,9],[7,12],[4.5,14],[0,14]]] },
  'C': { w: 8, s: [[[7,2],[4,0],[1,2],[0,7],[1,12],[4,14],[7,12]]] },
  'D': { w: 8.5, s: [[[0,0],[0,14]], [[0,0],[4.5,0],[7.5,3],[7.5,11],[4.5,14],[0,14]]] },
  'E': { w: 7, s: [[[7,0],[0,0],[0,14],[7,14]], [[0,7],[5,7]]] },
  'F': { w: 7, s: [[[7,0],[0,0],[0,14]], [[0,7],[5,7]]] },
  'G': { w: 8.5, s: [[[7.5,2],[4.5,0],[1,2],[0,7],[1,12],[4.5,14],[7.5,12],[7.5,8],[4.5,8]]] },
  'H': { w: 8.5, s: [[[0,0],[0,14]], [[8,0],[8,14]], [[0,7],[8,7]]] },
  'I': { w: 4, s: [[[2,0],[2,14]], [[0,0],[4,0]], [[0,14],[4,14]]] },
  'J': { w: 7, s: [[[6,0],[6,12],[4,14],[1,14],[0,12]]] },
  'K': { w: 8.5, s: [[[0,0],[0,14]], [[7.5,0],[0,7],[7.5,14]]] },
  'L': { w: 7, s: [[[0,0],[0,14],[7,14]]] },
  'M': { w: 11, s: [[[0,14],[0,0],[5.5,7],[11,0],[11,14]]] },
  'N': { w: 8.5, s: [[[0,14],[0,0],[8.5,14],[8.5,0]]] },
  'O': { w: 9, s: [[[4.5,0],[7,1.5],[8.5,5],[8.5,9],[7,12.5],[4.5,14],[2,12.5],[0.5,9],[0.5,5],[2,1.5],[4.5,0]]] },
  'P': { w: 8, s: [[[0,14],[0,0],[4.5,0],[7,2],[7,5],[4.5,7],[0,7]]] },
  'Q': { w: 9, s: [[[4.5,0],[7,1.5],[8.5,5],[8.5,9],[7,12.5],[4.5,14],[2,12.5],[0.5,9],[0.5,5],[2,1.5],[4.5,0]], [[5.5,10.5],[9,14]]] },
  'R': { w: 8, s: [[[0,14],[0,0],[4.5,0],[7,2],[7,5],[4.5,7],[0,7]], [[4,7],[8,14]]] },
  'S': { w: 8, s: [[[7,2.5],[5,0.5],[2,0.5],[0.5,3],[2,6],[6,8],[7.5,11],[6,13.5],[3,13.5],[1,11.5]]] },
  'T': { w: 8, s: [[[0,0],[8,0]], [[4,0],[4,14]]] },
  'U': { w: 8.5, s: [[[0,0],[0,11],[2,14],[6,14],[8,11],[8,0]]] },
  'V': { w: 9, s: [[[0,0],[4.5,14],[9,0]]] },
  'W': { w: 12, s: [[[0,0],[3,14],[6,6],[9,14],[12,0]]] },
  'X': { w: 8.5, s: [[[0,0],[8.5,14]], [[8.5,0],[0,14]]] },
  'Y': { w: 8.5, s: [[[0,0],[4.25,7],[8.5,0]], [[4.25,7],[4.25,14]]] },
  'Z': { w: 8, s: [[[0,0],[8,0],[0,14],[8,14]]] },
  'a': { w: 8.5, s: [[[6.5,5.5],[4,4],[1.5,5],[0.5,8.5],[1.5,12],[4,14],[6.5,12],[8,8.5],[6.5,5.5]], [[8,4],[8,14]]] },
  'b': { w: 8.5, s: [[[0,0],[0,14]], [[8,6],[6,4],[3,4],[1,6],[1,11],[3,14],[6,14],[8,11],[8,6]]] },
  'c': { w: 7, s: [[[6,5.5],[4,4],[1.5,5.5],[0.5,9],[1.5,12.5],[4,14],[6,12.5]]] },
  'd': { w: 8.5, s: [[[8,0],[8,14]], [[0.5,6],[2.5,4],[5.5,4],[7.5,6],[7.5,11],[5.5,14],[2.5,14],[0.5,11],[0.5,6]]] },
  'e': { w: 8.5, s: [[[8,9],[0.5,9]], [[8,9],[7.5,5.5],[5,4],[2.5,4],[0.5,7],[0.5,10],[2,13],[4.5,14],[7.5,12.5]]] },
  'f': { w: 5.5, s: [[[4.5,2.5],[3,0],[1.5,1],[1.5,14]], [[0,5],[4.5,5]]] },
  'g': { w: 8.5, s: [[[7,6],[5,4],[2,4],[0.5,6.5],[0.5,11],[2,13.5],[5,13.5],[7,11],[7,6]], [[7,11],[7,16],[5,18],[2,18],[0.5,16.5]]] },
  'h': { w: 8.5, s: [[[0,0],[0,14]], [[0,7],[2,4.5],[4.5,4],[6.5,5.5],[7.5,8],[7.5,14]]] },
  'i': { w: 3.5, s: [[[1.75,4],[1.75,14]], [[1.75,0.5],[1.75,1.5]]] },
  'j': { w: 5, s: [[[4,4],[4,15],[2.5,17.5],[0.5,17]], [[4,0.5],[4,1.5]]] },
  'k': { w: 8, s: [[[0,0],[0,14]], [[7,4],[1.5,8.5],[7,14]]] },
  'l': { w: 3.5, s: [[[1.75,0],[1.75,14]]] },
  'm': { w: 12, s: [[[0,14],[0,4]], [[0,7],[2,4.5],[4,4.5],[6,6.5],[6,14]], [[6,6.5],[8,4.5],[10,4.5],[12,6.5],[12,14]]] },
  'n': { w: 8.5, s: [[[0,14],[0,4]], [[0,7],[2,4.5],[4.5,4],[6.5,5.5],[7.5,8],[7.5,14]]] },
  'o': { w: 8.5, s: [[[4.25,4],[6.5,5],[7.5,8],[6.5,12],[4.25,14],[1.5,12],[0.5,8],[1.5,5],[4.25,4]]] },
  'p': { w: 8.5, s: [[[0,4],[0,18]], [[8,6],[6,4],[3,4],[1,6],[1,11],[3,14],[6,14],[8,11],[8,6]]] },
  'q': { w: 8.5, s: [[[0.5,6],[2.5,4],[5.5,4],[7.5,6],[7.5,11],[5.5,14],[2.5,14],[0.5,11],[0.5,6]], [[7.5,4],[7.5,18]]] },
  'r': { w: 6, s: [[[0,14],[0,4]], [[0,7],[2,4.5],[4.5,4],[6,5.5]]] },
  's': { w: 7.5, s: [[[6.5,5.5],[4.5,4],[2,4],[0.5,6],[2,8.5],[5,10],[6.5,12],[5,13.5],[2.5,13.5],[0.5,12]]] },
  't': { w: 5.5, s: [[[2.5,1],[2.5,13],[3.5,14.5],[5,14.5]], [[0,5],[4.5,5]]] },
  'u': { w: 8.5, s: [[[0,4],[0,11],[2,14],[5,14],[7,11],[7,4]], [[7,4],[7,14]]] },
  'v': { w: 7.5, s: [[[0,4],[3.75,14],[7.5,4]]] },
  'w': { w: 11, s: [[[0,4],[2.75,14],[5.5,8],[8.25,14],[11,4]]] },
  'x': { w: 7.5, s: [[[0,4],[7.5,14]], [[7.5,4],[0,14]]] },
  'y': { w: 7.5, s: [[[0,4],[3.75,12],[7.5,4]], [[3.75,12],[3.75,16],[2,18],[0,18]]] },
  'z': { w: 7.5, s: [[[0,4],[7.5,4],[0,14],[7.5,14]]] },
  '0': { w: 9, s: [[[4.5,0],[7,1.5],[8.5,5],[8.5,9],[7,12.5],[4.5,14],[2,12.5],[0.5,9],[0.5,5],[2,1.5],[4.5,0]]] },
  '1': { w: 5.5, s: [[[1.5,2.5],[3,0],[3,14]], [[1,14],[5,14]]] },
  '2': { w: 8, s: [[[1,3],[3,0],[6,0],[7.5,2.5],[7.5,5],[0,14],[8,14]]] },
  '3': { w: 8, s: [[[1.5,2],[3.5,0],[6,0.5],[7.5,3],[6,6],[3,7],[6,8],[7.5,11],[6,14],[3.5,14],[1.5,12]]] },
  '4': { w: 8.5, s: [[[6.5,0],[0.5,10],[8,10]], [[6,0],[6,14]]] },
  '5': { w: 8, s: [[[7.5,0],[0.5,0],[0.5,6],[5,6],[7,8],[7,11.5],[5,14],[1.5,14],[0,12]]] },
  '6': { w: 8.5, s: [[[7,2],[4,0],[1.5,2],[0.5,7],[1,12],[3.5,14],[6,13],[7.5,10],[6.5,6.5],[4,5.5],[1.5,6.5]]] },
  '7': { w: 8, s: [[[0,0],[8,0],[3.5,14]]] },
  '8': { w: 8.5, s: [[[2.5,1.5],[4.5,0],[6.5,1.5],[7.5,4],[6,7],[2,7],[0.5,4],[2.5,1.5]], [[2,7],[6,7],[7.5,10],[6.5,13],[4.5,14],[2,13],[0.5,10],[2,7]]] },
  '9': { w: 8.5, s: [[[1,12],[3.5,14],[6,12],[7.5,7],[7,2],[4.5,0],[2,1],[0.5,4],[1.5,7.5],[4,8.5],[6.5,7.5]]] },
  '.': { w: 3.5, s: [[[1.75,12],[1.75,14]]] },
  ',': { w: 3.5, s: [[[1.75,11.5],[1.75,13.5],[1.25,15.5],[0.5,16.5]]] },
  ':': { w: 3.5, s: [[[1.75,4],[1.75,5.5]], [[1.75,11],[1.75,12.5]]] },
  ';': { w: 3.5, s: [[[1.75,4],[1.75,5.5]], [[1.75,11],[1.75,13.5],[1,16],[0,17.5]]] },
  '!': { w: 3.5, s: [[[1.75,0],[1.75,9.5]], [[1.75,11.5],[1.75,13.5]]] },
  '?': { w: 8, s: [[[1,3],[3,0.5],[6,0.5],[7.5,3],[6,6],[4,7.5],[4,9.5]], [[4,12],[4,13.5]]] },
  "'": { w: 3, s: [[[2,0],[1,4]]] },
  '"': { w: 6, s: [[[2,0],[1,4]], [[5,0],[4,4]]] },
  '-': { w: 7, s: [[[0.5,8],[6.5,8]]] },
  '–': { w: 9, s: [[[0.5,8],[8.5,8]]] },
  '—': { w: 13, s: [[[0.5,8],[12.5,8]]] },
  '(': { w: 5, s: [[[4,0],[2,3],[2,11],[4,14]]] },
  ')': { w: 5, s: [[[1,0],[3,3],[3,11],[1,14]]] },
  '/': { w: 7, s: [[[1,14],[6,0]]] },
  '%': { w: 11, s: [[[1,14],[10,0]], [[2.5,1],[4,1],[4.5,3],[4,5],[2.5,5],[1,3],[2.5,1]], [[8.5,9],[10,9],[10.5,11],[10,13],[8.5,13],[7,11],[8.5,9]]] },
  '+': { w: 9, s: [[[4.5,3],[4.5,12]], [[0.5,7.5],[8.5,7.5]]] },
  '=': { w: 8, s: [[[0.5,5],[7.5,5]], [[0.5,10],[7.5,10]]] },
  '$': { w: 8, s: [[[7,2.5],[5,0.5],[2,0.5],[0.5,3],[2,6],[6,8],[7.5,11],[6,13.5],[3,13.5],[1,11.5]], [[4,0],[4,14]]] },
  '#': { w: 9, s: [[[3,0],[2.5,14]], [[6.5,0],[6,14]], [[0,4.5],[9,4.5]], [[0,10],[9,10]]] },
  '•': { w: 5, s: [[[2.5,6],[2.5,8]]] },
  '·': { w: 3.5, s: [[[1.75,7],[1.75,8.5]]] },
  '*': { w: 8, s: [[[4,1],[4,13]], [[0.5,4],[7.5,10]], [[7.5,4],[0.5,10]]] },
  '&': { w: 9, s: [[[6.5,0.5],[3.5,0.5],[1,3],[1.5,6],[4,8],[7,10],[7.5,12.5],[5.5,14],[2.5,14],[1,12],[2.5,9.5],[7,4.5]]] },
  '<': { w: 7, s: [[[6,0],[1,7],[6,14]]] },
  '>': { w: 7, s: [[[1,0],[6,7],[1,14]]] },
  ' ': { w: 4.5, s: [] },
};

function glyphWidth(ch, size, tracking) {
  const g = GLYPHS[ch];
  return (g ? g.w : 8) * (size / 14) + (tracking || 0);
}
function textWidth(text, size, tracking) {
  let w = 0;
  for (const ch of text) w += glyphWidth(ch, size, tracking);
  return w - (tracking || 0);
}
function wrapText(text, size, maxWidth, tracking) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const word of words) {
    const trial = cur ? cur + ' ' + word : word;
    if (textWidth(trial, size, tracking) <= maxWidth || !cur) cur = trial;
    else { lines.push(cur); cur = word; }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ---- canvas: RGB buffer at 2x supersampling, box-downsampled to 1024 ----
const SS = 2;
const W = 1024, H = 1024;
const buf = Buffer.alloc(W * SS * H * SS * 3, 255);

function stamp(cx, cy, r, rgb) {
  const r0 = Math.ceil(r + 1);
  const x0 = Math.floor(cx - r0), x1 = Math.ceil(cx + r0);
  const y0 = Math.floor(cy - r0), y1 = Math.ceil(cy + r0);
  const WW = W * SS;
  for (let y = y0; y <= y1; y++) {
    if (y < 0 || y >= H * SS) continue;
    for (let x = x0; x <= x1; x++) {
      if (x < 0 || x >= WW) continue;
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const a = Math.max(0, Math.min(1, r + 0.35 - d));
      if (a <= 0) continue;
      const o = (y * WW + x) * 3;
      buf[o] = Math.round(rgb[0] * a + buf[o] * (1 - a));
      buf[o + 1] = Math.round(rgb[1] * a + buf[o + 1] * (1 - a));
      buf[o + 2] = Math.round(rgb[2] * a + buf[o + 2] * (1 - a));
    }
  }
}
function line(x0, y0, x1, y1, width, rgb) {
  const sx0 = x0 * SS, sy0 = y0 * SS, sx1 = x1 * SS, sy1 = y1 * SS;
  const len = Math.hypot(sx1 - sx0, sy1 - sy0);
  const steps = Math.max(1, Math.ceil(len / (SS * 0.38)));
  const r = (width * SS) / 2;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    stamp(sx0 + (sx1 - sx0) * t, sy0 + (sy1 - sy0) * t, r, rgb);
  }
}
function polyline(pts, width, rgb, close) {
  for (let i = 0; i < pts.length - 1; i++) line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], width, rgb);
  if (close && pts.length > 2) line(pts[pts.length - 1][0], pts[pts.length - 1][1], pts[0][0], pts[0][1], width, rgb);
}
function rect(x, y, w, h, rgb) {
  const x0 = Math.round(x * SS), y0 = Math.round(y * SS);
  const x1 = Math.round((x + w) * SS), y1 = Math.round((y + h) * SS);
  const WW = W * SS;
  for (let yy = y0; yy < y1; yy++) {
    if (yy < 0 || yy >= H * SS) continue;
    for (let xx = x0; xx < x1; xx++) {
      if (xx < 0 || xx >= WW) continue;
      const o = (yy * WW + xx) * 3;
      buf[o] = rgb[0]; buf[o + 1] = rgb[1]; buf[o + 2] = rgb[2];
    }
  }
}
function vgrad(x, y, w, h, top, bottom) {
  const y0 = Math.round(y * SS), y1 = Math.round((y + h) * SS);
  const x0 = Math.round(x * SS), x1 = Math.round((x + w) * SS);
  const WW = W * SS;
  for (let yy = y0; yy < y1; yy++) {
    const t = h <= 0 ? 0 : (yy / SS - y) / h;
    const r = Math.round(top[0] + (bottom[0] - top[0]) * t);
    const g = Math.round(top[1] + (bottom[1] - top[1]) * t);
    const b = Math.round(top[2] + (bottom[2] - top[2]) * t);
    for (let xx = x0; xx < x1; xx++) {
      if (xx < 0 || yy < 0 || xx >= WW || yy >= H * SS) continue;
      const o = (yy * WW + xx) * 3;
      buf[o] = r; buf[o + 1] = g; buf[o + 2] = b;
    }
  }
}
function poly(pts, rgb) {
  const ys = pts.map(p => p[1]);
  const yMin = Math.max(0, Math.floor(Math.min(...ys)));
  const yMax = Math.min(H - 1, Math.ceil(Math.max(...ys)));
  for (let y = yMin; y <= yMax; y++) {
    const yc = y + 0.5;
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) {
        xs.push(a[0] + (yc - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
      }
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) rect(xs[k], y, xs[k + 1] - xs[k], 1, rgb);
  }
}
function disc(cx, cy, r, rgb) { stamp(cx * SS, cy * SS, r * SS, rgb); }
function ring(cx, cy, r, width, rgb) {
  const steps = Math.max(24, Math.ceil(r * 6));
  let prev = null;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const p = [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    if (prev) line(prev[0], prev[1], p[0], p[1], width, rgb);
    prev = p;
  }
}
function drawGlyph(ch, x, yTop, size, weight, rgb) {
  const g = GLYPHS[ch];
  if (!g) return;
  const unit = size / 14;
  if (ch === '•') { stamp((x + 2.5 * unit) * SS, (yTop + 7 * unit) * SS, size * 0.11 * SS, rgb); return; }
  if (ch === '·') { stamp((x + 1.75 * unit) * SS, (yTop + 7.5 * unit) * SS, size * 0.08 * SS, rgb); return; }
  const w = weight * size;
  for (const stroke of g.s) {
    const pts = stroke.map(([gx, gy]) => [x + gx * unit, yTop + gy * unit]);
    if (pts.length === 1) stamp(pts[0][0] * SS, pts[0][1] * SS, Math.max(w * SS / 2, 0.75 * SS), rgb);
    else polyline(pts, w, rgb, false);
  }
}
function drawText(text, x, yTop, size, weight, rgb, tracking) {
  const tr = tracking || 0;
  const unit = size / 14;
  let cx = x;
  for (const ch of text) {
    const g = GLYPHS[ch];
    if (g) drawGlyph(ch, cx, yTop, size, weight, rgb);
    cx += (g ? g.w : 8) * unit + tr;
  }
  return cx - x - tr;
}
function drawTextC(text, cx, yTop, size, weight, rgb, tracking) {
  drawText(text, cx - textWidth(text, size, tracking || 0) / 2, yTop, size, weight, rgb, tracking);
}
function drawTextR(text, rx, yTop, size, weight, rgb, tracking) {
  drawText(text, rx - textWidth(text, size, tracking || 0), yTop, size, weight, rgb, tracking);
}

// ---- PNG encoder ----
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let v = n;
    for (let k = 0; k < 8; k++) v = (v & 1) ? (0xEDB88320 ^ (v >>> 1)) : (v >>> 1);
    t[n] = v;
  }
  return t;
})();
function crc32(b) {
  let v = 0xFFFFFFFF;
  for (let i = 0; i < b.length; i++) v = CRC_TABLE[(v ^ b[i]) & 0xFF] ^ (v >>> 8);
  return (v ^ 0xFFFFFFFF) >>> 0;
}
function toPNG() {
  const raw = Buffer.alloc((W * 3 + 1) * H);
  for (let y = 0; y < H; y++) {
    const rowStart = y * (W * 3 + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < W; x++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const o = ((y * SS + sy) * W * SS + (x * SS + sx)) * 3;
        r += buf[o]; g += buf[o + 1]; b += buf[o + 2];
      }
      const o = rowStart + 1 + x * 3, n = SS * SS;
      raw[o] = Math.round(r / n); raw[o + 1] = Math.round(g / n); raw[o + 2] = Math.round(b / n);
    }
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- palette ----
const INK = [24, 24, 28], PAPER = [250, 248, 241], WHITE = [255, 255, 255];
const GREY = [96, 92, 86], LGREY = [178, 174, 166];
const RED = [178, 34, 34], NAVY = [24, 52, 92], GOLD = [186, 132, 20];
const TEAL = [14, 106, 100], GREEN = [46, 125, 50], AMBER = [178, 106, 0];
const REG = {
  'EUROPE': [47, 93, 168], 'MIDDLE EAST': [178, 34, 34], 'EAST ASIA': [186, 132, 20],
  'SOUTH ASIA': [122, 74, 158], 'SE ASIA': [14, 106, 100], 'AFRICA': [201, 106, 30],
  'N AMERICA': [63, 125, 78], 'S AMERICA': [138, 109, 59], 'OCEANIA': [31, 138, 158],
  'GLOBAL': [85, 85, 85],
};
const STATUS = { 'CONFIRMED': GREEN, 'OFFICIAL': NAVY, 'REPORTED': AMBER, 'CLAIM': RED };

function badge(x, y, text, size, bg, fg) {
  const w = textWidth(text, size, 1) + 20;
  rect(x, y, w, size + 12, bg);
  drawText(text, x + 10, y + 6, size, 0.2, fg || WHITE, 1);
  return w;
}
function numChip(cx, cy, n, r, bg) {
  disc(cx, cy, r, bg || INK);
  drawTextC(String(n), cx, cy - r + 3, r * 1.25, 0.2, WHITE, 0);
}

// ---- scenes: each draws inside (x, y, w, h), layered, original drawings ----
function sceneSkyline(x, y, w, h) {
  vgrad(x, y, w, h, [141, 179, 215], [224, 230, 233]);
  disc(x + w * 0.82, y + h * 0.24, h * 0.13, [233, 124, 84]);
  rect(x, y + h * 0.82, w, h * 0.18, [96, 104, 110]);
  const tw = w * 0.13;
  rect(x + w * 0.05, y + h * 0.36, tw, h * 0.46, [122, 134, 146]);
  rect(x + w * 0.22, y + h * 0.24, tw * 1.15, h * 0.58, [104, 118, 132]);
  rect(x + w * 0.42, y + h * 0.44, tw * 0.9, h * 0.38, [128, 140, 150]);
  rect(x + w * 0.66, y + h * 0.32, tw * 1.1, h * 0.5, [110, 124, 138]);
  rect(x + w * 0.84, y + h * 0.46, tw * 0.8, h * 0.36, [126, 138, 148]);
  for (let r = 0; r < 5; r++) for (let q = 0; q < 3; q++) rect(x + w * 0.07 + q * tw * 0.32, y + h * 0.40 + r * h * 0.085, tw * 0.18, h * 0.05, [233, 224, 142]);
  for (let r = 0; r < 7; r++) for (let q = 0; q < 4; q++) rect(x + w * 0.24 + q * tw * 0.27, y + h * 0.28 + r * h * 0.075, tw * 0.15, h * 0.045, [233, 224, 142]);
  for (let r = 0; r < 6; r++) for (let q = 0; q < 3; q++) rect(x + w * 0.68 + q * tw * 0.3, y + h * 0.36 + r * h * 0.075, tw * 0.16, h * 0.045, [233, 224, 142]);
  line(x + w * 0.55, y + h * 0.10, x + w * 0.55, y + h * 0.82, 4, [88, 100, 114]);
  disc(x + w * 0.55, y + h * 0.28, h * 0.075, [196, 60, 52]);
  disc(x + w * 0.55, y + h * 0.60, h * 0.11, [196, 60, 52]);
  line(x + w * 0.08, y + h * 0.82, x + w * 0.08, y + h * 0.64, 2.5, INK);
  poly([[x + w * 0.08, y + h * 0.64], [x + w * 0.16, y + h * 0.67], [x + w * 0.08, y + h * 0.70]], RED);
}
function sceneCourt(x, y, w, h) {
  vgrad(x, y, w, h, [26, 44, 82], [58, 82, 122]);
  // Gold scales of justice, shifted right so both pans clear the hook badge
  // (badge covers the left half of the scene); pans hang as bowls on strings.
  line(x + w * 0.74, y + h * 0.12, x + w * 0.74, y + h * 0.60, 4, GOLD);
  line(x + w * 0.58, y + h * 0.24, x + w * 0.90, y + h * 0.24, 4, GOLD);
  disc(x + w * 0.74, y + h * 0.10, h * 0.05, GOLD);
  line(x + w * 0.58, y + h * 0.24, x + w * 0.58, y + h * 0.34, 2.5, GOLD);
  line(x + w * 0.68, y + h * 0.24, x + w * 0.68, y + h * 0.34, 2.5, GOLD);
  poly([[x + w * 0.56, y + h * 0.34], [x + w * 0.70, y + h * 0.34], [x + w * 0.66, y + h * 0.44], [x + w * 0.60, y + h * 0.44]], GOLD);
  line(x + w * 0.80, y + h * 0.24, x + w * 0.80, y + h * 0.34, 2.5, GOLD);
  line(x + w * 0.90, y + h * 0.24, x + w * 0.90, y + h * 0.34, 2.5, GOLD);
  poly([[x + w * 0.78, y + h * 0.34], [x + w * 0.92, y + h * 0.34], [x + w * 0.88, y + h * 0.44], [x + w * 0.82, y + h * 0.44]], GOLD);
  disc(x + w * 0.74, y + h * 0.60, h * 0.045, GOLD);
  // Gavel lower-left, filling the space below the badge.
  rect(x + w * 0.10, y + h * 0.58, w * 0.14, h * 0.08, GOLD);
  line(x + w * 0.22, y + h * 0.64, x + w * 0.30, y + h * 0.80, 4, GOLD);
  rect(x + w * 0.24, y + h * 0.80, w * 0.12, h * 0.05, [150, 118, 52]);
  // Courthouse silhouette below the scales.
  rect(x + w * 0.58, y + h * 0.64, w * 0.32, h * 0.05, [222, 218, 206]);
  for (let i = 0; i < 3; i++) rect(x + w * (0.60 + i * 0.11), y + h * 0.69, w * 0.055, h * 0.20, [238, 236, 228]);
  rect(x, y + h * 0.89, w, h * 0.11, [104, 100, 92]);
}
function sceneDawnBlock(x, y, w, h) {
  vgrad(x, y, w, h, [226, 150, 96], [168, 158, 150]);
  disc(x + w * 0.78, y + h * 0.26, h * 0.14, [240, 214, 150]);
  rect(x + w * 0.08, y + h * 0.34, w * 0.34, h * 0.48, [94, 88, 84]);
  rect(x + w * 0.48, y + h * 0.22, w * 0.30, h * 0.60, [112, 104, 98]);
  for (let r = 0; r < 4; r++) for (let q = 0; q < 3; q++) rect(x + w * 0.11 + q * w * 0.10, y + h * 0.38 + r * h * 0.10, w * 0.06, h * 0.06, [240, 222, 150]);
  rect(x + w * 0.51, y + h * 0.26, w * 0.07, h * 0.07, [30, 26, 24]);
  rect(x + w * 0.60, y + h * 0.36, w * 0.07, h * 0.07, [30, 26, 24]);
  rect(x + w * 0.51, y + h * 0.46, w * 0.07, h * 0.07, [30, 26, 24]);
  rect(x + w * 0.66, y + h * 0.56, w * 0.07, h * 0.07, [30, 26, 24]);
  poly([[x + w * 0.56, y + h * 0.22], [x + w * 0.62, y + h * 0.06], [x + w * 0.68, y + h * 0.22]], [120, 112, 106]);
  disc(x + w * 0.62, y + h * 0.10, h * 0.09, [150, 142, 134]);
  rect(x, y + h * 0.82, w, h * 0.18, [80, 76, 70]);
}
function sceneDerrick(x, y, w, h) {
  vgrad(x, y, w, h, [240, 214, 150], [222, 196, 150]);
  rect(x, y + h * 0.76, w, h * 0.24, [166, 132, 84]);
  poly([[x + w * 0.30, y + h * 0.76], [x + w * 0.44, y + h * 0.14], [x + w * 0.58, y + h * 0.76]], [70, 66, 60]);
  line(x + w * 0.44, y + h * 0.14, x + w * 0.44, y + h * 0.76, 3, [40, 38, 34]);
  line(x + w * 0.34, y + h * 0.56, x + w * 0.54, y + h * 0.56, 3, [40, 38, 34]);
  line(x + w * 0.37, y + h * 0.38, x + w * 0.51, y + h * 0.38, 3, [40, 38, 34]);
  disc(x + w * 0.44, y + h * 0.10, h * 0.06, [220, 90, 30]);
  poly([[x + w * 0.40, y + h * 0.14], [x + w * 0.44, y + h * 0.04], [x + w * 0.48, y + h * 0.14]], [240, 140, 40]);
  disc(x + w * 0.76, y + h * 0.30, h * 0.10, [240, 200, 90]);
  rect(x + w * 0.68, y + h * 0.58, w * 0.20, h * 0.18, [120, 112, 100]);
  rect(x + w * 0.70, y + h * 0.62, w * 0.05, h * 0.05, [240, 222, 150]);
  rect(x + w * 0.78, y + h * 0.62, w * 0.05, h * 0.05, [240, 222, 150]);
}
function sceneParliament(x, y, w, h) {
  vgrad(x, y, w, h, [150, 190, 180], [224, 232, 222]);
  rect(x, y + h * 0.78, w, h * 0.22, [110, 140, 110]);
  rect(x + w * 0.14, y + h * 0.42, w * 0.72, h * 0.36, [238, 232, 214]);
  poly([[x + w * 0.10, y + h * 0.42], [x + w * 0.5, y + h * 0.18], [x + w * 0.90, y + h * 0.42]], [178, 52, 52]);
  for (let i = 0; i < 5; i++) rect(x + w * (0.20 + i * 0.13), y + h * 0.48, w * 0.06, h * 0.30, [210, 202, 180]);
  line(x + w * 0.86, y + h * 0.78, x + w * 0.86, y + h * 0.34, 2.5, INK);
  poly([[x + w * 0.86, y + h * 0.34], [x + w * 0.97, y + h * 0.37], [x + w * 0.86, y + h * 0.40]], [178, 34, 34]);
  rect(x + w * 0.06, y + h * 0.62, w * 0.14, h * 0.16, [40, 70, 140]);
  rect(x + w * 0.075, y + h * 0.58, w * 0.11, h * 0.05, [250, 248, 242]);
  line(x + w * 0.10, y + h * 0.66, x + w * 0.16, y + h * 0.72, 2.5, WHITE);
}
function sceneShophouse(x, y, w, h) {
  vgrad(x, y, w, h, [120, 130, 140], [200, 198, 190]);
  rect(x + w * 0.08, y + h * 0.30, w * 0.42, h * 0.48, [216, 190, 150]);
  rect(x + w * 0.54, y + h * 0.40, w * 0.36, h * 0.38, [190, 170, 140]);
  poly([[x + w * 0.05, y + h * 0.30], [x + w * 0.29, y + h * 0.14], [x + w * 0.53, y + h * 0.30]], [150, 60, 50]);
  rect(x + w * 0.14, y + h * 0.40, w * 0.10, h * 0.12, [60, 56, 50]);
  rect(x + w * 0.30, y + h * 0.40, w * 0.10, h * 0.12, [60, 56, 50]);
  rect(x + w * 0.14, y + h * 0.58, w * 0.10, h * 0.20, [120, 90, 60]);
  poly([[x + w * 0.30, y + h * 0.30], [x + w * 0.36, y + h * 0.10], [x + w * 0.42, y + h * 0.30]], [150, 142, 134]);
  disc(x + w * 0.36, y + h * 0.12, h * 0.08, [180, 172, 164]);
  poly([[x + w * 0.60, y + h * 0.40], [x + w * 0.64, y + h * 0.28], [x + w * 0.68, y + h * 0.40]], [240, 140, 40]);
  rect(x, y + h * 0.78, w, h * 0.22, [110, 106, 98]);
  line(x + w * 0.10, y + h * 0.78, x + w * 0.90, y + h * 0.78, 2, [80, 76, 70]);
}
function sceneRocket(x, y, w, h) {
  vgrad(x, y, w, h, [18, 30, 62], [60, 84, 128]);
  for (let i = 0; i < 9; i++) disc(x + w * (0.08 + ((i * 37) % 85) / 100), y + h * (0.08 + ((i * 53) % 60) / 100), 1.6, WHITE);
  poly([[x + w * 0.46, y + h * 0.10], [x + w * 0.54, y + h * 0.10], [x + w * 0.54, y + h * 0.52], [x + w * 0.46, y + h * 0.52]], [236, 236, 232]);
  poly([[x + w * 0.50, y + h * 0.02], [x + w * 0.54, y + h * 0.10], [x + w * 0.46, y + h * 0.10]], [196, 60, 52]);
  poly([[x + w * 0.46, y + h * 0.40], [x + w * 0.38, y + h * 0.56], [x + w * 0.46, y + h * 0.52]], [196, 60, 52]);
  poly([[x + w * 0.54, y + h * 0.40], [x + w * 0.62, y + h * 0.56], [x + w * 0.54, y + h * 0.52]], [196, 60, 52]);
  disc(x + w * 0.50, y + h * 0.20, h * 0.045, NAVY);
  poly([[x + w * 0.47, y + h * 0.52], [x + w * 0.53, y + h * 0.52], [x + w * 0.60, y + h * 0.72], [x + w * 0.40, y + h * 0.72]], [240, 150, 50]);
  disc(x + w * 0.50, y + h * 0.74, h * 0.10, [220, 214, 206]);
  disc(x + w * 0.42, y + h * 0.82, h * 0.07, [200, 194, 186]);
  disc(x + w * 0.60, y + h * 0.84, h * 0.06, [200, 194, 186]);
  rect(x, y + h * 0.88, w, h * 0.12, [40, 90, 60]);
}
function sceneTower(x, y, w, h) {
  vgrad(x, y, w, h, [140, 160, 190], [210, 216, 222]);
  rect(x, y + h * 0.80, w, h * 0.20, [120, 118, 110]);
  const tx = x + w * 0.38, tw = w * 0.24;
  poly([[tx, y + h * 0.80], [tx, y + h * 0.08], [tx + tw * 0.5, y], [tx + tw, y + h * 0.08], [tx + tw, y + h * 0.80]], [168, 178, 190]);
  for (let r = 0; r < 8; r++) for (let q = 0; q < 3; q++) rect(tx + tw * 0.14 + q * tw * 0.30, y + h * 0.12 + r * h * 0.085, tw * 0.18, h * 0.05, [120, 132, 146]);
  rect(tx - 2, y + h * 0.42, tw + 4, h * 0.10, [52, 48, 44]);
  poly([[tx + tw * 0.2, y + h * 0.42], [tx + tw * 0.5, y + h * 0.30], [tx + tw * 0.8, y + h * 0.42]], [150, 142, 134]);
  disc(tx + tw * 0.5, y + h * 0.30, h * 0.05, [150, 142, 134]);
  rect(x + w * 0.08, y + h * 0.48, w * 0.20, h * 0.32, [140, 150, 160]);
  rect(x + w * 0.72, y + h * 0.56, w * 0.18, h * 0.24, [146, 156, 166]);
}
function sceneMarket(x, y, w, h) {
  vgrad(x, y, w, h, [250, 220, 130], [240, 200, 130]);
  rect(x, y + h * 0.78, w, h * 0.22, [130, 126, 118]);
  rect(x + w * 0.10, y + h * 0.34, w * 0.80, h * 0.44, [250, 248, 240]);
  poly([[x + w * 0.06, y + h * 0.34], [x + w * 0.94, y + h * 0.34], [x + w * 0.90, y + h * 0.18], [x + w * 0.10, y + h * 0.18]], [220, 60, 40]);
  for (let i = 0; i < 6; i++) rect(x + w * (0.10 + i * 0.14), y + h * 0.18, w * 0.07, h * 0.16, i % 2 ? [250, 248, 240] : [220, 60, 40]);
  rect(x + w * 0.16, y + h * 0.44, w * 0.24, h * 0.22, [120, 170, 200]);
  rect(x + w * 0.46, y + h * 0.44, w * 0.24, h * 0.22, [120, 170, 200]);
  line(x + w * 0.28, y + h * 0.44, x + w * 0.28, y + h * 0.66, 2, [200, 200, 196]);
  line(x + w * 0.58, y + h * 0.44, x + w * 0.58, y + h * 0.66, 2, [200, 200, 196]);
  drawTextOnScene(x, y, w, h);
  function drawTextOnScene() {
    line(x + w * 0.08, y + h * 0.86, x + w * 0.92, y + h * 0.86, 3, [240, 200, 40]);
  }
  disc(x + w * 0.86, y + h * 0.70, h * 0.05, [30, 60, 140]);
}
function sceneTanker(x, y, w, h) {
  vgrad(x, y, w, h, [150, 190, 210], [210, 226, 232]);
  poly([[x + w * 0.06, y + h * 0.52], [x + w * 0.12, y + h * 0.40], [x + w * 0.88, y + h * 0.40], [x + w * 0.94, y + h * 0.52], [x + w * 0.88, y + h * 0.66], [x + w * 0.12, y + h * 0.66]], [150, 52, 44]);
  rect(x + w * 0.72, y + h * 0.22, w * 0.14, h * 0.20, [238, 236, 230]);
  rect(x + w * 0.74, y + h * 0.26, w * 0.04, h * 0.05, [60, 80, 110]);
  rect(x + w * 0.80, y + h * 0.26, w * 0.04, h * 0.05, [60, 80, 110]);
  line(x + w * 0.79, y + h * 0.22, x + w * 0.79, y + h * 0.12, 2.5, INK);
  poly([[x + w * 0.20, y + h * 0.40], [x + w * 0.24, y + h * 0.30], [x + w * 0.28, y + h * 0.40]], [240, 140, 40]);
  rect(x, y + h * 0.66, w, h * 0.34, [52, 110, 150]);
  for (let i = 0; i < 5; i++) {
    const wy = y + h * (0.70 + i * 0.06);
    poly([[x + w * 0.02, wy], [x + w * 0.18, wy - h * 0.03], [x + w * 0.34, wy], [x + w * 0.50, wy - h * 0.03], [x + w * 0.66, wy], [x + w * 0.82, wy - h * 0.03], [x + w * 0.98, wy]], [220, 236, 242]);
  }
  poly([[x + w * 0.10, y + h * 0.30], [x + w * 0.17, y + h * 0.12], [x + w * 0.24, y + h * 0.30]], [240, 200, 40]);
  drawText('!', x + w * 0.155, y + h * 0.14, h * 0.14, 0.22, INK, 0);
}
function sceneFlags(x, y, w, h) {
  vgrad(x, y, w, h, [170, 200, 230], [226, 232, 236]);
  rect(x, y + h * 0.76, w, h * 0.24, [120, 130, 120]);
  line(x + w * 0.22, y + h * 0.76, x + w * 0.22, y + h * 0.16, 3, INK);
  line(x + w * 0.72, y + h * 0.76, x + w * 0.72, y + h * 0.16, 3, INK);
  poly([[x + w * 0.22, y + h * 0.16], [x + w * 0.46, y + h * 0.20], [x + w * 0.22, y + h * 0.24]], [200, 60, 50]);
  poly([[x + w * 0.22, y + h * 0.24], [x + w * 0.46, y + h * 0.28], [x + w * 0.22, y + h * 0.32]], WHITE);
  poly([[x + w * 0.22, y + h * 0.32], [x + w * 0.46, y + h * 0.36], [x + w * 0.22, y + h * 0.40]], [60, 120, 60]);
  poly([[x + w * 0.72, y + h * 0.16], [x + w * 0.48, y + h * 0.20], [x + w * 0.72, y + h * 0.24]], [60, 120, 200]);
  poly([[x + w * 0.72, y + h * 0.24], [x + w * 0.48, y + h * 0.28], [x + w * 0.72, y + h * 0.32]], [240, 200, 40]);
  poly([[x + w * 0.72, y + h * 0.32], [x + w * 0.48, y + h * 0.36], [x + w * 0.72, y + h * 0.40]], [60, 120, 200]);
  rect(x + w * 0.34, y + h * 0.58, w * 0.32, h * 0.08, [140, 110, 70]);
  rect(x + w * 0.36, y + h * 0.66, w * 0.04, h * 0.12, [110, 86, 54]);
  rect(x + w * 0.60, y + h * 0.66, w * 0.04, h * 0.12, [110, 86, 54]);
}
function sceneBoat(x, y, w, h) {
  vgrad(x, y, w, h, [250, 200, 120], [250, 220, 170]);
  disc(x + w * 0.80, y + h * 0.22, h * 0.13, [240, 180, 60]);
  rect(x, y + h * 0.60, w, h * 0.40, [60, 130, 170]);
  for (let i = 0; i < 4; i++) {
    const wy = y + h * (0.64 + i * 0.09);
    poly([[x + w * 0.02, wy], [x + w * 0.20, wy - h * 0.035], [x + w * 0.38, wy], [x + w * 0.56, wy - h * 0.035], [x + w * 0.74, wy], [x + w * 0.92, wy - h * 0.035], [x + w * 0.99, wy]], [220, 238, 244]);
  }
  poly([[x + w * 0.22, y + h * 0.56], [x + w * 0.30, y + h * 0.40], [x + w * 0.78, y + h * 0.40], [x + w * 0.70, y + h * 0.56]], [140, 90, 50]);
  line(x + w * 0.52, y + h * 0.40, x + w * 0.52, y + h * 0.22, 2.5, [90, 60, 30]);
  poly([[x + w * 0.52, y + h * 0.22], [x + w * 0.68, y + h * 0.27], [x + w * 0.52, y + h * 0.32]], [240, 240, 230]);
  for (let i = 0; i < 5; i++) disc(x + w * (0.34 + i * 0.08), y + h * 0.36, h * 0.022, [60, 40, 26]);
  poly([[x + w * 0.14, y + h * 0.16], [x + w * 0.18, y + h * 0.13], [x + w * 0.22, y + h * 0.16]], [60, 50, 44]);
  poly([[x + w * 0.22, y + h * 0.16], [x + w * 0.26, y + h * 0.13], [x + w * 0.30, y + h * 0.16]], [60, 50, 44]);
}
function sceneRoad(x, y, w, h) {
  vgrad(x, y, w, h, [200, 210, 220], [230, 232, 234]);
  rect(x, y + h * 0.60, w, h * 0.40, [90, 90, 92]);
  for (let i = 0; i < 5; i++) rect(x + w * (0.04 + i * 0.20), y + h * 0.78, w * 0.10, h * 0.035, [250, 248, 240]);
  rect(x + w * 0.08, y + h * 0.36, w * 0.40, h * 0.28, [220, 60, 40]);
  rect(x + w * 0.11, y + h * 0.40, w * 0.10, h * 0.10, [180, 220, 240]);
  rect(x + w * 0.24, y + h * 0.40, w * 0.10, h * 0.10, [180, 220, 240]);
  rect(x + w * 0.37, y + h * 0.40, w * 0.08, h * 0.10, [180, 220, 240]);
  disc(x + w * 0.16, y + h * 0.64, h * 0.05, INK);
  disc(x + w * 0.40, y + h * 0.64, h * 0.05, INK);
  rect(x + w * 0.58, y + h * 0.30, w * 0.34, h * 0.34, [150, 148, 142]);
  rect(x + w * 0.58, y + h * 0.30, w * 0.34, h * 0.08, [110, 108, 102]);
  disc(x + w * 0.66, y + h * 0.64, h * 0.05, INK);
  disc(x + w * 0.84, y + h * 0.64, h * 0.05, INK);
  poly([[x + w * 0.48, y + h * 0.52], [x + w * 0.52, y + h * 0.40], [x + w * 0.56, y + h * 0.52]], [240, 200, 40]);
}

// ---- dot-grid world map ----
function pointInPoly(px, py, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const CONTINENTS = [
  [[0.03,0.30],[0.10,0.12],[0.22,0.10],[0.28,0.22],[0.24,0.38],[0.16,0.48],[0.08,0.44]],
  [[0.24,0.52],[0.30,0.50],[0.34,0.60],[0.30,0.78],[0.25,0.88],[0.22,0.70]],
  [[0.46,0.14],[0.55,0.10],[0.60,0.18],[0.56,0.30],[0.48,0.28],[0.44,0.20]],
  [[0.46,0.34],[0.56,0.32],[0.60,0.44],[0.56,0.62],[0.50,0.72],[0.46,0.56]],
  [[0.60,0.10],[0.78,0.08],[0.92,0.16],[0.94,0.30],[0.82,0.40],[0.66,0.36],[0.58,0.26]],
  [[0.86,0.62],[0.94,0.60],[0.96,0.70],[0.88,0.74]],
];
function drawMap(x, y, w, h, pins) {
  rect(x, y, w, h, [238, 234, 224]);
  const gap = 7;
  for (let gy = y + 4; gy < y + h - 2; gy += gap) {
    for (let gx = x + 4; gx < x + w - 2; gx += gap) {
      const nx = (gx - x) / w, ny = (gy - y) / h;
      if (CONTINENTS.some(p => pointInPoly(nx, ny, p))) disc(gx, gy, 1.7, [150, 142, 128]);
    }
  }
  for (const p of pins) {
    const px = x + p[0] * w, py = y + p[1] * h;
    disc(px, py, 7.5, REG[p[2]]);
    ring(px, py, 7.5, 1.5, WHITE);
    drawTextC(String(p[3]), px, py - 5.5, 10, 0.2, WHITE, 0);
  }
}

// ---- stories (own wording; every fact verified 24 Nov 2026, see report) ----
const HEROES = [
  { n: 1, region: 'EAST ASIA', status: 'OFFICIAL', source: 'CCDI, via Reuters',
    headline: 'Shanghai party chief probed',
    deck: 'Watchdog probes Politburo member Chen Jining for suspected severe violations.',
    badge: '4TH PROBE SINCE 2025', scene: sceneSkyline },
  { n: 2, region: 'N AMERICA', status: 'OFFICIAL', source: 'US Justice Dept, via Reuters',
    headline: 'Huawei guilty on 10 of 12',
    deck: 'Jury convicts Huawei of fraud and secrets theft; clears it of racketeering.',
    badge: '10 OF 12 COUNTS', scene: sceneCourt },
  { n: 3, region: 'EUROPE', status: 'OFFICIAL', source: 'Regional governor, via Reuters',
    headline: 'Strike kills 2 in Zaporizhzhia',
    deck: 'Dawn strike wrecks a block and a house; 40 hurt, among them four children.',
    badge: '2 KILLED, 40 HURT', scene: sceneDawnBlock },
];
const SECONDARY = [
  { n: 4, region: 'MIDDLE EAST', status: 'CONFIRMED', source: 'Reuters',
    headline: 'Baghdad seizes Kirkuk oil', deck: 'Four-province takeover.',
    badge: '4 PROVINCES', scene: sceneDerrick },
  { n: 5, region: 'OCEANIA', status: 'REPORTED', source: 'PNG parliament',
    headline: 'Bougainville vote begins', deck: 'MPs vote on 2019 result.',
    badge: 'VOTE BEGINS', scene: sceneParliament },
  { n: 6, region: 'SE ASIA', status: 'CONFIRMED', source: 'AP',
    headline: 'Hanoi blast kills 6', deck: 'Gas leak suspected.',
    badge: '6 KILLED', scene: sceneShophouse },
  { n: 7, region: 'S AMERICA', status: 'CONFIRMED', source: 'Arianespace',
    headline: 'Ariane lifts 36 satellites', deck: 'Leo batch from Kourou.',
    badge: '36 SATELLITES', scene: sceneRocket },
  { n: 8, region: 'MIDDLE EAST', status: 'REPORTED', source: 'Saudi Civil Defence',
    headline: 'Riyadh tower hit again', deck: 'Drone hits PIF tower.',
    badge: '11 HURT', scene: sceneTower },
  { n: 9, region: 'S AMERICA', status: 'CONFIRMED', source: 'AP',
    headline: '30 held in Cartagena', deck: 'Siege after robbery bid.',
    badge: '30 HELD', scene: sceneMarket },
  { n: 10, region: 'MIDDLE EAST', status: 'REPORTED', source: 'UKMTO',
    headline: '3 vessels struck in strait', deck: 'Mine claim unconfirmed.',
    badge: '3 STRUCK', scene: sceneTanker },
  { n: 11, region: 'EUROPE', status: 'CONFIRMED', source: 'Ukrainian presidency',
    headline: 'Hungary, Ukraine reset ties', deck: 'First visit in office.',
    badge: 'FRESH START', scene: sceneFlags },
  { n: 12, region: 'AFRICA', status: 'REPORTED', source: 'Reuters',
    headline: '175 feared lost at sea', deck: 'Unheard of for two weeks.',
    badge: '175 ABOARD', scene: sceneBoat },
  { n: 13, region: 'MIDDLE EAST', status: 'OFFICIAL', source: 'RAK Police',
    headline: 'Bus crash kills 13 in UAE', deck: 'Bus hits parked lorry.',
    badge: '13 KILLED', scene: sceneRoad },
];
const ALSO_ON = [
  { n: 14, text: 'Nepal quake, no deaths', status: 'CONFIRMED', source: 'NEMRC' },
  { n: 15, text: 'Cikande toll rises to 26', status: 'CONFIRMED', source: 'AP' },
  { n: 16, text: 'Malaysia to return 6,500+', status: 'OFFICIAL', source: 'AP' },
  { n: 17, text: 'Portugal passes budget', status: 'CONFIRMED', source: 'AP' },
  { n: 18, text: 'EU caps hybrid imports', status: 'CONFIRMED', source: 'Reuters' },
  { n: 19, text: 'UN Council debates AI war', status: 'CONFIRMED', source: 'UN' },
  { n: 20, text: 'Sooryavanshi hits 204', status: 'CONFIRMED', source: 'Reuters' },
  { n: 21, text: 'President visits blast site', status: 'REPORTED', source: 'Govt' },
  { n: 22, text: 'Solomons lets pact lapse', status: 'REPORTED', source: 'SMH' },
  { n: 23, text: 'CAS restores Senegal title', status: 'CONFIRMED', source: 'CAS' },
  { n: 24, text: 'Sanofi buys Insmed, $41bn', status: 'CONFIRMED', source: 'Sanofi' },
  { n: 25, text: 'Dell revenue hits $54.9bn', status: 'CONFIRMED', source: 'Dell' },
  { n: 26, text: 'EU adopts carbon reform', status: 'CONFIRMED', source: 'EP' },
  { n: 27, text: 'UN counts 47,000 femicides', status: 'CONFIRMED', source: 'UN' },
  { n: 28, text: 'Ebola evacuation in Congo', status: 'REPORTED', source: 'AP' },
  { n: 29, text: 'Sarkozy and Bruni on trial', status: 'REPORTED', source: 'AP' },
  { n: 30, text: 'Chess Game 1 drawn', status: 'CONFIRMED', source: 'FIDE' },
  { n: 31, text: 'Supermoon at full phase', status: 'CONFIRMED', source: 'NASA' },
  { n: 32, text: 'Shenzhou-24 crew named', status: 'OFFICIAL', source: 'CMSA' },
  { n: 33, text: 'England heat deaths: 5,258', status: 'OFFICIAL', source: 'UKHSA' },
  { n: 34, text: 'Spy chiefs probed on breach', status: 'REPORTED', source: 'AP' },
  { n: 35, text: 'Madagascar issues warrants', status: 'REPORTED', source: 'AP' },
  { n: 36, text: 'Australia plans tech fines', status: 'REPORTED', source: 'AP' },
  { n: 37, text: 'Russia: 699 drones down', status: 'CLAIM', source: 'Moscow' },
  { n: 38, text: 'Dow reclaims 50,000', status: 'CONFIRMED', source: 'NYSE' },
  { n: 39, text: 'TAIEX +8.99%, KOSPI +6.32%', status: 'CONFIRMED', source: 'TWSE' },
];
const REGIONS = [['EUROPE', 9], ['MIDDLE EAST', 4], ['EAST ASIA', 3], ['N AMERICA', 4], ['SOUTH ASIA', 2], ['SE ASIA', 3], ['AFRICA', 4], ['S AMERICA', 3], ['OCEANIA', 3], ['GLOBAL', 4]];
const TIMELINE = [
  ['01:00', 'Hanoi'], ['01:32', 'Nepal'], ['02:00', 'Zaporizhzhia'],
  ['05:46', 'Drones'], ['11:14', 'Ariane'], ['14:00', 'Chess'],
  ['14:53', 'Supermoon'], ['19:00', 'Pardon'],
];
const FIGURES = [
  ['10 / 12', 'Huawei counts'], ['36', 'Satellites up'], ['699', 'Drones claimed'],
  ['6,500+', 'To go home'], ['350,000', 'Hybrid cap'], ['5,258', 'Heat deaths'],
];
const DATE_CHECK = 'Not 24 Nov: Acropolis reopening 23rd · United outage 16th · Nvidia rally 23rd · Trump memo 23rd · Korea reward 23rd · Chapo claim 23rd · Shenzhou launch 25th · COP31 collapse 22nd · Guterres call 23rd · Huang rehire 23rd · Denmark law 23rd · Manchester evacuation 23rd.';
const PINS = [
  [0.84, 0.28, 'EAST ASIA', 1], [0.20, 0.24, 'N AMERICA', 2], [0.57, 0.20, 'EUROPE', 3],
  [0.61, 0.27, 'MIDDLE EAST', 4], [0.93, 0.66, 'OCEANIA', 5], [0.80, 0.38, 'SE ASIA', 6],
  [0.28, 0.62, 'S AMERICA', 7], [0.57, 0.38, 'MIDDLE EAST', 8], [0.24, 0.54, 'S AMERICA', 9],
  [0.67, 0.32, 'MIDDLE EAST', 10], [0.51, 0.15, 'EUROPE', 11], [0.43, 0.44, 'AFRICA', 12],
  [0.69, 0.40, 'MIDDLE EAST', 13],
];

// ---- page ----
const MX = 36, CW = W - 2 * MX;
function main() {
  rect(0, 0, W, H, PAPER);
  rect(0, 0, W, 6, INK);

  // Masthead
  drawText('THE ONE-DAY PAPER', MX, 12, 15, 0.22, RED, 1.2);
  drawTextR('All drawings and the map are original.', W - MX, 14, 12, 0.15, GREY, 0.3);
  drawText('Tuesday, 24 November 2026', MX, 28, 58, 0.18, INK, 0.5);
  drawText('The world in one day — Chen probed  ·  Huawei guilty  ·  Zaporizhzhia hit', MX, 104, 15, 0.15, [70, 68, 64], 0.4);
  drawTextR('39 stories  ·  10 regions', W - MX, 104, 15, 0.18, NAVY, 0.4);

  // Region line (each region in its own colour = the key)
  let rx = MX;
  const ry = 124;
  for (let i = 0; i < REGIONS.length; i++) {
    const [name, count] = REGIONS[i];
    const label = name + ' ' + count;
    rx += drawText(label, rx, ry, 11, 0.2, REG[name], 0.3);
    if (i < REGIONS.length - 1) rx += drawText('  ·  ', rx, ry, 11, 0.2, LGREY, 0);
  }

  // Timeline (UTC, verified hours only) + numbers-strip label on the same row
  let tx = MX;
  const ty = 142;
  tx += drawText('UTC  ', tx, ty, 13, 0.22, RED, 0.5);
  for (let i = 0; i < TIMELINE.length; i++) {
    const [t, label] = TIMELINE[i];
    tx += drawText(t + ' ', tx, ty, 13, 0.2, INK, 0.3);
    tx += drawText(label, tx, ty, 13, 0.15, GREY, 0.3);
    if (i < TIMELINE.length - 1) tx += drawText('   ·   ', tx, ty, 13, 0.15, LGREY, 0);
  }
  drawTextR('THE DAY IN NUMBERS', W - MX, ry, 12, 0.22, RED, 1);
  line(MX, 162, W - MX, 162, 2, INK);

  // Numbers strip: six separate columns
  const colW = CW / 6;
  for (let i = 0; i < FIGURES.length; i++) {
    const cx = MX + i * colW;
    if (i > 0) line(cx - 6, 172, cx - 6, 210, 1.5, LGREY);
    drawTextC(FIGURES[i][0], cx + colW / 2, 170, 28, 0.18, INK, 0.3);
    drawTextC(FIGURES[i][1], cx + colW / 2, 204, 11, 0.16, GREY, 0.4);
  }
  line(MX, 222, W - MX, 222, 1.5, LGREY);

  // Heroes
  const hw = (CW - 2 * 12) / 3, hy = 230, hh = 248;
  for (let i = 0; i < HEROES.length; i++) {
    const s = HEROES[i];
    const x = MX + i * (hw + 12);
    rect(x, hy, hw, hh, WHITE);
    line(x, hy, x + hw, hy, 2, INK);
    line(x, hy + hh, x + hw, hy + hh, 2, INK);
    s.scene(x, hy, hw, 76);
    badge(x + 10, hy + 10, s.badge, 15, REG[s.region], WHITE);
    numChip(x + hw - 20, hy + 76 - 16, s.n, 15, INK);
    drawText(s.region + "  •  " + s.status, x + 2, hy + 84, 12, 0.2, STATUS[s.status], 0.6);
    const hl = wrapText(s.headline, 36, hw - 8, 0.3);
    let yy = hy + 102;
    for (const ln of hl.slice(0, 2)) { drawText(ln, x + 2, yy, 36, 0.17, INK, 0.3); yy += 48; }
    const dl = wrapText(s.deck, 14, hw - 8, 0.3);
    yy += 2;
    for (const ln of dl.slice(0, 2)) { drawText(ln, x + 2, yy, 14, 0.12, [58, 56, 52], 0.3); yy += 19; }
    drawText('Source: ' + s.source, x + 2, hy + hh - 15, 11, 0.15, GREY, 0.3);
  }

  // Secondary cards: 5 columns x 2 rows, fixed interior positions
  const sw = (CW - 4 * 10) / 5, sy = 486, sh = 154;
  for (let i = 0; i < SECONDARY.length; i++) {
    const s = SECONDARY[i];
    const col = i % 5, row = Math.floor(i / 5);
    const x = MX + col * (sw + 10), y = sy + row * (sh + 6);
    rect(x, y, sw, sh, WHITE);
    line(x, y + sh, x + sw, y + sh, 1.5, LGREY);
    s.scene(x, y, sw, 36);
    badge(x + 6, y + 6, s.badge, 12, REG[s.region], WHITE);
    numChip(x + sw - 13, y + 36 - 10, s.n, 10, INK);
    drawText(s.status, x + 2, y + 42, 11, 0.2, STATUS[s.status], 0.5);
    const hl = wrapText(s.headline, 24, sw - 6, 0.3);
    let yy = y + 58;
    for (const ln of hl.slice(0, 2)) { drawText(ln, x + 2, yy, 24, 0.17, INK, 0.3); yy += 32; }
    drawText(s.deck, x + 2, y + 121, 14, 0.12, [58, 56, 52], 0.3);
    drawText(s.source, x + 2, y + sh - 14, 11, 0.15, GREY, 0.3);
  }

  // Map + DATE CHECK row
  const my = 816, mh = 58;
  drawMap(MX, my, 560, mh, PINS);
  drawText('WHERE IT HAPPENED — pin = story number, pin colour = region', MX, my - 13, 11, 0.2, NAVY, 0.5);
  const dx = MX + 576, dw = CW - 576;
  drawText('DATE CHECK', dx, my - 13, 12, 0.22, RED, 1);
  rect(dx, my, dw, mh, [244, 240, 230]);
  line(dx, my, dx, my + mh, 2, RED);
  const dcLines = wrapText(DATE_CHECK, 10.5, dw - 14, 0.2);
  let dy = my + 4;
  for (const ln of dcLines.slice(0, 4)) { drawText(ln, dx + 7, dy, 10.5, 0.13, [58, 56, 52], 0.2); dy += 13.5; }

  // ALSO ON: four columns, number coloured by status (see legend)
  const ay = 880;
  drawText('ALSO ON — every story first reported on Tuesday 24 November 2026', MX, ay, 13, 0.22, NAVY, 0.5);
  drawTextR('Number colour = status: green CONFIRMED · navy OFFICIAL · amber REPORTED · red CLAIM', W - MX, ay + 2, 10, 0.15, GREY, 0.3);
  line(MX, ay + 20, W - MX, ay + 20, 1.5, INK);
  const colW2 = (CW - 3 * 12) / 4;
  for (let i = 0; i < ALSO_ON.length; i++) {
    const a = ALSO_ON[i];
    const col = i % 4, row = Math.floor(i / 4);
    const x = MX + col * (colW2 + 12), y = ay + 28 + row * 16.5;
    let ex = x;
    ex += drawText(String(a.n), ex, y, 13, 0.2, STATUS[a.status], 0.3) + 5;
    ex += drawText(a.text, ex, y, 13, 0.13, INK, 0.3);
    ex += drawText(' · ' + a.source, ex, y, 13, 0.13, GREY, 0.3);
  }
  console.log('layout ends at', ay + 28 + 6 * 16.5 + 13);

  const outDir = process.env.MAKEFUN_OUTPUT_DIR || path.join(__dirname, 'out');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'entry.png'), toPNG());
  console.log('wrote entry.png');
}

main();
