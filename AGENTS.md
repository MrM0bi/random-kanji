# AGENTS.md — Random Kanji

Technical reference for AI coding agents working on this project.

## Runtime

- **Bun 1.3+** — runtime, package manager (`bun`, not `npm`/`node`), bundler, dev server.
- No Node.js, no npm, no Vite.
- Lockfile: `bun.lock` (not `package-lock.json`).
- Scripts defined in `package.json`:
  - `bun run dev` → `dev.ts`
  - `bun run build` → `build.ts`
  - `bun run check` → `svelte-check`

## Build pipeline

Both dev and production use `Bun.build()` with official plugins passed directly via the `plugins` option:

```ts
Bun.build({
  entrypoints: ["index.html"],    // Bun processes <script>/<link> tags in HTML
  outdir: ".bun-dev" | "dist",
  plugins: [SveltePlugin({ development: true/false }), tailwindPlugin],
})
```

- `SveltePlugin` is `bun-plugin-svelte` (official Oven plugin, v0.0.6+). Compiles `.svelte` files via `svelte/compiler`. Extracts component CSS into virtual CSS modules. Options: `{ development: boolean }`.
- `tailwindPlugin` is `bun-plugin-tailwind` (official Tailwind Labs plugin, v0.1.2+). Processes `@import "tailwindcss"` and `@custom-variant` directives in CSS.
- Plugins are also registered in `bunfig.toml` under `[serve.static]` for use with `bun ./index.html`, but the dev/build scripts pass them directly.

## Entry points

- `index.html` is the main entry. `Bun.build()` processes it: bundles `./src/main.ts` and `./public/favicon.svg` into hashed assets.
- `./src/main.ts` imports `./app.css` (Tailwind + custom CSS via `import`), then mounts the Svelte app.

## CSS handling

- **app.css**: Imported in `main.ts`. Contains `@import "tailwindcss"` and `@custom-variant dark`. Processed by `bun-plugin-tailwind`.
- **Component CSS**: Extracted by `bun-plugin-svelte` and bundled alongside main CSS.
- **No separate CSS extraction** in the custom scripts — the plugins handle everything.

## Runtime data files

Two JSON files are fetched at runtime via `fetch()` (not included in the JS bundle):

| File | Location | Fetched by | Purpose |
|------|----------|-----------|---------|
| `config.json` | `public/` → copied to build output | `src/lib/config.ts` | Spinner feel, spin speeds, loot odds, special items |
| `kanji.json` | `public/` → copied to build output | `src/lib/sources.ts` | Kanji deck data (large, ~900KB) |

These are NOT referenced from `index.html`, so Bun's bundler doesn't process them. Both `dev.ts` and `build.ts` copy them manually into the output directory (`cp public/config.json public/kanji.json .bun-dev/` or `dist/`).

**Why not `bun ./index.html`:** Bun's SPA fallback catches ALL paths, including these JSON files, returning HTML instead of JSON. The custom `dev.ts` avoids this by building into a temp directory and serving files from there, with a SPA fallback only for truly unmatched paths.

## Dev server (`dev.ts`)

- Runs `Bun.build()` with dev-mode plugins on startup.
- Copies `config.json` and `kanji.json` from `public/` into the output directory.
- Starts `Bun.serve()` on port 3000, serving files from `.bun-dev/`.
- SPA fallback via `Response(Bun.file(...))` for unknown routes.
- Auto-rebuilds on file changes using `fs.watch` on `src/`, `public/`, and `index.html`.

No HMR (incremental updates) — rebuild is a full `Bun.build()` run (typically ~300ms).

## Production build (`build.ts`)

- Runs `Bun.build()` with production plugins (`minify: true`, `development: false`).
- Copies `public/config.json` and `public/kanji.json` to `dist/`.
- Output is self-contained: `index.html`, `chunk-*.css`, `chunk-*.js`, `favicon-*.svg`, `config.json`, `kanji.json`.

## Svelte specifics

- **Svelte 5** with runes (`$state`, `$derived`, `$effect`, `$props`). No legacy `$:` syntax.
- Components use `<script lang="ts">` for TypeScript.
- Scoped CSS via `<style>` blocks — compiled by `svelte/compiler`, extracted by `bun-plugin-svelte`.
- Transitions (`svelte/transition`) and stores (`svelte/store`) are used (e.g., `writable` for reactive config).
- `svelte-check` for type-checking (run via `bun run check`).

## File structure

```
/ (project root)
├── index.html          ← SPA entry (references ./src/main.ts, ./public/favicon.svg)
├── dev.ts              ← Dev server script
├── build.ts            ← Production build script
├── bunfig.toml         ← Plugin config for bun ./index.html (not used in normal workflow)
├── package.json        ← Dependencies + scripts
├── tsconfig.json       ← TypeScript config
├── Caddyfile           ← SPA config for production Caddy
├── docker-compose.yml  ← Production deploy (Caddy container, bind-mount ./dist)
├── AGENTS.md           ← This file
├── src/
│   ├── main.ts         ← App bootstrap (load config, mount Svelte)
│   ├── app.css         ← Tailwind import + custom CSS custom properties
│   ├── App.svelte      ← Root component
│   ├── components/     ← UI components
│   └── lib/            ← Stores, data, config, sources, filters, theme
└── public/
    ├── config.json     ← Runtime config
    ├── kanji.json      ← Kanji deck data
    └── favicon.svg     ← Favicon
```

## Updating this file

Whenever you make significant changes to the project structure, build pipeline, dependencies,
or any other aspect that another AI agent would need to know to work on this project,
**update this file**. Keep it concise but complete — it's the first thing an agent reads.

## Key constraints for AI agents

1. **Never add Node.js / npm / Vite.** Bun replaces all three. No `vite.config.ts`, no `svelte.config.js`.
2. **Never use `import.meta.env`.** Bun doesn't inject Vite-style env vars. If `BASE_URL` is needed, hardcode it or use `process.env`.
3. **JSON files fetched at runtime** (`config.json`, `kanji.json`) must be manually copied to the build output. The bundler doesn't know about `fetch()` calls.
4. **Bun plugin API** requires passing plugins directly to `Bun.build({ plugins: [...] })`. Global `Bun.plugin()` registration does not work with `Bun.build()`.
5. **Do not remove `@rollup/rollup-linux-x64-gnu`** if present — it's a transitive dependency of something that needs native binaries. (Currently removed from direct deps.)
6. **CSS is imported in JS** (`import './app.css'` in `main.ts`). Add `<link>` in HTML only if moving away from the JS import approach.
