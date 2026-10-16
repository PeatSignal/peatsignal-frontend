"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { preconnect } from "react-dom";
import type { Map as MapLibreMap } from "maplibre-gl";
import { Maximize2, MapPinOff, Minimize2, RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/components/ui/utils";
import { FALLBACK_MAP_STYLE, MAP_LOCALE, isWebglSupported, resolveMapStyleUrl } from "@/lib/maps/map-config";
import type { Bbox } from "@/types";

export type BaseMapStatus = "loading" | "ready" | "no-webgl" | "error";

/** Batas waktu memuat style peta dasar sebelum beralih ke latar polos. */
const STYLE_TIMEOUT_MS = 8_000;

const STYLE_URL = resolveMapStyleUrl();

// Unduh MapLibre (±600 KB) segera setelah modul ini dimuat, sejajar dengan hydrate,
// bukan baru setelah efek komponen berjalan.
let maplibreModule: Promise<typeof import("maplibre-gl")> | null = null;
export function loadMaplibre() {
  return (maplibreModule ??= import("maplibre-gl"));
}
if (typeof window !== "undefined") void loadMaplibre().catch(() => { maplibreModule = null; });

function canvasLabel(label: string) {
  return `${label}. Gunakan tombol panah untuk menggeser, + atau − untuk memperbesar.`;
}

/**
 * Peta MapLibre dengan fallback. `onStyleReady` dipanggil setiap kali style selesai dimuat
 * (termasuk setelah beralih ke latar polos) dan saat callback berubah, jadi tambahkan atau
 * perbarui source/layer data di sana secara idempoten.
 */
export function BaseMap({ label, bounds, onStyleReady, className }: {
  label: string;
  bounds: Bbox;
  onStyleReady?: (map: MapLibreMap) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onStyleReadyRef = useRef(onStyleReady);
  const initialBounds = useRef(bounds);
  const mapRef = useRef<MapLibreMap | null>(null);
  const labelRef = useRef(label);
  // `map.isStyleLoaded()` bernilai false selama source GeoJSON memuat ulang, jadi dipakai penanda sendiri.
  const styleReadyRef = useRef(false);
  const [status, setStatus] = useState<BaseMapStatus>("loading");
  const [basemapFailed, setBasemapFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Buka koneksi ke server peta dasar lebih awal (DNS + TLS) sebelum style diminta.
  preconnect(new URL(STYLE_URL).origin, { crossOrigin: "anonymous" });

  // Callback baru (mis. data atau pilihan berubah) langsung diterapkan pada peta yang sudah siap.
  useEffect(() => {
    onStyleReadyRef.current = onStyleReady;
    const map = mapRef.current;
    if (map && styleReadyRef.current) onStyleReady?.(map);
  }, [onStyleReady]);

  useEffect(() => {
    labelRef.current = label;
    mapRef.current?.getCanvas().setAttribute("aria-label", canvasLabel(label));
  }, [label]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let map: MapLibreMap | null = null;
    let cancelled = false;
    let timeoutId: number | undefined;

    async function init(element: HTMLDivElement) {
      if (!isWebglSupported()) { setStatus("no-webgl"); return; }
      const maplibre = await loadMaplibre();
      if (cancelled) return;
      // Disalin oleh scripts/copy-maplibre-worker.mjs (predev/prebuild).
      maplibre.setWorkerUrl(`/vendor/maplibre-gl-${maplibre.getVersion()}/maplibre-gl-worker.mjs`);
      let styleLoaded = false;
      const switchToFallbackStyle = () => {
        if (cancelled || styleLoaded || !map) return;
        setBasemapFailed(true);
        styleReadyRef.current = false;
        map.setStyle(FALLBACK_MAP_STYLE);
      };
      try {
        map = new maplibre.Map({
          container: element,
          style: STYLE_URL,
          bounds: initialBounds.current,
          fitBoundsOptions: { padding: 32 },
          locale: MAP_LOCALE,
          cooperativeGestures: true,
          dragRotate: false,
          pitchWithRotate: false,
          maxPitch: 0,
        });
      } catch {
        setStatus("no-webgl");
        return;
      }
      mapRef.current = map;
      map.touchZoomRotate.disableRotation();
      map.keyboard.disableRotation();
      map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
      map.addControl(new maplibre.ScaleControl({ unit: "metric" }), "bottom-left");
      map.getCanvas().setAttribute("aria-label", canvasLabel(labelRef.current));

      // Di layar sempit atribusi otomatis ringkas tetapi terbuka dan menutupi peta; ciutkan ke tombol (i).
      map.once("load", () => element.querySelector(".maplibregl-compact-show")?.classList.remove("maplibregl-compact-show"));
      timeoutId = window.setTimeout(switchToFallbackStyle, STYLE_TIMEOUT_MS);
      // Peta yang sudah dibuang (unmount/coba lagi) tidak boleh lagi mengubah state.
      map.on("style.load", () => {
        if (cancelled) return;
        styleLoaded = true;
        styleReadyRef.current = true;
        window.clearTimeout(timeoutId);
        setStatus("ready");
        if (map) onStyleReadyRef.current?.(map);
      });
      map.on("error", (event) => {
        if (cancelled) return;
        // Sebelum style termuat: style peta dasar gagal. Sesudahnya: tile peta dasar gagal.
        if (!styleLoaded) switchToFallbackStyle();
        else if ("sourceId" in event && event.sourceId) setBasemapFailed(true);
      });
      map.on("webglcontextlost", () => { if (!cancelled) setStatus("error"); });
    }

    void init(container).catch(() => { if (!cancelled) setStatus("error"); });
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      mapRef.current = null;
      styleReadyRef.current = false;
      map?.remove();
    };
  }, [attempt]);

  // Ikuti perubahan batas (mis. filter wilayah) tanpa membuat ulang peta.
  const boundsKey = bounds.join(",");
  useEffect(() => {
    initialBounds.current = bounds;
    mapRef.current?.fitBounds(bounds, { padding: 32, duration: 600 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dibandingkan lewat boundsKey
  }, [boundsKey]);

  // Layar penuh: bingkai peta menutup seluruh layar (berfungsi juga di iPhone yang tidak punya
  // Fullscreen API). Bila browser mendukung, Fullscreen API dipakai sekalian agar bilah browser hilang.
  function enterFullscreen() {
    setFullscreen(true);
    const frame = frameRef.current;
    if (frame && document.fullscreenEnabled && !document.fullscreenElement) frame.requestFullscreen().catch(() => {});
  }

  function exitFullscreen() {
    setFullscreen(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }

  const previousFullscreen = useRef(fullscreen);
  useEffect(() => {
    const map = mapRef.current;
    map?.resize();
    // Fokus tetap di tombol setelah berganti mode (bukan saat halaman pertama dimuat).
    if (previousFullscreen.current !== fullscreen) toggleRef.current?.focus();
    previousFullscreen.current = fullscreen;
    if (!fullscreen) return;
    // Di layar penuh peta bebas digeser satu jari; halaman di belakangnya tidak ikut tergulir.
    map?.cooperativeGestures.disable();
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") exitFullscreen(); };
    // Esc pada Fullscreen API ditangani browser; ikuti statusnya.
    const onFullscreenChange = () => { if (!document.fullscreenElement) setFullscreen(false); };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      root.style.overflow = previousOverflow;
      mapRef.current?.cooperativeGestures.enable();
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [fullscreen]);

  function retry() {
    setStatus("loading");
    setBasemapFailed(false);
    setAttempt((value) => value + 1);
  }

  const failed = status === "no-webgl" || status === "error";

  return (
    // Bingkai luar menjaga ruang di halaman saat peta berpindah ke layar penuh.
    <div data-map-status={status} data-fullscreen={fullscreen || undefined} aria-busy={status === "loading"} className={cn("relative", className)}>
      <div
        ref={frameRef}
        role={fullscreen ? "dialog" : undefined}
        aria-modal={fullscreen || undefined}
        aria-label={fullscreen ? `${label} (layar penuh)` : undefined}
        className={cn("isolate overflow-hidden bg-muted", fullscreen ? "fixed inset-0 z-[70] h-dvh w-full" : "absolute inset-0 rounded-lg border")}
      >
        {/* Bukan `absolute`: CSS MapLibre memberi `.maplibregl-map` position: relative. */}
        <div ref={containerRef} className={cn("h-full w-full", failed && "invisible")} />
        {!failed && (
          <button
            ref={toggleRef}
            type="button"
            onClick={fullscreen ? exitFullscreen : enterFullscreen}
            aria-pressed={fullscreen}
            className="absolute top-2.5 left-2.5 z-10 inline-flex min-h-10 items-center gap-2 rounded-md border bg-card px-3 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {fullscreen ? <Minimize2 className="size-4" aria-hidden="true" /> : <Maximize2 className="size-4" aria-hidden="true" />}
            {fullscreen ? "Keluar layar penuh" : "Layar penuh"}
          </button>
        )}
        {status === "loading" && (
          <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted">
            <Skeleton className="h-full w-full rounded-none" />
            <span className="absolute text-sm text-muted-foreground">Memuat peta…</span>
          </div>
        )}
        {status === "ready" && basemapFailed && (
          <p role="status" className="absolute top-15 left-2.5 z-10 mr-14 flex max-w-sm items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Peta dasar tidak termuat (cek koneksi). Data tetap ditampilkan di atas latar polos.
          </p>
        )}
        {failed && (
          <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
            <MapPinOff className="size-7 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-semibold">Peta tidak dapat ditampilkan</p>
            <p className="max-w-sm text-xs leading-5 text-muted-foreground">
              {status === "no-webgl"
                ? "Browser atau perangkat ini tidak mendukung WebGL. Informasi lain di halaman ini tetap bisa dipakai."
                : "Terjadi kendala saat menggambar peta. Informasi lain di halaman ini tetap bisa dipakai."}
            </p>
            <Button variant="outline" size="sm" className="mt-2" onClick={retry}><RotateCcw aria-hidden="true" />Coba lagi</Button>
          </div>
        )}
      </div>
    </div>
  );
}
