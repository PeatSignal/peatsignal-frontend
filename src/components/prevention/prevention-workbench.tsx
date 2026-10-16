"use client";

import { useId, useState, useEffect, useSyncExternalStore, type FormEvent } from "react";
import { Download, Droplets, FlaskConical, MapPin } from "lucide-react";
import { CartesianGrid, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { useRepositoryQuery } from "@/components/providers/use-repository-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/select";
import { ErrorState } from "@/components/shared/async-states";
import { errorMessage } from "@/lib/api";
import { addDays } from "@/lib/domain/dates";
import { preventionInputSchema } from "@/lib/schemas/prevention";
import { formatDate, formatDecimal, formatMeters } from "@/lib/format";
import type { PreventionInput, PreventionResponse } from "@/types";

const field = "h-10 w-full min-w-0 rounded-md border bg-card px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
const levels = { HIGH: "Prioritas tinggi", MEDIUM: "Perlu dipantau", LOW: "Pemantauan rutin", INSUFFICIENT_DATA: "Perbarui data" };
const subscribeToClock = () => () => {};
const utcToday = () => new Date().toISOString().slice(0, 10);
const serverDate = () => "";
const blank = () => Array.from({ length: 7 }, () => ({ gwt: "", rain: "" }));

function Result({ data, input }: { data: PreventionResponse; input: PreventionInput }) {
  const p = data.prevention;
  const f = data.forecast;
  const chart = [
    ...input.readings.map((row, i) => ({ date: row.date, measured: row.gwt_m as number | null, selected: i === 6 ? row.gwt_m : null, model: i === 6 && f.model_gwt_m !== null ? row.gwt_m : null })),
    ...(f.selected_gwt_m !== null ? [{ date: f.forecast_date, measured: null, selected: f.selected_gwt_m, model: f.model_gwt_m }] : []),
  ];
  function download() {
    const blob = new Blob([JSON.stringify({ generated_at: new Date().toISOString(), input_snapshot: { ...input, readings: data.readings ?? input.readings }, result: data }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = `peatsignal-${data.station_code}-${data.input_date}-${data.source_kind}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <section aria-label="Hasil penilaian lapangan" className="space-y-5 border-t pt-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">Hasil {data.station_code}</h3><Badge variant="warning">{data.is_simulation ? "DEMO" : "INPUT MANUAL · BELUM DIVERIFIKASI"}</Badge></div>
      <Button type="button" size="sm" variant="outline" onClick={download}><Download aria-hidden="true" />Unduh ringkasan</Button>
    </div>
    <p className="text-xs text-muted-foreground">Input sampai {formatDate(data.input_date)} (UTC) · {data.source_note}</p>
    <figure aria-label="Grafik pengukuran dan prediksi lapangan" className="min-w-0 rounded-xl border p-3">
      <div className="h-56 w-full"><LineChart responsive style={{ width: "100%", height: "100%" }} data={chart} margin={{ top: 12, right: 12, bottom: 4, left: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" /><XAxis dataKey="date" tickFormatter={(date: string) => date.slice(5)} minTickGap={24} tick={{ fontSize: 11 }} /><YAxis width={48} domain={["auto", "auto"]} tick={{ fontSize: 11 }} /><Tooltip labelFormatter={(value) => formatDate(String(value))} formatter={(value) => typeof value === "number" ? formatMeters(value, 3) : "Tidak tersedia"} />
        <ReferenceLine y={-0.4} stroke="#b45309" strokeDasharray="3 4" />
        <Line dataKey="measured" name="Input GWT" stroke="#15803d" strokeWidth={2} dot={false} isAnimationActive={false} />
        <Line dataKey="selected" name="Pembanding terpilih" stroke="#2563eb" strokeDasharray="5 4" dot isAnimationActive={false} />
        <Line dataKey="model" name="Kandidat ML" stroke="#7c3aed" strokeDasharray="2 4" dot={false} isAnimationActive={false} />
      </LineChart></div><figcaption className="text-xs leading-5 text-muted-foreground">GWT · hijau / Pembanding · biru / ML · ungu / Acuan · −0,40 m. {data.is_simulation && "Seluruh input grafik adalah DEMO."}</figcaption>
    </figure>
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
        <h4 className="font-semibold">Prediksi +1 hari · {formatDate(f.forecast_date)}</h4>
        {f.selected_gwt_m !== null ? <><p className="text-3xl font-bold tabular-nums">{formatMeters(f.selected_gwt_m, 3)}</p><p className="text-xs">Metode terpilih: {f.selected_method === "RANDOM_FOREST" ? "Random Forest" : "Baseline (nilai terakhir)"}</p></> : <p className="text-sm">Prediksi belum tersedia.</p>}
        <details className="text-sm"><summary className="cursor-pointer text-muted-foreground">Alasan pemilihan metode</summary><p className="mt-2 leading-6">{f.reason}</p></details>
        {f.model_gwt_m !== null && <dl className="grid gap-2 border-t pt-3 text-sm"><div className="flex justify-between gap-3"><dt>Kandidat ML</dt><dd>{formatMeters(f.model_gwt_m, 3)}</dd></div><div className="flex justify-between gap-3"><dt>Baseline</dt><dd>{formatMeters(f.baseline_gwt_m!, 3)}</dd></div><div className="text-xs text-muted-foreground">MAE historis: ML {formatDecimal(f.model_mae_cm!, 2)} cm · baseline {formatDecimal(f.baseline_mae_cm!, 2)} cm. Ini bukan ukuran akurasi hari ini.</div></dl>}
        <p className="text-xs font-medium text-amber-900">Eksperimental · belum divalidasi untuk kondisi terkini.</p>
      </div>
      <div className="space-y-3 rounded-xl border border-primary/20 bg-secondary/30 p-4">
        <h4 className="font-semibold">Rekomendasi pencegahan</h4>
        <Badge variant={p.priority === "HIGH" ? "destructive" : "outline"}>{levels[p.priority]}</Badge>
        <p className="text-sm leading-6">{p.explanation}</p>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-6">{p.recommended_actions.map((action) => <li key={action}>{action}</li>)}</ol>
        <p className="text-xs text-muted-foreground">Berdasarkan pengukuran GWT{p.rainfall_7d_mm !== null ? " + curah hujan" : " saja"}; prediksi ML tidak menaikkan prioritas.</p>
      </div>
    </div>
    <details className="text-sm"><summary className="cursor-pointer font-medium">Alasan rekomendasi</summary><ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">{p.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></details>
    {p.missing_inputs.length > 0 && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Data belum lengkap: {p.missing_inputs.join(" ")}</p>}
    {data.rainfall && <details className="rounded-lg border p-3 text-sm"><summary className="cursor-pointer font-medium">Sumber hujan otomatis</summary><p className="mt-3 text-xs leading-5">{data.rainfall.note}</p><p className="mt-2 text-xs text-muted-foreground">{data.rainfall.provider === "OPEN_METEO" ? "Open-Meteo · estimasi model" : "CHIRPS via ClimateSERV"} · diambil {data.rainfall.retrieved_at} · {data.rainfall.provider === "OPEN_METEO" ? "titik acuan DEMO" : "rata-rata wilayah DEMO"} {data.rainfall.area_label}.</p><div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">{data.rainfall.days.map((day) => <p key={day.date}>{formatDate(day.date)}: {day.rainfall_mm === null ? "Belum tersedia" : `${formatDecimal(day.rainfall_mm, 2)} mm`}{day.kind === "FORECAST" ? " · Prakiraan, tidak dipakai sebagai pengukuran" : ""}</p>)}</div></details>}
    <details className="rounded-lg border p-3 text-sm"><summary className="cursor-pointer font-medium">Sumber, aturan, dan batasan hasil</summary><ul className="mt-3 list-disc space-y-2 pl-5">{data.limitations.map((item) => <li key={item}>{item}</li>)}</ul><p className="mt-3 break-words text-xs text-muted-foreground">{p.rule_version}{f.model_version ? ` · ${f.model_version}` : ""}</p></details>
  </section>;
}

export function PreventionWorkbench() {
  const id = useId();
  const [source, setSource] = useState<"MANUAL" | "DEMO">("MANUAL");
  const [rainMode, setRainMode] = useState<"MANUAL" | "CHIRPS" | "AUTO">("AUTO");
  const [station, setStation] = useState<"BRG3" | "BRG6">("BRG6");
  const today = useSyncExternalStore(subscribeToClock, utcToday, serverDate);
  const [chosenEnd, setEnd] = useState("");
  const end = chosenEnd || today;
  const [note, setNote] = useState("");
  const [rows, setRows] = useState(blank);
  const [validation, setValidation] = useState("");
  const [request, setRequest] = useState<PreventionInput | null>(null);
  const result = useRepositoryQuery(request ? ["field-prevention", request] : null, (repo, signal) => repo.assessPrevention(request!, { signal }));
  const rainfall = useRepositoryQuery(rainMode !== "MANUAL" && end && end >= "1981-01-07" ? ["rainfall", rainMode, "batanghari", end] : null,
    (repo, signal) => rainMode === "AUTO" ? repo.getAutomaticRainfall({ area_id: "batanghari", date_to: end }, { signal }) : repo.getChirpsRainfall({ area_id: "batanghari", date_to: end }, { signal }));
  useEffect(() => {
    if (rainfall.data?.status !== "PENDING") return;
    const timer = setTimeout(rainfall.refetch, 3000);
    return () => clearTimeout(timer);
  }, [rainfall.data?.status, rainfall.refetch]);
  const rainByDate = new Map((rainfall.data?.days ?? []).map((row) => [row.date, row.rainfall_mm]));
  const dates = rows.map((_, index) => end ? addDays(end, index - 6) : "");
  function resetResult() { setRequest(null); setValidation(""); }
  function changeSource(value: string) { resetResult(); setSource(value as "MANUAL" | "DEMO"); setRainMode(value === "MANUAL" ? "AUTO" : "MANUAL"); setRows(blank()); setNote(""); }
  function preset(kind: "dry" | "wet" | "no-rain") {
    resetResult(); setSource("DEMO"); setRainMode("MANUAL"); setEnd(today); setNote("Contoh skenario sintetis untuk demonstrasi; bukan pengukuran lapangan.");
    const levels = kind === "wet" ? [-35, -33, -30, -28, -25, -23, -20] : [-32, -35, -39, -42, -45, -48, -52];
    setRows(levels.map((gwt, index) => ({ gwt: String(gwt), rain: kind === "no-rain" ? "" : kind === "wet" ? String([12, 18, 20, 15, 25, 18, 15][index]) : "0" })));
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (rows.some((row) => row.gwt.trim() === "")) { setValidation("Lengkapi tujuh nilai GWT; kosong tidak dianggap nol."); return; }
    const parsed = preventionInputSchema.safeParse({ station_code: station, source_kind: source, source_note: note, rainfall_mode: rainMode, readings: rows.map((row, index) => ({ date: dates[index], gwt_m: Number(row.gwt) / 100, rainfall_mm: rainMode !== "MANUAL" ? null : row.rain.trim() === "" ? null : Number(row.rain) })) });
    if (!parsed.success) { setValidation(parsed.error.issues[0]?.message ?? "Periksa kembali isian."); return; }
    setValidation("");
    if (JSON.stringify(parsed.data) === JSON.stringify(request)) result.refetch(); else setRequest(parsed.data);
  }
  return <section aria-labelledby={`${id}-title`} className="min-w-0 space-y-5 rounded-xl border bg-card p-4 sm:p-6">
    <div className="space-y-2"><h2 id={`${id}-title`} className="flex items-center gap-2 text-lg font-semibold"><Droplets className="size-5 shrink-0 text-primary" aria-hidden="true" />Penilaian dari pengukuran lapangan</h2><p className="text-sm leading-6 text-muted-foreground">Isi 7 hari pengukuran untuk prediksi besok dan rekomendasi pencegahan.</p></div>
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b pb-4 text-xs">
      <span className="inline-flex items-center gap-1.5 font-medium"><MapPin className="size-3.5 text-primary" aria-hidden="true" />Wilayah DEMO: Batanghari, Jambi</span>
      <details className="w-full text-muted-foreground"><summary className="w-fit cursor-pointer hover:text-foreground">Detail lokasi &amp; sumber</summary><div className="mt-2 max-w-2xl space-y-1 leading-5">
        <p>BRG3 dan BRG6 memakai konteks Batanghari; filter wilayah pemantauan tidak mengubah lokasi uji.</p>
        <p>Open-Meteo: titik acuan DEMO 1,75° LS, 103,45° BT. CHIRPS: rata-rata kotak wilayah DEMO Batanghari. Koordinat persis stasiun belum tersedia.</p>
        <p>Gunakan GWT dari stasiun yang sesuai. Input uji tidak disimpan sebagai observasi.</p>
      </div></details>
    </div>
    <div className="flex flex-wrap items-center gap-2" aria-label="Contoh skenario"><FlaskConical className="size-4 text-muted-foreground" aria-hidden="true" /><span className="text-xs text-muted-foreground">Coba demo:</span><Button type="button" size="sm" variant="outline" onClick={() => preset("dry")}>Contoh kering</Button><Button type="button" size="sm" variant="outline" onClick={() => preset("wet")}>Contoh pulih</Button><Button type="button" size="sm" variant="outline" onClick={() => preset("no-rain")}>Tanpa data hujan</Button></div>
    <form onSubmit={submit} className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <div className="min-w-0 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <div className="space-y-2 text-sm"><p>Sumber input</p><Select aria-label="Sumber input" value={source} onValueChange={changeSource} options={[{ value: "MANUAL", label: "Pengukuran manual" }, { value: "DEMO", label: "Contoh DEMO" }]} /></div>
        <div className="space-y-2 text-sm"><p>Stasiun model</p><Select aria-label="Stasiun model" value={station} onValueChange={(value) => { resetResult(); setStation(value as "BRG3" | "BRG6"); setRows(blank()); setNote(""); }} options={[{ value: "BRG6", label: "BRG6" }, { value: "BRG3", label: "BRG3" }]} /></div>
        <div className="space-y-2 text-sm sm:col-span-2 lg:col-span-1 xl:col-span-2"><p>Tanggal terakhir (UTC)</p><DatePicker label="Tanggal terakhir pengukuran" value={end} min={rainMode !== "MANUAL" ? "1981-01-07" : undefined} max={today} onChange={(value) => { resetResult(); setEnd(value); setRows(blank()); }} /></div>
      </div>
      <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
        <div className="max-w-sm space-y-2 text-sm"><p>Sumber curah hujan</p><Select aria-label="Sumber curah hujan" value={rainMode} onValueChange={(value) => { resetResult(); setRainMode(value as "MANUAL" | "CHIRPS" | "AUTO"); setRows(rows.map((row) => ({ ...row, rain: "" }))); }} options={[{ value: "AUTO", label: "Otomatis · cuaca terkini" }, { value: "CHIRPS", label: "CHIRPS Final · historis" }, { value: "MANUAL", label: "Input hujan manual / demo" }]} /></div>
        {rainMode !== "MANUAL" && <div className="space-y-2 text-xs leading-5">
          {rainfall.status === "loading" && <p role="status">Mengambil data hujan otomatis…</p>}
          {rainfall.status === "error" && <ErrorState description={errorMessage(rainfall.error)} onRetry={rainfall.refetch} />}
          {rainfall.data && <><p role="status">{rainfall.data.provider === "OPEN_METEO" ? "Open-Meteo · estimasi cuaca: " : ""}{rainfall.data.status === "AVAILABLE" ? (rainfall.data.provider === "OPEN_METEO" ? "Hujan tersedia" : "CHIRPS tersedia") : rainfall.data.status === "PARTIAL" ? (rainfall.data.provider === "OPEN_METEO" ? "Hujan sebagian tersedia" : "CHIRPS sebagian tersedia") : rainfall.data.status === "PENDING" ? "CHIRPS sedang diproses" : rainfall.data.status === "ERROR" ? "Sumber hujan sedang terganggu" : (rainfall.data.provider === "OPEN_METEO" ? "Hujan belum tersedia untuk periode ini" : "CHIRPS belum tersedia untuk periode ini")} · {rainfall.data.days.filter((day) => day.rainfall_mm !== null).length}/7 hari.</p><p className="text-muted-foreground">{rainfall.data.provider === "OPEN_METEO" ? "Estimasi cuaca · titik acuan DEMO" : "Estimasi hujan · wilayah DEMO"}</p>{rainfall.data.days.some((day) => day.kind === "FORECAST") && <p className="text-amber-900">Hari ini: prakiraan, dikecualikan dari rekomendasi.</p>}<details className="text-muted-foreground"><summary className="cursor-pointer">Detail sumber hujan</summary><p className="mt-2">{rainfall.data.note}</p><p className="mt-1">Mode otomatis memakai Open-Meteo untuk periode terkini dan CHIRPS untuk periode lebih dari 14 hari lalu.</p></details><Button type="button" size="sm" variant="outline" onClick={rainfall.refetch}>{rainMode === "CHIRPS" ? "Periksa CHIRPS lagi" : "Perbarui data hujan"}</Button></>}
        </div>}
      </div>
      <label className="block space-y-2 text-sm"><span>Catatan sumber pengukuran</span><input className={field} value={note} minLength={3} maxLength={300} required placeholder="Mis. pengukuran dipwell BRG6" onChange={(event) => { resetResult(); setNote(event.target.value); }} /></label>
      </div>
      <div className="min-w-0 space-y-4">
      {source === "DEMO" && <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">DEMO</p>}
      <fieldset className="space-y-2"><legend className="mb-3 text-sm font-semibold">Pengukuran harian</legend><p className="pb-2 text-xs text-muted-foreground">GWT negatif: di bawah permukaan. Hujan kosong: belum diketahui.</p><div className="grid grid-cols-[80px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 text-xs text-muted-foreground sm:grid-cols-[140px_minmax(0,1fr)_minmax(0,1fr)]"><span>Tanggal</span><span>GWT (cm)</span><span>Hujan (mm)</span></div>
        {rows.map((row, index) => <div key={index} className="grid grid-cols-[80px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[140px_minmax(0,1fr)_minmax(0,1fr)]"><span className="text-xs tabular-nums">{dates[index] ? formatDate(dates[index]) : "—"}</span><input aria-label={`GWT ${dates[index]} (cm)`} className={field} type="number" step="any" min="-1000" max="200" required value={row.gwt} placeholder="−40" onChange={(event) => { resetResult(); setEnd(end); setRows(rows.map((item, i) => i === index ? { ...item, gwt: event.target.value } : item)); }} /><input aria-label={`Hujan ${dates[index]} (mm)`} className={field} type="number" step="any" min="0" max="1500" readOnly={rainMode !== "MANUAL"} value={rainMode !== "MANUAL" ? rainByDate.get(dates[index]!) ?? "" : row.rain} placeholder={rainMode !== "MANUAL" ? "Belum ada" : "Opsional"} onChange={(event) => { resetResult(); setEnd(end); setRows(rows.map((item, i) => i === index ? { ...item, rain: event.target.value } : item)); }} /></div>)}
      </fieldset>
      {validation && <p role="alert" className="text-sm text-red-800">{validation}</p>}
      <Button className="w-full sm:w-auto" type="submit" disabled={result.status === "loading" || (rainMode !== "MANUAL" && rainfall.status === "loading")}>{result.status === "loading" ? "Menghitung penilaian…" : "Hitung prediksi & rekomendasi"}</Button>
      </div>
    </form>
    <div aria-live="polite">{result.status === "loading" && <p role="status" className="text-sm">Memproses pengukuran…</p>}{result.status === "error" && <ErrorState description={errorMessage(result.error)} onRetry={result.refetch} />}{result.data && request && <Result data={result.data} input={request} />}</div>
  </section>;
}
