import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const contentDir = path.join(root, "content/blog");
const blogDir = path.join(root, "blog");
const site = "https://www.fluidrwa.com";
const today = "2026-05-27";

function esc(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugify(value) {
  return String(value).toLowerCase().replaceAll("&", "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
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
    if (value.includes("|")) data[key] = value.split("|").map((v) => v.trim()).filter(Boolean);
    else data[key] = value;
  }
  return { data, body: match[2].trim() };
}

function inlineMarkdown(text) {
  return esc(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function markdownToHtml(body) {
  const lines = body.split("\n");
  const out = [];
  let list = false;
  let paragraph = [];
  const flushP = () => {
    if (paragraph.length) {
      out.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };
  const closeList = () => {
    if (list) {
      out.push("</ul>");
      list = false;
    }
  };
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushP();
      closeList();
      continue;
    }
    if (trimmed.startsWith("### ")) {
      flushP();
      closeList();
      out.push(`<h3>${inlineMarkdown(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith("## ")) {
      flushP();
      closeList();
      out.push(`<h2>${inlineMarkdown(trimmed.slice(3))}</h2>`);
    } else if (trimmed.startsWith("- ")) {
      flushP();
      if (!list) {
        out.push("<ul>");
        list = true;
      }
      out.push(`<li>${inlineMarkdown(trimmed.slice(2))}</li>`);
    } else {
      paragraph.push(trimmed);
    }
  }
  flushP();
  closeList();
  return out.join("\n");
}

function readPosts() {
  return fs.readdirSync(contentDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const parsed = parseFrontmatter(fs.readFileSync(path.join(contentDir, file), "utf8"));
      const slug = parsed.data.slug || slugify(parsed.data.title);
      return { ...parsed.data, slug, body: parsed.body, html: markdownToHtml(parsed.body) };
    })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function header(active = "") {
  return `<header class="site-header light-header" data-site-header><nav class="nav" aria-label="Main navigation"><a class="brand light-brand" href="/index.html" aria-label="FluidRWA home"><img src="/assets/fluidrwa-small-logo.png" alt="FluidRWA"></a><button class="mobile-toggle light-toggle" type="button" aria-label="Open navigation" aria-expanded="false" data-nav-toggle><span></span><span></span><span></span></button><div class="nav-links light-nav-links" data-nav-links><a href="/index.html">Home</a><a href="/vendor-ecosystem.html">Vendors</a><a href="/solutions.html">Solutions</a><a href="/blog.html"${active === "blog" ? ' aria-current="page"' : ""}>Insights</a><a href="/team.html">Team</a><a href="/arcade.html">Arcade</a><a href="/contact.html">Contact</a><a class="nav-ecosystem-cta" href="/vendor-ecosystem.html">Explore Vendor Ecosystem</a></div></nav></header>`;
}

function footer() {
  return `<footer class="light-footer"><div class="light-container footer-grid-lite footer-simple"><a class="footer-brand-link" href="/index.html" aria-label="FluidRWA home"><img class="footer-logo-lite" src="/assets/fluidrwa-small-logo.png" alt="FluidRWA"></a><nav class="footer-legal-links" aria-label="Footer navigation"><a href="/contact.html">Contact Us</a><a href="/team.html">Team</a><a href="/arcade.html">Arcade</a><a href="/privacy.html">Privacy Policy</a><a href="/terms.html">Terms & Conditions</a></nav></div><div class="light-container footer-bottom-lite">© <span data-year></span> FluidRWA.</div></footer>`;
}

function blogStyles() {
  return `<style>
    .blog-page{background:#f8fbff;overflow-x:hidden}.blog-hero{padding:136px 0 52px;background:radial-gradient(circle at 12% 18%,rgba(255,227,110,.38),transparent 28%),radial-gradient(circle at 86% 16%,rgba(76,178,224,.24),transparent 30%),linear-gradient(135deg,#fffdf1 0%,#eff8ff 55%,#f8fbff 100%)}.blog-hero h1,.post-hero h1{margin:0;color:#12213a;font-family:var(--fluid-display);font-size:clamp(34px,5vw,58px);font-weight:650;letter-spacing:-.006em;line-height:1.08;overflow-wrap:anywhere}.blog-hero p,.post-hero p{max-width:760px;color:rgba(18,33,58,.72);font-size:18px;line-height:1.7}.blog-category-link{display:inline-flex;margin-top:16px;border:1px solid rgba(38,100,169,.18);border-radius:999px;background:rgba(255,255,255,.72);box-shadow:0 14px 34px rgba(18,33,58,.08);color:#12213a;padding:12px 18px;text-decoration:none;font-weight:950}.blog-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;padding:64px 0}.blog-card{overflow:hidden;border:1px solid rgba(38,100,169,.12);border-radius:24px;background:rgba(255,255,255,.78);box-shadow:0 18px 44px rgba(18,33,58,.06);text-decoration:none;color:#12213a;transition:transform .22s ease,box-shadow .22s ease}.blog-card:hover{transform:translateY(-4px);box-shadow:0 28px 70px rgba(38,100,169,.12)}.blog-card img{width:100%;aspect-ratio:16/10;object-fit:cover;object-position:center center;display:block}.blog-card div{padding:20px}.blog-card span,.post-meta{color:#2664a9;font-size:11px;font-weight:950;letter-spacing:.12em;text-transform:uppercase}.blog-card h2{margin:10px 0;color:#12213a;font-size:22px;line-height:1.16}.blog-card p{color:rgba(18,33,58,.68);line-height:1.62}.post-hero{padding:132px 0 38px;background:linear-gradient(135deg,#fffdf1 0%,#eff8ff 58%,#f8fbff 100%)}.post-layout{display:grid;grid-template-columns:minmax(0,1fr)280px;gap:44px;padding:52px 0}.post-main{max-width:830px;min-width:0}.post-main img{width:100%;border-radius:24px;box-shadow:0 24px 70px rgba(18,33,58,.09);margin-bottom:30px}.answer-box,.post-cta,.toc{border:1px solid rgba(38,100,169,.12);border-radius:22px;background:rgba(255,255,255,.78);box-shadow:0 18px 44px rgba(18,33,58,.06);padding:24px}.answer-box{margin-bottom:28px;background:linear-gradient(135deg,rgba(255,227,110,.26),rgba(234,249,255,.8))}.post-main h2{margin:36px 0 12px;color:#12213a;font-family:var(--fluid-display);font-size:30px;font-weight:650}.post-main h3{margin:28px 0 10px;color:#12213a;font-size:21px}.post-main p,.post-main li{color:rgba(18,33,58,.74);font-size:17px;line-height:1.76}.post-main a{color:#2664a9;font-weight:850;overflow-wrap:anywhere}.toc{position:sticky;top:110px;height:max-content;min-width:0}.toc strong{display:block;margin-bottom:12px;color:#12213a}.toc a{display:block;margin:10px 0;color:#2664a9;text-decoration:none;font-weight:800;overflow-wrap:anywhere}.post-cta{margin-top:36px;background:#12213a;color:#fff}.post-cta h2{margin:0 0 8px;color:#fff}.post-cta p{color:rgba(255,255,255,.76)}.post-cta a{display:inline-flex;margin-top:12px;border-radius:999px;background:#ffe36e;color:#12213a;padding:12px 18px;text-decoration:none;font-weight:950}.faq-list details{border:1px solid rgba(38,100,169,.12);border-radius:16px;background:#fff;margin:10px 0;padding:18px}.faq-list summary{cursor:pointer;color:#12213a;font-weight:900}@media(max-width:980px){.blog-grid,.post-layout{grid-template-columns:1fr}.toc{position:static}}@media(max-width:620px){.blog-grid{padding:40px 0}.post-layout{padding:32px 0}.blog-hero,.post-hero{padding-top:116px}.post-hero h1,.blog-hero h1{font-size:clamp(30px,8.8vw,38px)}.post-main h2{font-size:27px}.blog-card h2{font-size:21px}}
  </style>`;
}

function postPage(post, posts) {
  const url = `${site}/blog/${post.slug}/`;
  const socialImage = post.socialImage || post.image;
  const imageUrl = socialImage && socialImage.startsWith("/") ? `${site}${socialImage}` : socialImage;
  const faqs = [1, 2, 3].map((n) => ({ q: post[`faq${n}q`], a: post[`faq${n}a`] })).filter((f) => f.q && f.a);
  const headings = [...post.html.matchAll(/<h2>(.*?)<\/h2>/g)].map((m) => m[1].replace(/<[^>]+>/g, ""));
  const related = posts.filter((p) => p.slug !== post.slug).slice(0, 3);
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Article", headline: post.title, description: post.description, image: imageUrl, datePublished: post.date, dateModified: post.date, author: { "@type": "Organization", name: "FluidRWA" }, publisher: { "@type": "Organization", name: "FluidRWA", logo: { "@type": "ImageObject", url: `${site}/assets/fluidrwa-small-logo.png` } }, mainEntityOfPage: url },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: site }, { "@type": "ListItem", position: 2, name: "Insights", item: `${site}/blog.html` }, { "@type": "ListItem", position: 3, name: post.title, item: url }] },
      { "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }
    ]
  };
  const toc = headings.map((h) => `<a href="#${slugify(h)}">${esc(h)}</a>`).join("");
  const html = post.html.replace(/<h2>(.*?)<\/h2>/g, (_, h) => `<h2 id="${slugify(h.replace(/<[^>]+>/g, ""))}">${h}</h2>`);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(post.title)} | FluidRWA</title><meta name="description" content="${esc(post.description)}"><meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1"><meta name="author" content="FluidRWA"><link rel="canonical" href="${url}"><link rel="icon" href="/assets/favicon.png" type="image/png"><link rel="preload" as="image" href="/assets/fluidrwa-small-logo.png" fetchpriority="high"><link rel="stylesheet" href="/assets/styles-yellow-blue.css?v=forms-1"><meta property="og:type" content="article"><meta property="og:site_name" content="FluidRWA"><meta property="og:title" content="${esc(post.title)}"><meta property="og:description" content="${esc(post.description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${esc(imageUrl)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${esc(imageUrl)}">${blogStyles()}<script type="application/ld+json">${JSON.stringify(schema)}</script></head><body class="light-home blog-page">${header("blog")}<main><section class="post-hero"><div class="light-container"><p class="post-meta">${esc(post.category)}</p><h1>${esc(post.title)}</h1><p>${esc(post.description)}</p></div></section><div class="light-container post-layout"><article class="post-main"><img src="${esc(post.image)}?v=visual-6" alt="${esc(post.imageAlt || post.title)}" width="960" height="540" loading="eager" decoding="async"><div class="answer-box"><strong>Short answer</strong><p>${esc(post.answer)}</p></div>${html}<section class="faq-list" aria-labelledby="faq-title"><h2 id="faq-title">FAQ</h2>${faqs.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}</section><section class="post-cta"><h2>${esc(post.ctaTitle || "Find the right vendor faster.")}</h2><p>${esc(post.ctaText || "Use FluidRWA to move from broad research to a focused vendor path.")}</p><a href="${esc(post.ctaUrl || "/submit-project.html")}">${esc(post.ctaLabel || "Submit Project")}</a></section></article><aside class="toc"><strong>In this article</strong>${toc}<strong style="margin-top:24px">Related insights</strong>${related.map((p) => `<a href="/blog/${p.slug}/">${esc(p.title)}</a>`).join("")}</aside></div></main>${footer()}<script src="/assets/site.js?v=forms-1" defer></script></body></html>`;
}

function indexPage(posts) {
  const schema = { "@context": "https://schema.org", "@type": "CollectionPage", name: "FluidRWA Insights", url: `${site}/blog.html`, description: "SEO and AEO optimized guides about RWA, Web3 vendor discovery and digital asset infrastructure.", mainEntity: { "@type": "ItemList", numberOfItems: posts.length, itemListElement: posts.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.title, url: `${site}/blog/${p.slug}/` })) } };
  const imageUrl = `${site}/assets/social/blog.png`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>FluidRWA Insights | Web3 Vendor Discovery Guides</title><meta name="description" content="Read practical FluidRWA guides on RWA tokenization, Web3 infrastructure vendors, custody, compliance, payments, AI and digital asset operations."><meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1"><link rel="canonical" href="${site}/blog.html"><link rel="icon" href="/assets/favicon.png" type="image/png"><link rel="stylesheet" href="/assets/styles-yellow-blue.css?v=forms-1"><meta property="og:type" content="website"><meta property="og:site_name" content="FluidRWA"><meta property="og:title" content="FluidRWA Insights"><meta property="og:description" content="Clear guides for Web3 vendor discovery, RWA infrastructure and tokenized finance teams."><meta property="og:url" content="${site}/blog.html"><meta property="og:image" content="${imageUrl}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${imageUrl}">${blogStyles()}<script type="application/ld+json">${JSON.stringify(schema)}</script></head><body class="light-home blog-page">${header("blog")}<main><section class="blog-hero"><div class="light-container"><p class="eyebrow light-eyebrow">FluidRWA Insights</p><h1>Clear guides for Web3 vendor discovery.</h1><p>Explainers for teams choosing infrastructure across tokenization, compliance, custody, payments, AI, legal, audits and digital asset operations.</p><a class="blog-category-link" href="/blog/tokenization/">Browse Tokenization Guides</a></div></section><section class="light-container blog-grid">${posts.map((p) => `<a class="blog-card" href="/blog/${p.slug}/"><img src="${esc(p.image)}?v=visual-6" alt="${esc(p.imageAlt || p.title)}" width="640" height="400" loading="lazy" decoding="async"><div><span>${esc(p.category)}</span><h2>${esc(p.title)}</h2><p>${esc(p.description)}</p></div></a>`).join("")}</section></main>${footer()}<script src="/assets/site.js?v=forms-1" defer></script></body></html>`;
}

function categoryPage(posts, category, slug, title, description) {
  const categoryPosts = posts.filter((p) => p.category === category);
  const url = `${site}/blog/${slug}/`;
  const schema = { "@context": "https://schema.org", "@type": "CollectionPage", name: title, url, description, mainEntity: { "@type": "ItemList", numberOfItems: categoryPosts.length, itemListElement: categoryPosts.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.title, url: `${site}/blog/${p.slug}/` })) } };
  const imageUrl = `${site}/assets/social/blog.png`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)} | FluidRWA</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1"><link rel="canonical" href="${url}"><link rel="icon" href="/assets/favicon.png" type="image/png"><link rel="stylesheet" href="/assets/styles-yellow-blue.css?v=forms-1"><meta property="og:type" content="website"><meta property="og:site_name" content="FluidRWA"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${imageUrl}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${imageUrl}">${blogStyles()}<script type="application/ld+json">${JSON.stringify(schema)}</script></head><body class="light-home blog-page">${header("blog")}<main><section class="blog-hero"><div class="light-container"><p class="eyebrow light-eyebrow">Tokenization Blogs</p><h1>${esc(title)}</h1><p>${esc(description)}</p></div></section><section class="light-container blog-grid">${categoryPosts.map((p) => `<a class="blog-card" href="/blog/${p.slug}/"><img src="${esc(p.image)}?v=visual-6" alt="${esc(p.imageAlt || p.title)}" width="640" height="400" loading="lazy" decoding="async"><div><span>${esc(p.category)}</span><h2>${esc(p.title)}</h2><p>${esc(p.description)}</p></div></a>`).join("")}</section></main>${footer()}<script src="/assets/site.js?v=forms-1" defer></script></body></html>`;
}

function updateSitemap(posts) {
  const sitemapPath = path.join(root, "sitemap.xml");
  let sitemap = fs.readFileSync(sitemapPath, "utf8");
  sitemap = sitemap.replace(/\s*<url><loc>https:\/\/www\.fluidrwa\.com\/blog(?:\.html|\/[^<]*)<\/loc>[\s\S]*?<\/url>/g, "");
  const entries = [`  <url><loc>${site}/blog.html</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.85</priority></url>`, `  <url><loc>${site}/blog/tokenization/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.78</priority></url>`, ...posts.map((p) => `  <url><loc>${site}/blog/${p.slug}/</loc><lastmod>${p.date}</lastmod><changefreq>monthly</changefreq><priority>0.72</priority></url>`)].join("\n");
  sitemap = sitemap.replace(/\s*<\/urlset>/, `\n${entries}\n</urlset>`);
  fs.writeFileSync(sitemapPath, sitemap);
}

function updateLlms(posts) {
  const llmsPath = path.join(root, "llms.txt");
  let text = fs.readFileSync(llmsPath, "utf8");
  text = text.replace(/\n## Blog insights[\s\S]*?(?=\n## |$)/, "");
  const block = `\n## Blog insights\n\n- Blog index: ${site}/blog.html\n- Tokenization blog category: ${site}/blog/tokenization/\n${posts.map((p) => `- ${p.title}: ${site}/blog/${p.slug}/`).join("\n")}\n`;
  text = text.replace("\n## Core vendor categories", `${block}\n## Core vendor categories`);
  fs.writeFileSync(llmsPath, text);
}

const posts = readPosts();
fs.rmSync(blogDir, { recursive: true, force: true });
fs.mkdirSync(blogDir, { recursive: true });
for (const post of posts) {
  const dir = path.join(blogDir, post.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), postPage(post, posts));
}
fs.writeFileSync(path.join(root, "blog.html"), indexPage(posts));
fs.mkdirSync(path.join(blogDir, "tokenization"), { recursive: true });
fs.writeFileSync(path.join(blogDir, "tokenization", "index.html"), categoryPage(posts, "Tokenization", "tokenization", "Tokenization Blogs and Asset Tokenization Guides", "Answer-first guides for asset tokenization, RWA infrastructure, tokenization platforms, compliance, costs, risks, investors and implementation."));
updateSitemap(posts);
updateLlms(posts);
console.log(`Built ${posts.length} blog posts.`);
