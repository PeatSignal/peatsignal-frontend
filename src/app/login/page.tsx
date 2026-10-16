import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginView } from "@/components/auth/login-view";

export const metadata: Metadata = { title: "Masuk" };

export default function LoginPage() {
  // Tujuan setelah masuk dibaca dari ?next=, sehingga butuh Suspense saat prerender.
  return <Suspense fallback={null}><LoginView /></Suspense>;
}
