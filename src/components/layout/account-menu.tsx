"use client";

import { ChevronDown, LogOut } from "lucide-react";
import { useActor } from "@/components/providers/actor-context";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { roleLabels } from "@/lib/domain/labels";

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

/** Akun yang sedang masuk. Untuk berganti peran, keluar lalu masuk dengan akun lain. */
export function AccountMenu() {
  const { actor, signOut } = useActor();
  if (!actor) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" aria-label={`Buka profil (${actor.display_name})`} className="gap-2 rounded-full px-1.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-primary" aria-hidden="true">{initials(actor.display_name)}</span>
          <span className="hidden max-w-36 truncate text-xs font-medium xl:block">{actor.display_name}</span>
          <ChevronDown className="text-muted-foreground" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" aria-label="Profil akun" className="w-60 p-2">
        <div className="border-b px-2 py-3">
          <p className="break-words text-sm font-medium" data-testid="current-user">{actor.display_name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{roleLabels[actor.role]}</p>
        </div>
        <Button variant="ghost" onClick={signOut} aria-label={`Keluar (${actor.display_name})`} className="mt-1 w-full justify-start">
          <LogOut aria-hidden="true" />Keluar
        </Button>
      </PopoverContent>
    </Popover>
  );
}
