"use client";

import type { ComponentProps } from "react";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGuide } from "./guide-provider";
import type { GuideTab } from "./guide-dialog";

export function GuideButton({ tab = "start", children = "Buka panduan", ...props }: Omit<ComponentProps<typeof Button>, "onClick"> & { tab?: GuideTab }) {
  const { openGuide } = useGuide();
  return <Button onClick={() => openGuide(tab)} {...props}><BookOpen aria-hidden="true" />{children}</Button>;
}
