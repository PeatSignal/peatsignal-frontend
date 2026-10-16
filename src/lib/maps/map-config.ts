import type { Bbox } from "@/types";

/**
 * Peta dasar tanpa API key. Bisa diganti lewat `NEXT_PUBLIC_MAP_STYLE_URL`
 * (URL style MapLibre); jangan menaruh token rahasia di variabel ini.
 */
export const DEFAULT_MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

export function resolveMapStyleUrl(value: string | undefined = process.env.NEXT_PUBLIC_MAP_STYLE_URL): string {
  const trimmed = value?.trim();
  if (!trimmed) return DEFAULT_MAP_STYLE_URL;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : DEFAULT_MAP_STYLE_URL;
  } catch {
    return DEFAULT_MAP_STYLE_URL;
  }
}

/** Style cadangan bila peta dasar gagal dimuat: latar polos, lapisan data tetap bisa digambar. */
export const FALLBACK_MAP_STYLE = {
  version: 8 as const,
  sources: {},
  layers: [{ id: "latar", type: "background" as const, paint: { "background-color": "#eef2ee" } }],
};

/** Teks kontrol MapLibre dalam bahasa Indonesia. */
export const MAP_LOCALE: Record<string, string> = {
  "AttributionControl.ToggleAttribution": "Tampilkan atau sembunyikan sumber peta",
  "AttributionControl.MapFeedback": "Beri masukan peta",
  "CooperativeGesturesHandler.WindowsHelpText": "Tekan Ctrl sambil menggulir untuk memperbesar peta",
  "CooperativeGesturesHandler.MacHelpText": "Tekan ⌘ sambil menggulir untuk memperbesar peta",
  "CooperativeGesturesHandler.MobileHelpText": "Gunakan dua jari untuk menggeser peta",
  "FullscreenControl.Enter": "Layar penuh",
  "FullscreenControl.Exit": "Keluar dari layar penuh",
  "GeolocateControl.FindMyLocation": "Cari lokasi saya",
  "GeolocateControl.LocationNotAvailable": "Lokasi tidak tersedia",
  "LogoControl.Title": "Logo MapLibre",
  "Map.Title": "Peta",
  "Marker.Title": "Penanda peta",
  "NavigationControl.ResetBearing": "Kembalikan arah ke utara",
  "NavigationControl.ZoomIn": "Perbesar",
  "NavigationControl.ZoomOut": "Perkecil",
  "Popup.Close": "Tutup",
  "ScaleControl.Kilometers": "km",
  "ScaleControl.Meters": "m",
};

/** Gabungan beberapa kotak batas menjadi satu, untuk tampilan awal peta. */
export function unionBbox(boxes: readonly Bbox[]): Bbox | null {
  if (boxes.length === 0) return null;
  return boxes.reduce<Bbox>(
    ([minLon, minLat, maxLon, maxLat], [a, b, c, d]) => [Math.min(minLon, a), Math.min(minLat, b), Math.max(maxLon, c), Math.max(maxLat, d)],
    [Infinity, Infinity, -Infinity, -Infinity],
  );
}

/** Kotak batas sebagai poligon GeoJSON (urutan lon, lat). */
export function bboxPolygon([minLon, minLat, maxLon, maxLat]: Bbox): [number, number][][] {
  return [[[minLon, minLat], [maxLon, minLat], [maxLon, maxLat], [minLon, maxLat], [minLon, minLat]]];
}

export function isWebglSupported(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}
