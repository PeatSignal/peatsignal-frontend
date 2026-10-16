> Repository terpisah: baca [panduan setup dan hosting](SPLIT_REPOSITORY.md).

# PeatSignal — frontend

**Prevent · Detect · Act.** Fondasi tampilan prototype JOINTS Hackathon 2026. Bahasa antarmuka Indonesia; seluruh identitas demo berlabel simulasi. Sumber kebutuhan: 10 PRD dalam `prdFiles/`.

## Menjalankan aplikasi

Gunakan Node.js 22.13+ (Node 24 direkomendasikan) dan npm 11.

```bash
npm ci
npm run dev
```

Buka http://localhost:3000. Tidak membutuhkan backend, API key, atau `.env`. Lihat `.env.example` untuk mengaktifkan REST adapter. Jangan menyalin file kredensial workspace ke aplikasi atau `public/`.

```bash
npm run lint
npm run typecheck
npm run build
npm run start
```

Script dev/build menggunakan Webpack, opsi resmi Next.js. Turbopack membutuhkan port internal pemrosesan CSS yang ditolak sandbox tempat implementasi ini dibuat. Typecheck menjalankan `next typegen` sehingga dapat dijalankan sebelum build. Font sistem digunakan; tidak ada unduhan font saat build.

## Bagian yang selesai

- Application shell responsif: sidebar desktop yang dapat diciutkan, drawer mobile dengan fokus terkelola, topbar, skip link, dan footer.
- **Landing page** di `/` (style.md v2): navbar pill saat digulir, hero dengan judul display + ilustrasi SVG beranimasi ringan, pernyataan "Masalah" yang muncul mengikuti scroll, panel Cegah·Deteksi·Tindak bertumpuk (grafik/prioritas beranimasi, peta MapLibre titik panas yang dimuat saat mendekati layar), fitur, alur tugas, data & batasan + marquee sumber, FAQ, band CTA, footer. Animasi: komponen React Bits (`SplitText`, `CountUp`, `ScrollReveal`, `AnimatedContent`) di `src/components/bits/` (gsap/motion) dengan scroll native; animasi berulang hanya CSS dan berhenti di luar layar atau saat reduced motion dan isi tetap tampil tanpa JavaScript.
- **Login demo** di `/login`: pilih akun Koordinator/Petugas (tanpa kata sandi). Mode REST memverifikasi akun lewat `GET /api/v1/auth/me` dengan Bearer token peran; mode mock memeriksa daftar akun demo. Semua halaman aplikasi wajib masuk (`AuthGate` mengalihkan ke `/login?next=…` lalu kembali ke tujuan; `next` hanya menerima path internal). Sesi disimpan di `localStorage` (`gambutops:session:v1`); tombol **Keluar** di header untuk berganti akun. Ini pengalaman pengguna, bukan keamanan: server tetap memeriksa token setiap perubahan data.
- Routing aplikasi ada di route group `src/app/(app)/` (layout dengan providers + AppShell); URL tetap `/dashboard`, `/groundwater`, `/hotspots`, `/priorities`, `/tasks`, `/experiments/ml`.
- Mode switcher Historical Replay / Current Monitoring. Filter periode dan area disimpan **terpisah per mode** di `MonitoringProvider`; `as_of` = akhir periode.
- **Lapisan data (F0 data):** schema Zod + tipe, `GambutOpsRepository`, `createMockRepository()` (deterministik, localStorage untuk tugas/laporan), `createRestRepository()` (validasi payload, pemetaan error, guard mode), state machine tugas, dan hook data dengan cache per mode serta pembatalan respons lama. Detail: [docs/data-contract.md](docs/data-contract.md).
- Komponen bersama untuk provenance, DEMO/SIMULASI, loading, empty, error/retry, dan toast.
- Panduan gaya UI: [style.md](style.md) v2 — landing lapang dan beranimasi (React Bits + Motion), login/admin bergaya panel, warna utama hijau `#15803D`, font Bricolage Grotesque + Poppins. Status: target, kode masih v1 dan dimigrasikan bertahap.
- **Dropdown konsisten:** Radix Select untuk wilayah, stasiun, prioritas/petugas dan bulan/tahun kalender; menu mengikuti tema, mendukung keyboard, kelompok wilayah dan penanda pilihan.
- **UI ringkas:** penjelasan sumber/metode, indikator lengkap dan batasan tersedia melalui bagian Detail; angka, grafik, status dan tindakan tetap di tampilan utama.
- **Panduan penggunaan dalam aplikasi** (modal): dibuka saat diminta melalui tombol **Panduan** di header. Tidak muncul otomatis pada kunjungan pertama. Isi: Kenalan, Cara pakai (langkah bertanda "Segera tersedia" bila modul belum siap), Istilah, Penting (termasuk nomor darurat 112). Teks ada di `src/components/guide/guide-content.ts`; status modul mengikuti `available` di `navigation.ts`.
- Bahasa antarmuka untuk pengguna awam: tanpa kode fase internal (F0/F1/P1) dan tanpa judul berbahasa Inggris.
- **Titik panas** (`/hotspots`): peta MapLibre (warna = status verifikasi, popup, kotak wilayah DEMO), daftar yang sinkron dengan peta, pagination server 100 titik/halaman (reset saat filter berubah), filter satelit, detail (waktu WIB/UTC, confidence mentah, FRP, sumber), buat tugas dari titik, dan status sinkron NASA FIRMS + tombol sinkron koordinator (REST).
- **Prioritas pemeriksaan** (`/priorities`): assessment per wilayah dengan alasan, data yang belum tersedia, indikator dari snapshot, rekomendasi, versi aturan, snapshot mentah untuk audit, dan tombol **Buat tugas** (koordinator).
- **Tugas lapangan** (`/tasks`): saringan "Perlu tindakan saya", detail, riwayat status, laporan; koordinator menugaskan/meninjau (verifikasi, tindak lanjut, tutup), petugas memulai dan mengirim laporan SIMULASI. Pilih peran demo di header.
- Pengatur periode dan wilayah di panel **Filter data**, tersimpan terpisah per jenis data. Rentang memakai kalender React DayPicker + Radix Popover dengan bahasa Indonesia, navigasi bulan/tahun dan tombol Terapkan/Batal. ML memakai tanggal tunggal; laporan memakai kalender + jam/menit/detik lokal.
- **Uji prediksi** (`/experiments/ml`): pilihan stasiun dari API, MAE/RMSE vs baseline dalam cm, grafik dan tabel terukur/prediksi/baseline dalam meter, periode/versi/fitur/batasan model, serta form prediksi historis +1 hari. Gate `EXPERIMENT_ONLY` tetap ditampilkan; hasil tidak masuk keputusan operasional. Halaman selalu historis dan tidak mengikuti filter pemantauan. Mock menampilkan hasil belum tersedia tanpa angka rekaan.

- **Fondasi peta (MapLibre 6):** `src/components/maps/base-map.tsx` dengan tombol **Layar penuh** (desktop dan mobile, termasuk iPhone), kontrol berbahasa Indonesia, tombol zoom 40px di layar sentuh, geser dua jari/Ctrl+gulir agar halaman tetap bisa digulir, fallback latar polos saat peta dasar gagal, dan pesan + "Coba lagi" bila WebGL tidak tersedia. Koordinat stasiun tidak tersedia dari sumber, jadi tidak ada pin stasiun.

### Peta dasar dan worker MapLibre

Peta dasar default: OpenFreeMap Positron (tanpa API key). Ganti lewat `NEXT_PUBLIC_MAP_STYLE_URL` bila perlu. `npm run dev`/`npm run build` otomatis menjalankan `scripts/copy-maplibre-worker.mjs`, yang menyalin worker MapLibre ke `public/vendor/` (di-ignore Git). Bila menjalankan `next` langsung tanpa npm script, jalankan `node scripts/copy-maplibre-worker.mjs` lebih dulu.

Worker dan modul pendukungnya disajikan sebagai `.js` agar dikenali sebagai JavaScript oleh server production. Sertakan `public/vendor/` dalam deployment dan pastikan kedua file `maplibre-gl-worker.js` serta `maplibre-gl-shared.js` mengembalikan MIME JavaScript (`application/javascript` atau `text/javascript`), bukan `text/plain`.

## Sumber data

Default memakai mock repository (data DEMO sintetis, tidak butuh backend). Untuk memakai backend:

```bash
NEXT_PUBLIC_DATA_SOURCE=rest
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

Mode `rest` hanya aktif bila URL terisi. Untuk menulis data (tugas, laporan, tinjauan) isi juga
`NEXT_PUBLIC_DEMO_COORDINATOR_TOKEN` dan `NEXT_PUBLIC_DEMO_FIELD_OFFICER_TOKEN` (lihat `.env.example`).
REST adapter mengirim `Authorization: Bearer <token>` sesuai peran demo yang dipilih di header
("Masuk sebagai"); header `X-Actor-Id` tidak dipakai lagi. Kontrak: `backend/docs/tasks-handoff.md`. Kebutuhan endpoint untuk backend tercatat di [docs/data-contract.md](docs/data-contract.md#kebutuhan-api-untuk-backend).

Komponen memakai hook dari `src/components/providers/data-hooks.ts` (`useHotspots`, `usePriorities`, `useTasks`, `useRepositoryMutation`, dst.). Jangan mengimpor fixture, `fetch`, atau `localStorage` langsung dari komponen.

## Tes data

```bash
npm run test:data
```

Mencakup schema, state machine, konfigurasi peta, mock repository (mode, as_of, determinisme, persistensi, localStorage rusak, abort), dan REST adapter (payload invalid, pemetaan HTTP, guard mode).

## Setelah memperbarui dependency

Hentikan server development sebelum menjalankan `npm install` atau `npm ci`, lalu jalankan
kembali `npm run dev`. Webpack pada proses lama dapat menyimpan jalur paket sebelum npm
melakukan deduplikasi, sehingga muncul `ENOENT` meskipun dependency sudah valid.
Jika restart masih membaca cache lama, hentikan server lalu pindahkan `.next/dev` sebelum
menjalankan ulang. Hindari mengubah `node_modules` saat server development masih berjalan.

## Pengujian browser

Playwright hanya digunakan sebagai driver smoke test; test runner memakai Node bawaan.

```bash
npx playwright install chromium
npm run build
npm run start
```

Di terminal kedua:

```bash
npm run test:shell
```

`tests/shell/workflow.test.mjs` menguji alur prioritas → tugas → petugas → laporan → tindak lanjut → verifikasi dan reload. Pada build mock memakai localStorage; untuk REST, build dengan variabel REST + token lalu jalankan `SHELL_BASE_URL=http://localhost:3000 node --test --test-isolation=none tests/shell/workflow.test.mjs` dengan backend aktif.

Opsional: `SHELL_BASE_URL` mengubah alamat server; `PLAYWRIGHT_EXECUTABLE_PATH` memakai Chromium yang sudah terpasang. Test mencakup redirect, keenam route, peta (filter wilayah, peta dasar diblokir, tanpa WebGL), navigasi aktif, konteks mode lintas halaman, collapse, drawer/keyboard/fokus, 404, dan overflow pada desktop/tablet/mobile. Server dan browser harus dapat dijalankan pada lingkungan pengujian.

Hasil verifikasi aktual dan batas lingkungan dicatat dalam `docs/implementation-plan.md`. Jangan menganggap tes browser berhasil hanya karena build berhasil.

QA browser ke backend/database asli, termasuk forecast yang dibandingkan dengan artifact,
workflow dengan rollback, dan FIRMS live: [prosedur dan hasil](docs/live-integration-qa.md).

Uji browser ML dengan respons REST terkontrol (tanpa mengakses database atau NASA):

```bash
NEXT_PUBLIC_DATA_SOURCE=rest NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1 npm run build
npm run start -- --port 3100
# Terminal kedua:
ML_E2E_REST=1 SHELL_BASE_URL=http://127.0.0.1:3100 node --test --test-isolation=none tests/shell/ml.test.mjs
```

Test mengintersep API untuk menguji metrics, gate, forecast berhasil/ditolak, pergantian stasiun,
error/retry dan empty state. Ini bukan bukti koneksi ke backend live. Bangun ulang dengan
`NEXT_PUBLIC_DATA_SOURCE=mock NEXT_PUBLIC_API_BASE_URL= npm run build` sebelum suite browser mock.

## Referensi implementasi

- [Instalasi dan tooling Next.js](https://nextjs.org/docs/app/getting-started/installation)
- [Instalasi manual shadcn/ui](https://ui.shadcn.com/docs/installation/manual)
- [Sheet berbasis Radix](https://ui.shadcn.com/docs/components/radix/sheet)
- [MapLibre dan integrasi bundler untuk F1.3](https://maplibre.org/maplibre-gl-js/docs/)
