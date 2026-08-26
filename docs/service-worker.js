const GAME_PREFIX = "l3v3-game-";

const MIME_TYPES = {
  ".html":"text/html",
  ".js":"text/javascript",
  ".mjs":"text/javascript",
  ".css":"text/css",
  ".json":"application/json",
  ".png":"image/png",
  ".jpg":"image/jpeg",
  ".jpeg":"image/jpeg",
  ".gif":"image/gif",
  ".webp":"image/webp",
  ".svg":"image/svg+xml",
  ".ico":"image/x-icon",
  ".mp3":"audio/mpeg",
  ".wav":"audio/wav",
  ".ogg":"audio/ogg",
  ".mp4":"video/mp4",
  ".webm":"video/webm",
  ".wasm":"application/wasm",
  ".txt":"text/plain",
  ".xml":"application/xml"
};

self.addEventListener("install", event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

function getMimeType(path) {
  const lower = path.toLowerCase();
  for (const extension of Object.keys(MIME_TYPES)) {
    if (lower.endsWith(extension)) return MIME_TYPES[extension];
  }
  return "application/octet-stream";
}

function gameUrl(game, filePath) {
  return new URL(`/${game}/${filePath}`, self.location.origin).href;
}

async function deleteOldGameCaches(game) {
  const names = await caches.keys();
  const prefix = `${GAME_PREFIX}${game}-`;
  await Promise.all(
    names.filter(name => name.startsWith(prefix)).map(name => caches.delete(name))
  );
}

async function installGame(game, files) {
  if (!game) throw new Error("Missing game name.");
  if (!Array.isArray(files)) throw new Error("Missing game files.");

  await deleteOldGameCaches(game);

  const cacheName = `${GAME_PREFIX}${game}-${Date.now()}`;
  const cache = await caches.open(cacheName);

  for (const file of files) {
    if (!file.path || !file.data) continue;

    const path = file.path.replace(/^\/+/, "");
    const response = new Response(file.data, {
      status: 200,
      headers: {
        "Content-Type": getMimeType(path),
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });

    await cache.put(gameUrl(game, path), response);
  }

  await cache.put(
    gameUrl(game, "__l3v3_manifest__"),
    new Response(JSON.stringify({
      game,
      cacheName,
      installedAt: new Date().toISOString()
    }), {
      headers: {"Content-Type": "application/json"}
    })
  );
}

async function findGameResponse(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  const match = path.match(/^\/([^/]+)(?:\/(.*))?$/);
  if (!match) return null;

  const game = match[1];
  let filePath = match[2] || "index.html";

  if (filePath.endsWith("/")) filePath += "index.html";

  const names = await caches.keys();
  const prefix = `${GAME_PREFIX}${game}-`;
  const gameCaches = names.filter(name => name.startsWith(prefix));

  if (!gameCaches.length) return null;

  gameCaches.sort().reverse();

  for (const cacheName of gameCaches) {
    const cache = await caches.open(cacheName);
    const response = await cache.match(gameUrl(game, filePath));
    if (response) return response;
  }

  return null;
}

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const path = new URL(request.url).pathname;

  if (
    path === "/" ||
    path === "/index.html" ||
    path === "/launcher.js" ||
    path === "/service-worker.js"
  ) {
    return;
  }

  event.respondWith(
    (async () => {
      const gameResponse = await findGameResponse(request);
      return gameResponse || fetch(request);
    })()
  );
});

self.addEventListener("message", event => {
  if (event.data?.type !== "LOAD_GAME") return;

  const port = event.ports?.[0];

  (async () => {
    try {
      await installGame(event.data.game, event.data.files);
      port?.postMessage({ok: true});
    } catch (error) {
      console.error("Game installation failed:", error);
      port?.postMessage({
        ok: false,
        error: error.message || String(error)
      });
    }
  })();
});
