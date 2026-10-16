"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { navigation } from "@/components/layout/navigation";
import { useHotspotMap, useHotspots } from "@/components/providers/data-hooks";
import { useIsDemoData } from "@/components/providers/gambutops-repository";
import { useMonitoring } from "@/components/providers/monitoring-context";
import { EmptyState, ErrorState } from "@/components/shared/async-states";
import { DemoBadge } from "@/components/shared/demo-badge";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/components/ui/utils";
import { errorMessage } from "@/lib/api";
import { findArea } from "@/lib/domain/areas";
import { hotspotStatusLabels } from "@/lib/domain/labels";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { formatCount, formatDateRange, formatDateTime } from "@/lib/format";
import type { Hotspot, HotspotVerificationStatus } from "@/types";
import { HotspotDetail, satelliteLabel } from "./hotspot-detail";
import { HOTSPOT_STATUS_COLOR, HotspotMap } from "./hotspot-map";
import { SyncStatusPanel } from "./sync-status";

const page = navigation.find((item) => item.href === "/hotspots")!;
/** Jumlah baris per halaman daftar; peta memuat seluruh marker sesuai filter. */
export const HOTSPOTS_PER_PAGE = 100;
/** Di layar kecil daftar diringkas agar peta dan pengaturan tetap mudah dijangkau. */
const COMPACT_ROWS = 10;
export const SETTINGS_ANCHOR = "pengaturan-data";
const SATELLITES = [
  { value: null, label: "Semua satelit" },
  { value: "N", label: "Suomi NPP" },
  { value: "N20", label: "NOAA-20" },
] as const;

export function HotspotsHeader() {
  const { mode } = useMonitoring();
  const demo = useIsDemoData();
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{page.title}</h1>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant={mode === "HISTORICAL_REPLAY" ? "teal" : "warning"}>{mode === "HISTORICAL_REPLAY" ? "RIWAYAT" : "TERKINI"}</Badge>
        {demo && <DemoBadge />}
      </div>
    </div>
  );
}

function Legend() {
  const statuses: HotspotVerificationStatus[] = ["UNVERIFIED", "IN_VERIFICATION", "VERIFIED", "DISMISSED"];
  return (
    <ul aria-label="Keterangan warna titik" className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
      {statuses.map((status) => (
        <li key={status} className="inline-flex items-center gap-2"><span className="size-2.5 rounded-full ring-1 ring-white" style={{ background: HOTSPOT_STATUS_COLOR[status] }} aria-hidden="true" />{hotspotStatusLabels[status]}</li>
      ))}
    </ul>
  );
}

function HotspotRow({ hotspot, selected, onSelect }: { hotspot: Hotspot; selected: boolean; onSelect: () => void }) {
  return (
    <li>
      <button
        type="button"
        data-hotspot-id={hotspot.id}
        onClick={onSelect}
        aria-current={selected ? "true" : undefined}
        className={cn("flex w-full items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-left transition-colors duration-150 hover:border-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", selected && "border-primary bg-secondary/40")}
      >
        <span className="size-2.5 shrink-0 rounded-full" style={{ background: HOTSPOT_STATUS_COLOR[hotspot.verification_status] }} aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{formatDateTime(hotspot.observed_at)}</span>
          <span className="block text-xs text-muted-foreground">{findArea(hotspot.area_id)?.region ?? `${hotspot.latitude.toFixed(3)}, ${hotspot.longitude.toFixed(3)}`} · {satelliteLabel(hotspot.satellite)} · {hotspot.frp_mw === null ? "FRP –" : `FRP ${hotspot.frp_mw.toLocaleString("id-ID")} MW`}</span>
        </span>
        <span className="sr-only">{hotspotStatusLabels[hotspot.verification_status]}</span>
      </button>
    </li>
  );
}

export function HotspotsView() {
  const { mode, filter } = useMonitoring();
  const wide = useMediaQuery("(min-width: 1024px)");
  const [satellite, setSatellite] = useState<string | null>(null);
  // Halaman kembali ke awal bila mode/filter/satelit berubah.
  const filterKey = JSON.stringify([mode, filter, satellite]);
  const [paging, setPaging] = useState({ key: filterKey, offset: 0 });
  const offset = paging.key === filterKey ? paging.offset : 0;
  const [selection, setSelection] = useState<{ key: string; id: string | null }>({ key: filterKey, id: null });
  const selectedId = selection.key === `${filterKey}:${offset}` ? selection.id : null;
  const hotspots = useHotspots({ satellite, limit: HOTSPOTS_PER_PAGE, offset });
  const mapData = useHotspotMap(satellite);
  const listRef = useRef<HTMLUListElement>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const select = (id: string | null) => setSelection({ key: `${filterKey}:${offset}`, id });
  const selectOnMap = (id: string) => {
    const point = mapData.data?.items.find((item) => item.id === id);
    if (!point) return;
    const targetOffset = Math.floor(point.list_offset / HOTSPOTS_PER_PAGE) * HOTSPOTS_PER_PAGE;
    setPaging({ key: filterKey, offset: targetOffset });
    setSelection({ key: `${filterKey}:${targetOffset}`, id });
  };
  const goTo = (next: number) => setPaging({ key: filterKey, offset: next });

  // Pilihan dari peta: tampilkan baris di daftar (hanya di layar lebar agar halaman HP tidak melompat).
  useEffect(() => {
    if (!wide || !selectedId) return;
    listRef.current?.querySelector(`[data-hotspot-id="${CSS.escape(selectedId)}"]`)?.scrollIntoView({ block: "nearest" });
  }, [selectedId, wide]);

  const data = hotspots.data;
  const items = data?.items ?? [];
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const area = mode === "CURRENT_MONITORING" ? undefined : findArea(filter.area_id);

  return (
    <div className="min-w-0 space-y-5">
      <Alert className="border-amber-200 bg-amber-50">
        <Info className="text-amber-800" aria-hidden="true" />
        <div>
          <AlertTitle>Indikasi panas · perlu verifikasi</AlertTitle>
        </div>
      </Alert>

      {mode === "CURRENT_MONITORING" && <SyncStatusPanel />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Saring satelit" className="flex flex-wrap gap-2">
          {SATELLITES.map((option) => (
            <Button key={option.label} size="sm" variant={satellite === option.value ? "default" : "outline"} aria-pressed={satellite === option.value} onClick={() => setSatellite(option.value)}>{option.label}</Button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {data ? (data.total === 0 ? "Tidak ada titik" : <>Titik <span className="font-medium text-foreground">{formatCount(offset + 1)}–{formatCount(offset + items.length)}</span> dari <span className="font-medium text-foreground">{formatCount(data.total)}</span></>) : "Memuat…"}
          <span className="hidden sm:inline"> · {area?.label ?? (mode === "CURRENT_MONITORING" ? "Seluruh Indonesia" : "semua wilayah")} · {formatDateRange(filter.from, filter.to)}</span>
          {" · "}<a href={`#${SETTINGS_ANCHOR}`} className="font-medium text-primary underline-offset-4 hover:underline xl:hidden">Ubah tanggal/wilayah</a>
        </p>
      </div>

      {hotspots.status === "error" ? (
        <ErrorState title="Titik panas belum dapat dimuat" description={errorMessage(hotspots.error)} onRetry={hotspots.refetch} />
      ) : (
        <>
          <div className="space-y-2">
            {mapData.status === "error" ? (
              <ErrorState title="Peta titik panas belum dapat dimuat" description={errorMessage(mapData.error)} onRetry={mapData.refetch} />
            ) : (
              <HotspotMap hotspots={mapData.data?.items ?? []} selectedId={selectedId} onSelect={selectOnMap} areaId={filter.area_id} national={mode === "CURRENT_MONITORING"} className="h-[340px] sm:h-[460px]" />
            )}
            <p role="status" className="text-xs text-muted-foreground">
              {mapData.data ? `Peta menampilkan ${formatCount(mapData.data.items.length)} titik sesuai filter, mencakup semua halaman daftar.` : mapData.status === "loading" ? "Memuat seluruh titik pada peta…" : ""}
            </p>
            <Legend />
          </div>

          {!data ? (
            <div role="status" className="space-y-2"><span className="sr-only">Memuat titik panas…</span>{[0, 1, 2, 3].map((index) => <Skeleton key={index} className="h-14 rounded-lg" />)}</div>
          ) : data.total === 0 ? (
            <EmptyState
              title="Tidak ada titik panas"
              description={mode === "CURRENT_MONITORING"
                ? "Belum ada deteksi terkini untuk pilihan ini. Bukan berarti wilayah aman; cek status pembaruan data di atas."
                : "Tidak ada deteksi pada periode, wilayah, dan satelit ini. Coba perluas tanggal atau pilih semua satelit."}
            />
          ) : (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
              <div className="order-2 space-y-3 lg:order-1">
                <h2 className="text-sm font-semibold">Daftar titik (terbaru dulu)</h2>
                <ul ref={listRef} aria-label="Daftar titik panas" className="relative space-y-2 lg:max-h-[560px] lg:overflow-y-auto lg:pr-1">
                  {(wide || expanded === `${filterKey}:${offset}` ? items : items.slice(0, COMPACT_ROWS)).map((hotspot) => <HotspotRow key={hotspot.id} hotspot={hotspot} selected={hotspot.id === selectedId} onSelect={() => select(hotspot.id)} />)}
                </ul>
                {!wide && expanded !== `${filterKey}:${offset}` && items.length > COMPACT_ROWS && (
                  <Button variant="outline" className="w-full" onClick={() => setExpanded(`${filterKey}:${offset}`)}>Tampilkan semua {formatCount(items.length)} titik di halaman ini</Button>
                )}
                <nav aria-label="Halaman daftar titik" className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <Button size="sm" variant="outline" disabled={offset === 0} onClick={() => goTo(Math.max(0, offset - HOTSPOTS_PER_PAGE))}><ChevronLeft aria-hidden="true" /><span className="sr-only min-[360px]:not-sr-only">Sebelumnya</span></Button>
                  <span className="text-xs text-muted-foreground">Halaman {formatCount(Math.floor(offset / HOTSPOTS_PER_PAGE) + 1)} dari {formatCount(Math.max(1, Math.ceil(data.total / HOTSPOTS_PER_PAGE)))}</span>
                  <Button size="sm" variant="outline" disabled={offset + items.length >= data.total} onClick={() => goTo(offset + HOTSPOTS_PER_PAGE)}><span className="sr-only min-[360px]:not-sr-only">Berikutnya</span><ChevronRight aria-hidden="true" /></Button>
                </nav>
              </div>
              <div className="order-1 lg:sticky lg:top-6 lg:order-2">
                {selected ? (
                  <HotspotDetail key={selected.id} hotspot={selected} onClose={() => select(null)} />
                ) : (
                  <p className="rounded-xl border border-dashed px-5 py-8 text-center text-sm text-muted-foreground">Pilih titik untuk melihat detail.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
