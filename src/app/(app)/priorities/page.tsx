import { PreventionWorkbench } from "@/components/prevention/prevention-workbench";
import type { Metadata } from "next";
import { PrioritiesHeader, PrioritiesView } from "@/components/priorities/priorities-view";
import { MonitoringContextPanel } from "@/components/shared/monitoring-context-panel";

export const metadata: Metadata = { title: "Prioritas pemeriksaan" };

export default function PrioritiesPage() {
  return (
    <div className="space-y-7">
      <PrioritiesHeader />
      <PreventionWorkbench />
      <h2 className="text-lg font-semibold">Prioritas dari data pemantauan</h2>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <PrioritiesView />
        {/* Tanggal "Sampai" menjadi batas informasi (as_of) penilaian. */}
        <div className="xl:sticky xl:top-6"><MonitoringContextPanel /></div>
      </div>
    </div>
  );
}
