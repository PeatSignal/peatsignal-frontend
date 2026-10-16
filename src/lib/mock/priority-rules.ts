import type { AssessmentInput, FieldReport, GroundwaterObservation, Hotspot, InspectionTask, MonitoringMode, PriorityAssessment, PriorityDecision, PriorityLevel } from "@/types";
import { ASSESSMENT_BLOCKS, isInBbox, type AssessmentBlock } from "@/lib/domain/areas";
import { addDays, daysBetween, endOfDayMs } from "@/lib/domain/dates";
import { DEMO_GWT_SOURCE, DEMO_HOTSPOT_SOURCE, DEMO_RULE_SOURCE } from "./fixtures";

export const MOCK_RULE_VERSION = "demo-rules-0.1";
const WINDOW_DAYS = 7;
const SUPPORTING_RESULTS = new Set(["ACTIVE_FIRE_FOUND", "BURN_SCAR_FOUND"]);

export interface RuleInputs {
  mode: MonitoringMode;
  as_of: string;
  /** Hotspot sesuai mode. Fungsi ini sendiri yang membatasi ke jendela ≤ as_of. */
  hotspots: readonly Hotspot[];
  /** Seri GWT per stasiun untuk wilayah; kosong pada Current Monitoring. */
  groundwaterByRegion: ReadonlyMap<string, ReadonlyArray<readonly GroundwaterObservation[]>>;
  tasks: readonly InspectionTask[];
  reports: readonly FieldReport[];
}

/**
 * Tren GWT wilayah: rata-rata selisih antara observasi valid terbaru (≤ as_of, maksimal 2 hari sebelumnya)
 * dan observasi valid 6–8 hari sebelumnya. Hanya tanda tren yang dipakai; tidak ada ambang angka.
 */
export function regionalGwtTrend(series: ReadonlyArray<readonly GroundwaterObservation[]>, asOf: string): { trend_m: number | null; latest_m: number | null; latest_date: string | null; stations: number } {
  const deltas: number[] = [];
  const latest: { value: number; date: string }[] = [];
  for (const observations of series) {
    const valid = observations.filter((obs) => obs.gwt_m !== null && obs.observed_at <= asOf);
    const end = [...valid].reverse().find((obs) => daysBetween(obs.observed_at, asOf) <= 2);
    if (!end || end.gwt_m === null) continue;
    latest.push({ value: end.gwt_m, date: end.observed_at });
    const start = [...valid].reverse().find((obs) => {
      const gap = daysBetween(obs.observed_at, end.observed_at);
      return gap >= 6 && gap <= 8;
    });
    if (start && start.gwt_m !== null) deltas.push(end.gwt_m - start.gwt_m);
  }
  const mean = (values: number[]) => (values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 1000) / 1000 : null);
  return {
    trend_m: mean(deltas),
    latest_m: mean(latest.map((item) => item.value)),
    latest_date: latest.map((item) => item.date).sort().at(-1) ?? null,
    stations: deltas.length,
  };
}

export function evaluateBlock(block: AssessmentBlock, inputs: RuleInputs): PriorityAssessment {
  const windowStart = addDays(inputs.as_of, -(WINDOW_DAYS - 1));
  const cutoff = endOfDayMs(inputs.as_of);
  const hotspots = inputs.hotspots.filter((hotspot) => {
    const date = hotspot.observed_at.slice(0, 10);
    return date >= windowStart && Date.parse(hotspot.observed_at) <= cutoff && isInBbox(hotspot.longitude, hotspot.latitude, block.bbox);
  });
  const unverified = hotspots.filter((hotspot) => hotspot.verification_status === "UNVERIFIED" || hotspot.verification_status === "IN_VERIFICATION");
  const hotspotDays = new Set(hotspots.map((hotspot) => hotspot.observed_at.slice(0, 10))).size;
  const repeated = hotspotDays >= 3;

  const blockTaskIds = new Set(inputs.tasks.filter((task) => task.status === "VERIFIED" && task.mode === inputs.mode && task.hotspot_id !== null && inputs.hotspots.some((hotspot) => hotspot.id === task.hotspot_id && isInBbox(hotspot.longitude, hotspot.latitude, block.bbox))).map((task) => task.id));
  const supportingReports = inputs.reports.filter((report) => blockTaskIds.has(report.task_id) && SUPPORTING_RESULTS.has(report.result) && Date.parse(report.observed_at) <= cutoff);

  const series = inputs.mode === "HISTORICAL_REPLAY" ? inputs.groundwaterByRegion.get(block.region) ?? [] : [];
  const gwt = regionalGwtTrend(series, inputs.as_of);

  const reasons: string[] = [];
  const missing: string[] = ["CHIRPS_RAINFALL"];
  if (inputs.mode === "CURRENT_MONITORING") {
    reasons.push("GWT_NOT_AVAILABLE");
    missing.unshift("GWT_CURRENT");
  } else if (gwt.trend_m === null) {
    reasons.push("GWT_INSUFFICIENT");
    missing.unshift("GWT_TREND_7D");
  } else {
    reasons.push(gwt.trend_m < 0 ? "GWT_DECLINING" : "GWT_NOT_DECLINING");
  }
  const declining = gwt.trend_m !== null && gwt.trend_m < 0;

  let decision: PriorityDecision;
  let priority: PriorityLevel;
  if (repeated && supportingReports.length > 0) {
    reasons.unshift("HOTSPOT_REPEATED", "REPORT_SUPPORTS_FIRE");
    decision = "ESCALATE";
    priority = "HIGH";
  } else if (unverified.length > 0) {
    reasons.unshift(...(repeated ? ["HOTSPOT_REPEATED"] : []), "HOTSPOT_UNVERIFIED");
    decision = "REVIEW";
    priority = declining || repeated ? "HIGH" : "MEDIUM";
  } else if (hotspots.length > 0) {
    reasons.unshift("HOTSPOT_ALL_CHECKED");
    decision = "MONITOR";
    priority = declining ? "MEDIUM" : "LOW";
  } else if (gwt.trend_m !== null) {
    reasons.unshift("NO_HOTSPOT");
    decision = "MONITOR";
    priority = declining ? "MEDIUM" : "LOW";
  } else {
    // Tidak ada hotspot dan GWT tidak sezaman/tersedia: bukan berarti aman.
    reasons.unshift("NO_HOTSPOT");
    decision = "INSUFFICIENT_DATA";
    priority = "INSUFFICIENT_DATA";
  }

  const latestHotspot = hotspots.at(-1)?.observed_at ?? null;
  const snapshot: AssessmentInput[] = [
    { key: "hotspots_7d", label: "Anomali panas 7 hari", value: hotspots.length, unit: "titik", source: DEMO_HOTSPOT_SOURCE, observed_at: latestHotspot },
    { key: "hotspots_unverified_7d", label: "Belum diverifikasi", value: unverified.length, unit: "titik", source: DEMO_HOTSPOT_SOURCE, observed_at: latestHotspot },
    { key: "hotspot_days_7d", label: "Hari dengan anomali", value: hotspotDays, unit: "hari", source: DEMO_HOTSPOT_SOURCE, observed_at: latestHotspot },
    { key: "supporting_reports", label: "Laporan terverifikasi yang mendukung", value: supportingReports.length, unit: "laporan", source: "Laporan lapangan SIMULASI", observed_at: supportingReports.at(-1)?.observed_at ?? null },
    { key: "gwt_latest_m", label: "GWT wilayah terbaru", value: gwt.latest_m, unit: "m", source: DEMO_GWT_SOURCE, observed_at: gwt.latest_date },
    { key: "gwt_trend_7d_m", label: "Perubahan GWT 7 hari", value: gwt.trend_m, unit: "m", source: DEMO_GWT_SOURCE, observed_at: gwt.latest_date },
  ];

  return {
    id: `pa-${inputs.mode === "HISTORICAL_REPLAY" ? "h" : "c"}-${block.id}-${inputs.as_of}`,
    mode: inputs.mode,
    as_of: inputs.as_of,
    target: { type: "AREA", id: block.id, label: block.label },
    area_id: block.area_id,
    priority,
    decision,
    reason_codes: reasons,
    explanation: explanationFor(decision),
    missing_inputs: missing,
    input_snapshot: snapshot,
    recommended_actions: actionsFor(decision),
    rule_version: MOCK_RULE_VERSION,
    scientific_status: "heuristic_not_validated",
    source: DEMO_RULE_SOURCE,
    created_at: `${inputs.as_of}T23:59:59Z`,
    is_simulation: true,
  };
}

const priorityOrder: Record<PriorityLevel, number> = { HIGH: 0, MEDIUM: 1, LOW: 2, INSUFFICIENT_DATA: 3 };

export function evaluateAll(inputs: RuleInputs): PriorityAssessment[] {
  return ASSESSMENT_BLOCKS.map((block) => evaluateBlock(block, inputs)).sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || a.target.id.localeCompare(b.target.id));
}

function explanationFor(decision: PriorityDecision): string {
  switch (decision) {
    case "ESCALATE": return "Anomali panas berulang dan laporan lapangan terverifikasi mendukung adanya api atau bekas terbakar.";
    case "REVIEW": return "Ada anomali panas yang belum diverifikasi di blok ini. Inspeksi lapangan diperlukan untuk memastikan kondisinya.";
    case "MONITOR": return "Tidak ada anomali panas yang menunggu verifikasi. Lanjutkan pemantauan indikator yang tersedia.";
    case "INSUFFICIENT_DATA": return "Data belum cukup untuk menilai blok ini. Kondisi ini tidak berarti aman.";
  }
}

function actionsFor(decision: PriorityDecision): string[] {
  switch (decision) {
    case "ESCALATE": return ["Koordinasikan respons dengan tim pemadam setempat", "Tugaskan inspeksi lanjutan pada klaster anomali"];
    case "REVIEW": return ["Buat tugas inspeksi untuk anomali yang belum diverifikasi", "Periksa kondisi tata air di sekitar lokasi"];
    case "MONITOR": return ["Pantau anomali panas baru pada sinkronisasi berikutnya", "Periksa tren muka air tanah wilayah"];
    case "INSUFFICIENT_DATA": return ["Lengkapi data pengamatan sebelum menilai prioritas"];
  }
}
