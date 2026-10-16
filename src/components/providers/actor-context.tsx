"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { clearSession, useSession } from "@/lib/auth/session";
import type { User } from "@/types";
import { useUsers } from "./data-hooks";

interface ActorContextValue {
  /** Pengguna yang sedang masuk; null bila belum masuk atau status sesi belum diketahui. */
  actor: User | null;
  users: readonly User[];
  usersStatus: "idle" | "loading" | "success" | "error";
  signOut: () => void;
}

const ActorContext = createContext<ActorContextValue | null>(null);

/**
 * Pengguna aktif berasal dari sesi login demo. Pada REST, perannya memilih Bearer token;
 * identitas final tetap ditentukan server dari token tersebut.
 */
export function ActorProvider({ children }: { children: ReactNode }) {
  const users = useUsers();
  const session = useSession();
  const list = useMemo(() => users.data ?? [], [users.data]);
  const actor = session?.user ?? null;
  const signOut = useCallback(() => clearSession(), []);

  const value = useMemo(() => ({ actor, users: list, usersStatus: users.status, signOut }), [actor, list, users.status, signOut]);
  return <ActorContext.Provider value={value}>{children}</ActorContext.Provider>;
}

export function useActor(): ActorContextValue {
  const value = useContext(ActorContext);
  if (!value) throw new Error("useActor membutuhkan ActorProvider.");
  return value;
}
