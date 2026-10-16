"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, CircleHelp, Menu } from "lucide-react";
import { findNavigationItem } from "./navigation";
import { SidebarContent } from "./sidebar";
import { ModeSwitcher } from "./mode-switcher";
import { AccountMenu } from "./account-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useGuide } from "@/components/guide/guide-provider";
import { cn } from "@/components/ui/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const active = findNavigationItem(pathname);
  const [compact, setCompact] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openGuide } = useGuide();

  return (
    <div className="flex min-h-dvh">
      <a href="#main-content" className="fixed top-3 left-3 z-[100] -translate-y-24 rounded-md bg-primary px-4 py-3 text-sm text-white focus:translate-y-0">Lewati ke konten utama</a>
      <aside id="desktop-sidebar-nav" aria-label="Sidebar desktop" className={cn("sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-sidebar transition-[width] duration-200 lg:flex", compact ? "w-20" : "w-64")}>
        <SidebarContent pathname={pathname} compact={compact} onToggle={() => setCompact(!compact)} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-20 flex-wrap items-center gap-x-4 gap-y-3 border-b bg-card px-4 py-4 md:px-8">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild><Button variant="outline" size="icon" className="lg:hidden" aria-label="Buka navigasi"><Menu aria-hidden="true" /></Button></SheetTrigger>
            <SheetContent>
              <SheetTitle className="sr-only">Navigasi PeatSignal</SheetTitle>
              <SheetDescription className="sr-only">Pilih modul pemantauan atau eksperimen.</SheetDescription>
              <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex min-w-0 flex-1 items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline">{active?.experimental ? "Eksperimen" : "PeatSignal"}</span>
            <ChevronRight className="hidden size-3.5 sm:block" aria-hidden="true" />
            <span className="truncate font-medium text-foreground">{active?.label ?? "PeatSignal"}</span>
          </div>
          <Button variant="outline" onClick={() => openGuide()} aria-label="Buka panduan penggunaan" className="px-3 sm:px-4"><CircleHelp aria-hidden="true" /><span className="hidden sm:inline">Panduan</span></Button>
          <AccountMenu />
          <div className="w-full sm:w-auto"><ModeSwitcher /></div>
        </header>
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 px-4 py-7 outline-none md:px-8 md:py-9">
          <div className="mx-auto max-w-[1280px]">{children}</div>
        </main>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-4 text-[11px] text-muted-foreground md:px-8">
          <span>PeatSignal · Prevent, Detection, Action</span>

        </footer>
      </div>
    </div>
  );
}
