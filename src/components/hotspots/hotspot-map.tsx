"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent, Popup } from "maplibre-gl";
import { BaseMap, loadMaplibre } from "@/components/maps/base-map";
import { AREAS, INDONESIA_BBOX, findArea } from "@/lib/domain/areas";
import { hotspotStatusLabels } from "@/lib/domain/labels";
import { bboxPolygon, unionBbox } from "@/lib/maps/map-config";
import { formatDateTime } from "@/lib/format";
import type { Bbox, HotspotMapPoint, HotspotVerificationStatus } from "@/types";

type MapPoint = Omit<HotspotMapPoint, "list_offset">;

const AREA_SOURCE = "wilayah";
const HOTSPOT_SOURCE = "titik-panas";
const POINT_LAYER = "titik-panas-titik";
const SELECTED_LAYER = "titik-panas-terpilih";
const ALL_AREAS_BBOX = unionBbox(AREAS.map((area) => area.bbox)) as Bbox;

/** Warna status verifikasi; dipakai juga oleh legenda dan daftar. */
export const HOTSPOT_STATUS_COLOR: Record<HotspotVerificationStatus, string> = {
  UNVERIFIED: "#e8590c",
  IN_VERIFICATION: "#d97706",
  VERIFIED: "#18543b",
  DISMISSED: "#94a3b8",
};

function hotspotCollection(hotspots: readonly MapPoint[]) {
  return {
    type: "FeatureCollection" as const,
    features: hotspots.map((hotspot) => ({
      type: "Feature" as const,
      properties: { id: hotspot.id, color: HOTSPOT_STATUS_COLOR[hotspot.verification_status] },
      geometry: { type: "Point" as const, coordinates: [hotspot.longitude, hotspot.latitude] },
    })),
  };
}

function areaCollection(selectedAreaId: string | null, national: boolean) {
  return {
    type: "FeatureCollection" as const,
    features: (national ? [] : AREAS).map((area) => ({
      type: "Feature" as const,
      properties: { selected: area.id === selectedAreaId },
      geometry: { type: "Polygon" as const, coordinates: bboxPolygon(area.bbox) },
    })),
  };
}

/** Isi popup dibuat dengan textContent (bukan HTML) agar data sumber tidak dieksekusi. */
function popupContent(hotspot: MapPoint): HTMLElement {
  const root = document.createElement("div");
  root.className = "space-y-0.5 text-xs leading-5";
  const title = document.createElement("p");
  title.className = "font-semibold";
  title.textContent = formatDateTime(hotspot.observed_at);
  const status = document.createElement("p");
  status.textContent = `${hotspotStatusLabels[hotspot.verification_status]} · ${hotspot.frp_mw === null ? "FRP tidak tersedia" : `FRP ${hotspot.frp_mw.toLocaleString("id-ID")} MW`}`;
  root.append(title, status);
  return root;
}

const registeredMaps = new WeakSet<MapLibreMap>();

export function HotspotMap({ hotspots, selectedId, onSelect, areaId, national = false, className }: {
  hotspots: readonly MapPoint[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  areaId: string | null;
  national?: boolean;
  className?: string;
}) {
  const onSelectRef = useRef(onSelect);
  const popupRef = useRef<Popup | null>(null);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  useEffect(() => () => { popupRef.current?.remove(); }, []);

  const markers = useMemo(() => hotspotCollection(hotspots), [hotspots]);
  const selected = hotspots.find((hotspot) => hotspot.id === selectedId) ?? null;

  const sync = useCallback((map: MapLibreMap) => {
    if (!map.getSource(AREA_SOURCE)) {
      map.addSource(AREA_SOURCE, { type: "geojson", data: areaCollection(areaId, national) });
      map.addLayer({ id: `${AREA_SOURCE}-garis`, type: "line", source: AREA_SOURCE, paint: { "line-color": "#18543b", "line-width": ["case", ["get", "selected"], 2, 1], "line-dasharray": [2, 1.5], "line-opacity": 0.7 } });
    }
    if (!map.getSource(HOTSPOT_SOURCE)) {
      map.addSource(HOTSPOT_SOURCE, { type: "geojson", data: markers });
      map.addLayer({
        id: POINT_LAYER, type: "circle", source: HOTSPOT_SOURCE,
        paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 3.5, 9, 6, 12, 8], "circle-color": ["get", "color"], "circle-stroke-color": "#ffffff", "circle-stroke-width": 1, "circle-opacity": 0.9 },
      });
      map.addLayer({
        id: SELECTED_LAYER, type: "circle", source: HOTSPOT_SOURCE, filter: ["==", ["get", "id"], ""],
        paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 8, 9, 11, 12, 13], "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": "#111827", "circle-stroke-width": 2.5 },
      });
    }
    map.getSource<GeoJSONSource>(AREA_SOURCE)?.setData(areaCollection(areaId, national));
    map.getSource<GeoJSONSource>(HOTSPOT_SOURCE)?.setData(markers);
    map.setFilter(SELECTED_LAYER, ["==", ["get", "id"], selectedId ?? ""]);

    if (!registeredMaps.has(map)) {
      registeredMaps.add(map);
      map.on("click", POINT_LAYER, (event: MapLayerMouseEvent) => {
        const id = event.features?.[0]?.properties?.id;
        if (typeof id === "string") onSelectRef.current(id);
      });
      map.on("mouseenter", POINT_LAYER, () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", POINT_LAYER, () => { map.getCanvas().style.cursor = ""; });
    }

    popupRef.current?.remove();
    popupRef.current = null;
    if (selected) {
      const position: [number, number] = [selected.longitude, selected.latitude];
      if (!map.getBounds().contains(position)) map.easeTo({ center: position, duration: 500 });
      void loadMaplibre().then((maplibre) => {
        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new maplibre.Popup({ closeButton: false, offset: 12, maxWidth: "240px" }).setLngLat(position).setDOMContent(popupContent(selected)).addTo(map);
      });
    }
  }, [areaId, markers, national, selected, selectedId]);

  const area = national ? undefined : findArea(areaId);
  return (
    <BaseMap
      label={`Peta titik panas${area ? ` ${area.label}` : ""}, ${hotspots.length} titik sesuai filter`}
      bounds={national ? INDONESIA_BBOX : area?.bbox ?? ALL_AREAS_BBOX}
      onStyleReady={sync}
      className={className}
    />
  );
}
