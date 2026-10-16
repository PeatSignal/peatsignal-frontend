import type { Area, Bbox } from "@/types";

export const INDONESIA_BBOX: Bbox = [94.0, -11.5, 141.5, 6.5];

const DEMO_BOUNDARY = "Perkiraan kotak batas DEMO, bukan batas administratif resmi";

/**
 * Wilayah gambut sesuai kolom `peatland` pada mmc1.xlsx. Batas berupa kotak perkiraan
 * untuk filter peta; tidak dipakai untuk menempatkan stasiun (koordinat stasiun tidak tersedia).
 */
export const AREAS: readonly Area[] = [
  { id: "batanghari", label: "Batanghari, Jambi", region: "Batanghari", bbox: [102.9, -2.2, 104.0, -1.3], boundary_source: DEMO_BOUNDARY },
  { id: "kubu-raya", label: "Kubu Raya, Kalimantan Barat", region: "Kubu Raya", bbox: [108.9, -1.2, 110.0, 0.3], boundary_source: DEMO_BOUNDARY },
];

export interface AssessmentBlock {
  id: string;
  label: string;
  area_id: string;
  region: string;
  bbox: Bbox;
}

/** Area dibagi menjadi tiga blok barat–timur sebagai unit assessment DEMO. */
export const ASSESSMENT_BLOCKS: readonly AssessmentBlock[] = AREAS.flatMap((area) => {
  const [minLon, minLat, maxLon, maxLat] = area.bbox;
  const step = (maxLon - minLon) / 3;
  return ["A", "B", "C"].map((suffix, index) => ({
    id: `${area.id}-${suffix.toLowerCase()}`,
    label: `${area.region} · Blok ${suffix}`,
    area_id: area.id,
    region: area.region,
    bbox: [minLon + step * index, minLat, minLon + step * (index + 1), maxLat] as Bbox,
  }));
});

export function findArea(areaId: string | null | undefined): Area | undefined {
  return areaId ? AREAS.find((area) => area.id === areaId) : undefined;
}

export function isInBbox(longitude: number, latitude: number, [minLon, minLat, maxLon, maxLat]: Bbox): boolean {
  return longitude >= minLon && longitude <= maxLon && latitude >= minLat && latitude <= maxLat;
}

export function areaIdForPoint(longitude: number, latitude: number): string | null {
  return AREAS.find((area) => isInBbox(longitude, latitude, area.bbox))?.id ?? null;
}
