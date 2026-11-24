// Placeholder edition for make.fun news-image-20261124.
// Draws the final layout with PLACEHOLDER story blocks; the 25 November
// refresh replaces every story line with the verified news of 24 November 2026.
// Node 22+, standard library only. No network, no file reads, deterministic:
// two runs write identical bytes to /output/entry.png (or $MAKEFUN_OUTPUT_DIR).

import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";

const W = 1024;
const H = 1024;

// 5x7 bitmap glyphs, drawn fresh for this entry. Each glyph is 7 rows of 5 cells.
const GLYPHS = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11100", "10010", "10001", "10001", "10001", "10010", "11100"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "00110", "00110"],
  ",": ["00000", "00000", "00000", "00000", "00110", "00100", "01000"],
  ":": ["00000", "00110", "00110", "00000", "00110", "00110", "00000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  "_": ["00000", "00000", "00000", "00000", "00000", "00000", "11111"],
  "*": ["00000", "10101", "01110", "10101", "00000", "00000", "00000"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
};

const PAPER = [247, 242, 231];
const INK = [26, 35, 50];
const RED = [176, 58, 46];
const GOLD = [198, 158, 74];
const GREY = [138, 138, 138];
const CARD = [255, 255, 255];
const RULE = [216, 210, 196];

const buf = Buffer.alloc(W * H * 3);

function px(x, y, c) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 3;
  buf[i] = c[0];
  buf[i + 1] = c[1];
  buf[i + 2] = c[2];
}

function rect(x, y, w, h, c) {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) px(i, j, c);
  }
}

function textWidth(s, scale) {
  return s.length * 6 * scale - scale;
}

function drawText(s, x, y, scale, c) {
  const up = s.toUpperCase();
  let cx = x;
  for (const ch of up) {
    const g = GLYPHS[ch] || GLYPHS["?"];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === "1") rect(cx + col * scale, y + r * scale, scale, scale, c);
      }
    }
    cx += 6 * scale;
  }
}

function centerText(s, y, scale, c) {
  drawText(s, Math.round((W - textWidth(s, scale)) / 2), y, scale, c);
}

// --- layout ---
rect(0, 0, W, H, PAPER);
// masthead band
rect(0, 0, W, 128, INK);
rect(0, 128, W, 6, GOLD);
centerText("24 NOVEMBER 2026", 26, 8, [255, 255, 255]);
centerText("ONE DAY IN ONE IMAGE", 92, 3, GOLD);
// placeholder flag
centerText("PLACEHOLDER EDITION", 152, 3, RED);
// five story rows
const rowY0 = 196;
const rowH = 112;
const gap = 14;
const accents = [RED, INK, GOLD, [46, 90, 120], [110, 70, 120]];
for (let n = 0; n < 5; n++) {
  const y = rowY0 + n * (rowH + gap);
  rect(48, y, 928, rowH, CARD);
  rect(48, y, 928, 2, RULE);
  rect(48, y + rowH - 2, 928, 2, RULE);
  rect(48, y, 12, rowH, accents[n]);
  // number chip: digit centred inside the 60x60 chip at x=84
  rect(84, y + 26, 60, 60, accents[n]);
  drawText(String(n + 1), 99, y + 35, 6, [255, 255, 255]);
  drawText("STORY " + (n + 1), 168, y + 24, 3, INK);
  drawText("PLACEHOLDER", 168, y + 60, 4, GREY);
}
// in-brief strip
rect(48, 852, 928, 64, INK);
drawText("IN BRIEF:", 72, 872, 3, GOLD);
drawText("PLACEHOLDER", 72 + textWidth("IN BRIEF: ", 3) + 12, 872, 3, [255, 255, 255]);
// footer
centerText("STORIES TO BE FILLED IN FROM THE FULL NEWS OF 24 NOV 2026", 940, 2, GREY);
centerText("AT THE 25 NOVEMBER REFRESH - PLACEHOLDER, NOT FINAL NEWS", 962, 2, GREY);

// --- PNG encode (RGB, filter 0) ---
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}
function crc32(b) {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}

const raw = Buffer.alloc(H * (1 + W * 3));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 3)] = 0;
  buf.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // color type RGB
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", ihdr),
  chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "entry.png"), png);
console.log("wrote " + path.join(outDir, "entry.png") + " " + png.length + " bytes");
