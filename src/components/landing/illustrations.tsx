"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { Check, Satellite, Send } from "lucide-react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { cn } from "@/components/ui/utils";
import { TopoBackdrop } from "./topo-backdrop";

// Ilustrasi landing (style.md §6). Gerak berulang hanya lewat CSS (kelas lp-* di globals.css) dan
// berhenti di luar layar; animasi Motion di panel hanya sekali saat terlihat.
// Kelas `js-anim` dipakai fallback <noscript> agar ilustrasi tetap tampil tanpa JavaScript.
// Angka di hero, grafik air tanah, dan daftar prioritas ilustratif; peta titik panas memakai data repository.

const EASE = [0.22, 1, 0.36, 1] as const;

function useReveal<T extends Element>(amount = 0.35) {
  const ref = useRef<T>(null);
  const inView = useInView(ref, { once: true, amount });
  const reduce = useReducedMotion() ?? false;
  return { ref, show: inView || reduce, reduce };
}

/* ------------------------------------------------------------------ Hero */

const HERO_HOTSPOTS = [
  { left: "66%", top: "36%", pulse: true },
  { left: "74%", top: "48%", pulse: false },
  { left: "61%", top: "52%", pulse: false },
] as const;
const SPARK = [-0.21, -0.22, -0.24, -0.23, -0.27, -0.29, -0.3, -0.33, -0.32, -0.36, -0.38, -0.37, -0.4, -0.42];
const sparkY = (v: number) => 4 + ((v + 0.15) / -0.35) * 28;
const SPARK_PATH = SPARK.map((v, i) => `${i ? "L" : "M"}${((i / (SPARK.length - 1)) * 120).toFixed(1)} ${sparkY(v).toFixed(1)}`).join(" ");

/** Panel pemantauan bergaya peta topografi. Gerak: sapuan satelit pelan dan satu denyut titik panas. */
export function HeroIllustration() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { amount: 0 });

  return (
    <div ref={ref} data-paused={visible ? undefined : ""} role="img"
      aria-label="Ilustrasi pemantauan lahan gambut: peta kontur dengan sapuan satelit, tiga titik panas baru yang perlu dicek, dan muka air tanah stasiun BRG6 yang turun melewati batas −0,4 meter."
      className="js-anim relative aspect-[5/4] overflow-hidden rounded-[28px] bg-[#0B2E1E] text-[#10201A]">
      <TopoBackdrop id="hero" className="absolute inset-0 h-full w-full">
        <rect x="272" y="104" width="150" height="128" rx="10" fill="#22C55E" fillOpacity="0.05" stroke="#FFFFFF" strokeOpacity="0.35" strokeDasharray="4 6" />
      </TopoBackdrop>

      {/* Sapuan satelit (lintasan VIIRS) */}
      <div aria-hidden="true" className="lp-scan pointer-events-none absolute inset-y-0 left-0 w-1/3 border-r border-[#86EFAC]/50 bg-gradient-to-r from-transparent via-[#22C55E]/[0.06] to-[#22C55E]/[0.16]" />

      {HERO_HOTSPOTS.map((spot) => (
        <span key={spot.left} aria-hidden="true" className="absolute size-3 -translate-x-1/2 -translate-y-1/2" style={{ left: spot.left, top: spot.top }}>
          {spot.pulse && <span className="lp-pulse absolute inset-0 rounded-full bg-[#F79009]" />}
          <span className="absolute inset-0 rounded-full border-2 border-white bg-[#F79009]" />
        </span>
      ))}
      <span aria-hidden="true" className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5" style={{ left: "34%", top: "64%" }}>
        <span className="size-2.5 rotate-45 border-2 border-white bg-[#1D90FF]" />
        <span className="text-[10px] font-semibold tracking-wide text-white/80">BRG6</span>
      </span>

      <div className="absolute top-[5%] right-[5%] inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white/85 sm:text-[11px]">
        <Satellite className="size-3" aria-hidden="true" />VIIRS 375 m
      </div>

      <div className="lp-in absolute top-[5%] left-[5%] w-[40%] min-w-[130px] rounded-xl bg-white p-2.5 sm:rounded-2xl sm:p-3.5" style={{ animationDelay: "0.35s" }}>
        <p className="text-[9px] font-semibold tracking-[0.12em] text-muted-foreground uppercase sm:text-[10px]">Titik panas baru</p>
        <p className="mt-0.5 font-display text-lg leading-tight font-bold sm:text-2xl">3 lokasi</p>
        <p className="mt-1.5 inline-flex rounded-full border border-[#FEDF89] bg-[#FFFAEB] px-2 py-0.5 text-[9px] font-medium text-[#B54708] sm:text-[11px]">Perlu dicek</p>
      </div>

      <div className="lp-in absolute right-[5%] bottom-[5%] w-[46%] min-w-[150px] rounded-xl bg-white p-2.5 sm:rounded-2xl sm:p-3.5" style={{ animationDelay: "0.55s" }}>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[9px] font-semibold tracking-[0.12em] text-muted-foreground uppercase sm:text-[10px]">Air tanah BRG6</p>
          <p className="font-display text-sm font-bold whitespace-nowrap text-[#B54708] tabular-nums sm:text-lg">−0,42 m</p>
        </div>
        <svg viewBox="0 0 120 36" className="mt-1.5 block h-auto w-full overflow-visible" aria-hidden="true">
          <line x1="0" x2="120" y1={sparkY(-0.4)} y2={sparkY(-0.4)} stroke="#B54708" strokeOpacity="0.6" strokeDasharray="2 3" strokeWidth="0.75" />
          <path d={SPARK_PATH} pathLength={1} className="lp-draw" fill="none" stroke="#15803D" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

/* ------------------------------------------------------- Cegah: air tanah */

// Muka air tanah harian 30 hari (m terhadap permukaan), turun melewati −0,4 m.
const GWT = [-0.18, -0.19, -0.2, -0.19, -0.21, -0.23, -0.22, -0.24, -0.26, -0.25, -0.27, -0.29, -0.3, -0.29, -0.32, -0.34, -0.33, -0.36, -0.38, -0.37, -0.4, -0.42, -0.41, -0.44, -0.46, -0.45, -0.48, -0.5, -0.52, -0.54];
const CHART = { w: 400, h: 210, top: 14, bottom: 186, min: -0.7 };
const yOf = (v: number) => CHART.top + (v / CHART.min) * (CHART.bottom - CHART.top);
const xOf = (i: number) => 12 + (i / (GWT.length - 1)) * (CHART.w - 24);
const GWT_PATH = GWT.map((v, i) => `${i ? "L" : "M"}${xOf(i).toFixed(1)} ${yOf(v).toFixed(1)}`).join(" ");
const GWT_END = { x: xOf(GWT.length - 1), y: yOf(GWT.at(-1) ?? 0) };
const GWT_AREA = `${GWT_PATH} L${xOf(GWT.length - 1)} ${CHART.bottom} L${xOf(0)} ${CHART.bottom} Z`;

export function GroundwaterVisual() {
  const { ref, show, reduce } = useReveal<HTMLDivElement>();
  const t = (delay: number, duration = 0.7) => (reduce ? { duration: 0 } : { delay, duration, ease: EASE });

  return (
    <div ref={ref} className="js-anim rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">Stasiun BRG6</span>
        <span className="text-muted-foreground">30 hari</span>
      </div>
      <svg viewBox={`0 0 ${CHART.w} ${CHART.h}`} className="mt-4 block h-auto w-full" role="img" aria-label="Contoh grafik muka air tanah 30 hari yang terus turun hingga melewati batas −0,4 meter.">
        <defs>
          <linearGradient id="gwt-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#22C55E" stopOpacity="0.18" />
            <stop offset="1" stopColor="#22C55E" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" x2={CHART.w} y1={yOf(0)} y2={yOf(0)} stroke="#5B6B63" strokeOpacity="0.5" />
        <line x1="0" x2={CHART.w} y1={yOf(-0.4)} y2={yOf(-0.4)} stroke="#B54708" strokeDasharray="5 5" />
        <text x={CHART.w - 4} y={yOf(-0.4) - 6} textAnchor="end" fontSize="11" fill="#B54708">−0,4 m</text>
        <motion.path d={GWT_AREA} fill="url(#gwt-area)" initial={false} animate={{ opacity: show ? 1 : 0 }} transition={t(1.1)} />
        <motion.path d={GWT_PATH} fill="none" stroke="#15803D" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
          initial={false} animate={{ pathLength: show ? 1 : 0 }} transition={t(0.2, 1.6)} />
        <motion.g initial={false} animate={{ opacity: show ? 1 : 0, scale: show ? 1 : 0.6 }} transition={t(1.7, 0.4)}
          style={{ originX: `${GWT_END.x}px`, originY: `${GWT_END.y}px` }}>
          <circle cx={GWT_END.x} cy={GWT_END.y} r="5" fill="#15803D" stroke="#FFFFFF" strokeWidth="2" />
        </motion.g>
      </svg>
      <motion.p initial={false} animate={{ opacity: show ? 1 : 0, y: show ? 0 : 8 }} transition={t(1.9, 0.5)}
        className="mt-3 inline-flex rounded-full border border-[#FEDF89] bg-[#FFFAEB] px-3 py-1 text-xs font-medium text-[#B54708]">
        −0,54 m, di bawah batas
      </motion.p>
    </div>
  );
}

/* ---------------------------------------------------- Deteksi: titik panas */

function MapPlaceholder() {
  return <div className="absolute inset-0 bg-[#EEF2EE]" />;
}

// MapLibre (±600 KB) baru diunduh saat panel mendekati layar, tidak ikut beban awal halaman.
const LandingHotspotMap = dynamic(() => import("./landing-hotspot-map"), { ssr: false, loading: MapPlaceholder });

export function HotspotVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const near = useInView(ref, { once: true, margin: "400px 0px 400px 0px" });
  const visible = useInView(ref, { amount: 0 });
  return (
    <div ref={ref} data-paused={visible ? undefined : ""} className="js-anim relative aspect-[10/8] overflow-hidden rounded-2xl border bg-[#EEF2EE]">
      {near ? <LandingHotspotMap /> : <MapPlaceholder />}
    </div>
  );
}

/* --------------------------------------------------- Tindak: prioritas */

const PRIORITY_ROWS = [
  { name: "Blok A-12, Muaro Jambi", level: "Tinggi", tone: "border-[#FECDCA] bg-[#FEF3F2] text-[#B42318]" },
  { name: "Blok C-03, Kubu Raya", level: "Sedang", tone: "border-[#FEDF89] bg-[#FFFAEB] text-[#B54708]" },
  { name: "Blok B-07, Mempawah", level: "Rendah", tone: "border-border bg-muted text-muted-foreground" },
] as const;

export function PriorityVisual() {
  const { ref, show, reduce } = useReveal<HTMLDivElement>();
  const t = (delay: number) => (reduce ? { duration: 0 } : { delay, duration: 0.5, ease: EASE });

  return (
    <div ref={ref} className="js-anim rounded-2xl border bg-card p-5 sm:p-6">
      <ol className="space-y-3" aria-label="Contoh urutan prioritas pemeriksaan">
        {PRIORITY_ROWS.map((row, i) => (
          <motion.li key={row.name} initial={false} animate={{ opacity: show ? 1 : 0, y: show ? 0 : 16 }} transition={t(0.15 + i * 0.12)}
            className={cn("flex items-center gap-3 rounded-xl border bg-background px-4 py-3", i === 0 && "border-primary/40 bg-primary-soft")}>
            <span className="font-display text-lg font-bold text-muted-foreground tabular-nums">{i + 1}</span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{row.name}</span>
            <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", row.tone)}>{row.level}</span>
          </motion.li>
        ))}
      </ol>
      <div className="mt-4 flex justify-end">
        <span className="relative inline-flex h-9 items-center overflow-hidden rounded-full bg-primary px-4 text-xs font-semibold text-white">
          <motion.span className="js-pre inline-flex items-center gap-1.5" initial={false} animate={{ opacity: show ? 0 : 1, y: show ? -14 : 0 }} transition={t(1.4)}>
            <Send className="size-3.5" aria-hidden="true" />Jadikan tugas
          </motion.span>
          <motion.span className="absolute inset-0 inline-flex items-center justify-center gap-1.5" initial={false} animate={{ opacity: show ? 1 : 0, y: show ? 0 : 14 }} transition={t(1.4)}>
            <Check className="size-3.5" aria-hidden="true" />Tugas dikirim
          </motion.span>
        </span>
      </div>
    </div>
  );
}
