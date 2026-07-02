# Random Kanji

A small, self-hostable website for a study group to drill **Heisig** kanji. Pick a random
**kanji** (and guess its meaning) or a random **meaning** (and write the kanji), with filters to
narrow the pool — all wrapped in a CS:GO-style spinning reel.

## Features

- **Two modes** — Kanji picking / Meaning picking.
- **Animated picker** — a spinning reel that decelerates and lands on the result (respects
  `prefers-reduced-motion`).
- **Filters, all derived from the loaded deck** (nothing hardcoded):
  - Heisig **ID** range (dual-thumb slider + number inputs)
  - **JLPT** level bar with live per-level counts (N5–N1 and "no level")
  - **Stroke count** range (dual-thumb slider + number inputs)
- **Reveal** to check the answer (meanings, primitives, ID / JLPT / stroke metadata).
- **Light / dark** toggle; preferences, filters and mode persist in `localStorage`.
- Deck-source and language-version pickers, ready for more decks/languages later.
- **Rare "loot drops"** — special items that occasionally replace a spin result, with per-tier
  odds, rarity effects (sparkle / glow / emoji rain) and randomized flavour text.
- **Runtime config** — spinner feel, spin speeds, loot odds and the loot items all live in
  `config.json`, loaded at startup so they stay editable *after* the build.

## Tech stack

**Svelte 5** + **Bun** (runtime, package manager, bundler, dev server) + **TypeScript** +
**Tailwind CSS v4** → builds to **static files** (no backend), served in production by
**Caddy** in a Docker container.

### Key dependencies

| Package | Purpose |
|---------|---------|
| [`bun-plugin-svelte`](https://github.com/oven-sh/bun) | Official Oven plugin — compiles `.svelte` files, extracts component CSS, supports HMR |
| [`bun-plugin-tailwind`](https://github.com/tailwindlabs/tailwindcss) | Official Tailwind Labs plugin — processes `@import "tailwindcss"` and custom variants |
| [`@fortawesome/fontawesome-svg-core`](https://fortawesome.com) | Icon library (core) |
| [`@fortawesome/free-solid-svg-icons`](https://fortawesome.com) | Icon library (free solid icons) |

## Project structure

```
index.html          ← SPA entry point (references ./src/main.ts)
src/
├── main.ts         ← Bootstrap: load config, mount Svelte app
├── app.css         ← Tailwind import + custom CSS custom properties
├── App.svelte      ← Root component
├── components/     ← UI components (SpinnerReel, ResultCard, Filters, etc.)
└── lib/            ← Stores, data loading, filters, config, theme
public/
├── config.json     ← Runtime config (spinner feel, loot odds, special items)
├── kanji.json      ← Kanji deck data (fetched at startup)
└── favicon.svg     ← Favicon
dev.ts              ← Dev server (Bun.build + Bun.serve + fs.watch)
build.ts            ← Production build (Bun.build + official plugins)
bunfig.toml         ← Plugin registration for Bun's native dev server
```

## Development

Requires **Bun 1.3+** (one tool replaces node, npm and vite).

```bash
bun install
bun run dev          # http://localhost:3000
bun run check        # type-check (svelte-check)
bun run build        # → dist/ (static, minified, hashed)
```

### Why a custom dev server?

Bun's built-in dev server (`bun ./index.html`) handles Svelte, Tailwind and HMR natively,
but its SPA fallback catches **all** unmatched paths — including `/config.json` and
`/kanji.json` that the app fetches at runtime via `fetch()`. Those requests return HTML
instead of JSON, breaking the app. The custom `dev.ts` avoids this by building into a
temp directory and serving files from there, with a SPA fallback only for truly unknown routes.

### Dev server internals

`bun run dev` (runs `dev.ts`):

1. Runs `Bun.build()` with `bun-plugin-svelte` + `bun-plugin-tailwind` and `entrypoints: ["index.html"]`.
   Bun processes the HTML, compiles `.svelte` files, bundles JS/TS, extracts component CSS,
   processes `@import "tailwindcss"` and hashes assets.
2. Copies `public/config.json` and `public/kanji.json` into the output directory (these are fetched
   at runtime via `fetch()`, not referenced from HTML, so Bun's bundler doesn't know about them).
3. Starts `Bun.serve()` on port **3000** serving the built output.
4. Uses `fs.watch` on `src/`, `public/`, and `index.html` to trigger rebuilds on changes.

All MIME types are served correctly: HTML, CSS, JavaScript, JSON.

## Deployment

`bun run build` produces a `dist/` directory with everything needed:
- `index.html` — the SPA shell with hashed CSS/JS asset links
- `chunk-*.css` — all styles (Tailwind + app + component CSS)
- `chunk-*.js` — all application code (Svelte 5 runtime + Font Awesome + app)
- `favicon-*.svg` — hashed favicon
- `config.json` — runtime config (not compiled into the bundle)
- `kanji.json` — kanji deck data

Serve `dist/` with any static web server. The recommended setup uses **Caddy** in a Docker
container (no build stage — build locally before deploying).

### Option 1 — Docker Compose with Caddy (recommended)

Build locally, then start Caddy to serve the static files:

```bash
bun run build
docker compose up -d
```

The [`docker-compose.yml`](docker-compose.yml) runs `caddy:2-alpine` with `./dist:/srv:ro` and the
[`Caddyfile`](Caddyfile) configured as an SPA history-API fallback. No Docker build stage, no
Node.js in the final container.

The compose file is wired for **Traefik**. Before deploying, adjust:

- the external network named `proxy` — must be the network your Traefik instance is on;
- the env var **`TNAME`** — the Traefik router/service name;
- the env var **`DIR`** — absolute path to the project root (e.g. `/home/mobi/random-kanji`);
- the router label — host (`kanji.mrmobi.dev`), `entrypoints` and `tls` settings, matching your
  Traefik configuration.

### Option 2 — Any static web server

```bash
bun run build
cd dist
python3 -m http.server 8080    # or nginx, caddy directly, etc.
```

### Updating the deck

`kanji.json` is served from `dist/`. To update the deck data, replace `public/kanji.json`,
re-run `bun run build` and restart the container (or just copy the new file into `dist/` and
reload Caddy with `docker compose exec caddy caddy reload`).

### Runtime config edits

`config.json` is served from `dist/`. You can edit `public/config.json` and rebuild, or replace
it directly in `dist/` on a running container. The app refetches it on each page load.
