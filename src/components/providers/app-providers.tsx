"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { createRepository, readRepositoryConfig } from "@/lib/api/create-repository";
import { RepositoryProvider } from "./gambutops-repository";
import { MonitoringProvider } from "./monitoring-context";
import { QueryCacheProvider } from "./query-cache";
import { ActorProvider } from "./actor-context";
import { Toaster } from "@/components/ui/sonner";
import { GuideProvider } from "@/components/guide/guide-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  // Satu instance stabil selama aplikasi berjalan.
  const [repository] = useState(() => createRepository(readRepositoryConfig(), {
    onStorageIssue: (issue) => {
      if (issue === "RECOVERED") toast.warning("Data demo lokal dipulihkan", { description: "Data tersimpan tidak valid, sehingga diganti dengan data awal SIMULASI." });
      else toast.warning("Data demo tidak dapat disimpan", { description: "Penyimpanan browser tidak tersedia. Perubahan hilang setelah halaman dimuat ulang." });
    },
  }));

  return (
    <RepositoryProvider repository={repository}>
      <QueryCacheProvider>
        <MonitoringProvider>
          <ActorProvider>
            <GuideProvider>
              {children}
              <Toaster />
            </GuideProvider>
          </ActorProvider>
        </MonitoringProvider>
      </QueryCacheProvider>
    </RepositoryProvider>
  );
}
