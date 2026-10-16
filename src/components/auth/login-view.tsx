"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ClipboardCheck, Eye, Loader2, LogIn, ShieldCheck, Sprout, UserCog, Users } from "lucide-react";
import { roleGuides } from "@/components/guide/guide-content";
import { TopoBackdrop } from "@/components/landing/topo-backdrop";
import { Brand } from "@/components/layout/brand";
import { RepositoryProvider, useRepository } from "@/components/providers/gambutops-repository";
import { QueryCacheProvider } from "@/components/providers/query-cache";
import { useRepositoryQuery } from "@/components/providers/use-repository-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/components/ui/utils";
import { errorMessage } from "@/lib/api";
import { createRepository, readRepositoryConfig } from "@/lib/api/create-repository";
import { safeNextPath, saveSession, useSession } from "@/lib/auth/session";
import { roleLabels } from "@/lib/domain/labels";
import type { User } from "@/types";

const ROLE_DUTIES: Record<User["role"], readonly string[]> = {
  coordinator: roleGuides[0]?.duties ?? [],
  field_officer: roleGuides[1]?.duties ?? [],
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const repository = useRepository();
  const session = useSession();
  const users = useRepositoryQuery(["users"], (repo, signal) => repo.listUsers({ signal }));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ pending: boolean; error: unknown }>({ pending: false, error: null });
  const id = useId();
  const demo = repository.kind === "mock";

  // Sudah masuk: langsung ke tujuan.
  useEffect(() => {
    if (session) router.replace(next);
  }, [next, router, session]);

  const list = users.data ?? [];
  const selected = list.find((user) => user.id === selectedId) ?? list[0] ?? null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setStatus({ pending: true, error: null });
    try {
      const user = await repository.signIn(selected);
      saveSession(user);
      router.replace(next);
    } catch (error) {
      setStatus({ pending: false, error });
    }
  }

  return (
    <div className="w-full max-w-[440px]">
      <Link href="/" className="inline-flex min-h-10 items-center gap-1.5 rounded-md text-[11px] font-extrabold tracking-[0.12em] text-muted-foreground uppercase transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <ArrowLeft className="size-3.5" aria-hidden="true" />Kembali ke beranda
      </Link>

      <div className="mt-8 flex items-center justify-between gap-3">
        <Brand href="/" label="PeatSignal — beranda" />
        <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", demo ? "border-[#FEDF89] bg-[#FFFAEB] text-[#B54708]" : "border-border bg-muted text-muted-foreground")}>
          {demo ? "Akun demo" : "Server"}
        </span>
      </div>

      <h1 className="mt-8 font-display text-[clamp(30px,4vw,40px)] leading-[1.05] font-bold tracking-tight">Masuk ke PeatSignal</h1>
      <p className="mt-3 text-[15px] leading-7 text-muted-foreground">Pilih akun sesuai peran. Anda bisa keluar dan berganti akun kapan saja.</p>

      <form onSubmit={submit} className="mt-8 space-y-6" aria-describedby={`${id}-note`}>
        <fieldset className="space-y-3">
          <legend className="mb-3 text-[11px] font-bold tracking-[0.12em] text-muted-foreground uppercase">Akun</legend>
          {users.status === "error" ? (
            <Alert role="alert" className="border-red-200 bg-red-50">
              <AlertDescription className="mt-0 text-red-900">
                Daftar akun belum dapat dimuat: {errorMessage(users.error)}{" "}
                <button type="button" onClick={users.refetch} className="font-medium underline">Coba lagi</button>
              </AlertDescription>
            </Alert>
          ) : !users.data ? (
            <div role="status" className="space-y-3"><span className="sr-only">Memuat akun…</span><Skeleton className="h-[72px] rounded-xl" /><Skeleton className="h-[72px] rounded-xl" /></div>
          ) : (
            list.map((user) => {
              const Icon = user.role === "coordinator" ? UserCog : Users;
              const checked = selected?.id === user.id;
              return (
                <label key={user.id} className={cn(
                  "flex cursor-pointer items-center gap-4 rounded-xl border bg-card px-4 py-3.5 transition-colors duration-150 hover:border-primary/40 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2",
                  checked && "border-primary bg-primary-soft",
                )}>
                  <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors duration-150", checked ? "bg-primary text-white" : "bg-primary-soft text-primary")} aria-hidden="true">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{user.display_name}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{roleLabels[user.role]} · {ROLE_DUTIES[user.role].slice(0, 2).join(", ").toLowerCase()}</span>
                  </span>
                  <input type="radio" name="akun" value={user.id} checked={checked} onChange={() => setSelectedId(user.id)} className="size-4 shrink-0 accent-[var(--color-primary)]" />
                </label>
              );
            })
          )}
        </fieldset>

        {status.error !== null && (
          <Alert role="alert" className="border-red-200 bg-red-50"><AlertDescription className="mt-0 text-red-900">Gagal masuk: {errorMessage(status.error)}</AlertDescription></Alert>
        )}

        <Button type="submit" size="lg" className="h-12 w-full rounded-lg text-sm font-semibold" disabled={!selected || status.pending}>
          {status.pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <LogIn aria-hidden="true" />}
          {status.pending ? "Memeriksa akun…" : selected ? `Masuk sebagai ${selected.display_name}` : "Masuk"}
        </Button>
      </form>

      <p id={`${id}-note`} className="mt-6 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        {demo
          ? "Tanpa kata sandi. Data contoh berlabel DEMO dan tugas uji coba tersimpan di browser ini."
          : "Tanpa kata sandi. Identitas akun diverifikasi oleh server PeatSignal sebelum Anda masuk."}
      </p>
    </div>
  );
}

const PANEL_POINTS = [
  { icon: Sprout, text: "Muka air tanah per stasiun" },
  { icon: Eye, text: "Titik panas satelit NASA FIRMS" },
  { icon: ClipboardCheck, text: "Tugas cek lapangan dan laporan" },
] as const;

/** Panel kanan (desktop) / pita atas (HP): identitas produk di atas peta kontur yang sama dengan hero landing. */
function BrandPanel() {
  return (
    <aside aria-label="Tentang PeatSignal" className="relative isolate overflow-hidden bg-[#0B2E1E] text-white lg:sticky lg:top-0 lg:h-dvh">
      <TopoBackdrop id="login" river={false} className="absolute inset-0 -z-10 h-full w-full" />
      <div className="flex h-full flex-col justify-between gap-8 px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
        <p className="hidden text-[11px] font-bold tracking-[0.2em] text-white/60 uppercase lg:block">Panel operasional</p>
        <div className="max-w-md">
          <p className="font-display text-[clamp(30px,4.4vw,60px)] leading-[0.98] font-extrabold tracking-[-0.02em]">
            Prevent, detection, <span className="text-[#86EFAC] italic">action.</span>
          </p>
          <span aria-hidden="true" className="mt-6 hidden h-1 w-16 rounded-full bg-white lg:block" />
          <ul className="mt-8 hidden space-y-3 lg:block">
            {PANEL_POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-[15px] text-white/85">
                <span className="flex size-8 items-center justify-center rounded-lg border border-white/15 bg-white/10" aria-hidden="true"><Icon className="size-4" /></span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="hidden text-xs text-white/55 lg:block">© 2026 PeatSignal</p>
      </div>
    </aside>
  );
}

/** Halaman masuk berdiri sendiri: hanya repository, tanpa shell aplikasi atau panduan otomatis. */
export function LoginView() {
  const [repository] = useState(() => createRepository(readRepositoryConfig()));
  return (
    <RepositoryProvider repository={repository}>
      <QueryCacheProvider>
        <main className={cn("theme-v2", "grid min-h-dvh bg-background text-foreground lg:grid-cols-2")}>
          <div className="order-2 flex items-start justify-center px-4 py-10 sm:px-8 lg:order-1 lg:items-center lg:py-16">
            <LoginForm />
          </div>
          <div className="order-1 lg:order-2"><BrandPanel /></div>
        </main>
      </QueryCacheProvider>
    </RepositoryProvider>
  );
}
