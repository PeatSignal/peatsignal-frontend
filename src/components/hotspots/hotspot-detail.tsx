"use client";

import { useState } from "react";
import { ClipboardPlus, X } from "lucide-react";
import { useActor } from "@/components/providers/actor-context";
import { DemoBadge } from "@/components/shared/demo-badge";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { Button } from "@/components/ui/button";
import { findArea } from "@/lib/domain/areas";
import { confidenceLabels, hotspotStatusLabels } from "@/lib/domain/labels";
import { formatDateTime, formatUtcDateTime } from "@/lib/format";
import type { Hotspot } from "@/types";
import { HOTSPOT_STATUS_COLOR } from "./hotspot-map";

const SATELLITE_LABELS: Record<string, string> = { N: "Suomi NPP", N20: "NOAA-20", N21: "NOAA-21" };

export function satelliteLabel(code: string): string {
  return SATELLITE_LABELS[code] ?? code;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium break-all">{children}</dd>
    </div>
  );
}

/** Detail satu titik panas terpilih beserta aksi membuat tugas pemeriksaan. */
export function HotspotDetail({ hotspot, onClose }: { hotspot: Hotspot; onClose: () => void }) {
  const { actor } = useActor();
  const [creating, setCreating] = useState(false);
  const area = findArea(hotspot.area_id);
  const confidence = hotspot.confidence_raw ? `${confidenceLabels[hotspot.confidence_raw] ?? hotspot.confidence_raw} (${hotspot.confidence_raw})` : "Tidak tersedia";

  return (
    <section aria-labelledby="hotspot-detail-title" className="rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="size-2.5 rounded-full" style={{ background: HOTSPOT_STATUS_COLOR[hotspot.verification_status] }} aria-hidden="true" />
            {hotspotStatusLabels[hotspot.verification_status]}
          </p>
          <h2 id="hotspot-detail-title" className="mt-1 text-base font-semibold">Titik panas {formatDateTime(hotspot.observed_at)}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Tutup detail titik"><X aria-hidden="true" /></Button>
      </div>
      <dl className="mt-2 divide-y">
        <Row label="Waktu satelit">{formatUtcDateTime(hotspot.observed_at)}</Row>
        <Row label="Wilayah">{area?.label ?? "Wilayah lainnya"}</Row>
        <Row label="Koordinat">{hotspot.latitude.toFixed(5)}, {hotspot.longitude.toFixed(5)}</Row>
        <Row label="Satelit">{satelliteLabel(hotspot.satellite)} · {hotspot.instrument}</Row>
        <Row label="Confidence (mentah)">{confidence}</Row>
        <Row label="FRP">{hotspot.frp_mw === null ? "Tidak tersedia" : `${hotspot.frp_mw.toLocaleString("id-ID")} MW`}</Row>
        <Row label="Sumber">{hotspot.source}</Row>
        {hotspot.imported_at && <Row label="Diperbarui di server">{formatDateTime(hotspot.imported_at)}</Row>}
      </dl>
      <details className="mt-3 text-xs leading-5 text-muted-foreground"><summary className="cursor-pointer font-medium">Tentang confidence & FRP</summary><p className="mt-2">Confidence adalah kategori satelit, bukan peluang kebakaran. FRP mengukur energi panas yang terdeteksi.</p></details>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {hotspot.is_simulation ? <DemoBadge /> : <span />}
        {actor?.role === "coordinator" ? (
          <Button size="sm" onClick={() => setCreating(true)}><ClipboardPlus aria-hidden="true" />Buat tugas pemeriksaan</Button>
        ) : (
          <span className="text-xs text-muted-foreground">Hanya koordinator yang dapat membuat tugas.</span>
        )}
      </div>
      {creating && <CreateTaskDialog source={{ kind: "hotspot", hotspot }} open={creating} onOpenChange={setCreating} />}
    </section>
  );
}
