import { cn } from "@/components/ui/utils";
import type { GwtDay } from "@/lib/domain/groundwater";
import { gwtDayStatusLabels } from "@/lib/domain/labels";
import { formatDate, formatMeters } from "@/lib/format";

/** Alternatif teks grafik: semua hari pada periode, termasuk yang kosong. Nilai ditampilkan apa adanya (3 desimal). */
export function GroundwaterTable({ days, stationCode }: { days: readonly GwtDay[]; stationCode: string }) {
  return (
    <div tabIndex={0} role="region" aria-label={`Tabel muka air tanah ${stationCode}`} className="max-h-96 overflow-auto rounded-lg border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <table className="w-full min-w-[420px] text-left text-sm">
        <caption className="sr-only">Muka air tanah harian {stationCode}. Hari tanpa pengukuran ditulis tanpa nilai.</caption>
        <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-medium">Tanggal</th>
            <th scope="col" className="px-4 py-2.5 text-right font-medium">Muka air</th>
            <th scope="col" className="px-4 py-2.5 font-medium">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.date} className="border-t">
              <td className="whitespace-nowrap px-4 py-2">{formatDate(day.date)}</td>
              <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums">{day.value !== null ? formatMeters(day.value, 3) : <span className="text-muted-foreground" aria-label="tidak ada nilai">—</span>}</td>
              <td className={cn("px-4 py-2", day.status === "VALID" ? "text-muted-foreground" : day.status === "OUTSIDE_STATION" ? "text-muted-foreground" : "text-amber-900")}>{gwtDayStatusLabels[day.status]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
