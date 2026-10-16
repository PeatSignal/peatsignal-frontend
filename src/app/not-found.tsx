import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import { EmptyState } from "@/components/shared/async-states";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-5 px-4 py-10">
      <EmptyState title="Halaman tidak ditemukan" description="Alamat ini belum tersedia di PeatSignal. Kembali ke Ringkasan untuk memilih menu." />
      <div className="flex flex-wrap gap-2">
        <Button asChild><Link href="/dashboard"><ArrowLeft aria-hidden="true" />Kembali ke Ringkasan</Link></Button>
        <Button asChild variant="outline"><Link href="/"><Home aria-hidden="true" />Beranda PeatSignal</Link></Button>
      </div>
    </main>
  );
}
