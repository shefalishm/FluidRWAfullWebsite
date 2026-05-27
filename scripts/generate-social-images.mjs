import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root = process.cwd();
const socialDir = path.join(root, "assets/social");
const contentDir = path.join(root, "content/blog");
fs.mkdirSync(socialDir, { recursive: true });

const W = 1200;
const H = 630;

const font = {
  A: ["01110","10001","10001","11111","10001","10001","10001"], B: ["11110","10001","10001","11110","10001","10001","11110"],
  C: ["01111","10000","10000","10000","10000","10000","01111"], D: ["11110","10001","10001","10001","10001","10001","11110"],
  E: ["11111","10000","10000","11110","10000","10000","11111"], F: ["11111","10000","10000","11110","10000","10000","10000"],
  G: ["01111","10000","10000","10111","10001","10001","01111"], H: ["10001","10001","10001","11111","10001","10001","10001"],
  I: ["11111","00100","00100","00100","00100","00100","11111"], J: ["00111","00010","00010","00010","10010","10010","01100"],
  K: ["10001","10010","10100","11000","10100","10010","10001"], L: ["10000","10000","10000","10000","10000","10000","11111"],
  M: ["10001","11011","10101","10101","10001","10001","10001"], N: ["10001","11001","10101","10011","10001","10001","10001"],
  O: ["01110","10001","10001","10001","10001","10001","01110"], P: ["11110","10001","10001","11110","10000","10000","10000"],
  Q: ["01110","10001","10001","10001","10101","10010","01101"], R: ["11110","10001","10001","11110","10100","10010","10001"],
  S: ["01111","10000","10000","01110","00001","00001","11110"], T: ["11111","00100","00100","00100","00100","00100","00100"],
  U: ["10001","10001","10001","10001","10001","10001","01110"], V: ["10001","10001","10001","10001","10001","01010","00100"],
  W: ["10001","10001","10001","10101","10101","10101","01010"], X: ["10001","10001","01010","00100","01010","10001","10001"],
  Y: ["10001","10001","01010","00100","00100","00100","00100"], Z: ["11111","00001","00010","00100","01000","10000","11111"],
  0: ["01110","10001","10011","10101","11001","10001","01110"], 1: ["00100","01100","00100","00100","00100","00100","01110"],
  2: ["01110","10001","00001","00010","00100","01000","11111"], 3: ["11110","00001","00001","01110","00001","00001","11110"],
  4: ["00010","00110","01010","10010","11111","00010","00010"], 5: ["11111","10000","10000","11110","00001","00001","11110"],
  6: ["01110","10000","10000","11110","10001","10001","01110"], 7: ["11111","00001","00010","00100","01000","01000","01000"],
  8: ["01110","10001","10001","01110","10001","10001","01110"], 9: ["01110","10001","10001","01111","00001","00001","01110"],
  "&": ["01100","10010","10100","01000","10101","10010","01101"], "/": ["00001","00010","00010","00100","01000","01000","10000"],
  "-": ["00000","00000","00000","11111","00000","00000","00000"], "?": ["01110","10001","00001","00010","00100","00000","00100"],
  ".": ["00000","00000","00000","00000","00000","01100","01100"], ":": ["00000","01100","01100","00000","01100","01100","00000"],
  "'": ["00100","00100","01000","00000","00000","00000","00000"], ",": ["00000","00000","00000","00000","01100","00100","01000"]
};

function crcTable() {
  const table = [];
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  return table;
}
const table = crcTable();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

function png(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const src = y * width * 4;
    const dst = y * (width * 4 + 1);
    raw[dst] = 0;
    rgba.copy(raw, dst + 1, src, src + width * 4);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk("IHDR", header), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

function hex(value) {
  const clean = value.replace("#", "");
  return [parseInt(clean.slice(0, 2), 16), parseInt(clean.slice(2, 4), 16), parseInt(clean.slice(4, 6), 16)];
}

function mix(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}

function setPixel(buf, x, y, color, alpha = 1) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  const inv = 1 - alpha;
  buf[i] = Math.round(buf[i] * inv + color[0] * alpha);
  buf[i + 1] = Math.round(buf[i + 1] * inv + color[1] * alpha);
  buf[i + 2] = Math.round(buf[i + 2] * inv + color[2] * alpha);
  buf[i + 3] = 255;
}

function rect(buf, x, y, w, h, color, alpha = 1) {
  for (let yy = Math.max(0, y); yy < Math.min(H, y + h); yy += 1) {
    for (let xx = Math.max(0, x); xx < Math.min(W, x + w); xx += 1) setPixel(buf, xx, yy, color, alpha);
  }
}

function circle(buf, cx, cy, r, color, alpha = 1) {
  const r2 = r * r;
  for (let y = Math.floor(cy - r); y <= cy + r; y += 1) {
    for (let x = Math.floor(cx - r); x <= cx + r; x += 1) {
      const d = (x - cx) ** 2 + (y - cy) ** 2;
      if (d <= r2) setPixel(buf, x, y, color, alpha * (1 - Math.sqrt(d / r2) * 0.18));
    }
  }
}

function line(buf, x1, y1, x2, y2, color, alpha = 1) {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = Math.round(x1 + (x2 - x1) * t);
    const y = Math.round(y1 + (y2 - y1) * t);
    rect(buf, x - 1, y - 1, 3, 3, color, alpha);
  }
}

function textWidth(text, scale) {
  return [...text].reduce((sum, ch) => sum + (ch === " " ? 4 : 6) * scale, 0);
}

function drawText(buf, text, x, y, scale, color) {
  let cx = x;
  for (const raw of text.toUpperCase()) {
    if (raw === " ") {
      cx += 4 * scale;
      continue;
    }
    const glyph = font[raw] || font["?"];
    glyph.forEach((row, gy) => {
      [...row].forEach((bit, gx) => {
        if (bit === "1") rect(buf, cx + gx * scale, y + gy * scale, scale, scale, color);
      });
    });
    cx += 6 * scale;
  }
}

function wrap(text, maxWidth, scale, maxLines = 3) {
  const words = text.toUpperCase().replace(/[^A-Z0-9&/?:'., -]/g, "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (textWidth(next, scale) <= maxWidth) current = next;
    else {
      if (current) lines.push(current);
      current = word;
    }
    if (lines.length === maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) lines[maxLines - 1] = lines[maxLines - 1].replace(/\s+\S+$/, "") + "...";
  return lines;
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error("Missing frontmatter");
  const data = {};
  for (const line of match[1].split("\n")) {
    const i = line.indexOf(":");
    if (i < 0) continue;
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    data[key] = value;
  }
  return { data, body: match[2] };
}

function frontmatter(data) {
  return Object.entries(data).map(([key, value]) => `${key}: "${String(value).replaceAll('"', '\\"')}"`).join("\n");
}

function palette(seed) {
  const palettes = [
    ["#fff7d1", "#eef8ff", "#12213a", "#2664a9", "#ffe36e"],
    ["#eff8ff", "#fffdf1", "#12213a", "#6a5acd", "#4cb2e0"],
    ["#fff4e8", "#eef8ff", "#172033", "#0f5fa8", "#f6c915"],
    ["#f8fbff", "#fff7d1", "#0d2b4d", "#25a074", "#63e8ff"]
  ];
  return palettes[seed % palettes.length].map(hex);
}

function slugSeed(slug) {
  return [...slug].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

function card({ title, label, slug, output }) {
  const seed = slugSeed(slug);
  const [bg1, bg2, ink, accent, yellow] = palette(seed);
  const buf = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const t = (x / W) * 0.62 + (y / H) * 0.38;
      const c = mix(bg1, bg2, t);
      const i = (y * W + x) * 4;
      buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = 255;
    }
  }
  circle(buf, 160, 105, 280, yellow, 0.32);
  circle(buf, 1030, 120, 250, accent, 0.22);
  circle(buf, 1040, 540, 210, yellow, 0.18);
  for (let x = 0; x < W; x += 54) line(buf, x, 0, x + 220, H, ink, 0.035);
  for (let y = 30; y < H; y += 54) line(buf, 0, y, W, y + 80, ink, 0.026);

  const nodes = Array.from({ length: 9 }, (_, i) => [130 + ((seed * (i + 5)) % 920), 130 + ((seed * (i + 9)) % 370)]);
  nodes.slice(1).forEach((n, i) => line(buf, nodes[i][0], nodes[i][1], n[0], n[1], accent, 0.22));
  nodes.forEach((n, i) => circle(buf, n[0], n[1], 13 + (i % 3) * 5, i % 2 ? yellow : accent, 0.75));

  rect(buf, 92, 76, 1016, 478, [255, 255, 255], 0.72);
  rect(buf, 92, 76, 1016, 8, yellow, 0.98);
  rect(buf, 132, 116, 112, 112, ink, 0.94);
  line(buf, 158, 172, 218, 172, yellow, 0.95);
  line(buf, 188, 142, 188, 202, yellow, 0.95);
  line(buf, 164, 148, 212, 196, accent, 0.9);
  line(buf, 212, 148, 164, 196, accent, 0.9);

  drawText(buf, "FLUIDRWA", 274, 122, 6, ink);
  drawText(buf, label, 274, 190, 4, accent);
  wrap(title, 880, 8, 3).forEach((lineText, i) => drawText(buf, lineText, 132, 292 + i * 70, 8, ink));
  rect(buf, 132, 494, 590, 52, ink, 0.95);
  drawText(buf, "DISCOVERY FOR TOKENIZED FINANCE", 160, 512, 3, [255, 255, 255]);
  fs.writeFileSync(path.join(socialDir, output), png(W, H, buf));
}

const pageCards = [
  ["home.png", "FluidRWA", "Find trusted Web3 and digital asset vendors", "home"],
  ["vendor-ecosystem.png", "Vendor Ecosystem", "Explore specialized infrastructure providers", "vendor-ecosystem"],
  ["solutions.png", "Solutions", "Vendor discovery for tokenized finance workflows", "solutions"],
  ["blog.png", "Insights", "Clear guides for Web3 vendor discovery", "blog"],
  ["team.png", "Team", "The people building FluidRWA", "team"],
  ["arcade.png", "Arcade", "Learn the vendor ecosystem through quick games", "arcade"],
  ["contact.png", "Contact", "Connect with FluidRWA", "contact"],
  ["submit-project.png", "Submit Project", "Tell us what you are building", "submit-project"],
  ["apply-as-vendor.png", "Apply as Vendor", "Get discovered by digital asset teams", "apply-as-vendor"]
];
for (const [output, label, title, slug] of pageCards) card({ output, label, title, slug });

const files = fs.readdirSync(contentDir).filter((file) => file.endsWith(".md")).sort();
for (const file of files) {
  const full = path.join(contentDir, file);
  const parsed = parseFrontmatter(fs.readFileSync(full, "utf8"));
  const slug = parsed.data.slug || file.replace(/\.md$/, "");
  parsed.data.socialImage = `/assets/social/blog-${slug}.png`;
  card({ output: `blog-${slug}.png`, label: parsed.data.category || "Insight", title: parsed.data.title, slug });
  fs.writeFileSync(full, `---\n${frontmatter(parsed.data)}\n---\n${parsed.body}`);
}

console.log(`Generated ${pageCards.length + files.length} social preview PNGs.`);
