"use client";

import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useActor } from "@/components/providers/actor-context";
import { useHotspotSyncStatus, useRepositoryMutation } from "@/components/providers/data-hooks";
import { useIsDemoData } from "@/components/providers/gambutops-repository";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage } from "@/lib/api";
import { findArea } from "@/lib/domain/areas";
import { formatDateTime } from "@/lib/format";
import type { HotspotSyncInput, HotspotSyncStatus } from "@/types";

const PRODUCT_LABELS: Record<string, string> = { VIIRS_SNPP_NRT: "VIIRS Suomi NPP", VIIRS_NOAA20_NRT: "VIIRS NOAA-20" };
const STATUS: Record<HotspotSyncStatus["status"], { label: string; variant: "default" | "warning" | "destructive" | "outline" }> = {
  SUCCESS: { label: "Berhasil", variant: "default" },
  RUNNING: { label: "Berjalan", variant: "warning" },
  FAILED: { label: "Gagal", variant: "destructive" },
  NOT_SYNCED: { label: "Belum pernah", variant: "outline" },
};

/** Status sinkronisasi NASA FIRMS (mode terkini). Data lama tetap ditampilkan walau sync gagal. */
export function SyncStatusPanel() {
  const demo = useIsDemoData();
  const { actor } = useActor();
  const status = useHotspotSyncStatus(true);
  const sync = useRepositoryMutation((repo, input: HotspotSyncInput) => {
    if (!actor) throw new Error("Pengguna demo belum dimuat.");
    return repo.syncHotspots(input, { actor });
  });
  const canSync = !demo && actor?.role === "coordinator";

  async function run(target: HotspotSyncStatus) {
    try {
      const result = await sync.mutate({ area_id: target.area_id, source_product: target.source_product as HotspotSyncInput["source_product"], day_range: 3 });
      toast.success("Sinkronisasi selesai", { description: `${result.rows_received ?? 0} baris diterima, ${result.rows_inserted ?? 0} titik baru.` });
    } catch (error) {
      toast.error("Sinkronisasi gagal", { description: errorMessage(error) });
    }
  }

  return (
    <section aria-labelledby="sync-title" className="rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="sync-title" className="text-base font-semibold">Pembaruan data satelit (NASA FIRMS)</h2>
          <p className="mt-1 text-sm text-muted-foreground">Cakupan seluruh Indonesia</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {demo ? "Data contoh DEMO; tidak menghubungi NASA." : canSync ? "Sinkronkan mengambil 3 hari terakhir. Bisa diulang setiap 10 menit per target." : "Hanya koordinator yang dapat menyinkronkan. Data yang sudah ada tetap ditampilkan."}
          </p>
        </div>
      </div>
      {status.status === "error" ? (
        <p role="alert" className="mt-3 text-sm text-destructive">{errorMessage(status.error)}</p>
      ) : !status.data ? (
        <Skeleton className="mt-3 h-24" />
      ) : (
        <ul className="mt-3 divide-y">
          {status.data.map((target) => {
            const info = STATUS[target.status];
            return (
              <li key={`${target.area_id}-${target.source_product}`} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{target.area_id === "indonesia" ? "Seluruh Indonesia" : findArea(target.area_id)?.label ?? target.area_id} · {PRODUCT_LABELS[target.source_product] ?? target.source_product}</p>
                  <p className="text-xs text-muted-foreground">
                    {target.last_successful_at ? `Terakhir berhasil ${formatDateTime(target.last_successful_at)}` : "Belum pernah berhasil"}
                    {target.status === "FAILED" && target.last_attempt?.error_code ? ` · percobaan terakhir gagal (${target.last_attempt.error_code})` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={info.variant}>{info.label}</Badge>
                  {canSync && (
                    <Button size="sm" variant="outline" disabled={sync.isPending} onClick={() => run(target)} aria-label={`Sinkronkan ${target.area_id === "indonesia" ? "Seluruh Indonesia" : findArea(target.area_id)?.region ?? target.area_id} ${PRODUCT_LABELS[target.source_product] ?? target.source_product}`}>
                      <RefreshCw aria-hidden="true" className={sync.isPending ? "animate-spin" : undefined} />Sinkronkan
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-2 text-xs leading-5 text-muted-foreground">Hasil kosong berarti tidak ada deteksi dari permintaan tersebut, bukan berarti wilayah aman.</p>
    </section>
  );
}
