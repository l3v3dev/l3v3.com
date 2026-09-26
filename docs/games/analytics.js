(function () {
  const KEY = "l3v3.analyticsConsent";
  const REQUIRE_ANALYTICS_CONSENT_FOR_US = false;
  const gameScripts = [];

  function isUsVisitor() {
    const languages = Array.isArray(navigator.languages) ? navigator.languages : [navigator.language || ""];
    return languages.some(function (language) {
      const languageCode = String(language || "").toLowerCase();
      return languageCode === "en-us" || languageCode.startsWith("en-us") || languageCode.endsWith("-us");
    });
  }

  function consentIsRequired() {
    return !isUsVisitor() || REQUIRE_ANALYTICS_CONSENT_FOR_US;
  }

  function getConsent() {
    try {
      return localStorage.getItem(KEY);
    } catch (error) {
      return null;
    }
  }

  function loadAnalytics() {
    if (window.dataLayer) return;

    const existing = document.querySelector("script[data-l3v3-gtag]");
    if (existing) return;

    const gtagScript = document.createElement("script");
    gtagScript.async = true;
    gtagScript.src = "https://www.googletagmanager.com/gtag/js?id=G-FW4YV3KZ23";
    gtagScript.dataset.l3v3Gtag = "true";
    document.head.appendChild(gtagScript);

    const inline = document.createElement("script");
    inline.dataset.l3v3Gtag = "true";
    inline.textContent = "window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-FW4YV3KZ23');";
    document.head.appendChild(inline);
  }

  function loadGames() {
    if (window.L3V3_GAMEPLAY_ENABLED) return;
    window.L3V3_GAMEPLAY_ENABLED = true;
    gameScripts.forEach(function (script) {
      const gameScript = document.createElement("script");
      gameScript.defer = true;
      gameScript.src = script.dataset.l3v3GameSrc;
      document.body.appendChild(gameScript);
    });
  }

  function saveConsent(value) {
    try {
      localStorage.setItem(KEY, value);
    } catch (error) {
      // Browsers may block storage; consent still applies for this page.
    }
    window.L3V3_ANALYTICS_CONSENT = value;
    if (value === "accepted") {
      loadAnalytics();
      loadGames();
    }
    updateGate();
  }

  function createGate() {
    const gate = document.createElement("div");
    gate.id = "l3v3-consent-gate";
    gate.innerHTML = "<div class=\"l3v3-consent-dialog\" role=\"dialog\" aria-labelledby=\"l3v3-consent-title\"><h1 id=\"l3v3-consent-title\">Analytics consent required</h1><p>Accept Google Analytics to enable gameplay.</p><button type=\"button\" id=\"l3v3-consent-accept\">Accept and play</button><a href=\"../../index.html\">Back to games</a></div>";
    gate.querySelector("#l3v3-consent-accept").addEventListener("click", function () {
      saveConsent("accepted");
    });
    document.body.appendChild(gate);
    return gate;
  }

  function updateGate() {
    const gate = document.getElementById("l3v3-consent-gate");
    if (gate) gate.hidden = window.L3V3_GAMEPLAY_ENABLED === true;
  }

  function initialize() {
    gameScripts.push.apply(gameScripts, document.querySelectorAll("script[data-l3v3-game-src]"));
    const consent = getConsent();
    const accepted = consent === "accepted" || (!consentIsRequired() && consent !== "rejected");
    window.L3V3_ANALYTICS_CONSENT = accepted ? "accepted" : consent;

    if (accepted) {
      loadAnalytics();
      loadGames();
      return;
    }

    createGate();
    updateGate();
  }

  const style = document.createElement("style");
  style.textContent = "#l3v3-consent-gate{position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;background:rgb(0 0 0 / 82%);font:16px Georgia,serif;color:#fff}#l3v3-consent-gate[hidden]{display:none}.l3v3-consent-dialog{width:min(360px,calc(100vw - 48px));padding:24px;border:1px solid #66ccff;border-radius:8px;background:#1a1a2e;line-height:1.5;text-align:center}.l3v3-consent-dialog h1{margin:0 0 12px;color:#66ccff;font-size:22px}.l3v3-consent-dialog button{display:block;width:100%;margin:20px 0 12px;padding:10px;border:1px solid #66ccff;border-radius:4px;background:#253552;color:#fff;font:inherit;cursor:pointer}.l3v3-consent-dialog a{color:#9edfff}";
  document.head.appendChild(style);
  document.addEventListener("DOMContentLoaded", initialize, { once: true });
})();
