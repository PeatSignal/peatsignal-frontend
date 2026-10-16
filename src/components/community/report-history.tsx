import { citizenReportStatusLabels, type CitizenReport } from "@/lib/community";
import { formatDateTime } from "@/lib/format";

export function ReportHistory({ report }: { report: CitizenReport }) {
  return <div className="mt-4 border-t pt-4">
    <h4 className="text-sm font-semibold">Riwayat penanganan</h4>
    <ol className="mt-3 space-y-3 border-l pl-4" aria-label="Riwayat penanganan">
      <li className="text-xs leading-5"><p className="font-medium">Laporan disimpan</p><p className="text-muted-foreground">{formatDateTime(report.submitted_at)}</p></li>
      {report.handling_history.map((entry, index) => <li key={`${entry.at}-${index}`} className="text-sm leading-6">
        <p className="font-medium">{citizenReportStatusLabels[entry.to]}</p>
        <p className="break-words whitespace-pre-wrap">{entry.note}</p>
        <p className="text-xs text-muted-foreground">{entry.actor_name} · {formatDateTime(entry.at)}</p>
      </li>)}
    </ol>
  </div>;
}
