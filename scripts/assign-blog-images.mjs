import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const blogDir = path.join(root, "content/blog");
const imageDir = path.join(root, "assets/blog-images");
fs.mkdirSync(imageDir, { recursive: true });

function esc(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function parse(raw) {
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

function palette(index) {
  const palettes = [
    ["#fff7d1", "#0f5fa8", "#f6c915", "#63e8ff", "#12213a"],
    ["#eef8ff", "#12213a", "#9b7cff", "#ffe36e", "#164b7a"],
    ["#fffdf2", "#164b7a", "#38d9f2", "#f6c915", "#172033"],
    ["#f8fbff", "#0d2b4d", "#62e6b8", "#ffdf45", "#0f5fa8"],
    ["#fff4e8", "#172033", "#d49b12", "#3f8cff", "#4b2e83"],
    ["#effaf6", "#12392f", "#25a074", "#4cb2e0", "#172033"],
    ["#f6f2ff", "#27144a", "#9b7cff", "#ffdf45", "#0f5fa8"],
    ["#f2f7ff", "#10203d", "#4cb2e0", "#ffb84d", "#12213a"],
    ["#fff2f7", "#351528", "#e16ba8", "#ffe36e", "#164b7a"],
    ["#f4fbff", "#102d40", "#63e8ff", "#f6c915", "#17324f"]
  ];
  return palettes[index % palettes.length];
}

function theme(title, category, index) {
  const text = `${title} ${category}`.toLowerCase();
  if (text.includes("real estate")) return ["real-estate", ["real estate", "ownership", "property"]];
  if (text.includes("custody") || text.includes("wallet")) return ["custody", ["custody", "wallets", "controls"]];
  if (text.includes("kyc") || text.includes("aml") || text.includes("compliance") || text.includes("regulation") || text.includes("secure")) return ["compliance", ["compliance", "identity", "risk"]];
  if (text.includes("payment") || text.includes("stablecoin") || text.includes("ramp") || text.includes("money")) return ["payments", ["payments", "settlement", "rails"]];
  if (text.includes("smart contract") || text.includes("audit") || text.includes("blockchain")) return ["code", ["smart contracts", "security", "code"]];
  if (text.includes("ai")) return ["ai", ["AI", "automation", "analytics"]];
  if (text.includes("fund") || text.includes("invest") || text.includes("capital") || text.includes("liquid")) return ["markets", ["funds", "investors", "markets"]];
  if (text.includes("document") || text.includes("tax")) return ["documents", ["records", "reporting", "review"]];
  const defaults = ["token", "directory", "globe", "stack", "search"];
  return [defaults[index % defaults.length], ["tokenization", "RWA", "infrastructure"]];
}

function motif(kind, colors, seed) {
  const [, ink, accent, glow, deep] = colors;
  const soft = "rgba(255,255,255,.62)";
  const motifs = {
    "real-estate": `<g transform="translate(704 125)"><rect x="0" y="105" width="122" height="260" rx="12" fill="${deep}" opacity=".9"/><rect x="142" y="32" width="150" height="333" rx="14" fill="${ink}" opacity=".94"/><rect x="318" y="132" width="116" height="233" rx="12" fill="${accent}" opacity=".7"/>${Array.from({length:7},(_,r)=>Array.from({length:3},(_,c)=>`<rect x="${24+c*30}" y="${132+r*30}" width="15" height="16" rx="3" fill="${glow}" opacity=".65"/>`).join("")).join("")}${Array.from({length:9},(_,r)=>Array.from({length:4},(_,c)=>`<rect x="${170+c*29}" y="${62+r*30}" width="14" height="15" rx="3" fill="#fff" opacity=".58"/>`).join("")).join("")}</g>`,
    custody: `<g transform="translate(742 122)"><rect x="0" y="74" width="354" height="264" rx="34" fill="${deep}" opacity=".94"/><circle cx="177" cy="206" r="82" fill="${accent}" opacity=".88"/><circle cx="177" cy="206" r="48" fill="${glow}" opacity=".9"/><path d="M132 74v-28c0-66 90-66 90 0v28" fill="none" stroke="${ink}" stroke-width="24" stroke-linecap="round"/><rect x="228" y="136" width="78" height="34" rx="17" fill="#fff" opacity=".76"/></g>`,
    compliance: `<g transform="translate(728 90)"><path d="M192 0 342 58v118c0 124-68 210-150 260C110 386 42 300 42 176V58L192 0Z" fill="${deep}" opacity=".94"/><path d="M116 208l52 52 112-130" fill="none" stroke="${glow}" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/><g transform="translate(0 356)">${Array.from({length:4},(_,i)=>`<rect x="${i*92}" y="0" width="64" height="24" rx="12" fill="${i%2?accent:glow}" opacity=".76"/>`).join("")}</g></g>`,
    payments: `<g transform="translate(704 118)"><rect x="0" y="44" width="254" height="162" rx="28" fill="${deep}" opacity=".92"/><rect x="32" y="86" width="126" height="18" rx="9" fill="${glow}" opacity=".8"/><rect x="32" y="128" width="190" height="20" rx="10" fill="#fff" opacity=".62"/><path d="M292 52c80 52 80 182 0 234M338 14c124 82 124 282 0 364" fill="none" stroke="${accent}" stroke-width="22" stroke-linecap="round" opacity=".8"/><circle cx="414" cy="200" r="62" fill="${glow}" opacity=".74"/></g>`,
    code: `<g transform="translate(692 112)"><rect x="0" y="0" width="424" height="344" rx="34" fill="${deep}" opacity=".94"/><circle cx="44" cy="42" r="10" fill="${accent}"/><circle cx="76" cy="42" r="10" fill="${glow}"/><circle cx="108" cy="42" r="10" fill="#fff" opacity=".7"/><path d="m104 168-54 48 54 48M320 168l54 48-54 48M246 122l-70 188" fill="none" stroke="${glow}" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/><rect x="66" y="296" width="292" height="16" rx="8" fill="${accent}" opacity=".72"/></g>`,
    ai: `<g transform="translate(700 90)"><circle cx="204" cy="202" r="150" fill="${deep}" opacity=".9"/><path d="M132 174c0-52 38-92 86-92s86 40 86 92c0 68-50 82-50 128H182c0-46-50-60-50-128Z" fill="${accent}" opacity=".82"/><g>${Array.from({length:10},(_,i)=>{const a=(i/10)*Math.PI*2;const x=204+Math.cos(a)*210;const y=202+Math.sin(a)*176;return `<line x1="204" y1="202" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${glow}" stroke-width="4" opacity=".48"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="15" fill="${i%2?accent:glow}" opacity=".82"/>`;}).join("")}</g></g>`,
    markets: `<g transform="translate(686 132)"><rect x="0" y="0" width="444" height="318" rx="34" fill="${soft}" stroke="${ink}" stroke-opacity=".12"/><path d="M58 240C132 180 160 208 220 126s106-30 166-104" fill="none" stroke="${deep}" stroke-width="24" stroke-linecap="round"/><path d="M58 250h340" stroke="${ink}" stroke-opacity=".18" stroke-width="5"/><rect x="70" y="168" width="42" height="90" rx="12" fill="${accent}" opacity=".86"/><rect x="146" y="118" width="42" height="140" rx="12" fill="${glow}" opacity=".86"/><rect x="222" y="72" width="42" height="186" rx="12" fill="${deep}" opacity=".9"/></g>`,
    documents: `<g transform="translate(720 100)"><rect x="0" y="0" width="286" height="360" rx="28" fill="#fff" opacity=".84"/><path d="M210 0v78h76" fill="${glow}" opacity=".65"/><rect x="42" y="94" width="180" height="18" rx="9" fill="${deep}" opacity=".82"/><rect x="42" y="142" width="214" height="14" rx="7" fill="${ink}" opacity=".32"/><rect x="42" y="178" width="172" height="14" rx="7" fill="${ink}" opacity=".24"/><rect x="42" y="248" width="92" height="52" rx="16" fill="${accent}" opacity=".84"/><circle cx="318" cy="278" r="78" fill="${deep}" opacity=".9"/><path d="m282 278 28 28 52-66" fill="none" stroke="${glow}" stroke-width="18" stroke-linecap="round"/></g>`,
    token: `<g transform="translate(728 100)"><polygon points="190,0 354,94 354,282 190,376 26,282 26,94" fill="${deep}" opacity=".92"/><polygon points="190,54 306,122 306,254 190,322 74,254 74,122" fill="${accent}" opacity=".78"/><circle cx="190" cy="188" r="78" fill="${glow}" opacity=".9"/><path d="M190 120v136M122 188h136" stroke="${deep}" stroke-width="22" stroke-linecap="round"/></g>`,
    directory: `<g transform="translate(708 112)"><rect x="0" y="0" width="424" height="332" rx="34" fill="${deep}" opacity=".92"/><rect x="36" y="42" width="352" height="54" rx="18" fill="#fff" opacity=".78"/><circle cx="70" cy="69" r="14" fill="${accent}"/><path d="M116 69h218" stroke="${ink}" stroke-width="12" stroke-linecap="round" opacity=".45"/>${Array.from({length:3},(_,i)=>`<rect x="36" y="${124+i*68}" width="352" height="46" rx="18" fill="${i%2?accent:glow}" opacity=".76"/>`).join("")}</g>`,
    globe: `<g transform="translate(700 96)"><circle cx="208" cy="208" r="178" fill="${deep}" opacity=".92"/><circle cx="208" cy="208" r="130" fill="${accent}" opacity=".55"/><path d="M50 208h316M208 32c-76 68-76 284 0 352M208 32c76 68 76 284 0 352" fill="none" stroke="${glow}" stroke-width="14" stroke-linecap="round" opacity=".82"/><circle cx="300" cy="146" r="20" fill="#fff" opacity=".86"/><circle cx="142" cy="270" r="17" fill="${glow}"/></g>`,
    stack: `<g transform="translate(724 116)"><polygon points="160,0 306,82 160,164 14,82" fill="${glow}" opacity=".8"/><polygon points="14,82 160,164 160,314 14,230" fill="${deep}" opacity=".92"/><polygon points="306,82 160,164 160,314 306,230" fill="${accent}" opacity=".82"/><polygon points="250,136 396,218 250,300 104,218" fill="#fff" opacity=".55"/><polygon points="104,218 250,300 250,390 104,308" fill="${ink}" opacity=".65"/><polygon points="396,218 250,300 250,390 396,308" fill="${glow}" opacity=".58"/></g>`,
    search: `<g transform="translate(708 112)"><rect x="0" y="0" width="412" height="318" rx="34" fill="#fff" opacity=".7"/><circle cx="160" cy="146" r="92" fill="none" stroke="${deep}" stroke-width="34"/><path d="M224 210l112 112" stroke="${deep}" stroke-width="36" stroke-linecap="round"/><rect x="58" y="40" width="292" height="22" rx="11" fill="${accent}" opacity=".72"/><rect x="58" y="270" width="200" height="20" rx="10" fill="${glow}" opacity=".78"/></g>`
  };
  return motifs[kind] || motifs.token;
}

function svg(post, index) {
  const colors = palette(index);
  const [bg, ink, accent, glow, deep] = colors;
  const [kind, words] = theme(post.title, post.category, index);
  const seed = [...post.slug].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const layout = index % 6;
  const nodes = Array.from({ length: 7 + (index % 5) }, (_, i) => {
    const x = 120 + ((seed * (i + 3)) % 940);
    const y = 150 + ((seed * (i + 7)) % 440);
    return `<circle cx="${x}" cy="${y}" r="${7 + (i % 4) * 3}" fill="${i % 2 ? accent : glow}" opacity="${0.64 - i * 0.025}"/>`;
  }).join("");
  const lines = Array.from({ length: 6 + (index % 5) }, (_, i) => {
    const x1 = 120 + ((seed * (i + 3)) % 940);
    const y1 = 150 + ((seed * (i + 7)) % 440);
    const x2 = 120 + ((seed * (i + 4)) % 940);
    const y2 = 150 + ((seed * (i + 8)) % 440);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${layout % 2 ? deep : ink}" stroke-opacity=".13" stroke-width="${1.5 + (i % 3)}"/>`;
  }).join("");
  const backgroundPattern = [
    `${Array.from({ length: 18 }, (_, i) => `<path d="M${i * 86 - 80} 0V675" stroke="${ink}" stroke-opacity=".055"/>`).join("")}${Array.from({ length: 10 }, (_, i) => `<path d="M0 ${i * 74}H1200" stroke="${ink}" stroke-opacity=".045"/>`).join("")}`,
    `${Array.from({ length: 12 }, (_, i) => `<circle cx="${100 + i * 96}" cy="${110 + (i % 4) * 118}" r="${42 + (i % 3) * 22}" fill="${i % 2 ? accent : glow}" opacity=".12"/>`).join("")}`,
    `${Array.from({ length: 9 }, (_, i) => `<path d="M0 ${80 + i * 66}C260 ${20 + i * 46} 560 ${160 + i * 24} 1200 ${60 + i * 58}" fill="none" stroke="${i % 2 ? accent : ink}" stroke-opacity=".09" stroke-width="${2 + (i % 3)}"/>`).join("")}`,
    `${Array.from({ length: 8 }, (_, i) => `<rect x="${70 + i * 132}" y="${64 + (i % 3) * 150}" width="${72 + (i % 4) * 28}" height="${72 + (i % 2) * 42}" rx="20" fill="${i % 2 ? glow : accent}" opacity=".13" transform="rotate(${(i % 2 ? 8 : -8)} ${100 + i * 132} ${90 + (i % 3) * 150})"/>`).join("")}`,
    `${Array.from({ length: 14 }, (_, i) => `<path d="M${80+i*78} 80l38 22v44l-38 22-38-22v-44z" fill="none" stroke="${i % 2 ? accent : ink}" stroke-opacity=".12" stroke-width="3"/>`).join("")}`,
    `${Array.from({ length: 11 }, (_, i) => `<path d="M${-120+i*138} 675  ${220+i*92} 0" stroke="${i % 2 ? glow : ink}" stroke-opacity=".12" stroke-width="${4 + (i % 4)}"/>`).join("")}`
  ][layout];
  const motifFrame = [
    `<rect x="660" y="72" width="486" height="510" rx="44" fill="#fff" opacity=".52" stroke="${ink}" stroke-opacity=".08"/>`,
    `<circle cx="900" cy="316" r="254" fill="#fff" opacity=".38"/><circle cx="900" cy="316" r="176" fill="${glow}" opacity=".16"/>`,
    `<rect x="628" y="96" width="520" height="420" rx="54" fill="${deep}" opacity=".08"/><rect x="676" y="140" width="424" height="326" rx="38" fill="#fff" opacity=".46"/>`,
    `<path d="M630 132C770 48 1014 72 1130 210c108 128 8 302-150 356-184 62-396-12-432-178-22-104 6-210 82-256Z" fill="#fff" opacity=".42"/>`,
    `<rect x="640" y="86" width="492" height="438" rx="40" fill="#fff" opacity=".44"/><path d="M690 524h392" stroke="${deep}" stroke-opacity=".18" stroke-width="14" stroke-linecap="round"/>`,
    `<circle cx="890" cy="316" r="282" fill="#fff" opacity=".28"/><path d="M618 316h544M890 58v516" stroke="${ink}" stroke-opacity=".08" stroke-width="4"/>`
  ][layout];
  const accentPanel = `<g filter="url(#shadow)" opacity=".82"><circle cx="142" cy="474" r="42" fill="${accent}" opacity=".44"/><circle cx="224" cy="506" r="26" fill="${glow}" opacity=".5"/><circle cx="304" cy="458" r="18" fill="${deep}" opacity=".16"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675" role="img" aria-labelledby="title desc">
  <title id="title">${esc(post.title)}</title>
  <desc id="desc">Editorial infrastructure visual for ${esc(post.category)}.</desc>
  <defs>
    <radialGradient id="g1" cx="18%" cy="14%" r="60%"><stop stop-color="${accent}" stop-opacity=".48"/><stop offset="1" stop-color="${bg}" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2" cx="86%" cy="12%" r="58%"><stop stop-color="${glow}" stop-opacity=".42"/><stop offset="1" stop-color="${bg}" stop-opacity="0"/></radialGradient>
    <linearGradient id="split" x1="0" x2="1"><stop stop-color="${bg}"/><stop offset=".55" stop-color="${bg}"/><stop offset=".55" stop-color="${layout % 2 ? "#fffdf2" : "#eef8ff"}"/><stop offset="1" stop-color="${layout % 2 ? "#eef8ff" : "#fff7d1"}"/></linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="22" stdDeviation="22" flood-color="#12213a" flood-opacity=".14"/></filter>
  </defs>
  <rect width="1200" height="675" fill="${layout === 5 ? "url(#split)" : bg}"/>
  <rect width="1200" height="675" fill="url(#g1)"/>
  <rect width="1200" height="675" fill="url(#g2)"/>
  <g opacity=".9">${backgroundPattern}</g>
  <g>${lines}${nodes}</g>
  <g transform="translate(-300 0)">${motifFrame}</g>
  <g transform="translate(-300 0)" filter="url(#shadow)">${motif(kind, colors, seed)}</g>
  ${accentPanel}
</svg>`;
}

const files = fs.readdirSync(blogDir).filter((file) => file.endsWith(".md")).sort();
files.forEach((file, index) => {
  const full = path.join(blogDir, file);
  const parsed = parse(fs.readFileSync(full, "utf8"));
  const slug = parsed.data.slug || file.replace(/\.md$/, "");
  const imagePath = `/assets/blog-images/${slug}.svg`;
  parsed.data.image = imagePath;
  parsed.data.imageAlt = `${parsed.data.title} editorial infrastructure visual`;
  fs.writeFileSync(path.join(imageDir, `${slug}.svg`), svg(parsed.data, index));
  fs.writeFileSync(full, `---\n${frontmatter(parsed.data)}\n---\n${parsed.body}`);
});

console.log(`Assigned ${files.length} unique local blog images.`);
