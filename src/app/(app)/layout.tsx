import type { ReactNode } from "react";
import { AuthGate } from "@/components/auth/auth-gate";
import { AppProviders } from "@/components/providers/app-providers";
import { AppShell } from "@/components/layout/app-shell";

/** Layout aplikasi: wajib masuk, lalu data provider, mode, panduan, sidebar dan header. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AuthGate><AppProviders><AppShell>{children}</AppShell></AppProviders></AuthGate>;
}
