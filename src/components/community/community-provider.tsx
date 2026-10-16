"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { COMMUNITY_ALERTS, emptyCommunityStore, loadCommunityStore, saveCommunityStore, validateReport, type CommunityStore, type ReportInput } from "@/lib/community";
import { getBrowserStorage, type KeyValueStorage } from "@/lib/mock/storage";

interface CommunityContextValue {
  store: CommunityStore;
  ready: boolean;
  markRead: (ids: string[]) => void;
  createReport: (input: ReportInput) => void;
}
const CommunityContext = createContext<CommunityContextValue | null>(null);

export function CommunityProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState(emptyCommunityStore);
  const current = useRef(store);
  const storage = useRef<KeyValueStorage | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    storage.current = getBrowserStorage();
    const loaded = loadCommunityStore(storage.current, (message) => toast.warning(message));
    current.current = loaded;
    setStore(loaded);
    setReady(true);
  }, []);

  function commit(next: CommunityStore) {
    current.current = next;
    setStore(next);
    if (!saveCommunityStore(storage.current, next)) toast.warning("Perubahan hanya tersimpan sementara", { description: "Penyimpanan browser tidak tersedia. Perubahan hilang setelah reload." });
  }
  const markRead = (ids: string[]) => {
    if (!ready) return;
    const validIds = ids.filter((id) => COMMUNITY_ALERTS.some((alert) => alert.id === id));
    commit({ ...current.current, read_alert_ids: [...new Set([...current.current.read_alert_ids, ...validIds])] });
  };
  const createReport = (input: ReportInput) => {
    if (!ready) throw new Error("Penyimpanan sedang dimuat.");
    const data = validateReport(input);
    commit({ ...current.current, reports: [{ ...data, id: crypto.randomUUID(), submitted_at: new Date().toISOString(), status: "SUBMITTED", is_simulation: true }, ...current.current.reports] });
  };
  return <CommunityContext.Provider value={{ store, ready, markRead, createReport }}>{children}</CommunityContext.Provider>;
}

export function useCommunity() {
  const value = useContext(CommunityContext);
  if (!value) throw new Error("CommunityProvider diperlukan.");
  return value;
}
