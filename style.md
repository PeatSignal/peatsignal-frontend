---
name: GambutOps
version: 2
description: Panduan gaya GambutOps — landing yang lapang dan bergerak, panel aplikasi (admin) yang tegas dan rapi. Diturunkan dari tiga referensi, dengan identitas hijau gambut.
references:
  landing: "https://d-form.doscom.org/"            # struktur & komponen landing
  motion: "https://recruitment.doscom.org/"        # tipografi display & animasi scroll
  admin: "https://fotomomen.studio/admin"          # login admin split-screen & gaya panel
colors:
  primary: "#15803D"          # tombol utama, tautan aktif, kata aksen (kontras 5,0:1 di putih)
  primary-hover: "#166534"
  primary-2: "#22C55E"        # HANYA gradien/dekorasi (2,3:1 — bukan untuk teks)
  primary-soft: "#F0FDF4"     # latar chip/ikon, item aktif
  deep: "#0B2E1E"             # panel gelap (login admin, CTA band, footer gelap)
  deep-2: "#14532D"
  info: "#0B6BCB"             # teks tautan/info (5,3:1)
  info-bright: "#1D90FF"      # HANYA dekorasi (glow, garis grid, ilustrasi)
  foreground: "#10201A"
  muted-foreground: "#5B6B63"
  background: "#F7FAF8"
  card: "#FFFFFF"
  border: "#E3EAE5"
  warning: { fg: "#B54708", bg: "#FFFAEB", border: "#FEDF89" }
  danger: { fg: "#B42318", bg: "#FEF3F2", border: "#FECDCA" }
fonts:
  display: "Bricolage Grotesque"   # judul besar landing & panel admin (next/font/google)
  sans: "Poppins"                  # UI, body, tabel (next/font/google)
rounded:
  sm: "6px"      # input kecil, tag
  md: "8px"      # tombol, menu
  lg: "12px"     # kartu kecil, tombol besar admin, popover
  xl: "16px"     # kartu, panel, gambar
  "2xl": "24px"  # band CTA, hero media
  pill: "9999px" # navbar mengambang, tombol CTA landing, badge
motion:
  libraries: ["motion (framer-motion)", "React Bits (reactbits.dev)"]   # scroll native, tanpa smooth scroll
  ease: "cubic-bezier(0.22, 1, 0.36, 1)"
  duration: { fast: "150ms", base: "300ms", reveal: "700ms", hero: "1000ms" }
  stagger: "60–80ms"
---

# GambutOps Style Guide v2

> **Status migrasi (15 Okt 2026):** **landing `/` dan login `/login` sudah v2** (token via kelas `.theme-v2` dari `src/lib/fonts.ts`, komponen React Bits di `src/components/bits/`). Login dan halaman aplikasi masih v1 (flat, Arial, hijau gelap `#18543b`). Terapkan bertahap: landing → login → shell admin → halaman modul. Bagian yang sudah dimigrasikan dicatat di `docs/progress.md`. Versi v1 tersedia di riwayat Git.

Prinsip: **lapang di landing, padat-rapi di aplikasi, satu warna tegas, gerak yang bermakna.**

1. **Satu warna utama.** Hijau `primary` untuk aksi dan aksen; selebihnya netral. Warna status (amber/merah) hanya untuk status.
2. **Tipografi yang bicara.** Judul landing besar dan rapat (display); teks UI tenang dan mudah dibaca.
3. **Gerak membantu membaca.** Animasi mengarahkan perhatian dan menandai urutan; tidak pernah menghalangi isi atau data.
4. **Jujur tetap nomor satu.** Label DEMO/SIMULASI, sumber, dan batasan data tidak boleh kalah oleh dekorasi.

---

## 1. Apa yang diambil dari tiap referensi

| Referensi | Diambil | Tidak diambil |
| --- | --- | --- |
| **d-form.doscom.org** (landing) | Hero dua kolom (teks kiri, media kanan dalam kartu), latar putih kebiruan dengan cahaya radial lembut, baris statistik di bawah hero, eyebrow kecil kapital + judul H2 tengah, "3 langkah" dengan ikon bulat di atas kartu, grid fitur 3 kolom dengan ikon dalam kotak lembut, blok "Mengapa" dua kolom, FAQ accordion bergaris, band CTA penuh warna, footer multi-kolom | Ilustrasi stok; klaim angka tanpa sumber ("500+ acara") |
| **recruitment.doscom.org** (animasi) | Judul display raksasa **Bricolage Grotesque** dengan satu baris **miring berwarna**, navbar yang berubah menjadi **pill mengambang** saat di-scroll, teks yang muncul kata demi kata saat di-scroll di atas foto, panel lengket bertumpuk per divisi (warna pastel + media), smooth scroll **Lenis**, reveal **Motion** | Foto kerumunan sebagai elemen utama (GambutOps memakai screenshot produk dan peta) |
| **fotomomen.studio/admin** (admin) | Login **split-screen**: kiri form putih, kanan panel gelap bergradien dengan **garis grid** tipis dan judul display raksasa diakhiri titik ("ADMIN PANEL."), label input **kapital kecil berjarak huruf**, input bergaris bawah, tombol utama tebal kapital (glow-nya tidak diambil), tautan "Kembali ke beranda" kapital kecil | Tampilan dalam panel admin tidak terlihat (butuh login); gaya panel di bawah diturunkan dari bahasa visual halaman login |

## 2. Warna

Token didefinisikan di `src/app/globals.css` (Tailwind v4 `@theme`). Pakai kelas token (`bg-primary`, `text-muted-foreground`), bukan hex langsung.

| Token | Nilai | Pakai untuk | Kontras teks |
| --- | --- | --- | --- |
| `primary` | `#15803D` | Tombol utama, nav aktif, kata aksen judul, ikon penting | 5,0:1 di putih ✔ |
| `primary-hover` | `#166534` | Hover/aktif tombol utama | 7,1:1 ✔ |
| `primary-2` | `#22C55E` | Ujung gradien, garis aksen, glow | 2,3:1 ✗ **jangan untuk teks** |
| `primary-soft` | `#F0FDF4` | Kotak ikon, chip, baris terpilih | `primary` di atasnya 4,8:1 ✔ |
| `deep` / `deep-2` | `#0B2E1E` / `#14532D` | Panel login admin, band CTA, sidebar gelap (opsional) | putih 14,8:1 ✔ |
| `info` | `#0B6BCB` | Tautan teks, info netral | 5,3:1 ✔ |
| `info-bright` | `#1D90FF` | Glow/ilustrasi/garis grid dekoratif | 3,2:1 ✗ teks |
| `foreground` | `#10201A` | Teks utama | 16:1 ✔ |
| `muted-foreground` | `#5B6B63` | Teks sekunder, metadata | 5,4:1 ✔ |
| `background` / `card` / `border` | `#F7FAF8` / `#FFFFFF` / `#E3EAE5` | Latar, kartu, garis | — |

Status (tetap terpisah dari brand): **warning** `#B54708` di `#FFFAEB`, **danger** `#B42318` di `#FEF3F2`. Hijau `primary` tidak dipakai untuk menyatakan "aman" — data kurang bukan berarti aman.

**Gradien yang diizinkan** (hanya ini):

| Nama | Nilai | Dipakai di |
| --- | --- | --- |
| `glow-hero` | `radial-gradient(60% 60% at 70% 0%, rgb(34 197 94 / .10), transparent 70%)` di atas `background` | Latar hero landing (seperti d-form) |
| `band` | `linear-gradient(135deg, #0B2E1E 0%, #15803D 60%, #22C55E 100%)` | Band CTA penutup, panel kanan login admin |
| `grid-overlay` | dua `linear-gradient` garis `rgb(255 255 255 / .08)` 1px tiap 64px | Di atas `band` (seperti fotomomen) |
| `scrim` | `linear-gradient(to top, rgb(0 0 0 / .8), rgb(0 0 0 / .2))` | Teks di atas foto/screenshot |

Tidak ada gradien pada teks, tombol sekunder, kartu biasa, atau tabel.

## 3. Tipografi

Dua keluarga via `next/font/google` (self-hosted saat build, `display: swap`):

- **Bricolage Grotesque** — display. Hanya judul landing (H1/H2), judul panel admin, dan angka statistik besar.
- **Poppins** — semua teks UI, body, label, tabel, tombol.

| Level | Landing | Aplikasi (admin) |
| --- | --- | --- |
| Hero H1 | Bricolage 800, `clamp(44px, 7vw, 96px)`, line-height 0.95, tracking −0.02em; satu baris **italic** warna `primary` | — |
| Judul panel login admin | Bricolage 800, `clamp(56px, 8vw, 96px)`, line-height 0.85, kapital, diakhiri titik (mis. **"PANEL GAMBUT."**) | sama |
| H2 section | Bricolage 700, `clamp(30px, 4vw, 56px)`, tracking −0.02em | — |
| Judul halaman | — | Poppins 700, 24–30px, tracking −0.01em |
| H3 / judul kartu | Poppins 600, 16–18px | Poppins 600, 15–16px |
| Body | Poppins 400, 16–18px, line-height 1.7 | Poppins 400, 14px, line-height 1.6 |
| Eyebrow | Poppins 600, 12px, KAPITAL, tracking 0.2em, warna `primary` | Poppins 700, 11px, KAPITAL, tracking 0.12em, `muted-foreground` |
| Label input | — | Poppins 700, 11px, KAPITAL, tracking 0.08em (gaya fotomomen) |
| Angka statistik | Bricolage 700, 36–48px, `tabular-nums` | Poppins 700, 24–28px, `tabular-nums` |
| Caption | Poppins 400, 12–13px, `muted-foreground` | sama |

Teks Indonesia, kalimat pendek. Angka memakai format `id-ID` (koma desimal, minus tipografis).

## 4. Layout, ruang, radius, bayangan

- **Container:** landing `max-w-[1200px]`, aplikasi `max-w-[1280px]`; gutter `px-4 md:px-8`.
- **Section landing:** `py-20 md:py-28`; latar berganti putih ↔ `background` agar section terasa terpisah tanpa garis.
- **Grid:** kartu `gap-4 md:gap-6`; fitur 3 kolom ≥1024px, 2 kolom ≥640px, 1 kolom di HP.
- **Radius:** tombol aplikasi `md` 8px; tombol CTA landing & navbar `pill`; kartu `xl` 16px; media/band `2xl` 24px; tombol utama admin `lg` 12px.
- **Bayangan (minimal, seperti referensi):**
  - `shadow-xs`: `0 1px 2px rgb(0 0 0 / .05)` — kartu yang bisa diklik.
  - `shadow-sm`: `0 1px 3px rgb(0 0 0 / .1)` — navbar pill, popover, dialog.
  - **Tombol tidak pernah memakai bayangan atau glow**, termasuk tombol utama besar.
  - Tidak ada bayangan pada tabel, sidebar, atau kartu data.

## 5. Komponen

### Landing (pola d-form + recruitment)

| Komponen | Spesifikasi |
| --- | --- |
| **Navbar** | Awal: transparan, lebar penuh, tinggi 72px. Setelah scroll >24px: menjadi **pill mengambang** (`max-w-[1120px]`, `rounded-full`, `bg-white/80 backdrop-blur-md`, `border`, `shadow-sm`, `top-4`). Tautan aktif warna `primary` + garis bawah 2px. CTA kanan: tombol pill `primary`. HP: logo + tombol "Masuk" + menu sheet. |
| **Hero** | Opsi A (d-form): dua kolom, teks kiri + screenshot produk dalam kartu `rounded-2xl` dengan titik dekoratif di sudut. Opsi B (recruitment): teks tengah raksasa + dua tombol pill. GambutOps memakai **A** di desktop dan tumpuk di HP; baris bawah: 3 poin centang kecil ("Tanpa kata sandi", "Data berlabel DEMO", "Sumber NASA FIRMS"). |
| **Statistik** | 4 kolom dipisah garis tipis di atas; angka Bricolage + label kecil. **Hanya angka yang nyata** (mis. "2 wilayah DEMO", "6 modul", "2 satelit VIIRS"), bukan klaim pemasaran. |
| **Langkah (Cegah · Deteksi · Tindak)** | Eyebrow + H2 tengah; tiap langkah: ikon dalam lingkaran `primary` 48px di atas kartu media, judul + deskripsi rata tengah. Versi lanjut: panel lengket bertumpuk (pola divisi recruitment) dengan latar pastel per langkah: hijau muda (Cegah), amber muda (Deteksi), biru muda (Tindak). |
| **Kartu fitur** | `rounded-xl border bg-card p-6`; ikon 20px dalam kotak `primary-soft` 40px `rounded-lg`; judul 16px 600; deskripsi 14–15px muted. Hover: `border-primary/30`, ikon bergeser 2px (lihat §6). |
| **Blok "Mengapa"** | Dua kolom: media kiri, teks + 4 poin ikon kanan. |
| **FAQ** | Accordion Radix; baris `py-5 border-b`, judul 16px 500, chevron berputar 180°. |
| **Band CTA** | `rounded-2xl` (dalam container) atau penuh lebar, gradien `band` + `grid-overlay`, judul Bricolage putih, tombol putih teks `primary`. |
| **Footer** | Logo + deskripsi + kontak kiri, 3 kolom tautan (eyebrow kapital), baris hak cipta. Catatan darurat 112/BPBD tetap ada. |

### Aplikasi / admin (pola fotomomen)

| Komponen | Spesifikasi |
| --- | --- |
| **Login** | Split 50/50 ≥1024px. **Kiri** putih: tautan "← KEMBALI KE BERANDA" (11px, 800, kapital, muted), H1 "MASUK" Poppins 900 kapital, deskripsi, form, footer kecil kapital "GAMBUTOPS · AKUN DEMO". **Kanan** `band` + `grid-overlay`: logo putih kanan atas, judul display "PANEL GAMBUT." raksasa, garis putih 64×4px, deskripsi putih/80, hak cipta. HP: panel kanan menjadi header pendek di atas form. |
| **Input** | Gaya garis bawah: tanpa kotak, `border-b-2 border-border`, tinggi 48px, teks 16px 600; fokus `border-primary`. Label kapital kecil di atasnya. Pilihan akun demo: kartu radio `rounded-xl` (bukan dropdown). |
| **Tombol utama admin** | Tinggi 48px, `rounded-lg`, `bg-primary`, teks 12px 800 **KAPITAL** tracking 0.1em, tanpa bayangan. Sekunder: outline `rounded-lg`. Tombol kecil di dalam tabel/kartu: 36px, huruf biasa. |
| **Shell** | Sidebar putih 256px (ringkas 80px) dengan eyebrow "MENU" kapital; item aktif `bg-primary-soft text-primary` + strip kiri 3px `primary`. Header putih 64px: judul halaman kiri, akun + "Keluar" kanan, mode Riwayat/Terkini sebagai segmented control. Opsi: sidebar `deep` untuk kesan panel admin. |
| **Kartu data / statistik** | `rounded-xl border bg-card p-5`; label kapital kecil muted; angka Poppins 700 `tabular-nums`; tanpa bayangan. |
| **Tabel** | Header 11px kapital tracking muted, baris 52px, garis `border`, hover `bg-background`; kolom angka rata kanan. |
| **Badge status** | `rounded-full px-2.5 py-0.5 text-[11px] font-semibold`: DEMO/SIMULASI = warning, prioritas tinggi = danger, sedang = warning, rendah = primary-soft, data kurang = outline. |
| **Peta & grafik** | Tetap seperti v1 (MapLibre/Recharts) dengan warna token baru; tanpa animasi masuk. |

## 6. Animasi (Next.js + React Bits + Motion)

**Pustaka:**

- **React Bits** (reactbits.dev) — komponen animasi siap salin (TS + Tailwind). Komponen disalin ke `src/components/bits/` lewat CLI shadcn/jsrepo sesuai petunjuk di situsnya, lalu disesuaikan dengan token di atas. Beberapa komponen memakai `motion` atau `gsap`; pasang dependensinya dengan versi pasti di `package.json`.
- **motion** (`motion/react`) — reveal saat scroll, navbar pill, transisi antar panel.
- **Tanpa smooth scroll** (Lenis dihapus 15 Okt 2026): scroll native terasa lebih ringan dan tidak menunda input. Animasi berulang memakai CSS (`transform`/`opacity`) dan berhenti saat di luar layar; tidak memakai `filter: blur` atau `backdrop-filter` yang dianimasikan saat scroll.

**Pemetaan section → komponen React Bits:**

| Bagian | Komponen | Perilaku |
| --- | --- | --- |
| Hero H1 | `SplitText` atau `BlurText` | Kata muncul berurutan (stagger 60ms, 700ms), sekali saat load |
| Kata aksen hero ("sebelum terjadi") | `RotatingText` (opsional) | Bergiliran: *terbakar* → *meluas* → *terlambat*; berhenti bila reduced motion |
| Statistik | `CountUp` | Hitung naik sekali saat terlihat (1,2 s) |
| Paragraf "Masalah" di atas screenshot | `ScrollReveal` | Kata menjadi jelas mengikuti scroll (pola recruitment) |
| Cegah · Deteksi · Tindak | `ScrollStack` atau panel lengket buatan sendiri dengan `motion` | Kartu langkah menumpuk saat scroll |
| Kartu fitur/alur | `AnimatedContent` / `FadeContent` | Naik 24px + fade, stagger 80ms, `once: true` |
| CTA hero | `Magnet` (opsional, desktop pointer saja) | Tombol sedikit mengikuti kursor (maks 6px) |
| Latar band CTA / panel login | `DotGrid` atau `Squares` (opsional) | Pola halus statis atau sangat lambat; bisa diganti `grid-overlay` CSS |

**Aturan gerak:**

- Ease standar `cubic-bezier(0.22, 1, 0.36, 1)`; durasi: hover 150 ms, UI 300 ms, reveal 700 ms, hero ≤1000 ms. Jarak gerak maksimal 24px; tidak ada rotasi/zoom besar.
- Reveal hanya sekali (`viewport: { once: true, amount: 0.2 }`).
- **`prefers-reduced-motion: reduce`**: semua animasi masuk langsung tampil, marquee dan animasi berulang berhenti, `RotatingText` statis.
- Isi tetap terbaca tanpa JavaScript: elemen tidak boleh `opacity: 0` di HTML server tanpa fallback. Gunakan kelas yang dimulai dari terlihat dan hanya disembunyikan setelah JS siap.
- Di **aplikasi/admin** hanya transisi mikro: hover warna (150 ms), panel/sheet/dialog (200–300 ms), skeleton. **Tidak ada** reveal saat scroll, teks bergerak, atau marquee di halaman data.
- Tidak menganimasikan angka/data penting di aplikasi (nilai GWT, jumlah titik panas) agar tidak menyesatkan.
- Performa: animasikan `transform`/`opacity` saja; komponen animasi dimuat dinamis (`next/dynamic`) di bawah lipatan pertama; target LCP < 2,5 s di HP.

## 7. Aksesibilitas

- Kontras teks ≥4,5:1 (lihat tabel warna). `primary-2` dan `info-bright` tidak pernah untuk teks.
- Fokus terlihat: `focus-visible:ring-2 ring-primary ring-offset-2` di semua elemen interaktif, termasuk navbar pill dan kartu radio.
- Satu H1 per halaman; teks yang dipecah per kata oleh animasi tetap punya `aria-label` berisi kalimat utuh.
- Target sentuh ≥40px; tombol HP lebar penuh bila sendirian.
- Gambar screenshot punya `alt` deskriptif; dekorasi `aria-hidden`.

## 8. Jangan

- Lebih dari satu warna brand; ungu/oranye sebagai aksen.
- Gradien pada teks atau di luar daftar §2; efek kaca (blur) kecuali navbar pill.
- Bayangan atau glow pada tombol; bayangan tebal pada kartu data.
- Titik/bulatan dekoratif: titik di badge, pola titik di latar, bullet bulat, dan pemisah "·" sebagai hiasan.
- Teks panjang di landing: satu ide per section, maksimal satu kalimat pendek per blok; deretan logo/teknologi yang tidak membantu pengguna.
- Animasi di halaman data aplikasi, autoplay video, parallax berat, atau animasi yang menunda isi lebih dari 1 detik.
- Klaim angka tanpa sumber, ilustrasi stok yang menggantikan produk, atau menyembunyikan label DEMO/SIMULASI.
- Lenis/scroll-jacking di halaman yang memuat peta.

## 9. Pemetaan ke halaman GambutOps

| Halaman | Gaya | Catatan |
| --- | --- | --- |
| `/` landing | §5 Landing + §6 animasi penuh | Ringkas: hero (judul + 1 kalimat + 2 tombol), 4 angka nyata, 1 kalimat masalah, 3 panel cara kerja bertumpuk, alur 5 langkah, 3 batasan data, 4 FAQ, band CTA, footer satu baris |
| `/login` | §5 Login (split-screen fotomomen) | Akun demo sebagai kartu radio; panel kanan `band` + grid |
| `/dashboard`, `/groundwater`, `/hotspots`, `/priorities`, `/tasks`, `/experiments/ml` | §5 Aplikasi/admin, animasi mikro saja | Shell baru, label kapital, kartu data tanpa bayangan |
| 404 | Netral, tautan ke Ringkasan dan beranda | — |


## 10. Teks dan pemilih tanggal

- Utamakan judul, data, status dan aksi. Hindari eyebrow/deskripsi yang mengulang judul.
- Penjelasan sumber, istilah, metode dan audit tersedia melalui Detail atau Panduan.
- DEMO/SIMULASI, mode historis/terkini, data kurang dan gate eksperimen harus tetap jelas.
- Kalender bersama memakai React DayPicker + Radix Popover, locale Indonesia, satu bulan
  dengan navigasi bulan/tahun. Periode memakai draft dan Terapkan/Batal; tanggal tunggal
  langsung dipilih. Jangan memakai input tanggal native untuk fitur baru.
- Laporan memakai tanggal kalender serta jam/menit/detik lokal yang diberi keterangan zona waktu.


## 11. Select

- Gunakan Select bersama dari `src/components/ui/select.tsx` untuk pilihan tunggal.
- Trigger tinggi 40px (header/kalender 36px), border tipis, chevron dan focus ring; nilai panjang
  dipotong pada trigger tetapi tetap terbaca lengkap saat menu dibuka.
- Menu memakai latar kartu, sudut rounded-xl dan shadow-sm; pilihan aktif berwarna secondary
  dengan centang. Tinggi/lebar dibatasi viewport dan daftar dapat digulir.
- Kelompok/keterangan tambahan berada dalam menu, bukan memenuhi trigger.
- Form React Hook Form memakai Controller. Pilihan kosong tetap dikonversi ke nilai domain
  kosong/null; jangan mengirim identitas opsi internal ke API.
