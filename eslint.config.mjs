import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  // public/vendor berisi salinan worker MapLibre (scripts/copy-maplibre-worker.mjs).
  globalIgnores([".next/**", "out/**", "coverage/**", "next-env.d.ts", "public/vendor/**"]),
]);
