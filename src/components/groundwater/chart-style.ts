import { GWT_REFERENCE_M, type GwtGapKind } from "@/lib/domain/groundwater";

// Warna grafik muka air tanah. Dipakai sama persis oleh grafik, legenda, dan bar kelengkapan data.

export const LINE_COLOR = "#18543b";
export const AXIS_COLOR = "#617067";

export const GAP_STYLE: Record<GwtGapKind, { fill: string; opacity: number; label: string }> = {
  NO_MEASUREMENT: { fill: "#fcd34d", opacity: 0.35, label: "Tidak ada pengukuran" },
  DUPLICATE: { fill: "#f97316", opacity: 0.4, label: "Data ganda bertentangan (nilai tidak dipakai)" },
  OUTSIDE_STATION: { fill: "#94a3b8", opacity: 0.25, label: "Di luar periode pencatatan stasiun" },
};

const NICE_STEPS = [0.05, 0.1, 0.2, 0.25, 0.5, 1, 2];

/**
 * Sumbu-Y dengan langkah rapi. Domain selalu memuat 0 (permukaan) dan garis acuan, dengan sedikit ruang
 * agar garis data tidak menempel di tepi grafik.
 */
export function valueAxis(values: readonly number[]): { domain: [number, number]; ticks: number[]; digits: number } {
  const low = Math.min(GWT_REFERENCE_M, ...values);
  const high = Math.max(0, ...values);
  const range = Math.max(0.2, high - low);
  const step = NICE_STEPS.find((candidate) => candidate >= range / 6) ?? 2;
  const min = Math.floor((low - range * 0.04) / step) * step;
  const max = Math.ceil((high + range * 0.04) / step) * step;
  const ticks: number[] = [];
  for (let tick = min; tick <= max + step / 2; tick += step) ticks.push(Math.round(tick * 1000) / 1000);
  const digits = step >= 1 ? 0 : Number.isInteger(Math.round(step * 1000) / 100) ? 1 : 2;
  return { domain: [ticks[0] ?? min, ticks.at(-1) ?? max], ticks, digits };
}
