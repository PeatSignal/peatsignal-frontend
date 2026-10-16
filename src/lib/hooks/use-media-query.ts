"use client";

import { useCallback, useSyncExternalStore } from "react";

/** `true` bila media query cocok. Server dan render hydrate memakai `serverValue` agar HTML sama. */
export function useMediaQuery(query: string, serverValue = false): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    const list = window.matchMedia(query);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => serverValue);
}
