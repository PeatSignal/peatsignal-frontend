"use client";

import type { ReactNode } from "react";
import AnimatedContent from "@/components/bits/AnimatedContent";
import CountUp from "@/components/bits/CountUp";
import ScrollReveal from "@/components/bits/ScrollReveal";
import SplitText from "@/components/bits/SplitText";

// Pembungkus React Bits dengan nilai sesuai style.md §6 (ease halus, jarak ≤24px, sekali saja).
// Kelas `js-reveal` dipakai fallback <noscript> agar isi tetap tampil tanpa JavaScript.

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <AnimatedContent distance={24} duration={0.7} ease="power3.out" delay={delay} threshold={0.15} once className={["js-reveal", className].filter(Boolean).join(" ")}>
      {children}
    </AnimatedContent>
  );
}

/** Satu baris judul hero yang muncul kata demi kata. */
export function HeroLine({ text, className }: { text: string; className?: string }) {
  return (
    <span className="block">
      <SplitText
        text={text} tag="span" splitType="words" delay={70} duration={0.9} trigger="load" textAlign="left"
        from={{ opacity: 0, y: 28 }} to={{ opacity: 1, y: 0 }} ease="power3.out" rootMargin="0px"
        className={["js-reveal", className].filter(Boolean).join(" ")}
      />
    </span>
  );
}

export function StatNumber({ value, suffix }: { value: number; suffix?: string }) {
  return <CountUp to={value} from={0} duration={1.2} suffix={suffix} separator="." trigger="view" />;
}

/** Kalimat besar yang menjadi jelas mengikuti scroll (pola recruitment). */
export function ScrollStatement({ children }: { children: string }) {
  return (
    <ScrollReveal
      baseOpacity={0.15} enableBlur={false} baseRotation={0}
      containerClassName="my-0"
      textClassName="font-display text-[clamp(1.75rem,4.2vw,3.25rem)] leading-[1.15] font-bold tracking-tight text-foreground"
    >
      {children}
    </ScrollReveal>
  );
}
