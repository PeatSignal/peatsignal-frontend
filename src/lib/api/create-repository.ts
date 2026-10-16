import { createMockRepository } from "@/lib/mock/mock-repository";
import type { StorageIssue } from "@/lib/mock/storage";
import type { GambutOpsRepository } from "./repository";
import { createRestRepository } from "./rest-repository";

export interface RepositoryConfig {
  dataSource: "mock" | "rest";
  apiBaseUrl: string | null;
  /** Token peran DEMO (bukan rahasia; ikut terkirim ke browser). */
  authTokens: { coordinator: string | null; field_officer: string | null };
}

/** Hanya variabel NEXT_PUBLIC_* non-rahasia. Secret backend tidak pernah dibaca di sini. */
export function readRepositoryConfig(): RepositoryConfig {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || null;
  const requested = process.env.NEXT_PUBLIC_DATA_SOURCE?.trim();
  return {
    dataSource: requested === "rest" && apiBaseUrl ? "rest" : "mock",
    apiBaseUrl,
    authTokens: {
      coordinator: process.env.NEXT_PUBLIC_DEMO_COORDINATOR_TOKEN?.trim() || null,
      field_officer: process.env.NEXT_PUBLIC_DEMO_FIELD_OFFICER_TOKEN?.trim() || null,
    },
  };
}

export function createRepository(config: RepositoryConfig, hooks: { onStorageIssue?: (issue: StorageIssue) => void } = {}): GambutOpsRepository {
  if (config.dataSource === "rest" && config.apiBaseUrl) return createRestRepository({ baseUrl: config.apiBaseUrl, authTokens: config.authTokens });
  return createMockRepository({ onStorageIssue: hooks.onStorageIssue });
}
