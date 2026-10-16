import type { Metadata } from "next";
import { DashboardHeader, DashboardView, SETTINGS_ANCHOR } from "@/components/dashboard/dashboard-view";
import { MonitoringContextPanel } from "@/components/shared/monitoring-context-panel";

export const metadata: Metadata = { title: "Ringkasan" };

export default function DashboardPage() {
  return (
    <div className="space-y-7">
      <DashboardHeader />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <DashboardView />
        <div className="xl:sticky xl:top-6"><MonitoringContextPanel id={SETTINGS_ANCHOR} /></div>
      </div>
    </div>
  );
}
