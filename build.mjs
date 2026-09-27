import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

const outputRoot = path.resolve("docs/games");
const versionTag = randomUUID();
const siteUrl = "https://www.l3v3.com";

const gameTitles = {
  "cricket-batting": "Cricket | Chase the score",
  "football-playcall": "Gridiron Playcall | Call the play",
  "football-soccer": "Football | Sevens soccer",
  "function-path": "Math Path | Algebra and function graph puzzle",
  "function-path-3d": "Math Path 3D | 3D math puzzle game",
  "function-runner": "Function Runner | Function graph math game",
  "lighthouse-keeper": "Lighthouse Keeper | Keep lights on",
  "llm-inference": "LLM Inference | Token prediction AI maze",
  "llm-inference-3d": "LLM Inference 3D | GPT model visualization",
  "llm-train": "LLM Trainer | Learn gradient descent and AI",
  "rush-hour": "Rush Hour | Traffic logic puzzle game",
  "stickfigure-duel": "Ink Duel | Stick Figure Battle",
  "wylwyl": "wylwyl | Why you learn what you learn",
};

const staticPageMeta = {
  "docs/index.html": {
    title: "l3v3 | Local browser games",
    description: "Play browser games and interactive learning games covering algebra, function graphs, physics, probability, AI and machine learning, alongside sports and logic puzzles.",
    keywords: "browser games, educational browser games, STEM games, algebra games, function graph games, physics games, probability games, AI education games, machine learning games, logic puzzles, sports games",
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
    "function-path": "Practice algebra, function graphs, slopes, parabolas, trigonometry, projectile motion, probability and expected value in Math Path, an interactive browser math game.",
    "function-path-3d": "Explore 3D math challenges and spatial reasoning in Math Path 3D, an interactive browser puzzle built around navigating a three-dimensional path.",
    "function-runner": "Explore function graphs through trigonometric, polynomial and exponential curves, Fourier series, signal processing and physics in Function Runner, a browser math game.",
    "lighthouse-keeper": "Play Lighthouse Keeper, a survival browser game on l3v3 where you manage light, safety, and endurance through shifting conditions.",
    "llm-inference": "Explore tokenization, next-token prediction and language-model concepts in The GPT Language Model Maze, an interactive browser AI game.",
    "llm-inference-3d": "Explore tokens, transformer layers and language-model inference in an interactive 3D AI visualization built for browser play.",
    "llm-train": "Learn machine-learning concepts through play, including gradient descent, loss curves, learning rates, local minima, cross-entropy, masked-token prediction and backpropagation.",
    "rush-hour": "Solve a timed traffic puzzle by planning routes around moving vehicles and obstacles in Rush Hour, a browser game that builds logic and spatial reasoning.",
    "stickfigure-duel": "Play Ink Duel, a minimalist stick figure battle game on l3v3 with fast duels and satisfying timing-based combat.",
    "wylwyl": "Explore why you learn what you learn in Wylwyl, an educational browser game about learning and knowledge."
  };
  const gameKeywords = {
    "cricket-batting": "cricket game, cricket batting game, browser cricket game, arcade batting game",
    "football-playcall": "football strategy game, football play calling game, American football tactics, browser football game",
    "football-soccer": "soccer game, football game, browser soccer game, arcade soccer match",
    "function-path": "algebra game, function graph game, graphing functions, linear equations, quadratic functions, trigonometry, projectile motion, probability, expected value, interactive math game",
    "function-path-3d": "3D math game, 3D math puzzle, spatial reasoning game, function puzzle game, interactive math game, browser puzzle game",
    "function-runner": "function graph game, trigonometry, polynomial functions, exponential functions, Fourier series, signal processing, physics game, interactive math game",
    "lighthouse-keeper": "lighthouse survival game, browser survival game, arcade action game",
    "llm-inference": "AI game, language model game, tokenization, next-token prediction, artificial intelligence education, browser AI puzzle",
    "llm-inference-3d": "3D AI visualization, transformer model, language model inference, token embeddings, neural network visualization, AI education game",
    "llm-train": "machine learning game, gradient descent, loss function, learning rate, local minima, cross-entropy, masked language model, backpropagation, neural network education",
    "rush-hour": "traffic puzzle game, logic puzzle, spatial reasoning game, route planning puzzle, browser puzzle game",
    "stickfigure-duel": "stick figure fighting game, browser fighting game, arcade duel game",
    "wylwyl": "educational browser game, learning game, learning and knowledge, interactive education"
  };
  const htmlWithSeo = addSeoMetadata(htmlWithVersionedReferences, {
    title: `l3v3 | ${gameTitle}`,
    description: gameDescriptions[game.id] || `Play ${gameTitle} on l3v3, a quick browser game and creative challenge built for local play.`,
    keywords: gameKeywords[game.id],
    url: `${siteUrl}/games/${game.id}/`,
    image: `${siteUrl}/favicon.png`
  });
  await writeFile(htmlPath, htmlWithSeo);
}

console.log(`Updated ${catalog.length} game${catalog.length === 1 ? "" : "s"} using docs HTML in place with version tag ${versionTag}.`);
