import type { Metadata } from "next";
import { Suspense } from "react";
import { GroundwaterHeader, GroundwaterSkeleton, GroundwaterView, SETTINGS_ANCHOR } from "@/components/groundwater/groundwater-view";
import { MonitoringContextPanel } from "@/components/shared/monitoring-context-panel";

export const metadata: Metadata = { title: "Muka air tanah" };

export default function GroundwaterPage() {
  return (
    <div className="space-y-7">
      <GroundwaterHeader />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        {/* Pilihan stasiun dibaca dari URL (?stasiun=BRG6), sehingga butuh Suspense saat prerender. */}
        <Suspense fallback={<GroundwaterSkeleton />}><GroundwaterView /></Suspense>
        {/* Di layar kecil panel tampil setelah grafik; tautan "Ubah tanggal" mengarah ke sini. */}
        <div className="xl:sticky xl:top-6"><MonitoringContextPanel id={SETTINGS_ANCHOR} /></div>
      </div>
    </div>
  );
}
