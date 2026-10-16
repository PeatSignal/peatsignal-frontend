import Link from "next/link";
import { ArrowRight, ChevronDown, ClipboardCheck, Eye, FileSearch, ListOrdered, MapPinned, PhoneCall, ShieldCheck, Sprout, Users } from "lucide-react";
import { EMERGENCY_NOTE } from "@/components/guide/guide-content";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import { ForecastFeature } from "./forecast-feature";
import { LandingNavbar } from "./landing-navbar";
import { GroundwaterVisual, HeroIllustration, HotspotVisual, PriorityVisual } from "./illustrations";
import { HeroLine, Reveal, ScrollStatement } from "./reveal";

// Landing v2 (style.md): ringkas, satu ide per section. Hero dan panel cara kerja = ilustrasi SVG beranimasi
// ringan (illustrations.tsx), bukan screenshot, agar tetap tajam dan tidak perlu diperbarui saat UI berubah.

function SectionHeading({ id, eyebrow, title, center = false }: { id: string; eyebrow: string; title: React.ReactNode; center?: boolean }) {
  return (
    <Reveal className={cn("max-w-2xl", center && "mx-auto text-center")}>
      <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">{eyebrow}</p>
      <h2 id={id} className="mt-3 font-display text-[clamp(30px,4.2vw,52px)] leading-[1.05] font-bold tracking-tight">{title}</h2>
    </Reveal>
  );
}

function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-glow-hero pt-28 pb-20 sm:pt-36 md:pb-28">
      <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-4 md:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div>
          <h1 id="hero-title" className="font-display text-[clamp(40px,5vw,68px)] leading-[0.98] font-extrabold tracking-[-0.03em]">
            <HeroLine text="Cegah kebakaran gambut" />
            <HeroLine text="sebelum meluas." className="text-primary italic" />
          </h1>
          <Reveal delay={0.15}>
            <p className="mt-6 max-w-lg text-lg leading-8 text-muted-foreground">Air tanah, titik panas satelit, dan tugas lapangan dalam satu aplikasi.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full px-6"><Link href="/login">Masuk ke aplikasi<ArrowRight aria-hidden="true" /></Link></Button>
              <Button asChild size="lg" variant="outline" className="rounded-full bg-white px-6"><a href="#cara-kerja">Cara kerja</a></Button>
            </div>
          </Reveal>
        </div>
        <Reveal delay={0.2}>
          <figure className="overflow-hidden rounded-[28px] border bg-card">
            <HeroIllustration />
          </figure>
        </Reveal>
      </div>

    </section>
  );
}

function Problem() {
  return (
    <section id="masalah" aria-labelledby="masalah-title" className="scroll-mt-24 bg-card py-20 md:py-28">
      <div className="mx-auto max-w-[1200px] px-4 md:px-8">
        <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Masalah</p>
        <span id="masalah-title" className="sr-only">Masalah yang diselesaikan PeatSignal</span>
        <div className="mt-4 max-w-4xl">
          <ScrollStatement>Gambut bisa terbakar dari bawah tanah. Satelit melihat panasnya, belum tentu apinya. Tim butuh tahu lokasi mana yang dicek lebih dulu.</ScrollStatement>
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    key: "cegah", icon: Sprout, label: "Cegah", title: "Pantau air tanah", href: "/groundwater", visual: GroundwaterVisual, tone: "bg-[#ECFDF3]",
    text: "Garis turun berarti gambut makin kering.",
  },
  {
    key: "deteksi", icon: Eye, label: "Deteksi", title: "Lihat titik panas", href: "/hotspots", visual: HotspotVisual, tone: "bg-[#FFFAEB]",
    text: "Data satelit NASA FIRMS di peta, lengkap dengan waktu dan statusnya.",
  },
  {
    key: "tindak", icon: Users, label: "Tindak", title: "Kirim petugas", href: "/priorities", visual: PriorityVisual, tone: "bg-[#EFF6FF]",
    text: "Lokasi diurutkan beserta alasannya, lalu jadi tugas lapangan.",
  },
] as const;

function HowItWorks() {
  return (
    <section id="cara-kerja" aria-labelledby="cara-kerja-title" className="scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto max-w-[1200px] px-4 md:px-8">
        <SectionHeading id="cara-kerja-title" eyebrow="Cara kerja" center title={<>Prevent, detection, <span className="text-primary italic">action</span></>} />
        <ol className="mt-14 space-y-6 lg:space-y-10">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const Visual = step.visual;
            return (
              <li key={step.key} className="lg:sticky" style={{ top: `${96 + index * 20}px` }}>
                <article aria-labelledby={`langkah-${step.key}`} className={cn("grid items-center gap-8 overflow-hidden rounded-[28px] border p-6 sm:p-10 lg:min-h-[460px] lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12", step.tone)}>
                  <div>
                    <p className="flex items-center gap-3 text-sm font-semibold text-primary">
                      <span className="flex size-10 items-center justify-center rounded-full bg-primary text-white" aria-hidden="true"><Icon className="size-5" /></span>
                      {step.label}
                    </p>
                    <h3 id={`langkah-${step.key}`} className="mt-5 font-display text-[clamp(30px,3.6vw,48px)] leading-[1.05] font-bold tracking-tight">{step.title}</h3>
                    <p className="mt-3 text-lg leading-8 text-muted-foreground">{step.text}</p>
                    <Link href={step.href} className="mt-6 inline-flex min-h-10 items-center gap-1.5 rounded-full text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      Buka<ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </div>
                  <Visual />
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

const FLOW = [
  { icon: ListOrdered, title: "Prioritas", text: "Lokasi diurutkan beserta alasannya." },
  { icon: ClipboardCheck, title: "Tugas", text: "Koordinator memilih petugas." },
  { icon: MapPinned, title: "Cek lapangan", text: "Petugas memeriksa lokasi." },
  { icon: FileSearch, title: "Laporan", text: "Hasil temuan dikirim." },
  { icon: ShieldCheck, title: "Tinjauan", text: "Diverifikasi atau dicek ulang." },
] as const;

function Flow() {
  return (
    <section id="alur" aria-labelledby="alur-title" className="scroll-mt-24 bg-card py-20 md:py-28">
      <div className="mx-auto max-w-[1200px] px-4 md:px-8">
        <SectionHeading id="alur-title" eyebrow="Alur" center title={<>Setiap langkah <span className="text-primary italic">tercatat</span></>} />
        <ol className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {FLOW.map(({ icon: Icon, title, text }, index) => (
            <li key={title}>
              <Reveal delay={index * 0.06} className="flex h-full flex-col items-center gap-3 rounded-2xl border bg-background px-4 py-6 text-center">
                <span className="flex size-11 items-center justify-center rounded-full bg-primary text-white" aria-hidden="true"><Icon className="size-5" /></span>
                <div>
                  <p className="text-sm font-semibold"><span className="sr-only">Langkah {index + 1}: </span>{title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const PRINCIPLES = [
  { title: "Titik panas belum tentu api", text: "Selalu dicek di lapangan." },
  { title: "Prioritas bukan ramalan", text: "Urutan pemeriksaan, bukan peluang kebakaran." },
  { title: "Historis melatih, input baru menguji", text: "Model dilatih dari 2018–2019. Prediksi dengan input terkini masih eksperimental." },
] as const;

function DataPrinciples() {
  return (
    <section id="data" aria-labelledby="data-title" className="scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto max-w-[1200px] px-4 md:px-8">
        <SectionHeading id="data-title" eyebrow="Data" title="Prinsip penggunaan data" />
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {PRINCIPLES.map((item, index) => (
            <li key={item.title}>
              <Reveal delay={index * 0.08} className="h-full rounded-2xl border bg-card p-6">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{item.text}</p>
              </Reveal>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted-foreground">Sumber: NASA FIRMS (VIIRS), data stasiun BRG, Open-Meteo, dan CHIRPS.</p>
      </div>
    </section>
  );
}

const FAQ = [
  { q: "Apakah titik panas berarti kebakaran?", a: "Tidak selalu. Titik panas perlu dicek petugas di lapangan." },
  { q: "Apakah GWT terkini diambil otomatis?", a: "GWT diisi dari pengukuran lapangan tujuh hari berurutan, atau skenario demo berlabel. Hujan dapat diambil otomatis. Model dibandingkan dengan baseline dan belum divalidasi untuk kondisi terkini." },
  { q: "Perlu kata sandi untuk masuk?", a: "Tidak. Cukup pilih akun Koordinator atau Petugas." },
  { q: "Bisa dipakai di HP?", a: "Bisa, termasuk peta layar penuh." },
  { q: "Melihat kebakaran sungguhan?", a: "Jangan menunggu aplikasi. Hubungi 112 atau BPBD setempat." },
] as const;

function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-24 bg-card py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4 md:px-8">
        <SectionHeading id="faq-title" eyebrow="FAQ" center title="Pertanyaan singkat" />
        <div className="mt-10 divide-y border-y">
          {FAQ.map((item) => (
            <details key={item.q} className="group py-1">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-md py-4 text-left text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="pb-5 text-sm leading-7 text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section aria-labelledby="cta-title" className="px-4 py-20 md:px-8 md:py-28">
      <div className="bg-band relative mx-auto max-w-[1200px] overflow-hidden rounded-[28px] px-6 py-16 text-center text-white sm:px-12 md:py-20">
        <div aria-hidden="true" className="bg-grid-overlay absolute inset-0 [mask-image:radial-gradient(80%_80%_at_50%_0%,black,transparent)]" />
        <div className="relative">
          <h2 id="cta-title" className="mx-auto max-w-2xl font-display text-[clamp(32px,5vw,60px)] leading-[1.02] font-extrabold tracking-tight">Coba alurnya sekarang.</h2>
          <div className="mt-8 flex justify-center">
            <Button asChild size="lg" className="rounded-full bg-white px-6 text-primary hover:bg-white/90"><Link href="/login">Masuk ke aplikasi<ArrowRight aria-hidden="true" /></Link></Button>
          </div>
        </div>
      </div>
      <p role="note" className="mx-auto mt-8 flex max-w-2xl items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium leading-6 text-red-900">
        <PhoneCall className="mt-1 size-4 shrink-0" aria-hidden="true" />{EMERGENCY_NOTE}
      </p>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-4 py-8 md:px-8">
        <Brand href="/" label="PeatSignal — beranda" />
        <p className="text-xs text-muted-foreground">© 2026 PeatSignal</p>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className={cn("theme-v2", "min-h-dvh bg-background text-foreground")}>
      {/* Tanpa JavaScript, elemen beranimasi tetap tampil. */}
      <noscript><style>{".js-reveal,.split-parent,.js-anim *{visibility:visible!important;opacity:1!important;transform:none!important}.js-anim [pathLength]{stroke-dasharray:none!important;stroke-dashoffset:0!important}.js-anim .js-pre{display:none}"}</style></noscript>
      <a href="#konten" className="fixed top-3 left-3 z-[100] -translate-y-24 rounded-md bg-primary px-4 py-3 text-sm text-white focus:translate-y-0">Lewati ke konten utama</a>
      <LandingNavbar />
      <main id="konten" tabIndex={-1} className="outline-none">
        <Hero />
        <Problem />
        <HowItWorks />
        <ForecastFeature />
        <Flow />
        <DataPrinciples />
        <Faq />
        <ClosingCta />
      </main>
      <Footer />
    </div>
  );
}
