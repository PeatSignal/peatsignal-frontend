"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface QueryCacheValue {
  /** Naik setiap kali cache dibersihkan; query aktif memuat ulang. */
  version: number;
  get<T>(key: string): T | undefined;
  set(key: string, data: unknown): void;
  remove(key: string): void;
  invalidate(): void;
}

const QueryCacheContext = createContext<QueryCacheValue | null>(null);

/**
 * Cache hasil query per kunci. Setiap kunci query diawali mode pemantauan,
 * sehingga data Historical Replay dan Current Monitoring tidak pernah berbagi entri.
 */
export function QueryCacheProvider({ children }: { children: ReactNode }) {
  const [entries] = useState(() => new Map<string, unknown>());
  const [version, setVersion] = useState(0);

  const invalidate = useCallback(() => {
    entries.clear();
    setVersion((value) => value + 1);
  }, [entries]);

  const value = useMemo<QueryCacheValue>(() => ({
    version,
    get: <T,>(key: string) => entries.get(key) as T | undefined,
    set: (key, data) => void entries.set(key, data),
    remove: (key) => void entries.delete(key),
    invalidate,
  }), [entries, invalidate, version]);

  return <QueryCacheContext.Provider value={value}>{children}</QueryCacheContext.Provider>;
}

export function useQueryCache(): QueryCacheValue {
  const value = useContext(QueryCacheContext);
  if (!value) throw new Error("useQueryCache membutuhkan QueryCacheProvider.");
  return value;
}
