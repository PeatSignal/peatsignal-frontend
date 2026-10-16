"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu } from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/components/ui/utils";

export const LANDING_SECTIONS = [
  { id: "masalah", label: "Masalah" },
  { id: "cara-kerja", label: "Cara kerja" },
  { id: "forecasting", label: "Forecasting" },
  { id: "alur", label: "Alur" },
  { id: "data", label: "Data" },
  { id: "faq", label: "FAQ" },
] as const;

/** Navbar landing: transparan di atas, menjadi pill mengambang setelah digulir (style.md §5). */
export function LandingNavbar() {
  const [floating, setFloating] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setFloating(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Tandai section yang sedang dibaca.
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: "-40% 0px -55% 0px", threshold: [0, 0.25, 0.5] });
    for (const section of LANDING_SECTIONS) {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4">
      <div
        className={cn(
          "pointer-events-auto mx-auto flex h-16 items-center justify-between gap-3 px-3 transition-[max-width,background-color,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-5",
          floating ? "max-w-[1120px] rounded-full border border-border bg-white/95 shadow-sm" : "max-w-[1200px] border border-transparent",
        )}
      >
        <span className="min-[400px]:hidden"><Brand compact href="/" label="PeatSignal — beranda" /></span>
        <span className="hidden min-[400px]:block"><Brand href="/" label="PeatSignal — beranda" /></span>
        <nav aria-label="Bagian halaman" className="hidden items-center gap-1 lg:flex">
          {LANDING_SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={active === section.id ? "true" : undefined}
              className={cn(
                "relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active === section.id ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {section.label}
              {active === section.id && <span aria-hidden="true" className="absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-primary" />}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild className="rounded-full px-4 sm:px-5"><Link href="/login">Masuk<ArrowRight aria-hidden="true" className="hidden sm:block" /></Link></Button>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full lg:hidden" aria-label="Buka menu bagian halaman"><Menu aria-hidden="true" /></Button>
            </SheetTrigger>
            <SheetContent className={"theme-v2"}>
              <SheetTitle className="sr-only">Bagian halaman</SheetTitle>
              <SheetDescription className="sr-only">Lompat ke bagian landing page.</SheetDescription>
              <nav aria-label="Bagian halaman (menu)" className="mt-16 flex flex-col gap-1 px-4">
                {LANDING_SECTIONS.map((section) => (
                  <a key={section.id} href={`#${section.id}`} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-3 text-base font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {section.label}
                  </a>
                ))}
                <Button asChild size="lg" className="mt-4 rounded-full"><Link href="/login">Masuk ke aplikasi<ArrowRight aria-hidden="true" /></Link></Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
