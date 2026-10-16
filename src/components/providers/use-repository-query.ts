"use client";

import { useEffect, useRef, useState } from "react";
import { isAbortError, type GambutOpsRepository } from "@/lib/api";
import type { MonitoringMode } from "@/types";
import { useRepository } from "./gambutops-repository";
import { useQueryCache } from "./query-cache";

export type QueryStatus = "idle" | "loading" | "success" | "error";

export interface QueryState<T> {
  status: QueryStatus;
  data: T | undefined;
  error: unknown;
  refetch: () => void;
}

type Fetcher<T> = (repository: GambutOpsRepository, signal: AbortSignal) => Promise<T>;

/**
 * Query ke repository dengan cache, pembatalan, dan pengabaian respons lama.
 * `key` null menonaktifkan query. Gunakan `useMonitoringQuery` untuk data yang bergantung mode.
 */
export function useRepositoryQuery<T>(key: readonly unknown[] | null, fetcher: Fetcher<T>): QueryState<T> {
  const repository = useRepository();
  const cache = useQueryCache();
  const keyString = key === null ? null : JSON.stringify(key);
  const [attempt, setAttempt] = useState(0);
  const [failure, setFailure] = useState<{ requestKey: string; error: unknown } | null>(null);
  const [loaded, setLoaded] = useState<{ requestKey: string; data: T } | null>(null);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const requestKey = keyString === null ? null : `${cache.version}:${attempt}:${keyString}`;
  const cached = keyString === null ? undefined : cache.get<T>(keyString) ?? (loaded?.requestKey === requestKey ? loaded.data : undefined);

  useEffect(() => {
    if (requestKey === null || keyString === null || cache.get(keyString) !== undefined) return;
    const controller = new AbortController();
    fetcherRef.current(repository, controller.signal).then(
      (data) => {
        // Respons dari kunci lama sudah dibatalkan dan tidak pernah ditulis.
        if (controller.signal.aborted) return;
        cache.set(keyString, data);
        setLoaded({ requestKey, data });
      },
      (error: unknown) => {
        if (controller.signal.aborted || isAbortError(error)) return;
        setFailure({ requestKey, error });
      },
    );
    return () => controller.abort();
  }, [cache, keyString, repository, requestKey]);

  function refetch() {
    if (keyString !== null) cache.remove(keyString);
    setAttempt((value) => value + 1);
  }

  if (keyString === null) return { status: "idle", data: undefined, error: null, refetch };
  if (cached !== undefined) return { status: "success", data: cached, error: null, refetch };
  if (failure && failure.requestKey === requestKey) return { status: "error", data: undefined, error: failure.error, refetch };
  return { status: "loading", data: undefined, error: null, refetch };
}

/** Kunci cache selalu diawali mode agar data antar-mode tidak tercampur. */
export function useModeQuery<T>(mode: MonitoringMode, name: string, params: Record<string, unknown> | null, fetcher: Fetcher<T>): QueryState<T> {
  return useRepositoryQuery(params === null ? null : [mode, name, params], fetcher);
}
