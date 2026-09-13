(function () {
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
})();
