import Link from "next/link";
import { BrandMark } from "./brand-mark";
import { cn } from "@/components/ui/utils";

export function Brand({ compact = false, onNavigate, href = "/dashboard", label = "PeatSignal — ke Ringkasan" }: { compact?: boolean; onNavigate?: () => void; href?: string; label?: string }) {
  return (
    <Link href={href} onClick={onNavigate} aria-label={label} className={cn("flex w-fit items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", compact && "mx-auto")}>
      <span className="flex size-10 shrink-0 items-center justify-center text-primary">
        <BrandMark className="size-12 max-w-none" />
      </span>
      {!compact && <span><span className="block text-[21px] font-bold tracking-tight">Peat<span className="text-primary">Signal</span></span><span className="block whitespace-nowrap text-[8px] font-semibold tracking-[0.06em] text-muted-foreground">PREVENT · DETECTION · ACTION</span></span>}
    </Link>
  );
}
