import { LayoutDashboard, Waves, Satellite, ListOrdered, ClipboardCheck, FlaskConical, type LucideIcon } from "lucide-react";

export interface NavigationItem {
  href: string;
  label: string;
  title: string;
  eyebrow: string;
  /** Kode fase internal untuk tim; tidak ditampilkan ke pengguna. */
  phase: string;
  /** Modul sudah dapat dipakai pengguna. */
  available: boolean;
  /** Modul eksperimen (bukan bagian operasional utama). */
  experimental?: boolean;
  icon: LucideIcon;
  description: string;
  capabilities: readonly string[];
}

export const navigation: readonly NavigationItem[] = [
  {
    href: "/dashboard", label: "Ringkasan", title: "Ringkasan pemantauan",
    eyebrow: "PEATSIGNAL · RINGKASAN", phase: "F1.1", available: true, icon: LayoutDashboard,
    description: "Lihat kondisi lahan gambut, titik panas, dan tugas pemeriksaan dalam satu halaman.",
    capabilities: ["Melihat jumlah titik panas, tugas, dan kelengkapan data sesuai periode dan wilayah", "Melihat peta ringkas dan daftar lokasi yang perlu diperiksa", "Melihat kegiatan terbaru beserta sumber dan waktu datanya"],
  },
  {
    href: "/groundwater", label: "Muka air tanah", title: "Muka air tanah",
    eyebrow: "CEGAH · MUKA AIR TANAH", phase: "F1.2", available: true, icon: Waves,
    description: "Pantau seberapa dalam air di bawah permukaan gambut. Gambut yang makin kering makin mudah terbakar.",
    capabilities: ["Memilih stasiun pengukuran, misalnya BRG6 atau BRG3", "Melihat grafik muka air tanah (dalam meter) dan mengatur rentang tanggal", "Hari tanpa pengukuran tetap terlihat kosong, tidak dianggap nol"],
  },
  {
    href: "/hotspots", label: "Titik panas", title: "Titik panas satelit",
    eyebrow: "DETEKSI · TITIK PANAS", phase: "F1.3", available: true, icon: Satellite,
    description: "Lihat titik panas yang tertangkap satelit. Titik panas belum tentu kebakaran, sehingga perlu dicek di lapangan.",
    capabilities: ["Melihat titik panas pada peta dan memperbesar lokasi", "Memilih titik di peta atau daftar untuk melihat detailnya", "Menyaring berdasarkan tanggal, satelit, dan wilayah"],
  },
  {
    href: "/priorities", label: "Prioritas pemeriksaan", title: "Prioritas pemeriksaan",
    eyebrow: "CEGAH · PRIORITAS", phase: "F1.4", available: true, icon: ListOrdered,
    description: "Lihat lokasi mana yang sebaiknya diperiksa lebih dulu, lengkap dengan alasan dan data yang dipakai.",
    capabilities: ["Melihat urutan prioritas: tinggi, sedang, rendah, atau data kurang", "Membaca alasan prioritas dan data yang belum tersedia", "Membuat tugas pemeriksaan langsung dari lokasi prioritas"],
  },
  {
    href: "/tasks", label: "Tugas lapangan", title: "Tugas & laporan lapangan",
    eyebrow: "TINDAK · TUGAS LAPANGAN", phase: "F1.5", available: true, icon: ClipboardCheck,
    description: "Bagikan tugas pemeriksaan ke petugas, kirim laporan dari lapangan, lalu tinjau hasilnya.",
    capabilities: ["Koordinator membuat tugas dan memilih petugas", "Petugas memulai tugas dan mengirim laporan hasil pemeriksaan", "Setiap perubahan status tercatat: siapa, kapan, dan apa"],
  },
  {
    href: "/experiments/ml", label: "GWT Forecasting", title: "Uji prediksi muka air tanah",
    eyebrow: "EKSPERIMEN · PREDIKSI", phase: "F1.6", available: true, experimental: true, icon: FlaskConical,
    description: "Uji coba memperkirakan muka air tanah satu hari ke depan. Hasilnya belum dipakai untuk keputusan.",
    capabilities: ["Membandingkan perkiraan model dengan cara sederhana (nilai hari ini = besok)", "Melihat grafik nilai sebenarnya dan nilai perkiraan", "Hasil hanya tampil bila model sudah diuji; tidak ada angka karangan"],
  },
];

export function findNavigationItem(pathname: string) {
  return navigation.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}
