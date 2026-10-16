"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { GuideDialog, type GuideTab } from "./guide-dialog";

interface GuideContextValue { openGuide: (tab?: GuideTab) => void }
const GuideContext = createContext<GuideContextValue | null>(null);

export function GuideProvider({ children }: { children: ReactNode }) {
  const [manual, setManual] = useState<{ open: boolean; tab: GuideTab }>({ open: false, tab: "start" });
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const openGuide = useCallback((tab: GuideTab = "start") => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setManual({ open: true, tab });
  }, []);
  const value = useMemo(() => ({ openGuide }), [openGuide]);

  return <GuideContext.Provider value={value}>
    {children}
    <GuideDialog open={manual.open} onOpenChange={(open) => setManual((current) => ({ ...current, open }))}
      initialTab={manual.tab} firstVisit={false} onCloseAutoFocus={(event) => {
        const target = returnFocusRef.current;
        returnFocusRef.current = null;
        if (target?.isConnected) { event.preventDefault(); target.focus(); }
      }} />
  </GuideContext.Provider>;
}

export function useGuide(): GuideContextValue {
  const value = useContext(GuideContext);
  if (!value) throw new Error("useGuide membutuhkan GuideProvider.");
  return value;
}
