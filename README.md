# l3v3.com

This repository hosts the website for **l3v3.com**, a modern SaaS landing page for the agentic loop programming IDE called **l3v3**.

## Website
- `docs/index.html` � main landing page
- `docs/styles.css` � responsive theme and layout
- `docs/scripts/app.js` � mobile navigation behavior

## About l3v3
l3v3 is presented as an agentic workflow IDE that helps creators design, iterate, and automate software processes in a unified interface.

## Preview
Open `docs/index.html` in a browser to view the landing page locally.

## Build
Install dependencies once, then create the minified browser bundle:

```sh
npm install
npm run build
```

Add games by creating a directory under `src/games`, then registering its id and
title in `src/games/games.json`. Each game needs an `index.html` and
`src/main.js`. The build bundles every registered game, copies its serving HTML,
and generates `docs/games/games.json` for the landing page. Source code and
assets remain outside `docs`.
