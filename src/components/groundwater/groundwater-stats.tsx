import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/components/ui/utils";
import type { GwtChange, GwtSummary } from "@/lib/domain/groundwater";
import { gwtDirectionLabels } from "@/lib/domain/labels";
import { describeDepth, formatCentimeters, formatCount, formatDate, formatDateRange, formatMeters } from "@/lib/format";

function StatCard({ label, value, caption, children }: { label: string; value: ReactNode; caption: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col rounded-xl border bg-card p-4 sm:p-5">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-2 text-xl font-bold tracking-tight tabular-nums sm:text-2xl">{value}</dd>
      <dd className="mt-1 text-xs leading-5 text-muted-foreground">{caption}</dd>
      {children}
    </div>
  );
}

const directionStyle = {
  DRIER: { icon: ArrowDown, className: "text-amber-800", verb: "Turun" },
  WETTER: { icon: ArrowUp, className: "text-teal", verb: "Naik" },
  STABLE: { icon: Minus, className: "text-muted-foreground", verb: "Berubah" },
} as const;

/** "Turun 12 cm", "Naik 5 cm", atau "Kurang dari 1 cm". */
function changeAmount(change: GwtChange): string {
  if (change.direction === "STABLE") return "Kurang dari 1 cm";
  return `${directionStyle[change.direction].verb} ${formatCentimeters(change.delta)}`;
}

function ChangeValue({ change }: { change: GwtChange | null }) {
  // Teks arah lebih kecil dari angka agar tidak pecah baris pada kartu sempit.
  if (!change) return <span className="text-base font-semibold text-muted-foreground sm:text-lg">Belum bisa dihitung</span>;
  const style = directionStyle[change.direction];
  const Icon = style.icon;
  return <span className={cn("inline-flex items-center gap-1.5 text-base sm:text-lg", style.className)}><Icon className="size-5 shrink-0" aria-hidden="true" />{gwtDirectionLabels[change.direction]}</span>;
}

/** Empat angka utama. Semua dihitung hanya dari pengukuran valid; tanpa pengukuran ditulis "—". */
export function GroundwaterStats({ summary, change7, change14, periodEnd }: { summary: GwtSummary; change7: GwtChange | null; change14: GwtChange | null; periodEnd: string }) {
  const { latest, mean, deepest } = summary;
  const empty = "Tidak ada pengukuran pada periode ini";

  return (
    <dl className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Pengukuran terakhir"
        value={latest ? formatMeters(latest.value) : "—"}
        caption={latest ? <>{describeDepth(latest.value)} · {formatDate(latest.date)}{latest.date < periodEnd && <span className="block">Belum ada pengukuran sesudahnya</span>}</> : empty}
      />
      <StatCard
        label="Perubahan 7 hari"
        value={<ChangeValue change={change7} />}
        caption={change7 ? <>{changeAmount(change7)} · {formatDateRange(change7.start.date, change7.end.date)}</> : "Perlu dua pengukuran berjarak sekitar 7 hari"}
      >
        <dd className="mt-2 border-t pt-2 text-xs leading-5 text-muted-foreground">
          <span className="font-medium text-foreground">14 hari:</span> {change14 ? `${gwtDirectionLabels[change14.direction]} (${changeAmount(change14).toLowerCase()})` : "belum bisa dihitung"}
        </dd>
      </StatCard>
      <StatCard
        label="Rata-rata periode"
        value={mean !== null ? formatMeters(mean) : "—"}
        caption={mean !== null ? `Dari ${formatCount(summary.counts.VALID)} hari terukur` : empty}
      />
      <StatCard
        label="Paling dalam"
        value={deepest ? formatMeters(deepest.value) : "—"}
        caption={deepest ? <>{describeDepth(deepest.value)} · {formatDate(deepest.date)}</> : empty}
      />
    </dl>
  );
}
