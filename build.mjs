import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

const outputRoot = path.resolve("docs/games");
const versionTag = randomUUID();

async function discoverCatalogFromDirectory(outputRoot) {
  const entries = await readdir(outputRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({ id: entry.name }));
}

const catalog = await discoverCatalogFromDirectory(outputRoot);

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

function addGoogleAnalyticsLoader(html) {
  if (/googletagmanager\.com|data-l3v3-gtag|gtag\(|G-FW4YV3KZ23/.test(html)) {
    return html;
  }

  const analyticsScript = `<script src="../analytics.js"></script>`;
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${analyticsScript}\n</head>`);
  }

  return `${html}\n${analyticsScript}`;
}

function addBackToHomeIcon(html) {
  const homeIcon = `<a id="back-to-home" href="../../index.html" title="Back to Home" aria-label="Back to Home" style="position: fixed; top: 12px; left: 12px; z-index: 2147483647; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: #ffffff; background: rgba(0, 0, 0, 0.65); border: 1px solid rgba(255, 255, 255, 0.85); font: 26px/1 Georgia, serif; text-decoration: none; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4); pointer-events: auto; touch-action: manipulation; isolation: isolate;">⌂</a>`;

  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${homeIcon}\n</body>`);
  }

  return `${html}\n${homeIcon}`;
}

await mkdir(outputRoot, { recursive: true });

for (const htmlPath of [path.resolve("docs/index.html"), path.resolve("docs/oauth/index.html")]) {
  try {
    const html = await readFile(htmlPath, "utf8");
    const htmlWithVersionTagConstant = replaceVersionTagConstant(html, versionTag);
    const htmlWithVersionedReferences = addVersionToHtmlReferences(htmlWithVersionTagConstant, versionTag);
    await writeFile(htmlPath, htmlWithVersionedReferences);
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
  const htmlWithHomeIcon = addBackToHomeIcon(htmlWithAnalytics);
  const htmlWithVersionedReferences = addVersionToHtmlReferences(htmlWithHomeIcon, versionTag);
  await writeFile(htmlPath, htmlWithVersionedReferences);
}

console.log(`Updated ${catalog.length} game${catalog.length === 1 ? "" : "s"} using docs HTML in place with version tag ${versionTag}.`);
