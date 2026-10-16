import { addDays, daysBetween } from "@/lib/domain/dates";
import type { PreventionInput, PreventionResponse, ChirpsRainfall } from "@/types";

export function assessMockPrevention(input: PreventionInput, today: string): PreventionResponse {
  const rainfall = input.rainfall_mode === "AUTO" ? unavailableAutomatic("batanghari", input.readings[6]!.date) : input.rainfall_mode === "CHIRPS" ? unavailableChirps("batanghari", input.readings[6]!.date) : null;
  if (rainfall) input = { ...input, readings: input.readings.map((row) => ({ ...row, rainfall_mm: null })) };
  const rows = [...input.readings].sort((a, b) => a.date.localeCompare(b.date));
  const last = rows[6]!;
  const change = Math.round((last.gwt_m - rows[0]!.gwt_m) * 1e6) / 1e6;
  const rain = rows.flatMap((row) => row.rainfall_mm === null ? [] : [row.rainfall_mm]);
  const total = rain.length === 7 ? Math.round(rain.reduce((sum, value) => sum + value, 0) * 1000) / 1000 : null;
  let dryDays: number | null = null;
  if (total !== null) { dryDays = 0; for (const value of [...rain].reverse()) { if (value >= 1) break; dryDays++; } }
  const fresh = daysBetween(last.date, today) <= 2;
  const low = last.gwt_m <= -0.4, declining = change <= -0.05, dry = total !== null && total < 10;
  const priority = !fresh ? "INSUFFICIENT_DATA" : low && (declining || dry) ? "HIGH" : low || declining || dry ? "MEDIUM" : "LOW";
  const missing = total === null ? ["Curah hujan harian belum lengkap (7 hari)."] : [];
  const reasons = [`GWT terakhir ${last.gwt_m.toFixed(3)} m; perubahan selama 7 tanggal ${change.toFixed(3)} m.`];
  reasons.push(total === null ? "Curah hujan belum lengkap; penilaian hanya memakai GWT." : `Curah hujan 7 hari ${total.toFixed(1)} mm; ${dryDays} hari terakhir <1 mm/hari.`);
  const actions: string[] = [];
  if (low) { reasons.push("GWT mencapai/melewati acuan prototipe −0,40 m."); actions.push("Minta petugas mengukur ulang GWT dan memeriksa kondisi tata air/kanal."); }
  if (declining) { reasons.push("Muka air turun setidaknya 5 cm selama jendela pengukuran."); actions.push("Tingkatkan pemantauan harian dan catat perubahan berikutnya."); }
  if (dry) { reasons.push("Hujan kurang dari 10 mm/7 hari pada acuan prototipe."); actions.push("Prioritaskan patroli pencegahan dan pemeriksaan lapangan saat kering."); }
  if (!actions.length) actions.push("Lanjutkan pengukuran harian dan tinjau ulang bila muka air turun.");
  if (total === null) actions.push("Lengkapi pengukuran hujan untuk menilai konteks kekeringan.");
  if (!fresh) missing.push("GWT terbaru (maksimal berumur 2 hari).");
  return {
    station_code: input.station_code, source_kind: input.source_kind, source_note: input.source_note,
    is_simulation: input.source_kind === "DEMO", input_date: last.date, freshness: fresh ? "RECENT" : "STALE",
    observation_status: input.source_kind === "DEMO" ? "SIMULATED" : "USER_PROVIDED_UNVERIFIED",
    forecast: { status: fresh ? "BASELINE_ONLY" : "NOT_AVAILABLE", reason: fresh ? "Mode demo: pembanding memakai GWT terakhir; model ML hanya tersedia dari server." : "Perbarui tujuh hari input; pengukuran terakhir lebih dari dua hari lalu.", forecast_date: addDays(last.date, 1), selected_method: fresh ? "PERSISTENCE" : null, selected_gwt_m: fresh ? last.gwt_m : null, baseline_gwt_m: fresh ? last.gwt_m : null, model_gwt_m: null, model_version: null, model_mae_cm: null, baseline_mae_cm: null },
    prevention: {
      priority, explanation: !fresh ? "Pengukuran terakhir lebih dari dua hari lalu; perbarui data lapangan." : priority === "HIGH" ? "Prioritaskan pemeriksaan: muka air rendah disertai penurunan/hujan minim." : priority === "MEDIUM" ? "Ada indikator yang perlu dipantau dan diperiksa oleh petugas." : "Lanjutkan pemantauan rutin; hasil ini bukan jaminan tidak terjadi kebakaran.",
      reasons, recommended_actions: fresh ? actions : ["Lakukan pengukuran GWT terbaru sebelum menentukan tindakan."], missing_inputs: missing,
      latest_gwt_m: last.gwt_m, change_m: change, rainfall_7d_mm: total, rainfall_days: rain.length, dry_spell_days: dryDays,
      reference_gwt_m: -0.4, rule_version: "field-prevention-1.0", scientific_status: "heuristic_not_validated", forecast_used: false,
    },
    rainfall, readings: input.readings,
    limitations: ["Aturan prototipe; bukan probabilitas kebakaran atau jaminan aman.", "Input pengguna belum diverifikasi. Contoh DEMO bukan pengukuran lapangan.", "Model tidak direkayasa pada mode demo; pembanding menganggap besok sama dengan hari ini.", "Input ini tidak disimpan sebagai observasi atau mengubah dashboard pemantauan."],
  };
}

export function unavailableChirps(area: "batanghari" | "kubu-raya", end: string): ChirpsRainfall {
  return { status: "NOT_AVAILABLE", dataset_id: "UCSB-CHG/CHIRPS/DAILY", provider: "CLIMATESERV", scope: "REGIONAL_DEMO_BBOX", area_id: area, area_label: area === "batanghari" ? "Batanghari" : "Kubu Raya", bbox: area === "batanghari" ? [102.9, -2.2, 104, -1.3] : [108.9, -1.2, 110, 0.3], resolution_degrees: 0.05, statistic: "MEAN_VALID_CELLS", date_from: addDays(end, -6), date_to: end, retrieved_at: new Date().toISOString(), days: Array.from({ length: 7 }, (_, i) => { const date = addDays(end, i-6); return { date, rainfall_mm: null, valid_cells: 0, kind: "HISTORICAL_ESTIMATE", eligible_for_assessment: true, source_url: `https://data.chc.ucsb.edu/products/CHIRPS-2.0/global_daily/tifs/p05/${date.slice(0,4)}/chirps-v2.0.${date.replaceAll("-", ".")}.tif.gz` }; }), note: "Mode demo tidak mengunduh atau mengarang data CHIRPS. Hubungkan API backend untuk hujan otomatis." };
}

export function unavailableAutomatic(area: "batanghari" | "kubu-raya", end: string): ChirpsRainfall {
  const base = unavailableChirps(area, end);
  return { ...base, provider: "OPEN_METEO", dataset_id: "OPEN_METEO_PRECIPITATION", scope: "REGIONAL_REFERENCE_POINT", statistic: "MODEL_GRID_POINT", resolution_degrees: null, note: "Mode DEMO tidak mengunduh atau mengarang cuaca terkini. Hubungkan backend untuk data asli.", days: base.days.map((row) => ({ ...row, kind: "MODEL_ESTIMATE", eligible_for_assessment: true, source_url: "https://api.open-meteo.com/v1/forecast" })) };
}
