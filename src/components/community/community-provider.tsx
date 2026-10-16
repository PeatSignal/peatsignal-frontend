"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { COMMUNITY_ALERTS, COMMUNITY_STORE_KEY, emptyCommunityStore, handleCitizenReport, loadCommunityStore, saveCommunityStore, validateReport, type CitizenReportStatus, type CommunityStore, type ReportInput } from "@/lib/community";
import { getBrowserStorage, type KeyValueStorage } from "@/lib/mock/storage";
import { useActor } from "@/components/providers/actor-context";

interface CommunityContextValue {
  store: CommunityStore;
  ready: boolean;
  markRead: (ids: string[]) => void;
  createReport: (input: ReportInput) => void;
  handleReport: (id: string, status: CitizenReportStatus, note: string) => void;
}
const CommunityContext = createContext<CommunityContextValue | null>(null);

export function CommunityProvider({ children }: { children: ReactNode }) {
  const { actor } = useActor();
  const [store, setStore] = useState(emptyCommunityStore);
  const current = useRef(store);
  const storage = useRef<KeyValueStorage | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    storage.current = getBrowserStorage();
    function refresh() {
      const loaded = loadCommunityStore(storage.current, (message) => toast.warning(message));
      current.current = loaded;
      setStore(loaded);
    }
    function onStorage(event: StorageEvent) {
      if (event.key === COMMUNITY_STORE_KEY || event.key === null) refresh();
    }
    queueMicrotask(() => {
      if (!active) return;
      refresh();
      setReady(true);
    });
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  function latest() {
    if (!ready) throw new Error("Penyimpanan sedang dimuat.");
    return storage.current ? loadCommunityStore(storage.current, (message) => toast.warning(message)) : current.current;
  }
  function commit(next: CommunityStore) {
    if (!saveCommunityStore(storage.current, next)) throw new Error("Perubahan belum dapat disimpan. Periksa ketersediaan penyimpanan lalu coba lagi.");
    current.current = next;
    setStore(next);
  }
  const markRead = (ids: string[]) => {
    if (!ready) return;
    const validIds = ids.filter((id) => COMMUNITY_ALERTS.some((alert) => alert.id === id));
    const previous = latest();
    try { commit({ ...previous, read_alert_ids: [...new Set([...previous.read_alert_ids, ...validIds])] }); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Perubahan belum dapat disimpan."); }
  };
  const createReport = (input: ReportInput) => {
    if (actor?.role !== "community") throw new Error("Hanya masyarakat yang dapat menyimpan laporan warga.");
    const data = validateReport(input);
    const previous = latest();
    commit({ ...previous, reports: [{ ...data, id: crypto.randomUUID(), submitted_at: new Date().toISOString(), status: "SUBMITTED", is_simulation: true, handling_history: [] }, ...previous.reports] });
  };
  const handleReport = (id: string, status: CitizenReportStatus, note: string) => {
    if (!actor) throw new Error("Silakan masuk terlebih dahulu.");
    const previous = latest();
    const report = previous.reports.find((item) => item.id === id);
    if (!report) throw new Error("Laporan tidak ditemukan. Muat ulang halaman dan coba lagi.");
    const updated = handleCitizenReport(report, status, note, actor);
    commit({ ...previous, reports: previous.reports.map((item) => item.id === id ? updated : item) });
  };
  return <CommunityContext.Provider value={{ store, ready, markRead, createReport, handleReport }}>{children}</CommunityContext.Provider>;
}

export function useCommunity() {
  const value = useContext(CommunityContext);
  if (!value) throw new Error("CommunityProvider diperlukan.");
  return value;
}
