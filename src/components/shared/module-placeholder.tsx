import { CircleDashed, ShieldCheck } from "lucide-react";
import { navigation } from "@/components/layout/navigation";
import { GuideButton } from "@/components/guide/guide-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MonitoringContextPanel } from "./monitoring-context-panel";


export function ModulePlaceholder({ href }: { href: string }) {
  const item = navigation.find((entry) => entry.href === href);
  if (!item) throw new Error(`Route modul tidak terdaftar: ${href}`);
  const Icon = item.icon;

  return (
    <div className="space-y-7">
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-teal">{item.eyebrow}</p>
        <h1 className="mt-2.5 text-2xl font-bold tracking-tight sm:text-3xl">{item.title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]">
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="gap-4 p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3"><span className="flex size-12 items-center justify-center rounded-xl border border-primary/10 bg-secondary"><Icon className="size-6 text-primary" aria-hidden="true" /></span><Badge variant="outline">Segera tersedia</Badge></div>
            <div>
              <CardTitle className="text-xl">Halaman ini sedang disiapkan</CardTitle>
              <CardDescription className="mt-2">Sementara itu, Anda sudah bisa mengganti jenis data, mengatur periode dan wilayah, serta membaca panduan.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5 sm:px-7 sm:pb-7">
            <h3 className="mb-3 text-sm font-medium">Nanti di halaman ini Anda bisa:</h3>
            <ul className="space-y-3">{item.capabilities.map((capability) => <li key={capability} className="flex items-start gap-2.5 text-sm leading-6"><CircleDashed className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><span>{capability}</span></li>)}</ul>
          </CardContent>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t bg-muted/40 px-5 py-3.5 sm:px-7">
            <span className="text-xs text-muted-foreground">Belum tahu harus mulai dari mana?</span>
            <GuideButton tab="steps" variant="ghost" size="sm">Buka panduan</GuideButton>
          </div>
        </Card>
        {/* Di layar kecil, panel pengaturan tampil lebih dulu agar langkah "atur periode" langsung terlihat. */}
        <div className="order-first xl:order-none"><MonitoringContextPanel /></div>
      </div>


      <div className="flex items-start gap-3 rounded-lg border border-primary/15 bg-secondary/40 p-4 text-sm leading-6">
        <ShieldCheck className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
        <p><span className="font-semibold text-primary">Bisa ditelusuri.</span> Setiap prioritas akan disertai alasan, sumber, dan waktu datanya. Data yang kurang bukan berarti aman.</p>
      </div>
    </div>
  );
}
