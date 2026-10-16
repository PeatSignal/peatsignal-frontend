import { z } from "zod";
import { fieldReportSchema, inspectionTaskSchema } from "@/lib/schemas";
import type { FieldReport, InspectionTask } from "@/types";
import { createSeedStore } from "./fixtures";

export const DEMO_STORE_KEY = "gambutops:demo-store:v1";

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type StorageIssue = "RECOVERED" | "WRITE_FAILED";

const demoStoreSchema = z.object({
  version: z.literal(1),
  next_id: z.number().int().positive(),
  tasks: z.array(inspectionTaskSchema),
  reports: z.array(fieldReportSchema),
});

export interface DemoStore {
  version: 1;
  next_id: number;
  tasks: InspectionTask[];
  reports: FieldReport[];
}

export function createMemoryStorage(): KeyValueStorage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

/** localStorage bila tersedia (browser, bukan mode privat yang memblokir). */
export function getBrowserStorage(): KeyValueStorage | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const probe = "gambutops:probe";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

export function seedStore(): DemoStore {
  return { version: 1, next_id: 100, ...createSeedStore() };
}

/** Membaca store; data rusak atau versi lama diganti seed agar aplikasi tetap dapat dipakai. */
export function loadStore(storage: KeyValueStorage, onIssue?: (issue: StorageIssue) => void): DemoStore {
  let raw: string | null = null;
  try {
    raw = storage.getItem(DEMO_STORE_KEY);
  } catch {
    onIssue?.("RECOVERED");
    return seedStore();
  }
  if (raw === null) return seedStore();
  try {
    const parsed = demoStoreSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;
  } catch {
    // JSON tidak valid ditangani di bawah.
  }
  onIssue?.("RECOVERED");
  const fresh = seedStore();
  saveStore(storage, fresh, onIssue);
  return fresh;
}

export function saveStore(storage: KeyValueStorage, store: DemoStore, onIssue?: (issue: StorageIssue) => void) {
  try {
    storage.setItem(DEMO_STORE_KEY, JSON.stringify(store));
  } catch {
    onIssue?.("WRITE_FAILED");
  }
}
