const JSZIP_URL = "jszip.min.js";

const status = document.getElementById("status");

function setStatus(message) {
  status.textContent = message;
}

async function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Unable to load " + url));
    document.head.appendChild(script);
  });
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("This browser does not support Service Workers.");
  }

  await navigator.serviceWorker.register("./service-worker.js", {
    scope: "./"
  });

  await navigator.serviceWorker.ready;

  if (!navigator.serviceWorker.controller) {
    await new Promise(resolve => {
      const timeout = setTimeout(resolve, 2000);
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        clearTimeout(timeout);
        resolve();
      }, { once: true });
    });
  }

  if (!navigator.serviceWorker.controller) {
    throw new Error("Service Worker is not controlling this page yet. Reload once and try again.");
  }
}

async function extractZip(zipUrl) {
  setStatus("Downloading game...");

  const response = await fetch(zipUrl);
  if (!response.ok) {
    throw new Error(`Unable to download game (${response.status})`);
  }

  const data = await response.arrayBuffer();
  setStatus("Extracting game...");

  const zip = await JSZip.loadAsync(data);
  const files = [];

  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;

    const normalized = name.replace(/\\/g, "/");

    if (
      normalized.startsWith("/") ||
      normalized === ".." ||
      normalized.includes("../")
    ) {
      console.warn("Skipping unsafe ZIP entry:", name);
      continue;
    }

    files.push({
      path: normalized,
      data: await entry.async("arraybuffer")
    });
  }

  return files;
}

function sendFilesToServiceWorker(game, files) {
  return new Promise((resolve, reject) => {
    const controller = navigator.serviceWorker.controller;

    if (!controller) {
      reject(new Error("No active Service Worker controller."));
      return;
    }

    const channel = new MessageChannel();

    channel.port1.onmessage = event => {
      if (event.data?.ok) {
        resolve();
      } else {
        reject(new Error(event.data?.error || "Game installation failed."));
      }
    };

    const transferables = files.map(file => file.data);

    controller.postMessage(
      { type: "LOAD_GAME", game, files },
      [...transferables, channel.port2]
    );
  });
}

async function launchGame(game, zipUrl) {
  try {
    setStatus("Preparing game...");

    await registerServiceWorker();

    if (!window.JSZip) {
      await loadScript(JSZIP_URL);
    }

    const files = await extractZip(zipUrl);

    if (!files.length) {
      throw new Error("The ZIP file contains no files.");
    }

    setStatus("Installing game...");

    await sendFilesToServiceWorker(game, files);

    setStatus("Starting game...");

    await new Promise(resolve => setTimeout(resolve, 100));

    window.location.href = `/${game}/`;
  } catch (error) {
    console.error(error);
    setStatus("Unable to start the game: " + error.message);
  }
}

document.querySelectorAll("[data-game]").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    launchGame(link.dataset.game, link.dataset.zip);
  });
});
