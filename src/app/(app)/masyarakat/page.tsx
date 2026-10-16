import type { Metadata } from "next";
import { CommunityProvider } from "@/components/community/community-provider";
import { CommunityView } from "@/components/community/community-view";

export const metadata: Metadata = { title: "Ruang masyarakat" };
export default function CommunityPage() {
  return <CommunityProvider><CommunityView /></CommunityProvider>;
}
