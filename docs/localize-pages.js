(async function() {
  if (window.L3V3_CATALOG_READY) await window.L3V3_CATALOG_READY;

  function normalizeLanguage(language) {
    const parts = String(language || "").toLowerCase().split("-");
    if (parts[0] === "zh") {
      const script = parts.find(function(part) { return ["hans", "hant", "chs", "cht"].includes(part); });
      if (script) return script === "hant" || script === "cht" ? "zh-TW" : "zh";
      const region = parts.find(function(part) { return ["tw", "hk", "mo", "cn", "sg"].includes(part); });
      return ["tw", "hk", "mo"].includes(region) ? "zh-TW" : "zh";
    }
    return parts[0];
  }

  const requestedLanguage = new URLSearchParams(window.location.search).get("lang");
  const preferredLanguages = requestedLanguage ? [requestedLanguage] : [];
  if (Array.isArray(navigator.languages)) preferredLanguages.push.apply(preferredLanguages, navigator.languages);
  if (navigator.language) preferredLanguages.push(navigator.language);

  const logo = document.querySelector(".logo");
  const versionTag = logo ? new URL(logo.href).searchParams.get("v") : "";
  const catalogUrl = new URL("../locales.json", document.baseURI);
  if (versionTag) catalogUrl.searchParams.set("v", versionTag);

  let catalog;
  try {
    const response = await fetch(catalogUrl);
    if (!response.ok) return;
    catalog = await response.json();
  } catch (error) {
    return;
  }

  const language = preferredLanguages.map(normalizeLanguage).find(function(code) {
    return catalog[code] && catalog[code].pages;
  });
  if (!language) return;

  const styles = document.createElement("style");
  styles.textContent = ".localized-inline{color:var(--muted);font-size:.84em;font-weight:400}.localized-copy{display:block;margin-top:8px;color:var(--muted);font:inherit}";
  document.head.append(styles);

  document.querySelectorAll("[data-translation-key]").forEach(function(element) {
    const translation = element.dataset.translationKey.split(".").reduce(function(value, part) {
      return value && value[part];
    }, catalog[language].pages);
    if (typeof translation !== "string" || !translation.trim()) return;

    const localizedText = document.createElement("span");
    const isBlockCopy = element.matches("p, .under-subtitle");
    localizedText.className = isBlockCopy ? "localized-copy" : "localized-inline";
    localizedText.lang = language;
    localizedText.dir = "auto";
    localizedText.textContent = isBlockCopy ? translation : ` (${translation})`;
    element.append(localizedText);
  });

  if (document.body.dataset.gameCatalogPage === "more") {
    document.querySelectorAll(".game-card[data-game-id]").forEach(function(card) {
      const name = card.querySelector(".game-name");
      const localizedName = catalog[language].gameNames && catalog[language].gameNames[card.dataset.gameId] ||
        catalog[language].pages.oauth.games[card.dataset.gameId];
      if (!name || !localizedName || localizedName === name.textContent.trim()) return;

      const localizedText = document.createElement("span");
      localizedText.className = "localized-inline";
      localizedText.lang = language;
      localizedText.dir = "auto";
      localizedText.textContent = ` (${localizedName})`;
      name.append(localizedText);
    });
  }
})();