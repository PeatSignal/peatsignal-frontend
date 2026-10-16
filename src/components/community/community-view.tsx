"use client";

import { useState } from "react";
import { Bell, CheckCheck, Flame, Leaf, MapPin, Send, ShieldCheck, TreePine } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { AREAS, findArea, isInBbox } from "@/lib/domain/areas";
import { COMMUNITY_ALERTS, categoryLabels, citizenReportStatusLabels, type ReportInput } from "@/lib/community";
import { formatDateTime } from "@/lib/format";
import { useCommunity } from "./community-provider";
import { CommunityMap } from "./community-map";
import { ReportHistory } from "./report-history";

const field = "mt-2 w-full rounded-lg border bg-card px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
function localNow() { const date = new Date(); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }

export function CommunityView() {
  const { store, ready, markRead, createReport } = useCommunity();
  const [areaId, setAreaId] = useState("batanghari");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [picking, setPicking] = useState(false);
  const [category, setCategory] = useState<ReportInput["category"]>("FIRE");
  const [error, setError] = useState<string | null>(null);
  const [observedAt, setObservedAt] = useState(localNow);
  const area = findArea(areaId)!;
  const alerts = COMMUNITY_ALERTS.filter((alert) => alert.area_id === areaId);
  const reports = store.reports.filter((report) => report.area_id === areaId);
  const unread = alerts.filter((alert) => !store.read_alert_ids.includes(alert.id));
  const selected = alerts.find((alert) => alert.id === selectedId);
  const selectedReport = reports.find((report) => report.id === selectedId);
  function chooseLocation(point: [number, number]) {
    if (!isInBbox(point[0], point[1], area.bbox)) { toast.error("Pilih titik di dalam batas wilayah."); return; }
    setLocation(point); setPicking(false);
  }
  function changeArea(id: string) { setAreaId(id); setLocation(null); setSelectedId(null); setPicking(false); setError(null); }
  function selectAlert(id: string) { setSelectedId(id); markRead([id]); }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null);
    if (!location) { setError("Pilih lokasi kejadian pada peta atau gunakan pusat wilayah."); return; }
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      createReport({ category, area_id: areaId as ReportInput["area_id"], longitude: location[0], latitude: location[1], observed_at: new Date(observedAt).toISOString(), description: String(data.get("description") ?? ""), contact: String(data.get("contact") ?? "") });
      form.reset(); setLocation(null); setPicking(false); setObservedAt(localNow());
      toast.success("Laporan tersimpan");
    } catch (failure) { setError(failure instanceof z.ZodError ? failure.issues[0]?.message ?? "Periksa kembali laporan Anda." : failure instanceof Error ? failure.message : "Laporan belum dapat disimpan."); }
  }

  return <div className="space-y-7">
    <section className="flex flex-wrap items-start justify-between gap-5">
      <div className="max-w-2xl"><p className="mb-2 text-xs font-semibold tracking-widest text-primary uppercase">Bersama menjaga gambut</p><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Pantau hutan, jaga kehidupan</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Kenali indikasi kebakaran dan perubahan lahan di sekitar Anda. Catat temuan Anda melalui laporan warga.</p></div>
    </section>
    <div className="flex flex-wrap items-end justify-between gap-4"><div className="w-full sm:w-80"><label htmlFor="community-area" className="text-sm font-medium">Wilayah pantauan</label><Select id="community-area" className="mt-2" value={areaId} onValueChange={changeArea} options={AREAS.map((item) => ({ value: item.id, label: item.label }))} /></div><p className="max-w-md text-xs leading-5 text-muted-foreground">Periode pantauan 11–12 Oktober 2026. Batas wilayah merupakan perkiraan.</p></div>
    <div className="grid gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan wilayah">
      {[{ label: "Peringatan wilayah", value: alerts.length, icon: Bell }, { label: "Indikasi titik panas", value: alerts.filter((a) => a.kind === "HOTSPOT").length, icon: Flame }, { label: "Perubahan tutupan lahan", value: alerts.filter((a) => a.kind === "LAND_CHANGE").length, icon: TreePine }, { label: "Belum dibaca", value: ready ? unread.length : "…", icon: Leaf }].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-xl border bg-card p-5"><Icon className="size-5 text-primary" aria-hidden="true" /><p className="mt-3 text-3xl font-bold tabular-nums">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>)}
    </div>
    <aside className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950"><ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><p className="text-sm leading-6"><strong>Melihat api atau asap sungguhan?</strong> Jaga jarak aman dan hubungi 112 atau BPBD setempat. Utamakan keselamatan diri dan orang di sekitar Anda.</p></aside>
    <section aria-labelledby="community-map-title" className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="community-map-title" className="text-lg font-semibold">Peta pantauan wilayah</h2><p className="mt-1 text-xs text-muted-foreground">Pilih titik atau area untuk membaca detail indikasi.</p></div><Button variant={picking ? "default" : "outline"} aria-pressed={picking} onClick={() => setPicking(!picking)}><MapPin aria-hidden="true" />{picking ? "Batalkan pilih lokasi" : "Pilih lokasi laporan"}</Button></div>
      {picking && <p role="status" className="rounded-lg bg-secondary px-3 py-2 text-sm">Ketuk peta di dalam batas wilayah untuk menandai lokasi kejadian.</p>}
      <CommunityMap areaId={areaId} alerts={alerts} reports={reports} selectedId={selectedId} location={location} picking={picking} onSelect={selectAlert} onLocation={chooseLocation} />
      <ul aria-label="Legenda peta" className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">{[["bg-orange-600", "Titik panas"], ["bg-yellow-700", "Perubahan lahan"], ["bg-green-700", "Laporan warga"], ["bg-blue-600", "Lokasi dipilih"]].map(([color, label]) => <li key={label} className="flex items-center gap-2"><span className={`size-2.5 rounded-full ${color}`} />{label}</li>)}</ul>
      {selected ? <div aria-live="polite" className="rounded-lg border bg-muted/40 p-4"><h3 className="font-semibold">{selected.title}</h3><p className="mt-2 text-sm leading-6">{selected.description}</p><p className="mt-2 text-xs text-muted-foreground">{formatDateTime(selected.observed_at)}</p></div> : selectedReport ? <div aria-live="polite" className="rounded-lg border p-4"><h3 className="font-semibold">Laporan warga · {categoryLabels[selectedReport.category]}</h3><p className="mt-2 break-words text-sm">{selectedReport.description}</p><p className="mt-2 text-xs text-muted-foreground">{citizenReportStatusLabels[selectedReport.status]} · {formatDateTime(selectedReport.observed_at)}</p></div> : <p className="text-xs text-muted-foreground">Detail juga dapat dibuka dari daftar peringatan di bawah.</p>}
    </section>
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <section aria-labelledby="alerts-title" className="rounded-xl border bg-card p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 id="alerts-title" className="text-lg font-semibold">Peringatan wilayah</h2><Button variant="ghost" size="sm" disabled={!ready || unread.length === 0} onClick={() => markRead(alerts.map((alert) => alert.id))}><CheckCheck aria-hidden="true" />Tandai semua dibaca</Button></div><ul className="mt-4 space-y-3">{alerts.map((alert) => <li key={alert.id}><button className="w-full rounded-xl border p-4 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => selectAlert(alert.id)}><span className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-semibold">{alert.title}</span><Badge variant={store.read_alert_ids.includes(alert.id) ? "outline" : "warning"}>{store.read_alert_ids.includes(alert.id) ? "Dibaca" : "Baru"}</Badge></span><span className="mt-2 block text-xs leading-5 text-muted-foreground">{alert.description}</span><span className="mt-3 block text-xs text-muted-foreground">{formatDateTime(alert.observed_at)}</span></button></li>)}</ul></section>
      <section id="laporan-warga" aria-labelledby="report-title" className="rounded-xl border bg-card p-5"><h2 id="report-title" className="text-lg font-semibold">Laporkan temuan Anda</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">Lengkapi lokasi, waktu, dan deskripsi temuan Anda.</p>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div><label htmlFor="report-category" className="text-sm font-medium">Kategori kejadian</label><Select id="report-category" className="mt-2" value={category} onValueChange={(value) => setCategory(value as ReportInput["category"])} options={Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))} /></div>
          <fieldset className="rounded-lg border p-3"><legend className="px-1 text-sm font-medium">Lokasi kejadian</legend><p role="status" className="text-xs leading-5">{location ? `${location[1].toFixed(5)}, ${location[0].toFixed(5)} · ${area.region}` : "Belum ada lokasi dipilih."}</p><div className="mt-3 flex flex-wrap gap-2"><Button type="button" variant="outline" size="sm" onClick={() => { setPicking(true); document.getElementById("community-map-title")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>Pilih di peta</Button><Button type="button" variant="ghost" size="sm" onClick={() => chooseLocation([(area.bbox[0] + area.bbox[2]) / 2, (area.bbox[1] + area.bbox[3]) / 2])}>Gunakan pusat wilayah</Button></div><p className="mt-2 text-xs text-muted-foreground">Pusat wilayah dapat dipakai jika peta tidak tersedia.</p></fieldset>
          <div><label htmlFor="report-time" className="text-sm font-medium">Waktu kejadian</label><input id="report-time" type="datetime-local" required value={observedAt} onChange={(event) => setObservedAt(event.target.value)} className={field} /></div>
          <div><label htmlFor="report-description" className="text-sm font-medium">Deskripsi kejadian</label><textarea id="report-description" name="description" required minLength={10} maxLength={500} rows={4} placeholder="Ceritakan apa yang Anda lihat (10–500 karakter)." className={field} /></div>
          <div><label htmlFor="report-contact" className="text-sm font-medium">Kontak (opsional)</label><input id="report-contact" name="contact" maxLength={100} placeholder="Nomor telepon yang dapat dihubungi" className={field} /></div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={!ready} className="w-full"><Send aria-hidden="true" />Simpan laporan</Button>
        </form>
      </section>
    </div>
    <section aria-labelledby="my-reports-title" className="rounded-xl border bg-card p-5"><h2 id="my-reports-title" className="text-lg font-semibold">Laporan saya</h2><p className="mt-1 text-xs text-muted-foreground">Riwayat laporan Anda untuk {area.label}.</p>{!ready ? <p role="status" className="mt-4 text-sm">Memuat laporan…</p> : reports.length === 0 ? <p className="mt-4 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Belum ada laporan. Catat temuan melalui formulir di atas.</p> : <ul className="mt-4 space-y-3">{reports.map((report) => <li key={report.id} className="rounded-lg border p-4"><div className="flex flex-wrap justify-between gap-2"><h3 className="text-sm font-semibold">{categoryLabels[report.category]}</h3><Badge variant="outline">{citizenReportStatusLabels[report.status]}</Badge></div><p className="mt-2 text-sm break-words whitespace-pre-wrap">{report.description}</p><p className="mt-2 text-xs text-muted-foreground">{formatDateTime(report.observed_at)} · {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}</p><Button variant="ghost" size="sm" className="mt-2" onClick={() => { setSelectedId(report.id); document.getElementById("community-map-title")?.scrollIntoView({ behavior: "smooth" }); }}>Lihat di peta</Button><ReportHistory report={report} /></li>)}</ul>}</section>
    <section id="panduan-warga" className="rounded-xl border bg-secondary/40 p-5"><h2 className="text-lg font-semibold">Cara ikut menjaga gambut</h2><div className="mt-4 grid gap-5 sm:grid-cols-3">{[["1. Pantau wilayah", "Pilih wilayah, baca peringatan, dan lihat lokasi indikasi pada peta."], ["2. Amati dari tempat aman", "Hindari mendekati api atau asap. Titik panas dan perubahan tutupan lahan masih perlu diverifikasi."], ["3. Catat temuan", "Tandai lokasi dan waktu, lalu lengkapi deskripsi kejadian pada formulir laporan."]].map(([title, description]) => <div key={title}><h3 className="text-sm font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></div>)}</div></section>
  </div>;
}
