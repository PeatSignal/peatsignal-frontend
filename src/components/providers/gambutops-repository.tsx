"use client";

import type { GambutOpsRepository } from "@/lib/api";
import { createRepositoryContext } from "./repository-context";

export const { RepositoryProvider, useRepository } = createRepositoryContext<GambutOpsRepository>();

/** True bila data berasal dari mock (DEMO). Label DEMO hanya ditampilkan pada kondisi ini. */
export function useIsDemoData(): boolean {
  return useRepository().kind === "mock";
}
