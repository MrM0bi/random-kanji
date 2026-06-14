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

Svelte 5 + Vite + TypeScript + Tailwind CSS v4 → builds to **static files** (no backend), served
in production by Caddy in a Docker container.

## Data

The app fetches a deck JSON at runtime from `/kanji.json` (configured in
[`src/lib/sources.ts`](src/lib/sources.ts)). The file lives in [`public/`](public/) so it is served
alongside the app in both dev and production. To add decks/languages, extend `SOURCES` — the data
schema already supports multiple `versions` per kanji.

## Configuration

All tunables live in [`public/config.json`](public/config.json), fetched on startup just like the
deck (with a built-in fallback in [`src/lib/config.ts`](src/lib/config.ts) if the file is missing).
Because it is a static file served next to the app — **not** compiled into the bundle — you can edit
it after the build without recompiling:

- **`spinner`** — reel feel: total `durationMs`, `easing`, `spinCells`, settle nudge.
- **`spinSpeeds`** — the Normal / Fast / Instant durations behind the Tempo button.
- **`rarities`** — per-tier `chance` (per-spin drop odds), `color`/`dot`/`label`, and the effect
  flags `sparkle`, `glow`, `emojiRain`.
- **`specials`** — the loot items: `glyph`, `name`, `kanji`, `rarity`, optional `gold`, and a
  `descriptions` array (one line is shown at random when the item drops).

In production the file is baked into the image at `/config.json`. To tweak it on a running container
**without rebuilding**, bind-mount your own copy over it (see the commented `volumes:` block in
[`docker-compose.yml`](docker-compose.yml)) and restart the container.

## Development

Requires **Node.js 20+**.

```bash
npm install
npm run dev        # http://localhost:5173
npm run check      # type-check (svelte-check)
npm run build      # -> dist/ (static)
npm run preview    # preview the production build
```

## Deployment

The [`Dockerfile`](Dockerfile) builds the static site and serves it (including `kanji.json`) with
Caddy on port **80**, using an SPA history-API fallback. The container exposes only port 80; a
reverse proxy in front terminates TLS and routes to it.

The included [`docker-compose.yml`](docker-compose.yml) is wired for **Traefik**. Before deploying,
review these in the compose file and adjust to your environment:

- the external network named `proxy` — must be the network your Traefik instance is on (rename if
  yours differs);
- the env var **`TNAME`** — the Traefik router/service name (e.g. `random-kanji`);
- the router labels — host (`kanji.mrmobi.dev`), `entrypoints` and `tls` settings.

### Option 1 — Portainer (deploy from the Git repository)

1. Push this repo to a Git remote your Portainer can reach (GitHub, Gitea, …):
   ```bash
   git remote add origin <your-repo-url>
   git push -u origin master
   ```
2. In Portainer: **Stacks → Add stack → Repository**.
   - **Repository URL** — your repo (add credentials if it is private)
   - **Reference** — `refs/heads/master`
   - **Compose path** — `docker-compose.yml`
3. Under **Environment variables**, add `TNAME` = `random-kanji`.
4. **Deploy the stack.** Portainer clones the repo and builds the image from the `Dockerfile`, then
   starts the container on the `proxy` network where Traefik discovers it via the labels.
5. *(Optional)* Enable **GitOps updates** (polling or webhook) so a `git push` redeploys
   automatically.

The external `proxy` network must already exist — it does if Traefik is running on it.

### Option 2 — Docker + Docker Compose (CLI, no Portainer)

On any host with Docker installed:

```bash
git clone <your-repo-url> random-kanji
cd random-kanji

# Traefik network — skip if it already exists
docker network create proxy

# router/service name referenced by the compose labels
echo "TNAME=random-kanji" > .env

docker compose up -d --build
```

To update after pulling new changes:

```bash
git pull
docker compose up -d --build
```

### Option 3 — Quick local test (no reverse proxy)

```bash
docker build -t random-kanji .
docker run --rm -p 8080:80 random-kanji   # http://localhost:8080
```

Or uncomment the `ports:` mapping in `docker-compose.yml` and run `docker compose up --build`.

### Updating the deck

`kanji.json` is baked into the image at build time, so updating the deck (or any code) means
**rebuilding the image and redeploying** the stack (Portainer: *Pull and redeploy* / re-deploy;
CLI: `docker compose up -d --build`). `config.json` is baked in the same way, but can alternatively
be bind-mounted and edited live — see [Configuration](#configuration) above.

To serve without Docker entirely, run `npm run build` and point any static web server at `dist/`.
