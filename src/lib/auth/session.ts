"use client";

import { useSyncExternalStore } from "react";
import { z } from "zod";
import { userSchema } from "@/lib/schemas";
import type { User } from "@/types";

// Sesi demo di browser. Bukan keamanan: server tetap memeriksa token setiap perubahan data.

export const SESSION_KEY = "gambutops:session:v1";
const CHANGE_EVENT = "gambutops:session-change";

const sessionSchema = z.object({ user: userSchema, signed_in_at: z.iso.datetime({ offset: true }) });
export type Session = z.infer<typeof sessionSchema>;

let cachedRaw: string | null | undefined;
let cachedSession: Session | null = null;

/** Membaca sesi; nilai rusak dianggap belum masuk. Hasil di-cache agar referensi stabil. */
export function readSession(): Session | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(SESSION_KEY);
  } catch {
    raw = null;
  }
  if (raw === cachedRaw) return cachedSession;
  cachedRaw = raw;
  cachedSession = null;
  if (raw) {
    try {
      const parsed = sessionSchema.safeParse(JSON.parse(raw));
      cachedSession = parsed.success ? parsed.data : null;
    } catch {
      cachedSession = null;
    }
  }
  return cachedSession;
}

function notify() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function saveSession(user: User): Session {
  const session: Session = { user, signed_in_at: new Date().toISOString() };
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Penyimpanan diblokir: sesi tidak bisa dipertahankan setelah reload.
  }
  notify();
  return session;
}

export function clearSession() {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    // Abaikan.
  }
  notify();
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** `undefined` selama render server/hydrate (status belum diketahui), lalu sesi atau null. */
export function useSession(): Session | null | undefined {
  return useSyncExternalStore<Session | null | undefined>(subscribe, readSession, () => undefined);
}

/** Hanya izinkan tujuan internal aplikasi agar `?next=` tidak bisa dipakai untuk mengalihkan ke situs lain. */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\") || next.startsWith("/login")) return "/dashboard";
  return next;
}
