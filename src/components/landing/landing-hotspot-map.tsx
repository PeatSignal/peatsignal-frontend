"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { GeoJSONSource, Map as MapLibreMap, Marker } from "maplibre-gl";
import { MapPinOff } from "lucide-react";
import { HOTSPOT_STATUS_COLOR } from "@/components/hotspots/hotspot-map";
import { loadMaplibre } from "@/components/maps/base-map";
import { cn } from "@/components/ui/utils";
import { createRepository, readRepositoryConfig } from "@/lib/api/create-repository";
import { AREAS } from "@/lib/domain/areas";
import { hotspotStatusLabels } from "@/lib/domain/labels";
import { formatDateTime } from "@/lib/format";
import { FALLBACK_MAP_STYLE, MAP_LOCALE, isWebglSupported, resolveMapStyleUrl, unionBbox } from "@/lib/maps/map-config";
import type { Bbox, Hotspot } from "@/types";

// Peta titik panas di landing: MapLibre statis (tidak menangkap scroll/gesture) dengan data titik panas
// pemantauan terkini dari repository yang sama dengan aplikasi. Dimuat lewat next/dynamic dari illustrations.tsx.

const STYLE_URL = resolveMapStyleUrl();
const BOUNDS = unionBbox(AREAS.map((area) => area.bbox)) as Bbox;
const SOURCE = "landing-titik-panas";
const STYLE_TIMEOUT_MS = 8_000;

type Status = "loading" | "ready" | "failed";

function collection(hotspots: readonly Hotspot[]) {
  return {
    type: "FeatureCollection" as const,
    features: hotspots.map((hotspot) => ({
      type: "Feature" as const,
      properties: { color: HOTSPOT_STATUS_COLOR[hotspot.verification_status] },
      geometry: { type: "Point" as const, coordinates: [hotspot.longitude, hotspot.latitude] },
    })),
  };
}

/** Titik yang disorot: deteksi terbaru yang belum diverifikasi, atau deteksi terbaru. */
function featured(hotspots: readonly Hotspot[]): Hotspot | null {
  const latest = (items: readonly Hotspot[]) => items.reduce<Hotspot | null>((best, item) => (!best || item.observed_at > best.observed_at ? item : best), null);
  return latest(hotspots.filter((item) => item.verification_status === "UNVERIFIED")) ?? latest(hotspots);
}

export default function LandingHotspotMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const [markerElement] = useState(() => document.createElement("div"));
  const [status, setStatus] = useState<Status>("loading");
  const [styleVersion, setStyleVersion] = useState(0);
  const [hotspots, setHotspots] = useState<Hotspot[] | null>(null);
  // Kartu keterangan dibuka ke arah tengah peta agar tidak terpotong di tepi.
  const [cardSide, setCardSide] = useState<"left" | "right">("right");
  const highlight = useMemo(() => (hotspots ? featured(hotspots) : null), [hotspots]);

  // Data: periode bawaan mode pemantauan terkini.
  useEffect(() => {
    const controller = new AbortController();
    const repository = createRepository(readRepositoryConfig());
    const bounds = repository.getModeBounds("CURRENT_MONITORING");
    repository.listHotspots({ mode: "CURRENT_MONITORING", from: bounds.default_from, to: bounds.default_to, limit: 500 }, { signal: controller.signal })
      .then((result) => setHotspots(result.items))
      .catch(() => { if (!controller.signal.aborted) setHotspots([]); });
    return () => controller.abort();
  }, []);

  // Peta: dibuat sekali, tanpa interaksi agar scroll halaman tetap normal.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    let map: MapLibreMap | null = null;
    let timeoutId: number | undefined;

    async function init(element: HTMLDivElement) {
      if (!isWebglSupported()) { setStatus("failed"); return; }
      const maplibre = await loadMaplibre();
      if (cancelled) return;
      maplibre.setWorkerUrl(`/vendor/maplibre-gl-${maplibre.getVersion()}/maplibre-gl-worker.mjs`);
      let styleLoaded = false;
      map = new maplibre.Map({
        container: element,
        style: STYLE_URL,
        bounds: BOUNDS,
        fitBoundsOptions: { padding: { top: 72, bottom: 40, left: 64, right: 64 } },
        locale: MAP_LOCALE,
        interactive: false,
        attributionControl: { compact: true },
        fadeDuration: 0,
      });
      mapRef.current = map;
      markerRef.current = new maplibre.Marker({ element: markerElement, anchor: "center" });
      const switchToFallback = () => { if (!cancelled && !styleLoaded) map?.setStyle(FALLBACK_MAP_STYLE); };
      timeoutId = window.setTimeout(switchToFallback, STYLE_TIMEOUT_MS);
      map.on("style.load", () => {
        if (cancelled) return;
        styleLoaded = true;
        window.clearTimeout(timeoutId);
        setStatus("ready");
        setStyleVersion((value) => value + 1);
      });
      map.on("error", () => { if (!styleLoaded) switchToFallback(); });
      map.on("webglcontextlost", () => { if (!cancelled) setStatus("failed"); });
      map.once("load", () => element.querySelector(".maplibregl-compact-show")?.classList.remove("maplibregl-compact-show"));
    }

    void init(container).catch(() => { if (!cancelled) setStatus("failed"); });
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current = null;
      map?.remove();
    };
  }, [markerElement]);

  // Lapisan titik panas dan penanda sorotan; diulang setelah style berganti (mis. ke latar polos).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || styleVersion === 0 || !hotspots) return;
    const data = collection(hotspots);
    const source = map.getSource<GeoJSONSource>(SOURCE);
    if (source) source.setData(data);
    else {
      map.addSource(SOURCE, { type: "geojson", data });
      map.addLayer({
        id: `${SOURCE}-titik`, type: "circle", source: SOURCE,
        paint: { "circle-color": ["get", "color"], "circle-radius": 4.5, "circle-stroke-color": "#ffffff", "circle-stroke-width": 1.5, "circle-opacity": 0.9 },
      });
    }
    if (!highlight) return;
    markerRef.current?.setLngLat([highlight.longitude, highlight.latitude]).addTo(map);
    const x = map.project([highlight.longitude, highlight.latitude]).x;
    setCardSide(x < map.getContainer().clientWidth / 2 ? "right" : "left");
  }, [hotspots, highlight, styleVersion]);

  const label = hotspots
    ? `Peta ${hotspots.length} titik panas satelit NASA FIRMS di Jambi dan Kalimantan Barat${highlight ? `; deteksi terbaru ${formatDateTime(highlight.observed_at)}, ${hotspotStatusLabels[highlight.verification_status].toLowerCase()}` : ""}.`
    : "Peta titik panas satelit NASA FIRMS di Jambi dan Kalimantan Barat.";

  return (
    <div className="absolute inset-0" data-map-status={status}>
      <div ref={containerRef} role="img" aria-label={label} className="h-full w-full" />

      {status === "loading" && <div className="absolute inset-0 bg-[#EEF2EE]" />}
      {status === "failed" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
          <MapPinOff className="size-6 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Peta tidak dapat ditampilkan di perangkat ini.</p>
        </div>
      )}

      <div className="pointer-events-none absolute top-3 left-3 flex flex-wrap gap-1.5">
        <span className="rounded-full border bg-white/95 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">NASA FIRMS</span>
        {hotspots && hotspots.length > 0 && (
          <span className="rounded-full border bg-white/95 px-2.5 py-1 text-[11px] font-medium text-foreground tabular-nums">{hotspots.length.toLocaleString("id-ID")} titik</span>
        )}
      </div>

      {highlight && createPortal(
        <div className="relative size-4" aria-hidden="true">
          <span className="lp-pulse absolute inset-0 rounded-full bg-[#F79009]" />
          <span className="absolute inset-0 rounded-full border-2 border-white" style={{ backgroundColor: HOTSPOT_STATUS_COLOR[highlight.verification_status] }} />
          <div className={cn("absolute bottom-full mb-2.5 rounded-xl border bg-white px-3 py-2 text-xs shadow-sm", cardSide === "right" ? "left-0" : "right-0")}>
            <p className="font-semibold whitespace-nowrap">{formatDateTime(highlight.observed_at)}</p>
            <p className="mt-1 inline-flex rounded-full bg-[#FFFAEB] px-2 py-0.5 font-medium whitespace-nowrap text-[#B54708]">{hotspotStatusLabels[highlight.verification_status]}</p>
          </div>
        </div>,
        markerElement,
      )}
    </div>
  );
}
