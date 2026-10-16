import { Badge } from "@/components/ui/badge";

export function DemoBadge({ report = false }: { report?: boolean }) {
  return <Badge variant="warning">{report ? "SIMULASI" : "DEMO"}</Badge>;
}
