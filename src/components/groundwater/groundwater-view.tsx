"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarRange, ChevronDown, Info, Table2 } from "lucide-react";
import { navigation } from "@/components/layout/navigation";
import { useGroundwater, useStations } from "@/components/providers/data-hooks";
import { useIsDemoData } from "@/components/providers/gambutops-repository";
import { useMonitoring } from "@/components/providers/monitoring-context";
import { EmptyState, ErrorState } from "@/components/shared/async-states";
import { DemoBadge } from "@/components/shared/demo-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RepositoryError, errorMessage } from "@/lib/api";
import { findArea } from "@/lib/domain/areas";
import { clampDate, daysBetween } from "@/lib/domain/dates";
import {
  buildDailySeries, groundwaterChange, resolveStation, sortStations, stationCoverage, summarizeGroundwater,
  type GwtChange, type GwtSummary,
} from "@/lib/domain/groundwater";
import { HISTORICAL_DATA_PERIOD } from "@/lib/domain/periods";
import { describeDepth, formatCount, formatDate, formatDateRange, formatMeters } from "@/lib/format";
import type { GroundwaterSeries, Station } from "@/types";
import { CurrentUnavailable } from "./current-unavailable";
import { DataCompleteness } from "./data-completeness";
import { GroundwaterChart } from "./groundwater-chart";
import { GroundwaterStats } from "./groundwater-stats";
import { GroundwaterTable } from "./groundwater-table";
import { RangePresets } from "./range-presets";
import { StationPicker } from "./station-picker";

export const SETTINGS_ANCHOR = "pengaturan-data";
const STATION_PARAM = "stasiun";
const page = navigation.find((item) => item.href === "/groundwater")!;

export function GroundwaterHeader() {
  const { mode } = useMonitoring();
  const demo = useIsDemoData();
  const historical = mode === "HISTORICAL_REPLAY";
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{page.title}</h1>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant={historical ? "teal" : "warning"}>{historical ? `RIWAYAT ${HISTORICAL_DATA_PERIOD.from.slice(0, 4)}–${HISTORICAL_DATA_PERIOD.to.slice(0, 4)}` : "TERKINI"}</Badge>
        {demo && <DemoBadge />}
      </div>
    </div>
  );
}

export function GroundwaterSkeleton() {
  return (
    <div role="status" aria-live="polite" className="space-y-5">
      <span className="sr-only">Memuat data muka air tanah…</span>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[0, 1, 2, 3].map((index) => <Skeleton key={index} className="h-[118px] rounded-xl" />)}</div>
      <Skeleton className="h-[320px] rounded-xl sm:h-[400px]" />
    </div>
  );
}

function StationContext({ station }: { station: Station }) {
  return (
    <p className="text-xs leading-5 text-muted-foreground">
      <span className="font-medium text-foreground">{station.code}</span> · {station.region ?? "Wilayah belum tercatat"} ·{" "}
      {station.period_start && station.period_end ? <>data tersedia {formatDateRange(station.period_start, station.period_end)}</> : "periode data belum tercatat"}
    </p>
  );
}

function srSummary(station: Station, from: string, to: string, summary: GwtSummary, change7: GwtChange | null): string {
  const parts = [`Muka air tanah ${station.code}, ${formatDateRange(from, to)}.`, `${formatCount(summary.counts.VALID)} dari ${formatCount(summary.totalDays)} hari terukur.`];
  if (summary.latest) parts.push(`Pengukuran terakhir ${formatMeters(summary.latest.value)} (${describeDepth(summary.latest.value)}) pada ${formatDate(summary.latest.date)}.`);
  if (summary.deepest) parts.push(`Paling dalam ${formatMeters(summary.deepest.value)} pada ${formatDate(summary.deepest.date)}.`);
  if (change7) parts.push(`Perubahan 7 hari ${formatMeters(change7.delta)}.`);
  return parts.join(" ");
}

function SeriesContent({ series, station }: { series: GroundwaterSeries; station: Station }) {
  const { bounds, setFilter } = useMonitoring();
  const demo = useIsDemoData();
  const [showTable, setShowTable] = useState(false);
  const days = useMemo(() => buildDailySeries(series.observations, series.from, series.to, station), [series, station]);
  const summary = useMemo(() => summarizeGroundwater(days), [days]);
  const change7 = useMemo(() => groundwaterChange(days, 7), [days]);
  const change14 = useMemo(() => groundwaterChange(days, 14), [days]);
  const coverage = stationCoverage(station, series.from, series.to);
  const firstObservation = series.observations[0] ?? null;

  function showWholeStation() {
    if (!station.period_start || !station.period_end) return;
    setFilter({ from: clampDate(station.period_start, bounds.min_date, bounds.max_date), to: clampDate(station.period_end, bounds.min_date, bounds.max_date) });
  }
  const wholeStationAction = station.period_start && station.period_end
    ? <Button variant="outline" onClick={showWholeStation}><CalendarRange aria-hidden="true" />Tampilkan seluruh periode stasiun</Button>
    : null;

  if (series.observations.length === 0 || days.length === 0) {
    return (
      <EmptyState
        title={`Tidak ada pengukuran ${station.code} pada periode ini`}
        description={<>Periode yang dipilih: {formatDateRange(series.from, series.to)}.{station.period_start && station.period_end && <> Data stasiun ini tersedia {formatDateRange(station.period_start, station.period_end)}.</>} Tidak ada data bukan berarti kondisi aman.</>}
        action={wholeStationAction}
      />
    );
  }

  const notes: string[] = [];
  if (coverage?.startsBefore && station.period_start) notes.push(`${station.code} baru mulai mencatat pada ${formatDate(station.period_start)}.`);
  if (coverage?.endsAfter && station.period_end) notes.push(`${station.code} berhenti mencatat pada ${formatDate(station.period_end)}.`);

  return (
    <div className="space-y-5">
      {notes.length > 0 && (
        <Alert className="bg-muted/40">
          <Info className="text-muted-foreground" aria-hidden="true" />
          <div>
            <AlertTitle>Sebagian periode di luar masa pencatatan stasiun</AlertTitle>
            <AlertDescription>{notes.join(" ")} Hari di luar masa pencatatan diarsir abu-abu dan tidak diisi nilai.</AlertDescription>
          </div>
        </Alert>
      )}
      {summary.counts.VALID === 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <Info className="text-amber-800" aria-hidden="true" />
          <div>
            <AlertTitle>Semua hari pada periode ini tanpa nilai pengukuran</AlertTitle>
            <AlertDescription>Sumber mencatat tanggalnya, tetapi tidak ada nilai yang bisa dipakai. Angka ringkasan tidak dihitung.</AlertDescription>
          </div>
        </Alert>
      )}

      <GroundwaterStats summary={summary} change7={change7} change14={change14} periodEnd={series.to} />

      <section aria-labelledby="gwt-chart-title" className="rounded-xl border bg-card p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="gwt-chart-title" className="text-base font-semibold">Grafik muka air tanah harian</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{station.code} · {formatDateRange(series.from, series.to)} · garis turun berarti gambut makin kering</p>
          </div>
          <Button variant="outline" size="sm" aria-expanded={showTable} aria-controls="gwt-table" onClick={() => setShowTable((value) => !value)}>
            <Table2 aria-hidden="true" />{showTable ? "Sembunyikan tabel" : "Lihat sebagai tabel"}
            <ChevronDown className={showTable ? "rotate-180" : undefined} aria-hidden="true" />
          </Button>
        </div>
        <GroundwaterChart days={days} stationCode={station.code} from={series.from} to={series.to} summary={srSummary(station, series.from, series.to, summary, change7)} />
        {showTable && <div id="gwt-table" className="mt-5"><GroundwaterTable days={days} stationCode={station.code} /></div>}
      </section>

      <DataCompleteness summary={summary} station={station} sourceName={firstObservation?.source ?? null} sourceHash={firstObservation?.source_sha256 ?? null} demo={demo} />
    </div>
  );
}

function SeriesSection({ station }: { station: Station }) {
  const { mode } = useMonitoring();
  const groundwater = useGroundwater(station.id);

  if (groundwater.status === "error") {
    const notFound = groundwater.error instanceof RepositoryError && groundwater.error.code === "NOT_FOUND";
    return <ErrorState title={notFound ? `Stasiun ${station.code} tidak ditemukan di server` : "Data muka air tanah belum dapat dimuat"} description={errorMessage(groundwater.error)} onRetry={groundwater.refetch} />;
  }
  if (groundwater.status !== "success" || !groundwater.data) return <GroundwaterSkeleton />;
  if (mode === "CURRENT_MONITORING" && groundwater.data.availability === "NOT_AVAILABLE") return <CurrentUnavailable stationCode={station.code} />;
  return <SeriesContent series={groundwater.data} station={station} />;
}

export function GroundwaterView() {
  const { mode, filter } = useMonitoring();
  const stations = useStations();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const requestedCode = searchParams.get(STATION_PARAM);

  const sorted = useMemo(() => sortStations(stations.data ?? []), [stations.data]);
  const region = findArea(filter.area_id)?.region ?? null;
  const options = useMemo(() => (region ? sorted.filter((station) => station.region === region) : sorted), [sorted, region]);
  const { station, unknownCode } = resolveStation(options, sorted, requestedCode);

  function selectStation(code: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(STATION_PARAM, code);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  if (stations.status === "error") return <ErrorState title="Daftar stasiun belum dapat dimuat" description={errorMessage(stations.error)} onRetry={stations.refetch} />;
  if (stations.status !== "success") return <GroundwaterSkeleton />;
  if (!station) {
    return <EmptyState title="Belum ada stasiun pada wilayah ini" description={region ? `Tidak ada stasiun pengukuran yang tercatat di ${region}. Pilih wilayah lain atau "Semua wilayah" di panel Data yang ditampilkan.` : "Belum ada stasiun pengukuran yang tercatat."} />;
  }

  const periodDays = daysBetween(filter.from, filter.to) + 1;

  return (
    <div className="space-y-5">
      <section aria-label="Pilihan stasiun dan periode" className="rounded-xl border bg-card p-4 sm:p-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:items-end">
          <StationPicker stations={options} value={station.code} onChange={selectStation} />
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Periode: <span className="text-foreground">{formatDateRange(filter.from, filter.to)}</span> ({formatCount(periodDays)} hari) ·{" "}
              <a href={`#${SETTINGS_ANCHOR}`} className="text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Ubah tanggal</a>
            </p>
            {mode === "HISTORICAL_REPLAY" && <RangePresets station={station} />}
          </div>
        </div>
        <div className="mt-3 border-t pt-3"><StationContext station={station} /></div>
        {unknownCode && <p role="status" className="mt-2 text-xs leading-5 text-amber-900">Stasiun “{unknownCode}” tidak ditemukan. Menampilkan {station.code}.</p>}
        {region && <p className="mt-2 text-xs leading-5 text-muted-foreground">Daftar stasiun disaring untuk wilayah {region}.</p>}
      </section>

      <SeriesSection station={station} />
    </div>
  );
}
