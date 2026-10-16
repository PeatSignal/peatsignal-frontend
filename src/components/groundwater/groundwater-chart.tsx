"use client";

import { useId, useMemo } from "react";
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { addDays, daysBetween } from "@/lib/domain/dates";
import { GWT_REFERENCE_M, gapRuns, type GwtDay, type GwtGapKind } from "@/lib/domain/groundwater";
import { gwtDayStatusLabels } from "@/lib/domain/labels";
import { describeDepth, formatDate, formatDecimal, formatMeters, formatMonthYear, formatShortDate } from "@/lib/format";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { AXIS_COLOR, GAP_STYLE, LINE_COLOR, valueAxis } from "./chart-style";

function dateTicks(from: string, to: string, maxTicks: number): string[] {
  const span = daysBetween(from, to);
  const step = Math.max(1, Math.ceil(span / Math.max(1, maxTicks - 1)));
  const ticks: string[] = [];
  for (let offset = 0; offset <= span; offset += step) ticks.push(addDays(from, offset));
  return ticks;
}

/**
 * Sumbu-X kategori (satu titik per hari), sehingga arsiran dibentangkan dari hari valid sebelumnya hingga hari
 * sesudah rentang kosong: tepat pada bagian garis yang terputus, dan gap satu hari tetap terlihat.
 * Bila hari sebelumnya juga gap (jenis lain), arsiran mulai di awal rentang agar dua arsiran tidak bertumpuk.
 */
function shadedSpan(statusByDate: ReadonlyMap<string, GwtDay["status"]>, start: string, end: string): [string, string] {
  const previous = addDays(start, -1);
  const next = addDays(end, 1);
  return [statusByDate.get(previous) === "VALID" ? previous : start, statusByDate.has(next) ? next : end];
}

function TooltipCard({ day, stationCode }: { day: GwtDay; stationCode: string }) {
  return (
    <div className="max-w-64 rounded-lg border bg-card px-3 py-2.5 text-xs leading-5 shadow-sm">
      <p className="font-semibold">{formatDate(day.date)} · {stationCode}</p>
      {day.status === "VALID" && day.value !== null ? (
        <>
          <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">{formatMeters(day.value, 3)}</p>
          <p className="text-muted-foreground">{describeDepth(day.value)}</p>
        </>
      ) : (
        <p className="mt-1 font-medium text-amber-900">{gwtDayStatusLabels[day.status]}</p>
      )}
      {day.status === "DUPLICATE" && <p className="text-muted-foreground">Sumber mencatat dua nilai berbeda untuk tanggal ini.</p>}
      {day.observation && <p className="mt-1 text-muted-foreground">Sumber: {day.observation.source}</p>}
    </div>
  );
}

export interface GroundwaterChartProps {
  days: readonly GwtDay[];
  stationCode: string;
  from: string;
  to: string;
  /** Ringkasan teks untuk pembaca layar. */
  summary: string;
}

export function GroundwaterChart({ days, stationCode, from, to, summary }: GroundwaterChartProps) {
  const descriptionId = useId();
  const byDate = useMemo(() => new Map(days.map((day) => [day.date, day])), [days]);
  const statusByDate = useMemo(() => new Map(days.map((day) => [day.date, day.status])), [days]);
  const runs = useMemo(() => gapRuns(days), [days]);
  const values = days.flatMap((day) => (day.value === null ? [] : [day.value]));
  const axis = valueAxis(values);
  const longRange = daysBetween(from, to) > 120;
  const presentKinds = new Set(runs.map((run) => run.kind));
  // Layar sempit: lebih sedikit label tanggal agar tidak bertumpuk.
  const wide = useMediaQuery("(min-width: 640px)");
  const tickFontSize = wide ? 12 : 11;

  return (
    // Tanpa role="img": navigasi keyboard Recharts (panah kiri/kanan menampilkan tooltip) tetap terjangkau.
    <figure className="space-y-3" aria-label={`Grafik muka air tanah ${stationCode}`} aria-describedby={descriptionId}>
      <div className="h-[260px] w-full sm:h-[340px]">
        <LineChart responsive style={{ width: "100%", height: "100%" }} data={days as GwtDay[]} margin={{ top: 12, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="#e7ece8" vertical={false} />
          {runs.map((run) => {
            const [x1, x2] = shadedSpan(statusByDate, run.start, run.end);
            return (
              <ReferenceArea
                key={`${run.kind}-${run.start}`} ifOverflow="hidden" x1={x1} x2={x2}
                fill={GAP_STYLE[run.kind].fill} fillOpacity={GAP_STYLE[run.kind].opacity} strokeOpacity={0}
              />
            );
          })}
          <XAxis
            dataKey="date" ticks={dateTicks(from, to, wide ? 6 : 4)} interval={0} padding={{ left: 8, right: 8 }}
            tickFormatter={(date: string) => (longRange ? formatMonthYear : formatShortDate)(date)}
            tick={{ fill: AXIS_COLOR, fontSize: tickFontSize }} tickLine={false} axisLine={{ stroke: "#dce4de" }}
          />
          <YAxis
            domain={axis.domain} ticks={axis.ticks} interval={0} tickFormatter={(value: number) => `${formatDecimal(value, axis.digits)} m`} width={62}
            tick={{ fill: AXIS_COLOR, fontSize: tickFontSize }} tickLine={false} axisLine={false}
          />
          <ReferenceLine y={0} stroke="#9aa8a0" label={{ value: "Permukaan tanah (0 m)", position: "insideTopLeft", fill: AXIS_COLOR, fontSize: 11 }} />
          <ReferenceLine y={GWT_REFERENCE_M} stroke={AXIS_COLOR} strokeDasharray="6 4" label={{ value: `Acuan ${formatMeters(GWT_REFERENCE_M, 1)}`, position: "insideBottomRight", fill: AXIS_COLOR, fontSize: 11 }} />
          <Tooltip
            // filterNull false: hari tanpa nilai tetap menampilkan tooltip yang menjelaskan alasannya.
            filterNull={false}
            cursor={{ stroke: "#9aa8a0", strokeDasharray: "3 3" }}
            content={({ active, label }) => {
              const day = active && typeof label === "string" ? byDate.get(label) : undefined;
              return day ? <TooltipCard day={day} stationCode={stationCode} /> : null;
            }}
          />
          <Line
            dataKey="value" type="linear" stroke={LINE_COLOR} strokeWidth={2} connectNulls={false} isAnimationActive={false}
            activeDot={{ r: 4, fill: LINE_COLOR, stroke: "#ffffff", strokeWidth: 2 }}
            dot={(props: { cx?: number; cy?: number; index?: number }) => {
              // Titik hanya untuk pengukuran yang terisolasi (diapit hari kosong), agar tetap terlihat tanpa garis.
              const index = props.index ?? -1;
              const isolated = days[index]?.value !== null && days[index - 1]?.value == null && days[index + 1]?.value == null;
              return isolated && props.cx !== undefined && props.cy !== undefined
                ? <circle key={`dot-${index}`} cx={props.cx} cy={props.cy} r={3} fill={LINE_COLOR} />
                : <g key={`dot-${index}`} />;
            }}
          />
        </LineChart>
      </div>
      <figcaption id={descriptionId} className="sr-only">{summary}</figcaption>

      <ul aria-label="Keterangan grafik" className="flex flex-wrap gap-x-5 gap-y-2 text-xs leading-5 text-muted-foreground">
        <li className="flex items-start gap-2"><span className="mt-2.5 h-0.5 w-5 shrink-0 rounded-full" style={{ background: LINE_COLOR }} aria-hidden="true" />Muka air tanah terukur</li>
        <li className="flex items-start gap-2">
          <span className="mt-2.5 w-5 shrink-0 border-t-2 border-dashed" style={{ borderColor: AXIS_COLOR }} aria-hidden="true" />
          Batas acuan regulasi {formatMeters(GWT_REFERENCE_M, 1)} (PP 57/2016) — konteks, bukan ambang bahaya kebakaran
        </li>
        {(Object.keys(GAP_STYLE) as GwtGapKind[]).filter((kind) => presentKinds.has(kind)).map((kind) => (
          <li key={kind} className="flex items-start gap-2">
            <span className="mt-1 size-3 shrink-0 rounded-sm" style={{ background: GAP_STYLE[kind].fill, opacity: Math.min(1, GAP_STYLE[kind].opacity * 2) }} aria-hidden="true" />
            {GAP_STYLE[kind].label}
          </li>
        ))}
      </ul>
    </figure>
  );
}
