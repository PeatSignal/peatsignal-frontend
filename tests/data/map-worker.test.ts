import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = new URL("../../", import.meta.url);
const require = createRequire(import.meta.url);
const { version } = require("maplibre-gl/package.json");

test("aset worker production: entry dan dependensi memakai .js dan tetap valid sebagai module", () => {
  const generated = spawnSync(process.execPath, ["scripts/copy-maplibre-worker.mjs"], { cwd: root, encoding: "utf8" });
  assert.equal(generated.status, 0, generated.stderr);

  for (const name of ["worker", "shared"]) {
    const source = readFileSync(new URL(`public/vendor/maplibre-gl-${version}/maplibre-gl-${name}.js`, root), "utf8");
    assert.doesNotMatch(source, /["']\.\/[^"']+\.mjs["']/);
    if (name === "worker") assert.match(source, /["']\.\/maplibre-gl-shared\.js["']/);
    const parsed = spawnSync(process.execPath, ["--input-type=module", "--check"], { input: source, encoding: "utf8" });
    assert.equal(parsed.status, 0, parsed.stderr);
  }
});
