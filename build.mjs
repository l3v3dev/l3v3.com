import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const outputRoot = path.resolve("docs/games");
const catalog = JSON.parse(await readFile(path.join(outputRoot, "games.json"), "utf8"));
const versionTag = process.env.BUILD_VERSION || process.env.VERSION_TAG || Date.now().toString(36);

function addVersionToHtmlReferences(html, versionTag) {
  return html.replace(/(src|href)=["']([^"']+)["']/g, (match, attribute, resource) => {
    if (!resource || resource.startsWith("data:") || resource.startsWith("#") || resource.startsWith("mailto:") || resource.startsWith("tel:") || /^[a-z]+:\/\//i.test(resource)) {
      return match;
    }

    const separator = resource.includes("?") ? "&" : "?";
    return `${attribute}="${resource}${separator}v=${versionTag}"`;
  });
}

function addVersionToGameLinks(game, versionTag) {
  return `${game.id}/index.html?v=${versionTag}`;
}

function addBackToHomeIcon(html) {
  const homeIcon = `<a id="back-to-home" href="../../index.html" title="Back to Home" aria-label="Back to Home" style="position: fixed; top: 12px; left: 12px; z-index: 2147483647; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: #ffffff; background: rgba(0, 0, 0, 0.65); border: 1px solid rgba(255, 255, 255, 0.85); font: 26px/1 Georgia, serif; text-decoration: none; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);">⌂</a>`;

  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${homeIcon}\n</body>`);
  }

  return `${html}\n${homeIcon}`;
}

await mkdir(outputRoot, { recursive: true });

for (const game of catalog) {
  if (!/^[a-z0-9-]+$/.test(game.id)) throw new Error(`Invalid game id: ${game.id}`);
  if (!game.title || !game.description || !game.category || !Array.isArray(game.tags)) {
    throw new Error(`Missing metadata for game: ${game.id}`);
  }

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
  const htmlWithHomeIcon = addBackToHomeIcon(html);
  await writeFile(htmlPath, htmlWithHomeIcon);
}

const catalogWithVersionedLinks = catalog.map((game) => ({
  ...game,
  href: addVersionToGameLinks(game, versionTag)
}));

await writeFile(path.join(outputRoot, "games.json"), `${JSON.stringify(catalogWithVersionedLinks, null, 2)}\n`);
console.log(`Updated ${catalog.length} game${catalog.length === 1 ? "" : "s"} using docs HTML in place with version tag ${versionTag}.`);
