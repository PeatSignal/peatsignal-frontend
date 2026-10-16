"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { clearSession, useSession } from "@/lib/auth/session";
import { COMMUNITY_ACCOUNT } from "@/lib/auth/community-account";
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
  const session = useSession();
  const community = session?.user.role === "community";
  const users = useUsers(!!session && !community);
  const list = useMemo(() => community ? [COMMUNITY_ACCOUNT] : users.data ?? [], [community, users.data]);
  const actor = session?.user ?? null;
  const signOut = useCallback(() => clearSession(), []);

  const usersStatus = community ? "success" as const : users.status;
  const value = useMemo(() => ({ actor, users: list, usersStatus, signOut }), [actor, list, usersStatus, signOut]);
  return <ActorContext.Provider value={value}>{children}</ActorContext.Provider>;
}

export function useActor(): ActorContextValue {
  const value = useContext(ActorContext);
  if (!value) throw new Error("useActor membutuhkan ActorProvider.");
  return value;
}
