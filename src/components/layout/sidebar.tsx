"use client";

import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Brand } from "./brand";
import { navigation, communityNavigation } from "./navigation";
import { useActor } from "@/components/providers/actor-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";

export function SidebarContent({ pathname, compact = false, onNavigate, onToggle }: {
  pathname: string; compact?: boolean; onNavigate?: () => void; onToggle?: () => void;
}) {
  const { actor } = useActor();
  return (
    <>
      <div className={cn("flex h-20 shrink-0 items-center px-6", compact && "px-0")}><Brand compact={compact} onNavigate={onNavigate} /></div>
      <div className={cn("flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-3", compact && "px-3")}>
        <nav aria-label="Navigasi utama" className="space-y-1.5">
          {(actor?.role === "community" ? [communityNavigation] : navigation).map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} title={compact ? item.label : undefined}
                className={cn("group flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", active ? "bg-secondary text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground", compact && "justify-center px-0")}
              >
                <Icon className="size-[18px] shrink-0" aria-hidden="true" />
                <span className={cn("flex min-w-0 flex-1 flex-col", compact && "sr-only")}>
                  {item.label}
                  {/* Keterangan di baris kedua agar label panjang tidak terlipat tak beraturan. */}
                  {!compact && !item.experimental && !item.available && <span aria-hidden="true" className="text-[11px] leading-4 font-normal text-muted-foreground/80">Segera tersedia</span>}
                </span>
                {item.experimental ? <span className="sr-only"> (uji coba)</span> : !item.available && <span className="sr-only"> (segera tersedia)</span>}
              </Link>
            );
          })}
        </nav>

      </div>
      <div className={cn("flex min-h-16 shrink-0 items-center justify-end gap-2 px-6 py-3", compact && "justify-center px-0")}>
        {onToggle && <Button variant="ghost" size="icon" onClick={onToggle} aria-label={compact ? "Perluas sidebar" : "Ciutkan sidebar"} aria-expanded={!compact} aria-controls="desktop-sidebar-nav">{compact ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}</Button>}
      </div>
    </>
  );
}
