import type { MonitoringMode } from "@/types";
import { addDays } from "./dates";

export interface ModeBounds {
  mode: MonitoringMode;
  /** Tanggal paling awal yang boleh dipilih. */
  min_date: string;
  /** Tanggal paling akhir yang boleh dipilih; juga default `as_of`. */
  max_date: string;
  default_from: string;
  default_to: string;
}

/** Periode data GWT pada mmc1.xlsx (gabungan seluruh stasiun). */
export const HISTORICAL_DATA_PERIOD = { from: "2018-04-08", to: "2019-12-31" } as const;

/** Default replay: puncak musim kemarau 2019, sebelum hari `as_of`. */
export const HISTORICAL_BOUNDS: ModeBounds = {
  mode: "HISTORICAL_REPLAY",
  min_date: HISTORICAL_DATA_PERIOD.from,
  max_date: HISTORICAL_DATA_PERIOD.to,
  default_from: "2019-08-17",
  default_to: "2019-09-15",
};

/** Jendela pemantauan terkini: tujuh hari terakhir sampai `today`. */
export function currentBounds(today: string): ModeBounds {
  return {
    mode: "CURRENT_MONITORING",
    min_date: addDays(today, -29),
    max_date: today,
    default_from: addDays(today, -6),
    default_to: today,
  };
}
