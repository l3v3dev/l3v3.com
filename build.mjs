import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

const outputRoot = path.resolve("docs/games");
const versionTag = randomUUID();
const siteUrl = "https://www.l3v3.com";

const gameTitles = {
  "cricket-batting": "Cricket Game | Browser Arcade Batting",
  "football-playcall": "Gridiron Playcall | Football Strategy Game",
  "football-soccer": "Football / Soccer Game | Quick Browser Match",
  "function-path": "Math Path | Educational Puzzle Game",
  "function-runner": "Function Runner | Coding Challenge Game",
  "lighthouse-keeper": "Lighthouse Keeper | Survival Browser Game",
  "llm-inference": "The GPT Language Model Maze | AI Puzzle Game",
  "llm-train": "Gradient Descent: Token Trainer | ML Education Game",
  "stickfigure-duel": "Ink Duel | Stick Figure Battle Game",
};

const staticPageMeta = {
  "docs/index.html": {
    title: "l3v3 | Local browser games",
    description: "Play free browser games and educational experiments from l3v3, built for quick local play in the browser.",
    keywords: "free browser games, educational games, math games, coding games, AI games, sports games, action games",
    url: `${siteUrl}/`
  },
  "docs/oauth/index.html": {
    title: "l3v3 | Login",
    description: "Learn about the l3v3 login experience and explore the site’s browser game catalog.",
    url: `${siteUrl}/oauth/`
  },
  "docs/privacy/index.html": {
    title: "l3v3 | Privacy",
    description: "Review the l3v3 privacy notice, analytics disclosure, and data handling information.",
    url: `${siteUrl}/privacy/`
  },
  "docs/terms/index.html": {
    title: "l3v3 | Terms",
    description: "Read the l3v3 terms of use and site policies for browser games and educational content.",
    url: `${siteUrl}/terms/`
  }
};

async function discoverCatalogFromDirectory(outputRoot) {
  const entries = await readdir(outputRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({ id: entry.name }));
}

const catalog = await discoverCatalogFromDirectory(outputRoot);

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildSitemap(catalog) {
  const urls = [
    `${siteUrl}/`,
    `${siteUrl}/privacy/`,
    `${siteUrl}/terms/`,
    ...catalog.map((game) => `${siteUrl}/games/${game.id}/`)
  ];
  const entries = urls
    .map((url) => `  <url>\n    <loc>${escapeXml(url)}</loc>\n  </url>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

function shouldSkipHtmlResource(resource) {
  return !resource ||
    resource.startsWith("data:") ||
    resource.startsWith("#") ||
    resource.startsWith("mailto:") ||
    resource.startsWith("tel:") ||
    resource.startsWith("//") ||
    /^[a-z]+:\/\//i.test(resource);
}

function addVersionToResource(resource, versionTag) {
  if (/(^|[?&])v=/.test(resource)) {
    return resource.replace(/([?&])v=[^&]*/i, `$1v=${versionTag}`);
  }

  const separator = resource.includes("?") ? "&" : "?";
  return `${resource}${separator}v=${versionTag}`;
}

function replaceVersionTagConstant(html, versionTag) {
  return html.replace(/const\s+VERSION_TAG\s*=\s*["'][^"']*["'];?/i, `const VERSION_TAG = "${versionTag}";`);
}

function addVersionToHtmlReferences(html, versionTag) {
  const assetAttributePattern = /(src|href|poster|xlink:href)\s*=\s*(["'])([^"']+)(["'])/gi;
  const srcsetPattern = /srcset\s*=\s*(["'])([^"']+)(["'])/gi;

  const versionedHtml = html.replace(assetAttributePattern, (match, attribute, quote, resource) => {
    if (shouldSkipHtmlResource(resource)) {
      return match;
    }

    return `${attribute}=${quote}${addVersionToResource(resource, versionTag)}${quote}`;
  });

  return versionedHtml.replace(srcsetPattern, (match, quote, srcsetValue) => {
    const entries = srcsetValue.split(/\s*,\s*/).map((entry) => entry.trim()).filter(Boolean);
    const versionedEntries = entries.map((entry) => {
      const parts = entry.split(/\s+/);
      const resource = parts[0];
      const descriptor = parts.slice(1).join(" ");

      if (shouldSkipHtmlResource(resource)) {
        return entry;
      }

      return `${addVersionToResource(resource, versionTag)}${descriptor ? ` ${descriptor}` : ""}`;
    });

    return `srcset=${quote}${versionedEntries.join(", ")}${quote}`;
  });
}

function addVersionToGameLinks(game, versionTag) {
  return `${game.id}/index.html?v=${versionTag}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function addSeoMetadata(html, { title, description, keywords, url, image = `${siteUrl}/favicon.png`, ogType = "website" } = {}) {
  const finalTitle = title || "l3v3";
  const finalDescription = description || "Play browser games and educational experiments from l3v3.";
  const finalUrl = url || siteUrl;

  const titleTag = `<title>${escapeHtml(finalTitle)}</title>`;
  const tags = [
    `<meta name="description" content="${escapeHtml(finalDescription)}">`,
    keywords ? `<meta name="keywords" content="${escapeHtml(keywords)}">` : null,
    `<meta name="robots" content="index,follow">`,
    `<link rel="canonical" href="${escapeHtml(finalUrl)}">`,
    `<meta property="og:type" content="${escapeHtml(ogType)}">`,
    `<meta property="og:site_name" content="l3v3">`,
    `<meta property="og:title" content="${escapeHtml(finalTitle)}">`,
    `<meta property="og:description" content="${escapeHtml(finalDescription)}">`,
    `<meta property="og:url" content="${escapeHtml(finalUrl)}">`,
    `<meta property="og:image" content="${escapeHtml(image)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(finalTitle)}">`,
    `<meta name="twitter:description" content="${escapeHtml(finalDescription)}">`,
    `<meta name="twitter:image" content="${escapeHtml(image)}">`
  ].filter(Boolean).join("\n  ");

  const managedMetadataPattern = /(?:\s*<meta\s+(?:(?:name|property)="(?:description|keywords|robots|og:type|og:site_name|og:title|og:description|og:url|og:image|twitter:card|twitter:title|twitter:description|twitter:image)"[^>]*>)|\s*<link\s+rel="canonical"[^>]*>|\s*<script\s+type="application\/ld\+json"\s+data-l3v3-seo>[\s\S]*?<\/script>)\s*/gi;
  let updated = html.replace(managedMetadataPattern, "");
  if (/<title\s*>.*?<\/title>/i.test(updated)) {
    updated = updated.replace(/<title\s*>.*?<\/title>/i, titleTag);
  } else if (/<\/head>/i.test(updated)) {
    updated = updated.replace(/<\/head>/i, `${titleTag}\n</head>`);
  }

  if (/<\/head>/i.test(updated)) {
    return updated.replace(/<\/head>/i, `  ${tags}\n</head>`);
  }

  return `${updated}\n${titleTag}\n${tags}`;
}

function addGoogleAnalyticsLoader(html) {
  if (/googletagmanager\.com|data-l3v3-gtag|gtag\(|G-FW4YV3KZ23|analytics\.js/.test(html)) {
    return html;
  }

  const analyticsScript = `<script src="../analytics.js"></script>`;
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${analyticsScript}\n</head>`);
  }

  return `${html}\n${analyticsScript}`;
}

function addConsentControlledGameLoader(html) {
  return html.replace(/<script\s+defer\s+src=(['"])([^'"]*game\.min\.js[^'"]*)\1\s*><\/script>/gi, (match, quote, resource) => {
    return `<script data-l3v3-game-src=${quote}${resource}${quote}></script>`;
  });
}

function addBackToHomeIcon(html) {
  const homeIcon = `<a id="back-to-home" href="../../index.html" title="Back to Home" aria-label="Back to Home" style="position: fixed; top: 12px; left: 12px; z-index: 2147483647; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: #ffffff; background: rgba(0, 0, 0, 0.65); border: 1px solid rgba(255, 255, 255, 0.85); font: 26px/1 Georgia, serif; text-decoration: none; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4); pointer-events: auto; touch-action: manipulation; isolation: isolate;">⌂</a>`;

  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${homeIcon}\n</body>`);
  }

  return `${html}\n${homeIcon}`;
}

await mkdir(outputRoot, { recursive: true });
await writeFile(path.resolve("docs/sitemap.xml"), buildSitemap(catalog));
await writeFile(path.resolve("docs/robots.txt"), "User-agent: *\nAllow: /\n\nSitemap: https://www.l3v3.com/sitemap.xml\n");

for (const htmlPath of [
  path.resolve("docs/index.html"),
  path.resolve("docs/oauth/index.html"),
  path.resolve("docs/privacy/index.html"),
  path.resolve("docs/terms/index.html")
]) {
  try {
    const html = await readFile(htmlPath, "utf8");
    const htmlWithVersionTagConstant = replaceVersionTagConstant(html, versionTag);
    const htmlWithVersionedReferences = addVersionToHtmlReferences(htmlWithVersionTagConstant, versionTag);
    const relativePath = path.relative(process.cwd(), htmlPath).replace(/\\/g, "/");
    const meta = staticPageMeta[relativePath] || staticPageMeta["docs/index.html"];
    const htmlWithSeo = addSeoMetadata(htmlWithVersionedReferences, {
      title: meta.title,
      description: meta.description,
      keywords: meta.keywords,
      url: meta.url,
      image: `${siteUrl}/favicon.png`
    });
    await writeFile(htmlPath, htmlWithSeo);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      console.log(`Skipping missing static docs page: ${htmlPath}`);
      continue;
    }
    throw error;
  }
}

for (const game of catalog) {
  if (!/^[a-z0-9-]+$/.test(game.id)) throw new Error(`Invalid game id: ${game.id}`);

  const outputDir = path.join(outputRoot, game.id);
  const htmlPath = path.join(outputDir, "index.html");

  try {
    await readFile(htmlPath, "utf8");
  } catch (error) {
    if (error && error.code === "ENOENT") {
      console.log(`Skipping missing docs game page: ${game.id}`);
      continue;
    }
    throw error;
  }

  const html = await readFile(htmlPath, "utf8");
  const htmlWithAnalytics = addGoogleAnalyticsLoader(html);
  const htmlWithConsentGate = addConsentControlledGameLoader(htmlWithAnalytics);
  const htmlWithHomeIcon = addBackToHomeIcon(htmlWithConsentGate);
  const htmlWithVersionedReferences = addVersionToHtmlReferences(htmlWithHomeIcon, versionTag);
  const gameTitle = gameTitles[game.id] || game.id.replace(/-/g, " ");
  const gameDescriptions = {
    "cricket-batting": "Play Cricket, a fast browser batting game on l3v3 with arcade timing, simple controls, and quick replayability.",
    "football-playcall": "Play Gridiron Playcall, a football strategy game on l3v3 with tactical decisions, play calling, and replayable matchups.",
    "football-soccer": "Play Football / Soccer, a quick browser match game on l3v3 built for instant arcade action and simple controls.",
    "function-path": "Play Math Path, an educational puzzle game on l3v3 that turns algebraic reasoning into a visual pathfinding challenge.",
    "function-runner": "Play Function Runner, a browser coding challenge game on l3v3 that mixes logic, timing, and speed-run strategy.",
    "lighthouse-keeper": "Play Lighthouse Keeper, a survival browser game on l3v3 where you manage light, safety, and endurance through shifting conditions.",
    "llm-inference": "Play The GPT Language Model Maze, an AI puzzle game on l3v3 where token prediction and maze navigation meet.",
    "llm-train": "Play Gradient Descent: Token Trainer, an educational ML game on l3v3 that teaches model learning through interactive choices.",
    "stickfigure-duel": "Play Ink Duel, a minimalist stick figure battle game on l3v3 with fast duels and satisfying timing-based combat."
  };
  const htmlWithSeo = addSeoMetadata(htmlWithVersionedReferences, {
    title: `l3v3 | ${gameTitle}`,
    description: gameDescriptions[game.id] || `Play ${gameTitle} on l3v3, a quick browser game and creative challenge built for local play.`,
    url: `${siteUrl}/games/${game.id}/`,
    image: `${siteUrl}/favicon.png`
  });
  await writeFile(htmlPath, htmlWithSeo);
}

console.log(`Updated ${catalog.length} game${catalog.length === 1 ? "" : "s"} using docs HTML in place with version tag ${versionTag}.`);
