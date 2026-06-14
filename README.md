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
   git push -u origin main
   ```
2. In Portainer: **Stacks → Add stack → Repository**.
   - **Repository URL** — your repo (add credentials if it is private)
   - **Reference** — `refs/heads/main`
   - **Compose path** — `docker-compose.yml`
3. Under **Environment variables**, add `TNAME` = `random-kanji`.
4. **Deploy the stack.** Portainer clones the repo and builds the image from the `Dockerfile`, then
   starts the container on the `proxy` network where Traefik discovers it via the labels.
5. *(Optional)* Enable **GitOps updates** (polling or webhook) so a `git push` redeploys
   automatically.

The external `proxy` network must already exist — it does if Traefik is running on it.

> **Updating this stack — leave "Re-pull image" OFF.** Because this stack *builds* its image from
> the repo, use Portainer's **Pull and redeploy** (which re-clones the Git repo and rebuilds) but do
> **not** tick the *Re-pull image* option. "Re-pull image" tries to fetch the image from a registry;
> since the image is built locally and never pushed, that fails with
> `pull access denied for random-kanji, repository does not exist`. The compose file sets
> `pull_policy: build` and deliberately omits an `image:` tag to avoid this. If you want push-to-
> deploy with image pulls instead, see **Option 4** below.

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
docker buildx build --load -t random-kanji .
docker run --rm -p 8080:80 random-kanji   # http://localhost:8080
```

`docker buildx build --load` uses the modern BuildKit/Buildx builder and loads the result into your
local image store. (Plain `docker build` still works but prints a deprecation warning — see
[BuildKit / Buildx](#buildkit--buildx) below.)

Or uncomment the `ports:` mapping in `docker-compose.yml` and run `docker compose up --build`.

### Option 4 — GitOps with a prebuilt image (recommended for auto-redeploy)

Instead of having Portainer build the image, let CI build it and have Portainer just **pull** it.
This is the clean separation that "Pull and redeploy" expects.

1. The included workflow [`.github/workflows/docker-publish.yml`](.github/workflows/docker-publish.yml)
   builds and pushes `ghcr.io/<owner>/<repo>:latest` (and a `:<sha>` tag) to the **GitHub Container
   Registry** on every push to `main`. It needs no secrets — it uses the built-in `GITHUB_TOKEN`.
2. After the first run, open the package in your GitHub profile and either make it **public**, or
   keep it private and add GHCR credentials to Portainer (**Registries → Add registry → Custom**,
   URL `ghcr.io`, a GitHub PAT with `read:packages`).
3. In `docker-compose.yml`, remove the `build:` and `pull_policy:` lines and set:
   ```yaml
   image: ghcr.io/<your-gh-username>/random-kanji:latest
   ```
4. In Portainer, deploy the stack and add a **webhook** (Stack → Webhooks). Add a final step to the
   workflow (or a separate `curl`) that calls the webhook after the push, so each `git push` →
   image build → Portainer pulls the new image and recreates the container. Here "Re-pull image"
   **is** the correct action.

### Updating the deck

`kanji.json` is baked into the image at build time, so updating the deck (or any code) means
**rebuilding the image and redeploying** the stack (Portainer: *Pull and redeploy* / re-deploy;
CLI: `docker compose up -d --build`). `config.json` is baked in the same way, but can alternatively
be bind-mounted and edited live — see [Configuration](#configuration) above.

To serve without Docker entirely, run `npm run build` and point any static web server at `dist/`.

### BuildKit / Buildx

Recent Docker deprecates the legacy image builder:

```
DEPRECATED: The legacy builder is deprecated and will be removed in a future release.
            Install the buildx component to build images with BuildKit
```

This only affects the **manual `docker build`** command — Portainer's stack builds and
`docker compose build` already use BuildKit. To migrate the manual command:

- **Use Buildx directly** (preferred): `docker buildx build --load -t random-kanji .`. The `--load`
  flag puts the built image into your local image store so `docker run` can use it. Buildx ships
  with Docker Desktop; on a Linux server install it via your package manager
  (`sudo apt-get install docker-buildx-plugin` on Debian/Ubuntu using Docker's apt repo).
- **Or make `docker build` use BuildKit** without changing the command: enable it daemon-wide in
  `/etc/docker/daemon.json`:
  ```json
  { "features": { "buildkit": true } }
  ```
  then `sudo systemctl restart docker`. (A per-shell `export DOCKER_BUILDKIT=1` also works.)
- **Optional:** `docker buildx install` aliases `docker build` to `docker buildx build` globally.

Buildx also unlocks multi-architecture images (e.g. building for `arm64` on an `amd64` host) via
`--platform`, though that requires pushing to a registry rather than `--load`.
