"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { CircleHelp, Menu } from "lucide-react";
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
        <header className="flex min-h-16 flex-wrap items-center gap-x-3 gap-y-2 border-b bg-card px-4 py-3 md:px-8">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Buka navigasi"><Menu aria-hidden="true" /></Button></SheetTrigger>
            <SheetContent>
              <SheetTitle className="sr-only">Navigasi PeatSignal</SheetTitle>
              <SheetDescription className="sr-only">Pilih modul pemantauan atau eksperimen.</SheetDescription>
              <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1 truncate text-sm font-medium">{active?.label ?? "PeatSignal"}</div>
          <div className="order-last w-full sm:order-none sm:w-auto"><ModeSwitcher /></div>
          <Button variant="ghost" size="icon" onClick={() => openGuide()} aria-label="Buka panduan penggunaan" title="Panduan penggunaan"><CircleHelp aria-hidden="true" /></Button>
          <AccountMenu />
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
