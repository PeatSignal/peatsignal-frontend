// Salin worker MapLibre ke public/ agar bisa dimuat sebagai module worker.
// Webpack tidak dapat meneruskan `import.meta.url` milik maplibre-gl v6, jadi URL worker diset manual
// (lihat src/components/maps/base-map.tsx). Folder tujuan memuat versi agar cache browser aman.
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));
const dist = join(dirname(require.resolve("maplibre-gl/package.json")), "dist");
const { version } = JSON.parse(readFileSync(join(dist, "..", "package.json"), "utf8"));

const vendor = join(root, "public", "vendor");
const target = join(vendor, `maplibre-gl-${version}`);
mkdirSync(vendor, { recursive: true });
for (const entry of readdirSync(vendor)) {
  if (entry.startsWith("maplibre-gl-") && entry !== `maplibre-gl-${version}`) rmSync(join(vendor, entry), { recursive: true, force: true });
}
mkdirSync(target, { recursive: true });
// Beberapa server production mengirim .mjs sebagai text/plain. Module worker
// membutuhkan MIME JavaScript, termasuk seluruh import relatifnya.
for (const name of ["worker", "shared"]) {
  const source = readFileSync(join(dist, `maplibre-gl-${name}.mjs`), "utf8");
  writeFileSync(join(target, `maplibre-gl-${name}.js`), source.replaceAll("./maplibre-gl-shared.mjs", "./maplibre-gl-shared.js"));
}
console.log(`MapLibre worker ${version} → public/vendor/maplibre-gl-${version}/`);
