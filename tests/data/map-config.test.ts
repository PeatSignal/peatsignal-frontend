import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_MAP_STYLE_URL, bboxPolygon, resolveMapStyleUrl, unionBbox } from "@/lib/maps/map-config";
import { AREAS } from "@/lib/domain/areas";

test("map style: default tanpa env, http(s) diterima, nilai lain kembali ke default", () => {
  assert.equal(resolveMapStyleUrl(undefined), DEFAULT_MAP_STYLE_URL);
  assert.equal(resolveMapStyleUrl("   "), DEFAULT_MAP_STYLE_URL);
  assert.equal(resolveMapStyleUrl(" https://example.org/style.json "), "https://example.org/style.json");
  assert.equal(resolveMapStyleUrl("javascript:alert(1)"), DEFAULT_MAP_STYLE_URL);
  assert.equal(resolveMapStyleUrl("bukan url"), DEFAULT_MAP_STYLE_URL);
});

test("unionBbox: menggabungkan kotak wilayah; kosong → null", () => {
  assert.equal(unionBbox([]), null);
  assert.deepEqual(unionBbox(AREAS.map((area) => area.bbox)), [102.9, -2.2, 110.0, 0.3]);
});

test("bboxPolygon: cincin tertutup berurutan lon, lat", () => {
  const [ring] = bboxPolygon([1, 2, 3, 4]);
  assert.deepEqual(ring, [[1, 2], [3, 2], [3, 4], [1, 4], [1, 2]]);
});
