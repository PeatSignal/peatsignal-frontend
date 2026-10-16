"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "@/components/providers/actor-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { AREAS, findArea } from "@/lib/domain/areas";
import { categoryLabels, citizenReportStatusLabels, citizenReportTransitions, type CitizenReport, type CitizenReportStatus } from "@/lib/community";
import { formatDateTime } from "@/lib/format";
import { CommunityMap } from "./community-map";
import { useCommunity } from "./community-provider";
import { ReportHistory } from "./report-history";

function HandlingForm({ report }: { report: CitizenReport }) {
  const { handleReport } = useCommunity();
  const transitions = citizenReportTransitions[report.status];
  const [status, setStatus] = useState<CitizenReportStatus>(transitions[0] ?? report.status);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (transitions.length === 0) return <p className="mt-5 rounded-lg bg-muted px-4 py-3 text-sm">{report.status === "RESOLVED" ? "Penanganan laporan telah selesai." : "Laporan telah ditolak."}</p>;
  return <form className="mt-5 space-y-4 border-t pt-5" onSubmit={(event) => {
    event.preventDefault(); setError(null);
    try {
      handleReport(report.id, status, note);
      toast.success("Penanganan laporan disimpan");
      setNote("");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Penanganan belum dapat disimpan."); }
  }}>
    <h3 className="font-semibold">Tindak lanjut laporan</h3>
    <div><label htmlFor="handling-status" className="text-sm font-medium">Status penanganan</label><Select id="handling-status" className="mt-2" value={status} onValueChange={(value) => setStatus(value as CitizenReportStatus)} options={transitions.map((value) => ({ value, label: citizenReportStatusLabels[value] }))} /></div>
    <div><label htmlFor="handling-note" className="text-sm font-medium">Catatan penanganan</label><textarea id="handling-note" required minLength={3} maxLength={1000} rows={4} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Catat tindakan, hasil pemeriksaan, atau alasan penolakan." className="mt-2 w-full rounded-lg border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button type="submit">Simpan penanganan</Button>
  </form>;
}

export function CoordinatorReportsView() {
  const { actor } = useActor();
  const { store, ready } = useCommunity();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [areaFilter, setAreaFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  if (actor?.role !== "coordinator") return null;
  const reports = [...store.reports].sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
  const visible = reports.filter((report) => (statusFilter === "ALL" || report.status === statusFilter) && (!areaFilter || report.area_id === areaFilter));
  const selected = visible.find((report) => report.id === selectedId) ?? null;

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Laporan masyarakat</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Tinjau temuan warga, catat tindakan, dan perbarui perkembangan penanganan.</p></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Ringkasan laporan masyarakat">
      {Object.entries(citizenReportStatusLabels).map(([status, label]) => <div key={status} className="rounded-xl border bg-card p-4"><p className="text-2xl font-bold tabular-nums">{ready ? reports.filter((report) => report.status === status).length : "…"}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>)}
    </div>
    <div className="flex flex-wrap gap-4"><div className="w-full sm:w-64"><label htmlFor="citizen-status-filter" className="text-sm font-medium">Saring status laporan</label><Select id="citizen-status-filter" className="mt-2" value={statusFilter} onValueChange={setStatusFilter} options={[{ value: "ALL", label: "Semua status" }, ...Object.entries(citizenReportStatusLabels).map(([value, label]) => ({ value, label }))]} /></div><div className="w-full sm:w-72"><label htmlFor="citizen-area-filter" className="text-sm font-medium">Saring wilayah laporan</label><Select id="citizen-area-filter" className="mt-2" value={areaFilter} onValueChange={setAreaFilter} options={[{ value: "", label: "Semua wilayah" }, ...AREAS.map((area) => ({ value: area.id, label: area.label }))]} /></div></div>
    {!ready ? <p role="status" className="rounded-xl border bg-card p-6 text-sm">Memuat laporan masyarakat…</p> : <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <section aria-label="Daftar laporan masyarakat" className="rounded-xl border bg-card p-4">
        {visible.length === 0 ? <p className="p-4 text-sm leading-6 text-muted-foreground">{reports.length === 0 ? "Belum ada laporan masyarakat." : "Tidak ada laporan yang sesuai dengan filter."}</p> : <ul className="space-y-3">{visible.map((report) => <li key={report.id}><button type="button" onClick={() => setSelectedId(report.id)} aria-pressed={selected?.id === report.id} className={`w-full space-y-2 rounded-lg border p-4 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected?.id === report.id ? "border-primary bg-secondary/40" : ""}`}>
          <span className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-semibold">{categoryLabels[report.category]}</span><Badge variant={report.status === "SUBMITTED" ? "warning" : "outline"}>{citizenReportStatusLabels[report.status]}</Badge></span>
          <span className="block line-clamp-2 text-sm break-words">{report.description}</span><span className="block text-xs leading-5 text-muted-foreground">{findArea(report.area_id)?.label} · {formatDateTime(report.submitted_at)}</span>
        </button></li>)}</ul>}
      </section>
      <section aria-label="Detail laporan masyarakat" className="min-w-0 rounded-xl border bg-card p-4 sm:p-5">
        {!selected ? <p className="py-10 text-center text-sm text-muted-foreground">Pilih laporan untuk melihat detail dan melakukan penanganan.</p> : <>
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold">{categoryLabels[selected.category]}</h2><Badge variant="outline">{citizenReportStatusLabels[selected.status]}</Badge></div>
          <p className="mt-3 text-sm leading-6 break-words whitespace-pre-wrap">{selected.description}</p>
          <dl className="my-4 space-y-2 text-sm leading-6"><div><dt className="text-xs text-muted-foreground">Wilayah dan koordinat</dt><dd>{findArea(selected.area_id)?.label}<br />{selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}</dd></div><div><dt className="text-xs text-muted-foreground">Waktu kejadian</dt><dd>{formatDateTime(selected.observed_at)}</dd></div><div><dt className="text-xs text-muted-foreground">Kontak pelapor</dt><dd className="break-words">{selected.contact || "Tidak dicantumkan"}</dd></div></dl>
          <CommunityMap areaId={selected.area_id} alerts={[]} reports={[selected]} selectedId={selected.id} location={null} picking={false} onSelect={() => {}} onLocation={() => {}} />
          <HandlingForm key={`${selected.id}-${selected.status}`} report={selected} />
          <ReportHistory report={selected} />
        </>}
      </section>
    </div>}
  </div>;
}
