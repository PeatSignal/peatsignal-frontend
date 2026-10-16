import type { Metadata } from "next";
import { HotspotsHeader, HotspotsView, SETTINGS_ANCHOR } from "@/components/hotspots/hotspots-view";
import { MonitoringContextPanel } from "@/components/shared/monitoring-context-panel";

export const metadata: Metadata = { title: "Titik panas" };

export default function HotspotsPage() {
  return (
    <div className="space-y-7">
      <HotspotsHeader />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <HotspotsView />
        <div className="xl:sticky xl:top-6"><MonitoringContextPanel id={SETTINGS_ANCHOR} /></div>
      </div>
    </div>
  );
}
