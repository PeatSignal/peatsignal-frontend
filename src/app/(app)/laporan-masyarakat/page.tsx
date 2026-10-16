import type { Metadata } from "next";
import { CommunityProvider } from "@/components/community/community-provider";
import { CoordinatorReportsView } from "@/components/community/coordinator-reports-view";

export const metadata: Metadata = { title: "Laporan masyarakat" };
export default function CommunityReportsPage() {
  return <CommunityProvider><CoordinatorReportsView /></CommunityProvider>;
}
