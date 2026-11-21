(function() {
  const script = document.currentScript;
  const scriptUrl = new URL(script.src);
  const versionTag = scriptUrl.searchParams.get("v");
  const catalogUrl = new URL("game-catalog.json", scriptUrl);
  if (versionTag) catalogUrl.searchParams.set("v", versionTag);
  const preferencesKey = "l3v3.settings";

  function readPreferences() {
    try {
      const saved = JSON.parse(localStorage.getItem(preferencesKey) || "{}");
      return {
        shuffleCards: saved.shuffleCards === true,
        showGameIcons: saved.showGameIcons !== false
      };
    } catch (error) {
      return { shuffleCards: false, showGameIcons: true };
    }
  }

  window.L3V3_PREFERENCES = readPreferences();

  function shuffleGames(games) {
    const shuffledGames = games.slice();
    for (let index = shuffledGames.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffledGames[index], shuffledGames[swapIndex]] = [shuffledGames[swapIndex], shuffledGames[index]];
    }
    return shuffledGames;
  }

  function createCard(game, pathPrefix) {
    const card = document.createElement("div");
    card.className = "game-card";
    card.dataset.category = game.category;
    card.dataset.gameId = game.id;
    card.dataset.status = game.status || "";
    if (game.trailer) card.dataset.trailer = game.trailer;
    if (game.post) card.dataset.post = game.post;

    const link = document.createElement("a");
    link.className = "game";
    link.href = `${pathPrefix}games/${game.id}/index.html${versionTag ? `?v=${encodeURIComponent(versionTag)}` : ""}`;

    const icon = document.createElement("img");
    icon.className = "game-icon";
    icon.src = `${pathPrefix}games/${game.id}/assets/gameicon.png${versionTag ? `?v=${encodeURIComponent(versionTag)}` : ""}`;
    icon.width = 32;
    icon.height = 32;
    icon.alt = "";
    icon.loading = "lazy";

    const title = document.createElement("span");
    title.className = "game-name";
    title.textContent = game.title;
    if (game.tagline) {
      const tagline = document.createElement("span");
      tagline.className = "game-tagline";
      tagline.textContent = game.tagline;
      title.append(document.createTextNode(" "), tagline);
    }

    link.append(icon, title);
    if (game.status) {
      const status = document.createElement("span");
      status.className = "game-status";
      status.textContent = game.status;
      status.setAttribute("aria-label", `Game status: ${game.status}`);
      link.append(status);
    }

    const arrow = document.createElement("span");
    arrow.className = "arrow";
    link.append(arrow);

    const infoButton = document.createElement("button");
    infoButton.className = "info-button";
    infoButton.type = "button";
    infoButton.setAttribute("aria-label", "More information");
    infoButton.textContent = "i";
    link.append(infoButton);
    card.append(link);
    return card;
  }

  function getFeaturedLimit(catalog) {
    const configuredLimit = Number(catalog.featuredLimit);
    return Number.isFinite(configuredLimit) && configuredLimit >= 0 ? Math.floor(configuredLimit) : 7;
  }

  function createMoreCard() {
    const card = document.createElement("div");
    card.className = "game-card";
    card.dataset.category = "All";
    const link = document.createElement("a");
    link.className = "game";
    link.id = "more-link";
    link.href = `oauth/index.html${versionTag ? `?v=${encodeURIComponent(versionTag)}` : ""}`;
    const label = document.createElement("span");
    label.className = "more-label";
    const title = document.createElement("span");
    title.className = "game-name";
    title.textContent = "More";
    const arrow = document.createElement("span");
    arrow.className = "arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = " »";
    label.append(title, arrow);
    const infoButton = document.createElement("button");
    infoButton.className = "info-button";
    infoButton.type = "button";
    infoButton.setAttribute("aria-label", "More information");
    infoButton.textContent = "i";
    link.append(label, infoButton);
    card.append(link);
    return card;
  }

  window.L3V3_CATALOG_READY = (async function() {
    try {
      const response = await fetch(catalogUrl);
      if (!response.ok) return false;
      const catalog = await response.json();
      if (!Array.isArray(catalog.games)) return false;

      const container = document.getElementById("games");
      if (!container) return false;
      const page = document.body.dataset.gameCatalogPage;
      const pathPrefix = page === "more" ? "../" : "";
      const activeGames = catalog.games.filter(function(game) { return game.group === "active"; });
      const featuredLimit = getFeaturedLimit(catalog);
      let currentGames;

      function renderCatalog(event) {
        const preferences = window.L3V3_PREFERENCES;
        document.documentElement.dataset.showGameIcons = String(preferences.showGameIcons);

        if (!currentGames || event && event.detail && event.detail.setting === "shuffleCards") {
          const pageGames = page === "home"
            ? activeGames.slice(0, featuredLimit)
            : activeGames.slice(featuredLimit).concat(catalog.games.filter(function(game) {
              return game.group === "upcoming";
            }));
          currentGames = preferences.shuffleCards ? shuffleGames(pageGames) : pageGames;
        }

        if (page === "home") {
          const cards = currentGames.map(function(game) {
            return createCard(game, pathPrefix);
          });
          container.replaceChildren.apply(container, cards.concat(createMoreCard()));
        } else if (page === "more") {
          const cards = currentGames.map(function(game) { return createCard(game, pathPrefix); });
          container.replaceChildren.apply(container, cards);
        }
      }

      window.addEventListener("l3v3:settingschange", renderCatalog);
      renderCatalog();
      return true;
    } catch (error) {
      return false;
    }
  })();
})();
