function applyTheme(theme) {
  const root = document.documentElement;
  Object.entries(theme).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

function getThemeIndex(themeCount) {
  const sessionKey = 'guideThemeIndex';
  const stored = sessionStorage.getItem(sessionKey);
  const parsed = stored !== null ? Number(stored) : NaN;

  if (!Number.isNaN(parsed) && parsed >= 0 && parsed < themeCount) {
    return parsed;
  }

  const index = Math.floor(Math.random() * themeCount);
  sessionStorage.setItem(sessionKey, String(index));
  return index;
}

function mulberry32(seed) {
  return function () {
    let t = seed += 0x6d2b79f5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hsl(h, s, l) {
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

function hsla(h, s, l, a) {
  return `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${a})`;
}

function pick(array, rnd) {
  return array[Math.floor(rnd() * array.length)];
}

function formatRem(value) {
  return `${Math.round(value * 100) / 100}rem`;
}

function generateTheme(index) {
  const rnd = mulberry32(index + 1);
  const hue = rnd() * 360;
  const accentHue = (hue + 30 + rnd() * 80) % 360;
  const accent2Hue = (accentHue + 30 + rnd() * 60) % 360;
  const bgHue = (hue + 10 + rnd() * 20) % 360;
  const bgLight = 7 + rnd() * 8;
  const altLight = bgLight + 2 + rnd() * 4;
  const surfaceLight = bgLight + 6 + rnd() * 6;
  const surfaceStrongLight = surfaceLight + 2 + rnd() * 4;
  const accentSat = 70 + rnd() * 18;
  const accentLight = 53 + rnd() * 14;
  const textLight = 88 - rnd() * 10;
  const mutedLight = 58 + rnd() * 14;

  const fontSets = [
    {
      body: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      heading: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    },
    {
      body: "'Public Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      heading: "'Space Grotesk', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    },
    {
      body: "'IBM Plex Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      heading: "'Poppins', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    },
    {
      body: "'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      heading: "'Manrope', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    },
    {
      body: "'Work Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      heading: "'Fira Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    },
    {
      body: "'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      heading: "'Lexend', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }
  ];

  const layoutOptions = [
    { heroGrid: '1.1fr 0.9fr', featureColumns: 'repeat(2, minmax(0, 1fr))', whyGrid: '1.2fr 0.8fr' },
    { heroGrid: '1fr 1fr', featureColumns: 'repeat(2, minmax(0, 1fr))', whyGrid: '1fr 0.95fr' },
    { heroGrid: '0.95fr 1.05fr', featureColumns: 'repeat(2, minmax(0, 1fr))', whyGrid: '1.1fr 0.9fr' },
    { heroGrid: '1.2fr 0.8fr', featureColumns: '1fr', whyGrid: '1fr' }
  ];

  const layout = pick(layoutOptions, rnd);

  return {
    '--font-body': pick(fontSets, rnd).body,
    '--font-heading': pick(fontSets, rnd).heading,
    '--bg': hsl(bgHue, 24 + rnd() * 10, bgLight),
    '--bg-alt': hsl(bgHue, 20 + rnd() * 12, altLight),
    '--bg-accent-1': hsla(accentHue, 90, accentLight, 0.14 + rnd() * 0.05),
    '--bg-accent-2': hsla(accent2Hue, 90, accentLight, 0.16 + rnd() * 0.04),
    '--surface': hsla(bgHue, 18 + rnd() * 8, surfaceLight, 0.88 + rnd() * 0.04),
    '--surface-strong': hsla(bgHue, 18 + rnd() * 8, surfaceStrongLight, 0.96 + rnd() * 0.02),
    '--surface-border': hsla(bgHue, 24 + rnd() * 10, surfaceLight, 0.12 + rnd() * 0.05),
    '--text': hsl(bgHue, 12 + rnd() * 8, textLight),
    '--muted': hsl(bgHue, 10 + rnd() * 16, mutedLight),
    '--link': hsl(bgHue, 16 + rnd() * 10, 80 + rnd() * 10),
    '--accent': hsl(accentHue, accentSat, accentLight),
    '--accent-2': hsl(accent2Hue, accentSat, accentLight),
    '--accent-alt': hsl(accentHue, 60, 96),
    '--pill-bg': hsla(accentHue, 90, accentLight, 0.18 + rnd() * 0.06),
    '--status': hsl((accentHue + 70 + rnd() * 20) % 360, 90, 70 + rnd() * 8),
    '--nav-bg': hsla(bgHue, 20 + rnd() * 10, bgLight + 4, 0.82 + rnd() * 0.1),
    '--nav-bg-mobile': hsla(bgHue, 20 + rnd() * 10, bgLight + 4, 0.94 + rnd() * 0.04),
    '--hero-grid': layout.heroGrid,
    '--hero-gap': `${2 + rnd() * 1.7}rem`,
    '--hero-align': pick(['start', 'center', 'end'], rnd),
    '--feature-columns': layout.featureColumns,
    '--why-grid': layout.whyGrid,
    '--panel-radius': formatRem(1.3 + rnd() * 1.3),
    '--panel-padding': formatRem(1.6 + rnd() * 1.2),
    '--heading-spacing': `-${(0.02 + rnd() * 0.04).toFixed(3)}em`,
    '--button-radius': formatRem(0.8 + rnd() * 0.9),
    '--brand-gap': `${0.55 + rnd() * 0.5}rem`,
    '--section-gap': `${3 + rnd() * 1}rem`,
    '--card-border': `1px solid ${hsla(bgHue, 18 + rnd() * 12, surfaceLight, 0.1 + rnd() * 0.08)}`
  };
}

const themeCount = 100;
const themes = Array.from({ length: themeCount }, (_, index) => generateTheme(index));
const themeIndex = getThemeIndex(themeCount);
applyTheme(themes[themeIndex]);

document.addEventListener('DOMContentLoaded', function () {
  const navToggle = document.getElementById('navToggle');
  const siteNav = document.getElementById('siteNav');

  if (!navToggle || !siteNav) {
    return;
  }

  navToggle.addEventListener('click', function () {
    siteNav.classList.toggle('open');
    const expanded = siteNav.classList.contains('open');
    navToggle.setAttribute('aria-expanded', expanded.toString());
  });

  document.querySelectorAll('.site-nav a[href^="#"]').forEach((link) => {
    link.addEventListener('click', function () {
      siteNav.classList.remove('open');
    });
  });
});
