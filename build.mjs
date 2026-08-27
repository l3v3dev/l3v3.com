import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";

const sourceRoot = path.resolve("src/games");
const outputRoot = path.resolve("docs/games");
const catalog = JSON.parse(await readFile(path.join(sourceRoot, "games.json"), "utf8"));

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

for (const game of catalog) {
  if (!/^[a-z0-9-]+$/.test(game.id)) throw new Error(`Invalid game id: ${game.id}`);
  if (!game.title || !game.description || !game.category || !Array.isArray(game.tags)) {
    throw new Error(`Missing metadata for game: ${game.id}`);
  }

  const sourceDir = path.join(sourceRoot, game.id);
  const outputDir = path.join(outputRoot, game.id);
  await mkdir(outputDir, { recursive: true });
  await cp(path.join(sourceDir, "index.html"), path.join(outputDir, "index.html"));

  await build({
    entryPoints: [path.join(sourceDir, "src/main.js")],
    outfile: path.join(outputDir, "game.min.js"),
    bundle: true,
    minify: true,
    format: "iife",
    target: "es2020",
    loader: { ".svg": "dataurl" },
    sourcemap: false,
    logLevel: "info",
  });
}

await writeFile(path.join(outputRoot, "games.json"), `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Built ${catalog.length} game${catalog.length === 1 ? "" : "s"}.`);
