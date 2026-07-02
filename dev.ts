import { SveltePlugin } from "bun-plugin-svelte";
import tailwind from "bun-plugin-tailwind";
import { watch } from "fs";
import { mkdir } from "fs/promises";

const PORT = parseInt(process.env.PORT || "3000");
const OUT = ".bun-dev";

async function build() {
  const t1 = performance.now();
  await mkdir(OUT, { recursive: true });
  const out = await Bun.build({
    entrypoints: ["index.html"],
    outdir: OUT,
    minify: false,
    plugins: [SveltePlugin({ development: true }), tailwind],
  });
  if (!out.success) {
    for (const l of out.logs) console.error(l);
    return false;
  }
  await Bun.write(Bun.file(`${OUT}/config.json`), Bun.file("public/config.json"));
  await Bun.write(Bun.file(`${OUT}/kanji.json`), Bun.file("public/kanji.json"));
  console.log(`  built in ${(performance.now() - t1).toFixed(0)}ms`);
  return true;
}

if (!(await build())) process.exit(1);

let html = await Bun.file(`${OUT}/index.html`).text();

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname === "/" ? "/index.html" : url.pathname;
    const file = Bun.file(`${OUT}${path}`);
    if (await file.exists()) return new Response(file);
    return new Response(html, { headers: { "Content-Type": "text/html" } });
  },
});

console.log(`Dev server → http://localhost:${PORT}`);

// Rebuild on source changes
watch("src", { recursive: true }, async (_, f) => {
  if (!f || f.endsWith("~") || f.startsWith(".")) return;
  if (await build()) html = await Bun.file(`${OUT}/index.html`).text();
});
watch("public", async (_, f) => {
  if (!f || !["config.json", "kanji.json"].includes(f)) return;
  await build();
  html = await Bun.file(`${OUT}/index.html`).text();
});
watch(".", async (_, f) => {
  if (!f || f !== "index.html") return;
  await build();
  html = await Bun.file(`${OUT}/index.html`).text();
});
