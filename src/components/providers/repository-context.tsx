"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Instantiate once at module scope with GambutOpsRepository after feat/f0-data
 * is merged. No fixture, API call, or duplicate repository contract lives here.
 */
export function createRepositoryContext<TRepository>() {
  const RepositoryContext = createContext<TRepository | null>(null);

  function RepositoryProvider({ repository, children }: { repository: TRepository; children: ReactNode }) {
    return <RepositoryContext.Provider value={repository}>{children}</RepositoryContext.Provider>;
  }

  function useRepository(): TRepository {
    const repository = useContext(RepositoryContext);
    if (repository === null) throw new Error("Repository belum dihubungkan ke aplikasi.");
    return repository;
  }

  return { RepositoryProvider, useRepository };
}
