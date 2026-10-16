import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: { absolute: "PeatSignal — Prevent, Detection, Action" },
  description: "Pantau muka air tanah gambut, lihat titik panas satelit, tentukan prioritas pemeriksaan, dan catat hasil lapangan dalam satu alur yang dapat ditelusuri.",
  openGraph: {
    title: "PeatSignal — Prevent, Detection, Action",
    description: "Prototipe JOINTS Hackathon 2026: pemantauan gambut, titik panas satelit, dan tugas lapangan yang dapat ditelusuri.",
    images: [{ url: "/landing/hero-kalimantan.jpg", width: 1280, height: 960, alt: "Foto udara hutan rawa tropis di Kalimantan Barat" }],
    locale: "id_ID",
    type: "website",
  },
};

export default function Home() {
  return <LandingPage />;
}
