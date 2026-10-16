import { Database, Clock3 } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/format";
import { DemoBadge } from "./demo-badge";

export function DataProvenance({ sourceName, observedAt = null, observedDate = null, simulation = true }: {
  sourceName: string; observedAt?: string | null; observedDate?: string | null; simulation?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5"><Database className="size-3.5" aria-hidden="true" />{sourceName}</span>
      <span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5" aria-hidden="true" />
        {observedAt ? <time dateTime={observedAt}>{formatDateTime(observedAt)}</time> : observedDate ? <time dateTime={observedDate}>{formatDate(observedDate)} · pengamatan harian</time> : "Waktu pengamatan belum tersedia"}
      </span>
      {simulation && <DemoBadge />}
    </div>
  );
}
