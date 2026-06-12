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

## Tech stack

Svelte 5 + Vite + TypeScript + Tailwind CSS v4 → builds to **static files** (no backend), served
in production by Caddy in a Docker container.

## Data

The app fetches a deck JSON at runtime from `/kanji.json` (configured in
[`src/lib/sources.ts`](src/lib/sources.ts)). The file lives in [`public/`](public/) so it is served
alongside the app in both dev and production. To add decks/languages, extend `SOURCES` — the data
schema already supports multiple `versions` per kanji.

## Development

Requires **Node.js 20+**.

```bash
npm install
npm run dev        # http://localhost:5173
npm run check      # type-check (svelte-check)
npm run build      # -> dist/ (static)
npm run preview    # preview the production build
```

## Deployment (Docker + Caddy)

```bash
docker build -t random-kanji .
docker run -p 8080:80 random-kanji   # http://localhost:8080
```

The image builds the static site and serves `dist/` (including `kanji.json`) via Caddy with an
SPA history-API fallback. To serve without Docker, run `npm run build` and point any static web
server at `dist/`.
