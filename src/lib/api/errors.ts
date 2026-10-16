export type RepositoryErrorCode =
  | "NETWORK"
  | "HTTP"
  | "INVALID_PAYLOAD"
  | "NOT_FOUND"
  | "VALIDATION"
  | "ILLEGAL_TRANSITION"
  | "FORBIDDEN"
  | "ABORTED";

const defaultMessages: Record<RepositoryErrorCode, string> = {
  NETWORK: "Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.",
  HTTP: "Server mengembalikan kesalahan.",
  INVALID_PAYLOAD: "Data dari server tidak sesuai format yang diharapkan.",
  NOT_FOUND: "Data tidak ditemukan.",
  VALIDATION: "Isian belum valid.",
  ILLEGAL_TRANSITION: "Perubahan status tidak diizinkan.",
  FORBIDDEN: "Anda tidak memiliki izin untuk tindakan ini.",
  ABORTED: "Permintaan dibatalkan.",
};

export class RepositoryError extends Error {
  readonly code: RepositoryErrorCode;
  readonly status: number | null;
  readonly details: unknown;

  constructor(code: RepositoryErrorCode, message?: string, options: { status?: number | null; details?: unknown; cause?: unknown } = {}) {
    super(message ?? defaultMessages[code], { cause: options.cause });
    this.name = "RepositoryError";
    this.code = code;
    this.status = options.status ?? null;
    this.details = options.details;
  }
}

export function isAbortError(error: unknown): boolean {
  return (error instanceof RepositoryError && error.code === "ABORTED") || (error instanceof DOMException && error.name === "AbortError");
}

export function throwIfAborted(signal: AbortSignal | undefined) {
  if (signal?.aborted) throw new RepositoryError("ABORTED");
}

/** Pesan yang aman ditampilkan ke pengguna. */
export function errorMessage(error: unknown): string {
  if (error instanceof RepositoryError) return error.message;
  return "Terjadi kendala yang tidak terduga. Silakan coba lagi.";
}
