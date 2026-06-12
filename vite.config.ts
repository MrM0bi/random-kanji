import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), tailwindcss()],
  server: {
    // Some filesystems / mapped drives (e.g. the J: drive this repo lives on)
    // don't support native file-change notifications, which crashes the
    // watcher with `UNKNOWN: watch`. Polling is the reliable fallback.
    watch: { usePolling: true },
  },
})
