import { ClipboardCheck, History, ListOrdered, MapPinned, Satellite, SlidersHorizontal, Waves, type LucideIcon } from "lucide-react";

// Teks panduan untuk pengguna awam. Kalimat pendek, tanpa istilah teknis yang tidak dijelaskan.

export interface GuideStep {
  title: string;
  body: string;
  icon: LucideIcon;
  /** Halaman tujuan langkah ini; null bila langkah dilakukan di header/panel. */
  href: string | null;
}

export const guideSteps: readonly GuideStep[] = [
  {
    title: "Pilih jenis data",
    body: "Pilih Riwayat untuk data historis, atau Terkini untuk hotspot terbaru. Sumber data contoh ditandai DEMO.",
    icon: History,
    href: null,
  },
  {
    title: "Atur periode dan wilayah",
    body: "Buka Periode pada Filter data, pilih tanggal mulai dan akhir, lalu Terapkan. Pilih wilayah yang ingin dilihat. Filter berlaku lintas halaman pemantauan.",
    icon: SlidersHorizontal,
    href: "/dashboard",
  },
  {
    title: "Cek muka air tanah",
    body: "Pilih stasiun, lalu lihat grafik kedalaman air di bawah gambut. Garis yang turun berarti gambut makin kering. Bagian berarsir berarti tidak ada pengukuran, bukan nol.",
    icon: Waves,
    href: "/groundwater",
  },
  {
    title: "Lihat titik panas",
    body: "Periksa titik panas dari satelit di peta. Ketuk titik untuk melihat waktu, satelit, dan status pengecekannya.",
    icon: Satellite,
    href: "/hotspots",
  },
  {
    title: "Tentukan lokasi yang diperiksa",
    body: "Buka Prioritas pemeriksaan untuk melihat lokasi yang sebaiknya dicek lebih dulu beserta alasannya.",
    icon: ListOrdered,
    href: "/priorities",
  },
  {
    title: "Kirim tugas dan laporan",
    body: "Koordinator membuat tugas dan memilih petugas. Petugas memulai tugas, lalu mengirim laporan hasil pengecekan.",
    icon: ClipboardCheck,
    href: "/tasks",
  },
  {
    title: "Tinjau hasil",
    body: "Koordinator membaca laporan, lalu memilih: terverifikasi, ditutup, atau perlu tindak lanjut.",
    icon: MapPinned,
    href: "/tasks",
  },
];

export interface GlossaryItem {
  term: string;
  meaning: string;
}

export const glossary: readonly GlossaryItem[] = [
  { term: "Gambut", meaning: "Tanah dari sisa tumbuhan yang menumpuk dan basah. Saat kering, gambut mudah terbakar dan apinya bisa menjalar di bawah permukaan." },
  { term: "Muka air tanah (GWT)", meaning: "Kedalaman air di bawah permukaan tanah, dalam meter. Angka negatif berarti di bawah permukaan; makin negatif, makin kering." },
  { term: "Batas acuan −0,4 m", meaning: "Menurut PP 57/2016, gambut budidaya dinyatakan rusak bila muka air lebih dalam dari 0,4 m di titik pengukuran. Di grafik dipakai sebagai pembanding, bukan tanda pasti akan terbakar." },
  { term: "Titik panas (hotspot)", meaning: "Lokasi yang suhunya lebih panas dari sekitarnya menurut satelit. Belum tentu kebakaran, jadi perlu dicek di lapangan." },
  { term: "Tingkat keyakinan satelit", meaning: "Penilaian satelit terhadap kualitas deteksi (rendah, nominal, tinggi). Ini bukan peluang terjadinya kebakaran." },
  { term: "FRP", meaning: "Fire Radiative Power, perkiraan besarnya panas yang dipancarkan, dalam megawatt (MW)." },
  { term: "Prioritas pemeriksaan", meaning: "Urutan lokasi yang sebaiknya dicek lebih dulu, berdasarkan aturan sederhana. Ini bukan ramalan kebakaran." },
  { term: "Data kurang", meaning: "Data belum cukup untuk menilai lokasi. Artinya belum bisa dinilai, bukan berarti aman." },
  { term: "Mode riwayat", meaning: "Memutar ulang data 2018–2019. Aplikasi hanya memakai data sampai tanggal yang Anda pilih, tidak mengintip data sesudahnya." },
  { term: "Mode terkini", meaning: "Hotspot terbaru dari server, atau data contoh bila berlabel DEMO. Data muka air tanah terbaru belum tersedia." },
  { term: "DEMO / SIMULASI", meaning: "Data contoh untuk uji coba. Bukan hasil pengamatan atau laporan lapangan sungguhan." },
];

export interface RoleGuide {
  role: string;
  duties: readonly string[];
}

export const roleGuides: readonly RoleGuide[] = [
  { role: "Koordinator", duties: ["Melihat ringkasan dan prioritas", "Membuat tugas dan memilih petugas", "Meninjau laporan dan menentukan hasil akhir"] },
  { role: "Petugas lapangan", duties: ["Melihat tugas yang diberikan", "Menandai tugas sedang dikerjakan", "Mengirim laporan hasil pengecekan"] },
];

export const importantNotes: readonly string[] = [
  "Versi ini adalah uji coba. Data contoh selalu diberi label DEMO atau SIMULASI.",
  "Titik panas belum tentu kebakaran. Pastikan dengan pengecekan di lapangan.",
  "Prioritas adalah panduan urutan pemeriksaan, bukan ramalan kebakaran.",
  "Dalam mode DEMO, tugas/laporan tersimpan di browser. Pada sumber data server, perubahan tersimpan di server; isi laporan demo tetap SIMULASI.",
];

export const EMERGENCY_NOTE = "Melihat kebakaran sungguhan? Jangan menunggu aplikasi. Segera hubungi 112 atau BPBD setempat.";
