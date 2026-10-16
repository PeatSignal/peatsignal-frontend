import type { Metadata } from "next";
import { MlView } from "@/components/ml/ml-view";

export const metadata: Metadata = { title: "Uji prediksi" };
export default function MLPage() { return <MlView />; }
