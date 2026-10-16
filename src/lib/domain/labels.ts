import type { GwtDayStatus, GwtDirection } from "./groundwater";
import type { FieldReportResult, HotspotVerificationStatus, MonitoringMode, PriorityDecision, PriorityLevel, TaskStatus, UserRole } from "@/types";

export const modeLabels: Record<MonitoringMode, string> = {
  HISTORICAL_REPLAY: "Mode riwayat",
  CURRENT_MONITORING: "Mode terkini",
};

/** Penjelasan singkat mode untuk pengguna awam. */
export const modeDescriptions: Record<MonitoringMode, string> = {
  HISTORICAL_REPLAY: "Memutar ulang data 2018–2019 untuk latihan dan evaluasi.",
  CURRENT_MONITORING: "Simulasi kondisi saat ini. Data muka air terbaru belum tersedia.",
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  OPEN: "Baru",
  ASSIGNED: "Ditugaskan",
  IN_PROGRESS: "Dikerjakan",
  SUBMITTED: "Menunggu tinjauan",
  VERIFIED: "Terverifikasi",
  DISMISSED: "Ditutup",
  NEEDS_FOLLOWUP: "Perlu tindak lanjut",
};

/** Label tombol aksi menuju status tujuan. */
export const taskActionLabels: Record<TaskStatus, string> = {
  OPEN: "Buka",
  ASSIGNED: "Tugaskan",
  IN_PROGRESS: "Mulai kerjakan",
  SUBMITTED: "Kirim laporan",
  VERIFIED: "Verifikasi",
  DISMISSED: "Tutup tanpa temuan",
  NEEDS_FOLLOWUP: "Minta tindak lanjut",
};

export const priorityLabels: Record<PriorityLevel, string> = {
  HIGH: "Tinggi",
  MEDIUM: "Sedang",
  LOW: "Rendah",
  INSUFFICIENT_DATA: "Data kurang",
};

export const decisionLabels: Record<PriorityDecision, string> = {
  ESCALATE: "Eskalasi",
  REVIEW: "Perlu inspeksi",
  MONITOR: "Pantau",
  INSUFFICIENT_DATA: "Data belum cukup",
};

export const hotspotStatusLabels: Record<HotspotVerificationStatus, string> = {
  UNVERIFIED: "Belum diverifikasi",
  IN_VERIFICATION: "Sedang diperiksa",
  VERIFIED: "Terverifikasi",
  DISMISSED: "Tidak ditemukan api",
};

export const reportResultLabels: Record<FieldReportResult, string> = {
  ACTIVE_FIRE_FOUND: "Api aktif ditemukan",
  BURN_SCAR_FOUND: "Bekas terbakar ditemukan",
  NO_FIRE_FOUND: "Tidak ditemukan api",
  LOCATION_INACCESSIBLE: "Lokasi tidak dapat dijangkau",
};

export const roleLabels: Record<UserRole, string> = {
  coordinator: "Koordinator",
  field_officer: "Petugas lapangan",
};

/** Arti confidence mentah VIIRS. Bukan probabilitas kebakaran. */
export const confidenceLabels: Record<string, string> = {
  l: "Rendah",
  n: "Nominal",
  h: "Tinggi",
};

export const reasonCodeLabels: Record<string, string> = {
  HOTSPOT_UNVERIFIED: "Ada anomali panas yang belum diverifikasi",
  HOTSPOT_REPEATED: "Anomali panas muncul berulang pada beberapa hari",
  REPORT_SUPPORTS_FIRE: "Laporan lapangan mendukung adanya api atau bekas terbakar",
  HOTSPOT_ALL_CHECKED: "Semua anomali panas sudah diperiksa",
  NO_HOTSPOT: "Tidak ada anomali panas pada periode ini",
  GWT_DECLINING: "Muka air tanah wilayah cenderung menurun",
  GWT_NOT_DECLINING: "Muka air tanah wilayah tidak menurun",
  GWT_NOT_AVAILABLE: "Data muka air tanah tidak tersedia",
  GWT_INSUFFICIENT: "Pengamatan muka air tanah belum cukup untuk tren",
  // Kode decision engine backend (inspection-rules-1.0).
  HOTSPOT_REQUIRES_VERIFICATION: "Ada anomali panas yang belum diperiksa di lapangan",
  HOTSPOT_REPEATED_3_DAYS: "Anomali panas muncul pada 3 hari berbeda atau lebih dalam 7 hari",
  FIELD_REPORT_SUPPORTS_INDICATION: "Laporan lapangan terverifikasi menemukan api atau bekas terbakar",
  REGIONAL_GWT_DECLINING: "Muka air tanah wilayah cenderung menurun (makin kering)",
  REGIONAL_GWT_TREND_AVAILABLE: "Tren muka air tanah 7 hari tersedia untuk wilayah ini",
  INSUFFICIENT_CONTEMPORARY_INPUTS: "Data pada periode ini belum cukup untuk menentukan prioritas",
};

export const missingInputLabels: Record<string, string> = {
  GWT_CURRENT: "Muka air tanah terkini (tidak ada observasi setelah 2019)",
  GWT_TREND_7D: "Tren muka air tanah 7 hari",
  HOTSPOT_OBSERVATIONS: "Pengamatan anomali panas",
  CHIRPS_RAINFALL: "Curah hujan CHIRPS (belum terintegrasi)",
  FIELD_VERIFICATION: "Laporan lapangan terverifikasi",
  HOTSPOT_EVIDENCE: "Anomali panas dalam 7 hari terakhir",
};

/** Status harian muka air tanah dengan bahasa awam. */
export const gwtDayStatusLabels: Record<GwtDayStatus, string> = {
  VALID: "Terukur",
  MISSING: "Tidak ada pengukuran",
  DUPLICATE: "Data ganda bertentangan",
  SUSPECT: "Perlu dicek, tidak dipakai",
  NO_RECORD: "Tidak tercatat di sumber",
  OUTSIDE_STATION: "Di luar periode stasiun",
};

export const gwtDirectionLabels: Record<GwtDirection, string> = {
  DRIER: "Makin kering",
  WETTER: "Makin basah",
  STABLE: "Relatif tetap",
};
