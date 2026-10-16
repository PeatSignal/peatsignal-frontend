import { Bricolage_Grotesque, Poppins } from "next/font/google";

// style.md v2: display untuk judul besar, Poppins untuk teks. Diunduh saat build dan disajikan sendiri.
export const bricolage = Bricolage_Grotesque({ subsets: ["latin"], weight: ["400", "700", "800"], variable: "--font-bricolage", display: "swap" });
export const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-poppins-face", display: "swap" });
