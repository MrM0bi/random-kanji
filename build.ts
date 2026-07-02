import { $ } from 'bun'
import { SveltePlugin } from 'bun-plugin-svelte'
import tailwindPlugin from 'bun-plugin-tailwind'

console.log('Cleaning dist/ …')
await $`rm -rf dist`

console.log('Bundling with Bun …')
const result = await Bun.build({
  entrypoints: ['index.html'],
  outdir: 'dist',
  minify: true,
  plugins: [SveltePlugin({ development: false }), tailwindPlugin],
})

if (!result.success) {
  for (const log of result.logs) console.error(log)
  process.exit(1)
}

// Runtime-fetched JSON files — Bun's bundler doesn't know about fetch('kanji.json').
console.log('Copying runtime JSON …')
await $`cp public/config.json public/kanji.json dist/`

console.log('Build done → dist/')
