"use client";

import { History, WifiOff } from "lucide-react";
import { useSwitchMode } from "@/components/layout/mode-switcher";
import { Button } from "@/components/ui/button";

/** Mode Terkini tanpa data GWT terbaru: tidak ada grafik, dan data lama tidak dipakai sebagai pengganti. */
export function CurrentUnavailable({ stationCode }: { stationCode: string }) {
  const switchMode = useSwitchMode();
  return (
    <section role="status" aria-labelledby="gwt-current-title" className="rounded-xl border border-amber-200 bg-amber-50/60 p-6 sm:p-8">
      <span className="flex size-11 items-center justify-center rounded-xl border border-amber-200 bg-card"><WifiOff className="size-5 text-amber-800" aria-hidden="true" /></span>
      <h2 id="gwt-current-title" className="mt-4 text-lg font-semibold">Data muka air terkini belum tersedia</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-950">
        Belum ada pengukuran terbaru {stationCode}. Lihat mode Riwayat untuk data 2018–2019.
      </p>
      <Button className="mt-5" onClick={() => switchMode("HISTORICAL_REPLAY")}><History aria-hidden="true" />Lihat data riwayat 2018–2019</Button>
    </section>
  );
}
