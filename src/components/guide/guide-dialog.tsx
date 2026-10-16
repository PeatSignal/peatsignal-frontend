"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowRight, Eye, PhoneCall, ShieldAlert, Sprout, Users } from "lucide-react";
import { navigation } from "@/components/layout/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/components/ui/utils";
import { EMERGENCY_NOTE, glossary, guideSteps, importantNotes, roleGuides } from "./guide-content";

export type GuideTab = "start" | "steps" | "terms" | "notes";

const tabs: ReadonlyArray<{ id: GuideTab; label: string }> = [
  { id: "start", label: "Kenalan" },
  { id: "steps", label: "Cara pakai" },
  { id: "terms", label: "Istilah" },
  { id: "notes", label: "Penting" },
];

export function GuideDialog({ open, onOpenChange, initialTab, firstVisit, onCloseAutoFocus }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab: GuideTab;
  firstVisit: boolean;
  onCloseAutoFocus?: (event: Event) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent closeLabel="Tutup panduan" onCloseAutoFocus={onCloseAutoFocus}>
        {/* key memastikan tab awal diterapkan setiap kali panduan dibuka */}
        {open && <GuideBody key={initialTab} initialTab={initialTab} firstVisit={firstVisit} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function GuideBody({ initialTab, firstVisit, onClose }: { initialTab: GuideTab; firstVisit: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<GuideTab>(initialTab);
  const baseId = useId();
  const tabRefs = useRef<Record<GuideTab, HTMLButtonElement | null>>({ start: null, steps: null, terms: null, notes: null });
  const index = tabs.findIndex((item) => item.id === tab);

  function focusTab(next: GuideTab) {
    setTab(next);
    tabRefs.current[next]?.focus();
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const last = tabs.length - 1;
    const target =
      event.key === "ArrowRight" ? tabs[index === last ? 0 : index + 1] :
      event.key === "ArrowLeft" ? tabs[index === 0 ? last : index - 1] :
      event.key === "Home" ? tabs[0] :
      event.key === "End" ? tabs[last] : undefined;
    if (!target) return;
    event.preventDefault();
    focusTab(target.id);
  }

  const next = tabs[index + 1];

  return (
    <>
      <div className="border-b px-5 pt-5 sm:px-6 sm:pt-6">
        {/* Ruang kanan hanya untuk judul (tombol tutup); baris tab memakai lebar penuh. */}
        <div className="pr-9">
          <DialogTitle>Panduan penggunaan PeatSignal</DialogTitle>
          <DialogDescription className="mt-1">Kenali cara memakai aplikasi ini dalam beberapa menit.</DialogDescription>
        </div>
        <div role="tablist" aria-label="Bagian panduan" className="-mx-1 mt-4 flex overflow-x-auto pb-px sm:gap-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              ref={(element) => { tabRefs.current[item.id] = element; }}
              id={`${baseId}-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              aria-controls={`${baseId}-panel`}
              tabIndex={tab === item.id ? 0 : -1}
              onClick={() => setTab(item.id)}
              onKeyDown={onTabKeyDown}
              className={cn(
                // Layar 320px: keempat tab tetap terlihat tanpa perlu digeser.
                "min-h-11 shrink-0 whitespace-nowrap border-b-2 px-1.5 text-[13px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-[360px]:px-2.5 sm:px-3 sm:text-sm",
                tab === item.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${tab}`} tabIndex={0} className="min-h-0 flex-1 overflow-y-auto px-5 py-5 focus-visible:outline-none sm:px-6">
        {tab === "start" && <StartPanel />}
        {tab === "steps" && <StepsPanel onNavigate={onClose} />}
        {tab === "terms" && <TermsPanel />}
        {tab === "notes" && <NotesPanel />}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/40 px-5 py-3.5 sm:px-6">
        <span className="text-xs text-muted-foreground">Bagian {index + 1} dari {tabs.length} · Buka lagi lewat tombol <span className="font-medium text-foreground">Panduan</span></span>
        <div className="flex gap-2">
          {next ? (
            <>
              <Button variant="ghost" onClick={onClose}>{firstVisit ? "Lewati" : "Tutup"}</Button>
              <Button onClick={() => focusTab(next.id)}>Lanjut<ArrowRight aria-hidden="true" /></Button>
            </>
          ) : (
            <Button onClick={onClose}>{firstVisit ? "Mulai gunakan" : "Selesai"}</Button>
          )}
        </div>
      </div>
    </>
  );
}

function StartPanel() {
  return (
    <div className="space-y-5 text-sm leading-6">
      <p>
        <strong>PeatSignal</strong> membantu tim memantau lahan gambut yang rawan terbakar. Anda bisa melihat kondisi air tanah dan titik panas dari satelit,
        menentukan lokasi yang perlu dicek, lalu mencatat hasil pengecekan di lapangan.
      </p>
      <ul className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: Sprout, title: "Cegah", text: "Pantau air tanah sebelum gambut terlalu kering." },
          { icon: Eye, title: "Deteksi", text: "Lihat titik panas dari satelit." },
          { icon: Users, title: "Tindak", text: "Kirim petugas dan catat hasilnya." },
        ].map(({ icon: Icon, title, text }) => (
          <li key={title} className="rounded-lg border p-3.5">
            <Icon className="size-5 text-primary" aria-hidden="true" />
            <p className="mt-2 font-semibold">{title}</p>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{text}</p>
          </li>
        ))}
      </ul>
      <div>
        <h3 className="font-semibold">Siapa yang memakai?</h3>
        <ul className="mt-2 grid gap-3 sm:grid-cols-2">
          {roleGuides.map((role) => (
            <li key={role.role} className="rounded-lg bg-muted/60 p-3.5">
              <p className="font-medium">{role.role}</p>
              <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-xs leading-5 text-muted-foreground">
                {role.duties.map((duty) => <li key={duty}>{duty}</li>)}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StepsPanel({ onNavigate }: { onNavigate: () => void }) {
  return (
    <ol className="space-y-3">
      {guideSteps.map((step, index) => {
        const item = step.href ? navigation.find((entry) => entry.href === step.href) : undefined;
        // Langkah header/panel periode selalu tersedia; modul mengikuti status navigasinya.
        const ready = step.href === null || step.href === "/dashboard" || item?.available === true;
        const Icon = step.icon;
        return (
          <li key={step.title} className="flex gap-3 rounded-lg border p-3.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-primary" aria-hidden="true">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Icon className="size-4 text-teal" aria-hidden="true" />
                <h3 className="text-sm font-semibold">{step.title}</h3>
                {!ready && <Badge variant="outline">Segera tersedia</Badge>}
              </div>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.body}</p>
              {step.href && ready && (
                <Link href={step.href} onClick={onNavigate} className="mt-1.5 inline-flex min-h-9 items-center gap-1 rounded text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  Buka {item?.label ?? "halaman"}<ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function TermsPanel() {
  return (
    <dl className="divide-y">
      {glossary.map((item) => (
        <div key={item.term} className="py-3 first:pt-0 last:pb-0">
          <dt className="text-sm font-semibold">{item.term}</dt>
          <dd className="mt-0.5 text-sm leading-6 text-muted-foreground">{item.meaning}</dd>
        </div>
      ))}
    </dl>
  );
}

function NotesPanel() {
  return (
    <div className="space-y-4">
      <ul className="space-y-2.5">
        {importantNotes.map((note) => (
          <li key={note} className="flex gap-2.5 text-sm leading-6"><ShieldAlert className="mt-1 size-4 shrink-0 text-amber-700" aria-hidden="true" />{note}</li>
        ))}
      </ul>
      <p role="note" className="flex gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm font-medium leading-6 text-red-900">
        <PhoneCall className="mt-1 size-4 shrink-0" aria-hidden="true" />{EMERGENCY_NOTE}
      </p>
    </div>
  );
}
