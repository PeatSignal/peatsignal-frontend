import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { bricolage, poppins } from "@/lib/fonts";

export const metadata: Metadata = {
  title: { default: "PeatSignal — Prevent, Detection, Action", template: "%s | PeatSignal" },
  description: "Prototipe pemantauan lahan gambut: muka air tanah, titik panas satelit, prioritas pemeriksaan, dan tugas lapangan yang dapat ditelusuri.",
  robots: { index: false, follow: false },
};

/** Layout akar hanya memuat dokumen; landing dan aplikasi punya layout sendiri. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="id"><body className={`${bricolage.variable} ${poppins.variable}`}>{children}</body></html>;
}
