import { z } from "zod";
import { AREAS, findArea, isInBbox } from "@/lib/domain/areas";
import type { KeyValueStorage } from "@/lib/mock/storage";

export const COMMUNITY_STORE_KEY = "gambutops:community-store:v1";
export const categoryLabels = { FIRE: "Kebakaran / asap", CLEARING: "Pembukaan lahan", LOGGING: "Penebangan pohon", OTHER: "Lainnya" } as const;
export const reportInputSchema = z.object({
  category: z.enum(["FIRE", "CLEARING", "LOGGING", "OTHER"]),
  area_id: z.enum(["batanghari", "kubu-raya"]),
  longitude: z.number().finite(), latitude: z.number().finite(),
  observed_at: z.iso.datetime({ offset: true }),
  description: z.string().trim().min(10, "Deskripsi minimal 10 karakter.").max(500, "Deskripsi maksimal 500 karakter."),
  contact: z.string().trim().max(100, "Kontak maksimal 100 karakter."),
}).superRefine((value, ctx) => {
  const area = findArea(value.area_id);
  if (!area || !isInBbox(value.longitude, value.latitude, area.bbox)) ctx.addIssue({ code: "custom", path: ["longitude"], message: "Pilih lokasi di dalam wilayah yang dipilih." });
});
export const citizenReportSchema = reportInputSchema.safeExtend({
  id: z.string().min(1), submitted_at: z.iso.datetime({ offset: true }),
  status: z.literal("SUBMITTED"), is_simulation: z.literal(true),
});
export const communityAlertSchema = z.object({
  id: z.string(), area_id: z.enum(["batanghari", "kubu-raya"]), kind: z.enum(["HOTSPOT", "LAND_CHANGE"]),
  title: z.string(), description: z.string(), observed_at: z.iso.datetime({ offset: true }),
  longitude: z.number(), latitude: z.number(), source: z.string(), is_simulation: z.literal(true),
  extent: z.tuple([z.number(), z.number(), z.number(), z.number()]).nullable(),
});
export type CitizenReport = z.infer<typeof citizenReportSchema>;
export type ReportInput = z.infer<typeof reportInputSchema>;
export type CommunityAlert = z.infer<typeof communityAlertSchema>;
export const communityStoreSchema = z.object({ version: z.literal(1), reports: z.array(citizenReportSchema), read_alert_ids: z.array(z.string()) });
export type CommunityStore = z.infer<typeof communityStoreSchema>;
export function emptyCommunityStore(): CommunityStore { return { version: 1, reports: [], read_alert_ids: [] }; }

export const COMMUNITY_ALERTS: readonly CommunityAlert[] = AREAS.flatMap((area) => {
  const [west, south, east, north] = area.bbox;
  const lon = (west + east) / 2;
  const lat = (south + north) / 2;
  return [
    { id: `${area.id}-heat-1`, area_id: area.id, kind: "HOTSPOT", title: "Indikasi panas perlu diperhatikan", description: "Contoh anomali panas di sekitar kawasan gambut. Titik panas belum tentu kebakaran; diperlukan verifikasi lapangan.", observed_at: "2026-10-12T08:00:00Z", longitude: lon - 0.12, latitude: lat + 0.12, source: "DEMO sintetis · format hotspot satelit", is_simulation: true, extent: null },
    { id: `${area.id}-heat-2`, area_id: area.id, kind: "HOTSPOT", title: "Indikasi panas lain di wilayah Anda", description: "Contoh titik panas yang belum diperiksa. Jaga jarak aman jika melihat api atau asap.", observed_at: "2026-10-12T06:30:00Z", longitude: lon + 0.16, latitude: lat - 0.12, source: "DEMO sintetis · format hotspot satelit", is_simulation: true, extent: null },
    { id: `${area.id}-land-1`, area_id: area.id, kind: "LAND_CHANGE", title: "Indikasi perubahan tutupan lahan", description: "Contoh area yang tutupan lahannya berubah. Ini belum mengonfirmasi deforestasi atau alih fungsi lahan dan perlu pemeriksaan lebih lanjut.", observed_at: "2026-10-11T04:00:00Z", longitude: lon + 0.08, latitude: lat + 0.08, source: "DEMO sintetis · perubahan tutupan lahan", is_simulation: true, extent: [lon + 0.02, lat + 0.02, lon + 0.14, lat + 0.14] },
  ] as CommunityAlert[];
});

export function validateReport(input: unknown, now = new Date()): ReportInput {
  const result = reportInputSchema.parse(input);
  if (new Date(result.observed_at).getTime() > now.getTime()) throw new Error("Waktu kejadian tidak boleh di masa depan.");
  return result;
}

export function loadCommunityStore(storage: KeyValueStorage | null, onIssue: (message: string) => void): CommunityStore {
  if (!storage) return emptyCommunityStore();
  try {
    const raw = storage.getItem(COMMUNITY_STORE_KEY);
    if (!raw) return emptyCommunityStore();
    return communityStoreSchema.parse(JSON.parse(raw));
  } catch {
    onIssue("Data demo masyarakat dipulihkan karena penyimpanan sebelumnya tidak dapat dibaca.");
    const fresh = emptyCommunityStore();
    saveCommunityStore(storage, fresh);
    return fresh;
  }
}

export function saveCommunityStore(storage: KeyValueStorage | null, store: CommunityStore): boolean {
  try {
    if (!storage) return false;
    storage.setItem(COMMUNITY_STORE_KEY, JSON.stringify(store));
    return true;
  } catch { return false; }
}
