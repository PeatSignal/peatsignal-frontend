import Link from "next/link";
import { ArrowRight, CloudRain, Droplets, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";

const FEATURES = [
  { icon: Droplets, title: "Input GWT 7 hari", text: "Masukkan pengukuran lapangan atau coba skenario demo." },
  { icon: CloudRain, title: "Hujan otomatis", text: "Open-Meteo untuk periode terkini, CHIRPS untuk historis." },
  { icon: ListChecks, title: "Rekomendasi dengan alasan", text: "Lihat apa yang perlu diperiksa berdasarkan GWT dan hujan." },
];

function ForecastPreview() {
  return <figure aria-label="Ilustrasi demo prediksi GWT satu hari" className="min-w-0 rounded-3xl border bg-card p-5 shadow-sm sm:p-7">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><p className="text-xs font-medium text-muted-foreground">Batanghari · BRG6</p><p className="mt-1 font-semibold">Dari pengukuran ke langkah berikutnya</p></div>
      <span className="rounded-full bg-secondary px-3 py-1 text-[10px] font-semibold tracking-wide text-primary">DEMO</span>
    </div>
    <svg viewBox="0 0 420 220" role="img" aria-label="Contoh demo GWT tujuh hari dan baseline satu hari berikutnya" aria-labelledby="forecast-preview-title" className="mt-6 w-full overflow-visible">
      <title id="forecast-preview-title">Contoh GWT turun dari minus 32 ke minus 52 cm. Baseline besok tetap minus 52 cm.</title>
      {[40, 95, 150].map((y) => <line key={y} x1="40" x2="390" y1={y} y2={y} stroke="var(--border)" strokeDasharray="3 5" />)}
      <g fill="var(--muted-foreground)" fontSize="11"><text x="0" y="44">−30</text><text x="0" y="99">−40</text><text x="0" y="154">−50</text><text x="40" y="203">7 hari pengukuran</text><text x="340" y="203">Besok</text></g>
      <path d="M40 51 90 67.5 140 89.5 190 106 240 122.5 290 139 340 161V178H40Z" fill="var(--secondary)" />
      <path d="M40 51 90 67.5 140 89.5 190 106 240 122.5 290 139 340 161" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {[ [40,51], [90,67.5], [140,89.5], [190,106], [240,122.5], [290,139], [340,161] ].map(([x,y]) => <circle key={x} cx={x} cy={y} r="4" fill="var(--primary)" stroke="var(--card)" strokeWidth="2" />)}
      <path d="M340 161H390" stroke="var(--color-info)" strokeWidth="3" strokeDasharray="5 5" />
      <circle cx="390" cy="161" r="5" fill="var(--card)" stroke="var(--color-info)" strokeWidth="2" />
      <text x="357" y="140" fontSize="12" fontWeight="600" fill="var(--color-info)">−52 cm</text>
    </svg>
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-2"><span className="h-0.5 w-4 bg-primary" />Input GWT</span><span className="inline-flex items-center gap-2"><span className="w-4 border-t-2 border-dashed border-info" />Baseline +1 hari</span></div>
    <div className="mt-5 flex items-start gap-3 rounded-xl bg-secondary/60 p-4"><ListChecks className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /><div><p className="text-sm font-semibold">Periksa kembali kondisi tata air</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Contoh alasan: muka air rendah dan terus menurun.</p></div></div>
    <figcaption className="mt-4 text-xs leading-5 text-muted-foreground">Ilustrasi sintetis. Model ML dibandingkan dengan baseline; hasil terkini masih eksperimental.</figcaption>
  </figure>;
}

export function ForecastFeature() {
  return <section id="forecasting" aria-labelledby="forecasting-title" className="scroll-mt-24 py-20 md:py-28">
    <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-4 md:px-8 lg:grid-cols-2 lg:gap-16">
      <Reveal>
        <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Groundwater Forecasting</p>
        <h2 id="forecasting-title" className="mt-3 font-display text-[clamp(30px,4.2vw,52px)] leading-[1.05] font-bold tracking-tight">Data hari ini.<br /><span className="text-primary italic">Persiapan untuk besok.</span></h2>
        <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">Gunakan pengukuran muka air tanah terbaru untuk menguji prediksi satu hari ke depan dan menentukan langkah pencegahan.</p>
        <ul className="mt-7 space-y-5">{FEATURES.map(({ icon: Icon, title, text }) => <li key={title} className="flex gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"><Icon className="size-5" aria-hidden="true" /></span><div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p></div></li>)}</ul>
        <Button asChild size="lg" className="mt-8 rounded-full px-6"><Link href="/login?next=%2Fexperiments%2Fml">Coba Groundwater Forecasting<ArrowRight aria-hidden="true" /></Link></Button>
        <p className="mt-4 max-w-lg text-xs leading-5 text-muted-foreground">Wilayah DEMO Batanghari · model BRG3/BRG6. GWT diisi manual; lokasi hujan memakai pendekatan wilayah.</p>
      </Reveal>
      <Reveal delay={0.1}><ForecastPreview /></Reveal>
    </div>
  </section>;
}
