"use client";

import { LogOut } from "lucide-react";
import { useActor } from "@/components/providers/actor-context";
import { Button } from "@/components/ui/button";
import { roleLabels } from "@/lib/domain/labels";

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

/** Akun yang sedang masuk. Untuk berganti peran, keluar lalu masuk dengan akun lain. */
export function AccountMenu() {
  const { actor, signOut } = useActor();
  if (!actor) return null;
  return (
    <div className="flex min-w-0 items-center gap-2.5 md:border-l md:pl-4">
      <span className="hidden size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary md:flex" aria-hidden="true">{initials(actor.display_name)}</span>
      <div className="hidden min-w-0 md:block">
        <p className="truncate text-xs font-semibold" data-testid="current-user">{actor.display_name}</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{roleLabels[actor.role]} · akun demo</p>
      </div>
      <Button variant="outline" size="sm" onClick={signOut} aria-label={`Keluar (${actor.display_name})`} className="px-2.5 sm:px-3">
        <LogOut aria-hidden="true" /><span className="hidden sm:inline">Keluar</span>
      </Button>
    </div>
  );
}
