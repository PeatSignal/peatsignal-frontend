"use client";

import { useCallback, useEffect, useRef } from "react";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import { BaseMap } from "@/components/maps/base-map";
import { findArea } from "@/lib/domain/areas";
import { bboxPolygon } from "@/lib/maps/map-config";
import type { CommunityAlert, CitizenReport } from "@/lib/community";

const registered = new WeakSet<MapLibreMap>();
export function CommunityMap({ areaId, alerts, reports, selectedId, location, picking, onSelect, onLocation }: {
  areaId: string; alerts: readonly CommunityAlert[]; reports: CitizenReport[]; selectedId: string | null;
  location: [number, number] | null; picking: boolean;
  onSelect: (id: string) => void; onLocation: (point: [number, number]) => void;
}) {
  const callbacks = useRef({ onSelect, onLocation, picking });
  useEffect(() => { callbacks.current = { onSelect, onLocation, picking }; }, [onSelect, onLocation, picking]);
  const area = findArea(areaId)!;
  const sync = useCallback((map: MapLibreMap) => {
    const data: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [
      { type: "Feature", properties: { kind: "boundary" }, geometry: { type: "Polygon", coordinates: bboxPolygon(area.bbox) } },
      ...alerts.filter((alert) => alert.extent).map((alert): GeoJSON.Feature => ({ type: "Feature", properties: { id: alert.id, kind: "land" }, geometry: { type: "Polygon", coordinates: bboxPolygon(alert.extent!) } })),
      ...alerts.map((alert): GeoJSON.Feature => ({ type: "Feature", properties: { id: alert.id, kind: alert.kind === "HOTSPOT" ? "heat" : "land", selected: alert.id === selectedId }, geometry: { type: "Point", coordinates: [alert.longitude, alert.latitude] } })),
      ...reports.map((report): GeoJSON.Feature => ({ type: "Feature", properties: { id: report.id, kind: "report", selected: report.id === selectedId }, geometry: { type: "Point", coordinates: [report.longitude, report.latitude] } })),
      ...(location ? [{ type: "Feature", properties: { kind: "location" }, geometry: { type: "Point", coordinates: location } } as GeoJSON.Feature] : []),
    ] };
    if (!map.getSource("community")) {
      map.addSource("community", { type: "geojson", data });
      map.addLayer({ id: "community-land", type: "fill", source: "community", filter: ["all", ["==", ["geometry-type"], "Polygon"], ["==", ["get", "kind"], "land"]], paint: { "fill-color": "#a16207", "fill-opacity": 0.25 } });
      map.addLayer({ id: "community-boundary", type: "line", source: "community", filter: ["==", ["geometry-type"], "Polygon"], paint: { "line-color": "#52765a", "line-width": 1.5, "line-dasharray": [3, 2] } });
      map.addLayer({ id: "community-points", type: "circle", source: "community", filter: ["==", ["geometry-type"], "Point"], paint: {
        "circle-radius": ["case", ["boolean", ["get", "selected"], false], 11, 7],
        "circle-color": ["match", ["get", "kind"], "heat", "#ea580c", "land", "#a16207", "location", "#2563eb", "#15803d"], "circle-stroke-color": "#ffffff", "circle-stroke-width": 2,
      } });
    }
    map.getSource<GeoJSONSource>("community")?.setData(data);
    map.getCanvas().style.cursor = picking ? "crosshair" : "grab";
    if (!registered.has(map)) {
      registered.add(map);
      map.on("click", (event) => {
        if (callbacks.current.picking) { callbacks.current.onLocation([event.lngLat.lng, event.lngLat.lat]); return; }
        const feature = map.queryRenderedFeatures(event.point, { layers: ["community-points", "community-land"] })[0];
        const id = feature?.properties?.id;
        if (typeof id === "string") callbacks.current.onSelect(id);
      });
    }
  }, [area, alerts, reports, selectedId, location, picking]);
  return <BaseMap label={`Peta masyarakat ${area.label}`} bounds={area.bbox} onStyleReady={sync} className="h-[320px] sm:h-[430px]" />;
}
