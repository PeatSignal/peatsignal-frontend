import { Database, FileCheck2, MapPinOff } from "lucide-react";
import { DemoBadge } from "@/components/shared/demo-badge";
import type { GwtDayStatus, GwtSummary } from "@/lib/domain/groundwater";
import { gwtDayStatusLabels } from "@/lib/domain/labels";
import { formatCount, formatDateRange } from "@/lib/format";
import type { Station } from "@/types";
import { GAP_STYLE, LINE_COLOR } from "./chart-style";

const SEGMENTS: ReadonlyArray<{ statuses: readonly GwtDayStatus[]; label: string; color: string; opacity: number }> = [
  { statuses: ["VALID"], label: gwtDayStatusLabels.VALID, color: LINE_COLOR, opacity: 1 },
  { statuses: ["MISSING", "NO_RECORD", "SUSPECT"], label: GAP_STYLE.NO_MEASUREMENT.label, color: GAP_STYLE.NO_MEASUREMENT.fill, opacity: 0.8 },
  { statuses: ["DUPLICATE"], label: "Data ganda bertentangan", color: GAP_STYLE.DUPLICATE.fill, opacity: 0.8 },
  { statuses: ["OUTSIDE_STATION"], label: gwtDayStatusLabels.OUTSIDE_STATION, color: GAP_STYLE.OUTSIDE_STATION.fill, opacity: 0.6 },
];

export function DataCompleteness({ summary, station, sourceName, sourceHash, demo }: {
  summary: GwtSummary; station: Station; sourceName: string | null; sourceHash: string | null; demo: boolean;
}) {
  const segments = SEGMENTS.map((segment) => ({ ...segment, count: segment.statuses.reduce((sum, status) => sum + summary.counts[status], 0) })).filter((segment) => segment.count > 0);
  const total = Math.max(1, summary.totalDays);
  const percent = Math.round((summary.counts.VALID / total) * 100);

  return (
    <section aria-labelledby="gwt-completeness-title" className="rounded-xl border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="gwt-completeness-title" className="text-base font-semibold">Kelengkapan data</h2>
        <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{percent}%</span> hari terukur ({formatCount(summary.counts.VALID)} dari {formatCount(summary.totalDays)} hari)</p>
      </div>

      <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        {segments.map((segment) => <span key={segment.label} style={{ width: `${(segment.count / total) * 100}%`, background: segment.color, opacity: segment.opacity }} />)}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs leading-5 text-muted-foreground">
        {segments.map((segment) => (
          <li key={segment.label} className="inline-flex items-center gap-2">
            <span className="size-2.5 rounded-sm" style={{ background: segment.color, opacity: segment.opacity }} aria-hidden="true" />
            {segment.label}: <span className="font-medium text-foreground tabular-nums">{formatCount(segment.count)} hari</span>
          </li>
        ))}
      </ul>


      <details className="mt-4 border-t pt-3 text-xs leading-5 text-muted-foreground">
        <summary className="cursor-pointer font-medium">Detail sumber & kelengkapan</summary>
        <p className="mt-3">Hari tanpa pengukuran tidak dihitung sebagai nol atau dipakai dalam rata-rata.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <p className="flex items-start gap-2">
          <Database className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>
            <span className="font-medium text-foreground">Sumber:</span> {sourceName ?? station.source ?? "Belum tercatat"} · pengamatan harian, jam pengukuran tidak diketahui
            {demo && <span className="ml-2 inline-block align-middle"><DemoBadge /></span>}
          </span>
        </p>
        <p className="flex items-start gap-2">
          <FileCheck2 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>
            <span className="font-medium text-foreground">Periode stasiun {station.code}:</span>{" "}
            {station.period_start && station.period_end ? formatDateRange(station.period_start, station.period_end) : "belum tercatat"}
            {sourceHash && <> · <span title={`SHA-256 ${sourceHash}`}>sidik file {sourceHash.slice(0, 12)}…</span></>}
          </span>
        </p>
        <p className="flex items-start gap-2 sm:col-span-2">
          <MapPinOff className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>Data riwayat 2018–2019, bukan kondisi saat ini. Koordinat stasiun belum tersedia dari sumber, jadi stasiun tidak ditampilkan di peta.</span>
        </p>
        </div>
      </details>
    </section>
  );
}
