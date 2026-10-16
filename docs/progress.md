# GambutOps — Timeline dan Pemantauan Progres

Pembaruan terakhir: **15 Oktober 2026**. Scope: **aplikasi lengkap dalam 3 hari**: frontend, backend, database, ETL, NASA FIRMS, decision engine, tugas/laporan, dan eksperimen ML GWT +1 hari.

Checklist lintas frontend/backend sampai submission: [PROJECT_TASKS.md](../../PROJECT_TASKS.md).

## 1. Posisi saat ini

**Keenam halaman aplikasi sudah diimplementasikan. QA browser ke backend/database asli lulus lokal (bagian 19); penyederhanaan UI/kalender dan dropdown tersedia (bagian 21–22). Acceptance akhir dan integrasi landing page tetap terbuka. Deployment ditunda sementara sesuai arahan pengguna. Landing page ditangani teman; sisa frontend aplikasi ditangani pengguna sesuai pembagian terbaru.**

| Bagian | Status | Bukti / pekerjaan tersisa |
| --- | --- | --- |
| Setup project dan dependency dasar | IMPLEMENTED | Next.js, TypeScript strict, Tailwind, shadcn/ui, Lucide, formulir/grafik, MapLibre 6.11.2 (`feat/f0-foundation`) |
| Design system dan application shell | IMPLEMENTED | Sidebar, drawer mobile, topbar, tema terang, identitas demo |
| Routing dan mode switcher | IMPLEMENTED | Enam route, redirect root, Historical Replay default, toast dan konteks lintas halaman |
| Shared states dan provenance | IMPLEMENTED | Komponen loading/empty/error/retry, badge, dan sumber/waktu |
| Kontrak data dan mock repository | IMPLEMENTED | `feat/f0-data`: Zod + tipe, mock + REST repository; REST stations/GWT/hotspots disesuaikan dengan read API backend di `feat/fe-read-contract`, tes data 38/38; lihat bagian 12 |
| Integrasi provider ke shell | IMPLEMENTED | `feat/f0-data`: RepositoryProvider, cache query per mode, filter periode/area per mode |
| QA F0 | IMPLEMENTED | `feat/f0-foundation`: `npm ci` bersih, lint/typecheck/build, test:data 51/51, test:shell 9/9 (production), responsif 320–1280; menunggu review gate; lihat bagian 14 |
| F1.2 Groundwater | IMPLEMENTED | `feat/fe-groundwater`; lihat bagian 13 |
| F1.4 Priorities + F1.5 Tasks | MERGED (PR #10) | `feat/frontend-tasks`: REST (BE-05/BE-06, Bearer token) + mock; E2E workflow lulus pada mock dan REST; lihat bagian 15 |
| F1.3 Hotspots | MERGED (PR #10) | `feat/frontend-hotspots`: peta + daftar + pagination + sync FIRMS; mock dan REST diuji; lihat bagian 16 |
| F1.1 Dashboard | MERGED (PR #11) | `feat/frontend-dashboard`: perhatian utama, angka, peta ringkas, kegiatan; lihat bagian 17 |
| F1.6 | IMPLEMENTED | ML metrics/forecast REST, grafik/tabel evaluasi, gate dan batasan; lihat bagian 18 |
| F1.7 | QA LOKAL PASS | Browser ke backend/Supabase asli, workflow, ML sesuai artifact, FIRMS live; acceptance akhir terbuka, smoke deployment ditunda; lihat bagian 19 |
| Backend foundation/data API | IMPLEMENTED | `feat/backend-data`: ETL GWT, importer VIIRS, API read; 20 tes lulus termasuk PostGIS nyata |
| FIRMS live / rules / tasks / ML | IMPLEMENTED / QA LOKAL PASS | Backend tersedia; browser REST, workflow, ML sesuai artifact dan FIRMS live lulus; lihat bagian 19 |

Riwayat foundation: code shell tercatat pada `main` lokal dan referensi lokal `origin/main`, commit **`f3177ea`** (`feat(frontend): implement GambutOps F0 shell and routing`). Ini hasil inspeksi Git lokal, bukan pemeriksaan langsung ke GitHub. Branch shell terpisah juga tersedia pada checkout `/tmp/gambutops-f0-shell`.

Status implementasi per halaman tercantum di tabel di atas. Bagian timeline dan pembagian kerja lama di bawah dipertahankan sebagai riwayat; pembagian terbaru mengikuti paragraf posisi saat ini.

## 2. Asumsi timeline

- Tim: dua engineer, masing-masing memakai AI agent dan melakukan review hasilnya.
- Target: **3 hari kerja intensif**, sekitar 8–10 jam fokus per orang per hari. Kita menangani backend/data/FIRMS/ML; teman menangani seluruh frontend. Kontrak API disepakati pada awal H1. Dependency, PostgreSQL/PostGIS, FIRMS, dan browser harus dapat diakses; target bukan jaminan.
- H1 adalah hari pekerjaan dilanjutkan, bukan tanggal kalender tetap. Deadline belum ditentukan.
- Tahap berikutnya dimulai setelah gate sebelumnya terpenuhi dan instruksi lanjut diberikan. Timeline tidak memberikan izin otomatis untuk mengerjakan seluruh fase sekaligus.
- Pengerjaan paralel memakai checkout dan branch berbeda, dengan kepemilikan file yang disepakati.
- QA dan handoff masuk ke H3; tidak ada hari cadangan terpisah. Jika hambatan dependency, kontrak, atau review belum selesai, catat keterlambatan secara eksplisit; jangan menandai fitur selesai atau menghapus acceptance criteria untuk mengejar target.

## 3. Timeline sampai selesai

| Target | Kita / agent kita | Teman / agent teman | Hasil dan gate |
| --- | --- | --- | --- |
| **H1 awal (±2 jam)** | FastAPI, Pydantic/OpenAPI, PostgreSQL/PostGIS, migrations, `/health`, auth/role demo server-side; sepakati kontrak | Tutup fondasi frontend dan mock provider berdasarkan kontrak; dependency dan smoke shell | Kontrak read/write tersedia; kedua agent dapat bekerja tanpa mengedit file yang sama |
| **H1 sisa (±6–8 jam)** | ETL/audit `mmc1.xlsx`, provenance, stations/GWT API; importer CSV VIIRS idempotent dan hotspot API | Dashboard, Groundwater, dan peta/list Hotspots memakai mock lalu REST untuk endpoint yang siap | Stasiun/GWT/hotspot historis tersimpan; filter tanggal/bbox bekerja; UI inti tersedia |
| **H2 awal (±4–5 jam)** | FIRMS sync server-side, UTC/cache/dedup/error handling; rule engine ber-versi dengan snapshot/as_of | Tutup Hotspots dan Priorities; integrasikan endpoint data, filter, sumber/waktu | Sync NASA dapat diuji; assessment deterministik, input kurang transparan, tidak mencampur mode |
| **H2 sisa (±4–5 jam)** | Tasks/reports API, role enforcement, state machine, history, DB persistence; baseline dan persiapan fitur ML | Tasks/forms/role demo; ML UI; ganti write mock dengan REST saat API siap | Alur tugas dasar persisten; baseline ML berjalan tanpa leakage |
| **H3 awal (±4–5 jam)** | Training/evaluasi Random Forest BRG6/BRG3, split kronologis, MAE/RMSE vs baseline, artifact/version, metrics/forecast API | Integrasikan workflow dan hasil eksperimen ML; tutup dashboard/aktivitas dan responsivitas | Hasil eksperimen nyata tampil; forecast historis hanya untuk input valid; laporan SIMULASI |
| **H3 sisa (±4–5 jam)** | Tes ETL/reimport/rules/status/auth/API/DB/ML; perbaikan bug dan dokumentasi backend | Lint/typecheck/build, browser/E2E, perbaikan UI, dokumentasi demo | E2E terintegrasi lulus; startup reproducible; checklist final terpenuhi |

F1.4 mendahului workflow penuh F1.5. Pembuatan tugas dari prioritas dinilai selesai setelah keduanya terintegrasi. Dashboard dapat dibangun lebih dahulu; integrasi akhir peta ringkas menunggu komponen MapLibre F1.3. Publikasi/deployment memerlukan target hosting dan instruksi tersendiri.

### Checkpoint harian

- **Akhir H1:** kontrak disepakati; data historis dan API read tersedia; UI dashboard/GWT/hotspot dasar siap.
- **Akhir H2:** FIRMS, priorities, dan tasks API tersedia; UI memakai REST bertahap; baseline ML berjalan.
- **Akhir H3:** backend/frontend/ML terintegrasi; workflow persisten dan QA lulus. Gate yang belum lulus tetap dicatat sebagai pekerjaan tersisa.

ML ditargetkan benar-benar dilatih dan dievaluasi, bukan hanya empty state. Jika tidak mengalahkan baseline, hasil tetap ditampilkan sebagai eksperimen dan tidak dipakai decision engine. Tanpa GWT terkini, jangan menghasilkan forecast kondisi 2026. FIRMS live harus diuji ketika akses tersedia; CSV historis adalah fallback berlabel, bukan bukti integrasi live berhasil. CHIRPS tetap opsional sesuai PRD.

## 4. Pembagian kepemilikan dan branch

| Pemilik | Kepemilikan |
| --- | --- |
| Kita | `backend/**`: FastAPI, Pydantic, DB/migrations, auth/role, ETL, FIRMS, rules, tasks/reports, ML, tes dan dokumentasi backend |
| Teman | `frontend/**`: seluruh route/UI, types/Zod, mock dan REST adapters, package/lockfile, MapLibre/Recharts, formulir, tes dan dokumentasi frontend |
| Bersama, melalui review | Kontrak API/OpenAPI, startup gabungan, konfigurasi hosting, integrasi dan E2E |

Shell yang sudah tersedia menjadi handoff untuk teman. Pembagian frontend per modul sebelumnya diganti dengan pembagian frontend/backend. Handoff perubahan yang sedang berjalan sebelum berpindah tanggung jawab. Kita tidak mengedit frontend; kebutuhan UI/adapter disampaikan kepada teman. Tracker bersama ini diperbarui bergantian.

| Tahap | Branch kita | Branch teman |
| --- | --- | --- |
| Foundation | `feat/backend-foundation` | `feat/f0-data` |
| Data/read API | `feat/backend-data` | `feat/frontend-monitoring` |
| FIRMS/rules | `feat/backend-firms-priorities` | `feat/frontend-priorities` |
| Tasks/reports | `feat/backend-tasks` | `feat/frontend-tasks` |
| ML | `feat/backend-ml` | `feat/frontend-ml` |
| Integration/QA | `fix/backend-qa` | `fix/frontend-qa` |

- Buat branch baru dari `main` terbaru setelah dependency tahap sebelumnya digabungkan.
- Teman memiliki `package.json` dan lockfile frontend; kita memiliki dependency Python/backend. Kontrak API dipublikasi sejak H1 dan perubahan dibahas sebelum diterapkan.
- PR berukuran kecil, sertakan fitur/perubahan, hasil tes aktual, dan batas yang belum selesai.
- Engineer pasangan meninjau PR. Merge setelah pemeriksaan yang relevan lulus; agent tidak melakukan merge otomatis.
- Tidak push langsung ke `main`, tidak force push, dan tidak menghapus perubahan pihak lain.

## 5. Checklist per milestone

### F0 — Foundation

- [x] Baca PRD dan periksa repository.
- [x] Setup, design system, shell, routing, mode switcher.
- [x] Shared states, dokumentasi setup, dan factory Context repository.
- [x] Lint/typecheck/build shell dijalankan dan lulus.
- [x] Kontrak tujuh entitas dan Zod schema tersedia (`feat/f0-data`); review backend menunggu.
- [x] Fixture historis/terkini serta mock provider tersedia dan terintegrasi.
- [x] Tes filter, referensi, nilai nullable, determinisme, dan as_of lulus (`test:data` 27/27).
- [x] MapLibre tersedia sebelum F1.3 (`BaseMap` + fallback peta dasar/WebGL; pratinjau wilayah di `/hotspots`).
- [x] Instalasi bersih dan smoke browser pada lingkungan normal lulus (15 Okt 2026, macOS, Node 26.5.0).
- [ ] Gate F0 diterima sebelum lanjut F1.1 — siap direview di `feat/f0-foundation`.

### F1.1 — Dashboard

- [x] Area/periode/mode memengaruhi data provider.
- [x] Ringkasan hotspot, tugas, kelengkapan data, prioritas, aktivitas, dan provenance tampil.
- [x] Loading/empty/error/retry tersedia untuk query data.
- [x] Peta ringkasan terintegrasi setelah komponen F1.3 tersedia.

### F1.2 — Groundwater

- [x] Pilihan stasiun BRG6/BRG3/lainnya, filter tanggal, grafik dan tooltip.
- [x] Statistik/tren dihitung hanya dari observasi valid; missing tetap gap/null.
- [x] Satuan meter, nilai negatif, sumber sintetis, dan keterbatasan jelas.
- [x] Current Monitoring menampilkan GWT terkini tidak tersedia.

### F1.3 — Hotspots

- [x] MapLibre zoom/pan, marker/popup, serta sinkronisasi selection peta/daftar.
- [x] Filter tanggal/sensor/area; sumber, waktu, confidence mentah, FRP, dan verifikasi.
- [x] Label DEMO pada data sintetis; fallback ketika basemap/WebGL gagal.
- [x] Empty/error state dan keterangan anomali panas, bukan kebakaran terkonfirmasi.

### F1.4 — Priorities

- [x] Assessment deterministik, tingkat prioritas, alasan, rekomendasi, sumber/waktu.
- [x] Input snapshot, missing inputs, rule_version, dan status heuristik tersedia.
- [ ] Tidak ada data setelah as_of atau campuran GWT historis dengan hotspot terkini.
- [x] Aksi buat tugas berfungsi setelah integrasi F1.5.

### F1.5 — Field Verification

- [x] Daftar/filter/detail tugas dan form pembuatan RHF/Zod.
- [x] Tampilan koordinator/petugas dan validasi tindakan sesuai role demo.
- [x] Transisi OPEN → ASSIGNED → IN_PROGRESS → SUBMITTED tervalidasi.
- [x] Review VERIFIED / DISMISSED / NEEDS_FOLLOWUP dan penugasan ulang follow-up.
- [x] Laporan SIMULASI, validasi form, riwayat status/aktor, dan toast.
- [x] Tugas/laporan bertahan setelah reload: localStorage pada mode mock dan database melalui REST pada mode backend.
- [ ] Error storage atau data tersimpan tidak valid ditangani dengan pesan yang jelas.

### F1.6 — ML Experiment UI

- [x] Tujuan GWT +1 hari, baseline, satuan metrik, serta batasan dijelaskan.
- [x] Empty state tampil sebelum model dilatih; hasil tersedia dikonsumsi melalui REST.
- [x] Tidak membuat ilustrasi metrik; flag SIMULASI API tetap ditampilkan bila ada.
- [x] Metrics/forecast memakai API, mempertahankan release gate; hasil historis terpisah dari kondisi terkini.
- [ ] Smoke halaman ML dengan backend/database dan artifact deployment nyata.

### F1.7 — Integration & QA

- [ ] Navigasi, seluruh filter, grafik, peta, toast, dan aksi penting berfungsi.
- [ ] E2E prioritas → tugas → petugas → laporan → koordinator → review lulus.
- [ ] Reload mempertahankan tugas/laporan tanpa mencampur mode.
- [ ] Loading/empty/error, input invalid, dan transisi ilegal diuji.
- [ ] Desktop 1440px, tablet 768px, mobile 375px, keyboard/fokus diperiksa.
- [ ] Lint, typecheck, production build, dan browser test final lulus.
- [ ] README, `.env.example`, panduan demo, dan catatan integrasi API final tersedia.
- [ ] Tidak ada tombol aktif tanpa fungsi, secret frontend, atau klaim ilmiah tanpa dukungan.

## 6. Riwayat verifikasi

| Tanggal | Pemeriksaan | Hasil | Catatan |
| --- | --- | --- | --- |
| 2026-10-14 | Lint shell | PASS | Tanpa warning |
| 2026-10-14 | Typecheck shell | PASS | TypeScript strict |
| 2026-10-14 | Production build shell | PASS | Webpack; keenam route diprerender |
| 2026-10-14 | `npm ci --dry-run` offline | PASS | Validasi manifest/lockfile; bukan instalasi bersih |
| 2026-10-14 | Inspeksi HTML route | PASS | Bahasa Indonesia, label DEMO/F0 tersedia |
| 2026-10-14 | Browser smoke shell | FAIL — ENVIRONMENT | Chromium gagal diluncurkan: socket sandbox ditolak; belum menguji interaksi |
| 2026-10-14 | `feat/f0-data`: lint, typecheck, build | PASS | Lingkungan lokal teman |
| 2026-10-14 | `feat/f0-data`: `npm run test:data` | PASS | 27/27 |
| 2026-10-14 | `feat/f0-data`: `npm run test:shell` (`next start` port 3100) | PASS | 1/1; screenshot 1440 px & 375 px tanpa error console/hydration |
| 2026-10-15 | `feat/fe-read-contract`: lint, typecheck, build | PASS | Tanpa warning |
| 2026-10-15 | `feat/fe-read-contract`: `npm run test:data` | PASS | 38/38, termasuk 10 tes kontrak dari `backend/docs/examples/read-api.json` |
| 2026-10-15 | `feat/fe-read-contract`: `npm run test:shell` (`next start` port 3000, mock) | PASS | 1/1 |
| 2026-10-15 | REST repository vs backend lokal `:8000` | PASS | Stations/GWT/hotspots/error 404–422 lolos; lihat bagian 12 |
| 2026-10-15 | `feat/f0-foundation`: `rm -rf node_modules && npm ci` | PASS | Node 26.5.0 / npm 11.17.0, macOS |
| 2026-10-15 | `feat/f0-foundation`: lint, typecheck, build | PASS | Tanpa warning |
| 2026-10-15 | `feat/f0-foundation`: `npm run test:data` | PASS | 51/51 (3 tes baru `map-config`) |
| 2026-10-15 | `feat/f0-foundation`: `npm run test:shell` (`next start` port 3000, mock) | PASS | 9/9: shell (+320px), groundwater, peta (normal, layar penuh ×3, peta dasar diblokir, tanpa WebGL) |
| 2026-10-15 | `feat/f0-foundation`: sapuan responsif 7 route × 6 lebar (320–1280) | PASS | Tanpa overflow/elemen keluar layar |
| 2026-10-15 | Dev server: peringatan hydration panduan | PASS | Tidak muncul lagi di `/dashboard`, `/groundwater`, `/hotspots` |

Hasil ini bersifat historis. Setelah perubahan kode berikutnya, jalankan ulang pemeriksaan yang relevan dan tambahkan hasil baru; jangan menyebut hasil lama sebagai bukti versi terbaru sudah lulus.

## 7. Hambatan dan aksi berikutnya

| Hambatan | Pemilik | Aksi untuk menutup |
| --- | --- | --- |
| Progres frontend teman belum diketahui | Teman | Ambil handoff shell dan laporkan branch/progres aktual |
| Integrasi kontrak/API frontend | Kedua engineer | Review `/openapi.json`; stations/GWT/hotspots siap, respons hotspots memakai pagination envelope |
| Terminal gagal membuat sandbox sementara: `No space left on device` | Kita | Pulihkan kapasitas disk/temp sebelum menjalankan setup dan tes backend |
| Dependency/DB/FIRMS belum terverifikasi | Kita | Periksa akses dan environment sebelum implementasi backend |
| Registry npm tidak dapat diakses dalam sandbox | Teman | Pasang dependency dan uji `npm ci` pada lingkungan normal |
| Chromium/server tidak dapat diuji dalam sandbox | Teman | Jalankan smoke test dan inspeksi visual pada lingkungan normal |
| Deadline belum ditetapkan | Kedua engineer | Isi tanggal H1 dan deadline, lalu sesuaikan estimasi |

**Langkah terdekat:** frontend mengintegrasikan read API; kita melanjutkan FIRMS live dan rule engine setelah review milestone data. Startup/import dan filter endpoint didokumentasikan dalam `backend/README.md`.

## 8. Cara memperbarui tracker

1. Awal sesi: baca tracker dan pilih pekerjaan pada milestone yang sudah diizinkan.
2. Ubah status menjadi IN_PROGRESS dan catat pemilik serta branch/PR.
3. Setelah implementasi: tandai IMPLEMENTED. Tandai DONE hanya setelah acceptance criteria, tes, review, dan integrasi terpenuhi.
4. Tambahkan hasil tes aktual beserta tanggal/commit; tulis NOT_RUN untuk tes yang belum dijalankan.
5. Akhir sesi: perbarui checklist, hambatan, handoff pasangan, dan pekerjaan berikutnya.

Status: TODO = belum dimulai; IN_PROGRESS = dikerjakan; IMPLEMENTED = kode tersedia, belum menutup gate; WAITING = menunggu input pihak lain; BLOCKED = tidak dapat maju tanpa perubahan kondisi; DONE = gate sudah terpenuhi.

| Tanggal | Milestone / status | Pemilik | Branch / commit / PR | Perubahan dan hasil tes | Handoff berikutnya |
| --- | --- | --- | --- | --- | --- |
| 2026-10-14 | F0 shell / IMPLEMENTED | Kita | `main` lokal, `f3177ea` | Shell tersedia; lint/typecheck/build PASS; browser FAIL karena lingkungan | Integrasi provider teman dan QA browser |
| 2026-10-14 | Backend data / IMPLEMENTED | Kita | `feat/backend-data` | Audit GWT/VIIRS nyata; migration PostGIS upgrade/downgrade PASS; Ruff PASS; 20 pytest PASS | Adapter REST tiga endpoint read; FIRMS/rules berikutnya |
| 2026-10-14 | F0 data / IMPLEMENTED | Teman | `feat/f0-data` | Kontrak, mock/REST repository, provider; lint/typecheck/build/test:data/test:shell PASS | `feat/frontend-monitoring` setelah merge |
| — | — | — | — | — | — |

## 9. Definisi aplikasi selesai

Selesai berarti gate frontend dan backend terpenuhi: API/DB nyata digunakan dalam alur terintegrasi, ETL idempotent dan audit tersedia, FIRMS sync teruji, prioritas dapat ditelusuri, tugas/laporan persisten, model GWT dilatih/evaluasi transparan, auth/role server-side bekerja, serta QA dan startup terdokumentasi. Mode mock tetap tersedia sebagai demo frontend tanpa backend; data nyata/sintetis dibedakan melalui provenance dan label.

### Checklist backend / data / FIRMS / ML — milik kita

- [ ] FastAPI/Pydantic, OpenAPI, health, environment, migrations PostgreSQL/PostGIS.
- [ ] Auth akun demo, role write server-side, CORS, secrets hanya server.
- [x] Audit ulang GWT, hash/provenance, null/gap/duplikat, koordinat nullable; reimport tanpa duplikasi.
- [x] Stations/GWT/hotspots API dengan tanggal/bbox; VIIRS CSV import dan UTC/key stabil.
- [ ] FIRMS sync server-side, dedup/cache, waktu sinkronisasi, penanganan API gagal.
- [ ] Rules deterministik/ber-versi, snapshot/reasons/missing inputs, as_of tanpa future leakage; tetap heuristik belum tervalidasi ilmiah.
- [ ] Tasks/reports API, DB persistence, role/status/history, laporan SIMULASI, transisi follow-up.
- [ ] Baseline persistence, lag/rolling digeser, gap ditangani, split kronologis, Random Forest BRG6/BRG3.
- [ ] MAE/RMSE dalam cm, ukuran/periode test, baseline tanggal sama, artifact/model version, metrics/forecast API.
- [ ] Forecast ditolak jika input kurang; hasil eksperimen tanpa klaim prediksi kebakaran atau kondisi live.
- [ ] Tes backend/ETL/rules/workflow/ML dan E2E gabungan lulus; panduan startup/seed/demo lengkap.

Di luar scope: validasi ilmiah baru atas rule engine, prediksi kebakaran nasional, deteksi api bawah tanah, sensor GWT live, rute patroli, chatbot. Deployment mengikuti target hosting yang disepakati; CHIRPS opsional.

Referensi: [README setup](../README.md), [hasil F0 shell](implementation-plan.md), dan [PRD roadmap](../../../prdFiles/prd-roadmap.md).

## 10. Sesi frontend 2026-10-14 — `feat/f0-data`

**Status:** selesai, menunggu review. Belum di-push dan belum di-merge.

**Scope sesi:** kontrak data, mock + REST repository, integrasi provider, penyesuaian UI ke `style.md`.

#### Commit

| Commit | Isi |
| --- | --- |
| `99204b7` | Schema Zod + tipe, state machine tugas, area, periode, label, komposisi dashboard |
| `5b02166` | `createMockRepository()`, `createRestRepository()`, fixture deterministik, localStorage store, tes data, dependency `tsx` |
| `381bece` | RepositoryProvider, cache query per mode, filter periode/area per mode, panel konteks memakai provider |
| `9e664f8` | `style.md`; Sheet `shadow-sm` tanpa blur; tanpa shadow pada segmen aktif; gradasi kartu dihapus; hover kartu `border-primary/25` |
| (commit docs) | README, `.env.example`, `docs/data-contract.md`, plan, tracker |

#### Tes yang benar-benar dijalankan

| Perintah | Hasil |
| --- | --- |
| `npm run lint` | Lulus |
| `npm run typecheck` | Lulus |
| `npm run build` | Lulus |
| `npm run test:data` | 27/27 lulus |
| `npm run test:shell` terhadap `next start` port 3100 | 1/1 lulus |
| Screenshot dashboard 1440 px & 375 px | Tidak ada error console/hydration |

#### Belum dikerjakan / risiko

- Halaman F1 (dashboard, groundwater, hotspots, priorities, tasks, ML) masih placeholder.
- Persistensi tugas melalui UI belum bisa diuji di browser karena UI tugas baru dibangun pada F1.5. Persistensi sudah diuji di level repository.
- Prioritas mock memakai `demo-rules-0.1`, bukan decision engine backend. Bentuk output mengikuti PRD agar bisa diganti dengan REST.
- `GET /api/v1/users` belum ada di rencana API. REST mode membutuhkan endpoint ini untuk pemilihan petugas.
- MapLibre belum dipasang (F1.3).

#### Handoff berikutnya

Branch `feat/frontend-monitoring` dari `main` setelah `feat/f0-data` digabung: dashboard (F1.1), groundwater (F1.2), hotspots + MapLibre (F1.3) memakai `useDashboardSummary`, `useGroundwater`, `useHotspots`.

## 11. Sesi frontend 2026-10-14 — UX pengguna awam + panduan (lanjutan di `feat/f0-data`)

**Status:** selesai, menunggu review. Belum push/merge.

- Modal panduan (Radix Dialog): auto-open sekali per browser, tab dengan navigasi panah/Home/End, fokus kembali ke tombol pembuka, label "Segera tersedia" untuk modul yang belum siap, catatan darurat 112/BPBD.
- Bahasa awam: kode fase (F0/F1/P1) dan judul Inggris dihapus dari UI; mode jadi "Riwayat"/"Terkini"; tagline "Cegah · Deteksi · Tindak".
- Pengatur periode (input tanggal native) + wilayah + "Kembalikan ke awal"; di layar kecil panel ini tampil sebelum kartu placeholder.
- Tes browser diperluas: panduan pertama kali, tidak muncul ulang, fokus kembali, filter per mode, panduan dari drawer, overflow 768/375.

| Perintah | Hasil |
| --- | --- |
| `npm run lint` / `typecheck` / `build` | Lulus |
| `npm run test:data` | 27/27 lulus |
| `npm run test:shell` (production, port 3100) | 1/1 lulus |
| Screenshot 1440/375 (panduan + ringkasan) | Tanpa error/warning console |

Temuan yang diperbaiki saat tes: fokus tidak kembali ke tombol Panduan setelah modal ditutup; peringatan aksesibilitas Radix `aria-describedby`; nama aksesibel link "Uji prediksi" ganda.

Belum: halaman fitur (F1.1–F1.6) masih placeholder — UX inti baru lengkap setelah modul dibangun.

## 12. Sesi frontend 2026-10-15 — adaptasi read API backend (`feat/fe-read-contract`)

**Status:** IMPLEMENTED, belum commit/push. Mengikuti [handoff read API](../../backend/docs/read-api-handoff.md) dari commit backend `de27be9`.

- Schema respons backend baru (`src/lib/api/rest-schemas.ts`) dan mapper murni (`src/lib/api/rest-mappers.ts`); REST adapter tidak lagi memvalidasi payload dengan schema model UI.
- Stations: tambah `code` (label), `id` tetap UUID, `latitude/longitude → lat/lon`, `region`/`source` nullable.
- GWT: array dibungkus menjadi series; `observed_date → observed_at`; `DUPLICATE → DUPLICATE_FLAGGED` dengan nilai tetap null; `source_id`/`source_sha256` dipertahankan; diurutkan per tanggal tanpa mengisi gap; hasil kosong → `NOT_AVAILABLE` + notice sesuai mode; mode/stasiun yang tidak sesuai → `INVALID_PAYLOAD`.
- Hotspots: envelope `{items,total,limit,offset}`; `acquired_at/sensor/frp → observed_at/instrument/frp_mw`; `imported_at` per item; `last_synced_at` koleksi = waktu import terbaru di halaman (`last_synced_scope: "PAGE_IMPORT"`); `daynight` null; `area_id` lookup bbox DEMO; query `limit/offset/satellite`.
- Dashboard: `total` dari server; `unverified_scope` (`PAGE` bila hanya satu halaman yang dimuat); `duplicate_days` terpisah dari `missing_days`.
- Mock: pagination + urutan seperti backend (akuisisi turun, lalu ID), validasi limit 1–1000, kode satelit `N`/`N20`, `code` stasiun.

| Perintah | Hasil |
| --- | --- |
| `npm run lint` / `typecheck` / `build` | Lulus |
| `npm run test:data` | 38/38 lulus |
| `npm run test:shell` (production, port 3000, mock) | 1/1 lulus |
| Uji mutasi mapper (DUPLICATE→MISSING, total=items.length) | Keduanya tertangkap tes kontrak |
| Smoke REST repository ke backend lokal `127.0.0.1:8000` | 8 stasiun; GWT BRG6/BRG3 2019-08-17..09-15 (BRG3 berhenti 2019-08-27); seluruh GWT 2018–2019 lolos dengan 393 MISSING + 1 DUPLICATE (BRG5 2019-03-21, null); hotspot halaman 1/2 tanpa tumpang tindih; Current kosong; 404/422 → NOT_FOUND/VALIDATION |

Catatan:

- Backend `:8000` yang dipakai smoke bukan database aplikasi port 5433 dari handoff (port 5433 tidak aktif): total hotspot Batanghari 604 dan Kubu Raya 448, bukan 3.439/2.964, dan hotspot terbaru 2019-08-31. Ulangi smoke pada database handoff.
- `getDashboardSummary` pada REST masih gagal (HTTP 501) karena `/priorities` belum diimplementasikan; sesuai handoff.
- Halaman groundwater/hotspots/dashboard masih placeholder, jadi belum ada pemeriksaan browser pada mode REST. Saat FE-04/FE-05 dibangun: tampilkan `code`, batas periode stasiun, beda MISSING vs duplikat, label “waktu import pada hasil halaman ini”, dan reset offset ketika filter/mode berubah.
- CORS backend default hanya `http://localhost:3000`; buka frontend REST lewat `localhost`.

## 13. Sesi frontend 2026-10-15 — halaman Muka air tanah (FE-04, `feat/fe-groundwater`)

**Status:** IMPLEMENTED, sudah di-push ke `feat/fe-groundwater`; menunggu review. Dibangun di atas `feat/fe-read-contract` (PR #5).

Keputusan UX:

- Pengguna awam harus bisa menjawab dalam ±10 detik: seberapa dalam air sekarang, makin kering atau basah, dan seberapa lengkap datanya.
- Stasiun dipilih lewat dropdown native per wilayah, label `code` (bukan UUID), tersimpan di URL `?stasiun=BRG6`. Filter wilayah menyaring stasiun.
- Periode memakai filter global + pintasan 30 hari / 90 hari / Seluruh data stasiun. Tautan "Ubah tanggal" menuju panel pengaturan (di bawah konten pada layar kecil).
- Kartu: pengukuran terakhir (+ "cm di bawah permukaan"), perubahan 7 dan 14 hari (pasangan valid ±1 hari; selain itu "Belum bisa dihitung"), rata-rata, paling dalam. Semua hanya dari pengukuran valid.
- Grafik: sumbu-Y meter dengan garis 0 m (permukaan) dan garis acuan −0,4 m (PP 57/2016, konteks bukan ambang bahaya). Hari tanpa nilai memutus garis dan diarsir: amber = tidak ada pengukuran, oranye = data ganda, abu-abu = di luar periode stasiun. Tooltip menjelaskan setiap hari, termasuk hari kosong. Tabel alternatif menampilkan semua hari.
- Kondisi: memuat (skeleton), gagal (coba lagi), stasiun tak dikenal di URL, periode tanpa data (+ tombol seluruh periode stasiun), semua hari tanpa nilai, periode melewati masa stasiun, dan mode Terkini (tanpa grafik, tombol ke riwayat).
- Label DEMO global (banner, panel, footer, header halaman) hanya tampil saat mock; REST menampilkan "SERVER".

| Perintah | Hasil |
| --- | --- |
| `npm run lint` / `typecheck` / `build` | Lulus |
| `npm run test:data` | 48/48 lulus (10 tes baru `groundwater-domain`) |
| `npm run test:shell` (production, port 3000, mock) | 2/2 lulus (tes baru `groundwater.test.mjs`, termasuk tanpa error console dan tanpa overflow 768/375) |
| Browser mode REST ke backend `:8000` (dev, `localhost:3000`) | BRG6 dan BRG5 Mar 2019 tampil; data ganda 21 Mar dan kosong 22 Mar diarsir terpisah; tanpa badge DEMO |

Catatan:

- Peringatan hydration di mode dev muncul pada kunjungan pertama saat panduan terbuka otomatis (Radix memasang `aria-hidden` sebelum halaman selesai hydrate). Juga terjadi di `/hotspots`, jadi bukan dari halaman ini; tidak muncul di build production. Perlu ditangani terpisah.
- Mengubah periode lewat pintasan juga mengubah `as_of` global untuk halaman lain (perilaku filter global yang sudah ada).

## 14. Sesi frontend 2026-10-15 — penutupan F0 (`feat/f0-foundation`)

**Status:** IMPLEMENTED, menunggu review gate F0. Branch dibuat dari `feat/fe-groundwater` (berisi FE-04).

- **MapLibre 6.11.2** dengan `BaseMap` (`src/components/maps/`): dimuat lazy, kontrol berbahasa Indonesia, geser dua jari/Ctrl+gulir, rotasi dimatikan, atribusi diciutkan di layar sempit. Peta dasar gagal/timeout 10 dtk → latar polos + pemberitahuan (lapisan data tetap tampil). WebGL tidak ada → pesan + "Coba lagi". Peta dasar default OpenFreeMap (tanpa key), bisa diganti `NEXT_PUBLIC_MAP_STYLE_URL`.
- Worker MapLibre v6 tidak bisa di-resolve webpack (`import.meta.url`), jadi `scripts/copy-maplibre-worker.mjs` (predev/prebuild) menyalinnya ke `public/vendor/maplibre-gl-<versi>/` (di-ignore Git), lalu `setWorkerUrl` diarahkan ke sana.
- `/hotspots` menampilkan pratinjau **Wilayah pemantauan** (kotak DEMO) yang ikut filter wilayah, sebagai titik awal F1.3.
- **Peta layar penuh** (desktop dan mobile): bingkai peta menutup seluruh layar (overlay CSS, ditambah Fullscreen API bila tersedia; iPhone memakai overlay). Esc/tombol "Keluar layar penuh" untuk kembali, gulir halaman dikunci, geser satu jari aktif selama layar penuh. Tombol zoom 40px pada layar sentuh.
- **Responsif:** semua route diperiksa di 320/375/414/768/1024/1280 px (tanpa overflow). Diperbaiki: input tanggal ditumpuk di bawah 400px, kartu statistik GWT satu kolom di bawah 360px, label tanggal grafik dikurangi di layar sempit, keterangan grafik rata kiri saat terlipat, keempat tab panduan terlihat di 320px, keterangan "Segera tersedia" di sidebar pada baris kedua.
- Perbaikan hydration: panduan pertama kali baru dibuka setelah halaman selesai dimuat dan browser senggang (sebelumnya Radix memasang `aria-hidden` sebelum hydrate selesai).
- UX shell: sidebar memberi tanda "Segera" pada modul yang belum siap (nama aksesibel "… (segera tersedia)"); Ringkasan menampilkan **Pilih menu** tepat setelah "Mulai dari sini", modul siap dipakai ditaruh paling depan dengan tanda "Siap dipakai".

| Perintah | Hasil |
| --- | --- |
| `npm ci` (setelah `rm -rf node_modules`) | Lulus |
| `npm run lint` / `typecheck` / `build` | Lulus |
| `npm run test:data` | 51/51 lulus |
| `npm run test:shell` (production, port 3000, mock) | 9/9 lulus (termasuk layar penuh desktop/mobile/tanpa Fullscreen API dan tab panduan 320px) |
| Screenshot 1440/768/375 `/dashboard`, `/hotspots` | Tanpa overflow, tanpa error console |

Catatan / tindak lanjut:

- `npm audit --omit=dev` melaporkan advisory pada `next` 16.2.10 (sebagian kritis, sebagian hanya Turbopack/Server Actions yang tidak dipakai), `nanoid`, dan `baseline-browser-mapping`. Sudah ada sebelum sesi ini; upgrade Next sebaiknya PR terpisah dan diuji ulang.
- Node Homebrew sempat rusak setelah `simdjson` di-upgrade (`libsimdjson.33.dylib` hilang); diperbaiki dengan `brew upgrade node` (26.5.0 → 26.11.1). Lint/test:data diulang di Node baru: lulus.
- ESLint mengabaikan `public/vendor/**` (salinan worker MapLibre).
- Peta dasar membutuhkan internet. Saat offline, tampilan otomatis memakai latar polos.
- Waktu muat peta `/hotspots` (diukur Playwright, mesin lokal): production ±0,6–0,9 dtk sampai style siap, ±1,1–1,5 dtk sampai tile selesai; dev pada kunjungan pertama ±4–5 dtk karena webpack mengompilasi halaman + MapLibre. MapLibre kini diunduh sejajar dengan hydrate dan koneksi ke server peta dibuka lebih awal (`preconnect`); sisa waktu didominasi rantai style → tile OpenFreeMap. Batas tunggu style sebelum latar polos: 8 dtk.

## 15. Sesi frontend 2026-10-15 — Prioritas + Tugas terhubung REST (`feat/frontend-tasks`)

**Status:** IMPLEMENTED, belum commit/push. Mengikuti [tasks-handoff](../../backend/docs/tasks-handoff.md) (branch backend `feat/backend-tasks`, `63830a3`) dan [priorities-handoff](../../backend/docs/priorities-handoff.md).

- **Auth:** REST adapter mengirim `Authorization: Bearer <token>` sesuai peran demo; `X-Actor-Id` dihapus. Token dari `NEXT_PUBLIC_DEMO_COORDINATOR_TOKEN` / `NEXT_PUBLIC_DEMO_FIELD_OFFICER_TOKEN`; tanpa token, mutasi gagal dengan pesan jelas tanpa request.
- **Peran demo:** pemilih "Masuk sebagai" di header (semua lebar layar), tersimpan di localStorage; daftar dari `GET /users` (REST) atau fixture (mock).
- **Priorities REST:** schema API + mapper; `as_of` → cutoff UTC akhir hari yang tidak pernah di masa depan; snapshot objek → indikator (jendela, jumlah/hari/belum diperiksa hotspot, tren GWT per stasiun, laporan); snapshot asli dapat dibuka untuk audit.
- **Halaman Prioritas:** ringkasan per tingkat, kartu per wilayah (alasan, data belum tersedia, data yang dipakai, rekomendasi, aturan/heuristik, tugas terkait) dan dialog **Buat tugas** (RHF + Zod) untuk koordinator.
- **Halaman Tugas:** saringan "Perlu tindakan saya"/Aktif/Menunggu tinjauan/Selesai/Semua, detail via `?tugas=`, panel tindakan per peran (tugaskan, mulai, kirim laporan SIMULASI, verifikasi/tindak lanjut/tutup, penugasan ulang follow-up), laporan, dan riwayat status urut waktu.
- Backend mengirim entri `OPEN → ASSIGNED` sebelum entri pembuatan bila timestamp sama; frontend mengurutkan (`orderedHistory`) dan usulan dicatat di `data-contract.md`.

| Perintah | Hasil |
| --- | --- |
| `npm run lint` / `typecheck` / `build` | Lulus |
| `npm run test:data` | 55/55 lulus (Bearer per peran, token kosong, cutoff/mapping priorities, urutan riwayat) |
| `npm run test:shell` (production, mock) | 10/10 lulus, termasuk `workflow.test.mjs` |
| `workflow.test.mjs` pada build production REST ke backend `feat/backend-tasks` (`:8000`) | Lulus; DB mencatat 9 riwayat + 2 laporan SIMULASI, semua tulis memakai Bearer |

Catatan:

- Pengujian REST memakai salinan database lokal `gambutops_fe` (dimigrasi ke `20261015_0005`); database `gambutops` milik backend tidak diubah. PostgreSQL lokal sempat tidak bisa start karena `postmaster.pid` basi; file dipindah ke `postmaster.pid.stale-20261015`.
- Data hotspot historis lokal berakhir 31 Agu 2019, sehingga periode default (s.d. 15 Sep) menghasilkan MONITOR; pilih "Sampai" ≤ 31 Agu 2019 untuk melihat REVIEW/HIGH.
- REST hanya punya satu petugas demo; mock punya dua.

## 16. Sesi frontend 2026-10-15 — halaman Titik panas (FE-05, `feat/frontend-hotspots`)

**Status:** IMPLEMENTED, belum commit/push. Branch dari `feat/frontend-tasks` + `main` terbaru (backend Tasks/ML). Kontrak: [read-api-handoff](../../backend/docs/read-api-handoff.md), [firms-handoff](../../backend/docs/firms-handoff.md).

- **Peta:** titik GeoJSON berwarna status verifikasi, cincin titik terpilih, popup (isi via `textContent`), garis kotak wilayah DEMO, peta mengikuti filter wilayah, layar penuh dan fallback dari F0.
- **Daftar ↔ peta:** pilih di daftar → sorot + popup (peta bergeser bila titik di luar layar); klik titik di peta → baris tersorot dan digulir (layar lebar).
- **Pagination server:** 100 titik/halaman, total dari `total`, kembali ke halaman 1 saat mode/periode/wilayah/satelit berubah. Di HP daftar diringkas 10 baris + "Tampilkan semua", ada tautan "Ubah tanggal/wilayah".
- **Detail titik:** waktu WIB dan UTC, wilayah, koordinat, satelit, confidence mentah (bukan peluang), FRP, sumber, waktu pembaruan server; koordinator dapat **membuat tugas dari titik** (dialog tugas kini menerima assessment atau hotspot).
- **Sinkron FIRMS (mode Terkini):** status per wilayah × produk (`GET /hotspots/sync-status`), tombol "Sinkronkan" untuk koordinator pada REST (`POST /admin/hotspots/sync`, Bearer, 3 hari); 429/502/503 tampil sebagai pesan. Mock menampilkan status DEMO dan menolak sync (tidak berpura-pura live).
- Perbaikan `BaseMap`: pembaruan data tidak lagi bergantung pada `isStyleLoaded()` (false saat source GeoJSON memuat ulang) sehingga pilihan beruntun tidak terlewat.
- Pratinjau "Wilayah pemantauan" F0 dihapus karena digantikan halaman ini.

| Perintah | Hasil |
| --- | --- |
| `npm run lint` / `typecheck` / `build` | Lulus |
| `npm run test:data` | 57/57 lulus (sync REST + Bearer + 429, sync mock ditolak) |
| `npm run test:shell` (production, mock) | 11/11 lulus (tes baru `hotspots.test.mjs`) |
| `hotspots.test.mjs` di dev REST ke backend `main` (`:8000`, DB `gambutops_fe`) | Lulus, termasuk membuat tugas dari titik |
| Sapuan responsif 6 halaman × 320/375/414/768/1024/1280 | Tanpa overflow |

Catatan:

- Tanpa filter wilayah, REST mengembalikan semua hotspot yang diimpor (mis. 14.261 untuk periode default, termasuk di luar kotak DEMO); pilih wilayah untuk fokus.
- Uji klik langsung pada titik peta belum otomatis (posisi piksel kanvas); dicek manual lewat screenshot.
- DB uji belum berisi data NRT (status NOT_SYNCED); tombol sinkron belum dicoba ke NASA dari frontend.

## 17. Sesi frontend 2026-10-15 — halaman Ringkasan (FE-03, `feat/frontend-dashboard`)

**Status:** IMPLEMENTED, belum commit/push. Branch dari `main` setelah PR #10 (Tasks + Hotspots).

- **Perlu perhatian:** wilayah prioritas tertinggi (keputusan, penjelasan, catatan "bukan peluang kebakaran") dan **Tugas yang menunggu Anda** sesuai peran demo (koordinator: baru/menunggu tinjauan/tindak lanjut; petugas: tugas miliknya yang ditugaskan/dikerjakan).
- **Empat angka** yang dapat diklik: titik panas (total server + belum diverifikasi, dengan cakupan halaman), wilayah prioritas tinggi/sedang, tugas aktif, dan kelengkapan muka air tanah (% hari terukur atau pemberitahuan data terkini tidak tersedia).
- **Peta ringkas** memakai `HotspotMap` dan kunci cache yang sama dengan halaman Titik panas (halaman pertama).
- **Kegiatan terbaru** dengan nama aktor dan label SIMULASI; **provenance** (batas data/as_of, sumber dan waktu pembaruan hotspot). Panel periode/wilayah di samping (tautan "Ubah periode/wilayah").
- `buildActivity` memakai `orderedHistory`, sehingga pembuatan tugas tampil sebelum penugasan pada waktu yang sama.
- `ModulePlaceholder` disederhanakan (bagian khusus dashboard dihapus); kini hanya dipakai `/experiments/ml`.

| Perintah | Hasil |
| --- | --- |
| `npm run lint` / `typecheck` / `build` | Lulus |
| `npm run test:data` | 58/58 lulus (urutan kegiatan) |
| `npm run test:shell` (production, mock) | 12/12 lulus (tes baru `dashboard.test.mjs`) |
| `dashboard.test.mjs` di dev REST ke backend `:8000` | Lulus |
| Sapuan responsif 6 halaman × 320–1280 | Tanpa overflow |

Catatan: tanpa filter wilayah, jumlah titik panas REST mencakup semua hotspot yang diimpor (termasuk di luar kotak DEMO), sedangkan peta dibingkai ke dua wilayah DEMO.

## 18. Sesi frontend 2026-10-15 — Uji prediksi dan QA lokal

**Status:** IMPLEMENTED pada working tree, belum commit/push. Landing page tetap terpisah.

- `/experiments/ml` menggantikan placeholder dan modul diaktifkan pada navigasi/panduan.
- Metrics melalui `useMlMetrics`: pilihan stasiun dari respons, MAE/RMSE model vs persistence
  dalam cm, periode pelatihan/uji, jumlah sampel, versi dan timestamp model.
- Grafik terukur/prediksi/baseline dalam meter dengan tooltip dan legenda, tanpa menyambung
  nilai null; tabel seluruh titik evaluasi tersedia untuk pembaca layar dan inspeksi nilai.
- Kontrak Zod mempertahankan `station_code`, `release_gate`, `limitations`, termasuk gate
  pada forecast. Gate hilang atau tidak dikenal ditolak sebagai payload invalid.
- Form tanggal input memanggil forecast historis +1 hari melalui repository. Envelope REJECTED,
  error/retry, pending, dan hasil tersedia ditampilkan. Perubahan tanggal/stasiun membuang
  tampilan respons sebelumnya; hook query membatalkan respons lama dan memakai cache per input.
- Halaman menjelaskan bahwa periode model tidak mengikuti filter monitoring. Mode terkini
  tetap diberi keterangan eksplisit bahwa eksperimen historis tidak mewakili kondisi sekarang.
- Mock tetap NOT_AVAILABLE; tidak membuat metrik ilmiah rekaan. Angka fixture hanya ada di tes.

| Pemeriksaan | Hasil |
| --- | --- |
| `npm ci --no-audit --no-fund` | PASS; memerlukan akses registry di luar sandbox |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `node --import tsx --test --test-isolation=none tests/data/*.test.ts` | 60/60 PASS |
| Production build dengan konfigurasi REST | PASS |
| Production build dengan konfigurasi mock | PASS |
| Browser ML REST dengan API terkontrol | PASS; metrics, gate, forecast OK/REJECTED, pergantian stasiun, error/retry, empty, dan 320/375/768/1440 px |
| `npm run test:shell` pada production mock | 13/13 PASS; dashboard, GWT, hotspots, peta/fallback/fullscreen, ML, navigasi/responsif dan workflow/reload |

Batas: uji REST sesi ini mengintersep respons API di browser, tidak mengakses backend/database
atau NASA live. Smoke dengan runtime deployment, API publik/CORS, integrasi landing page,
dan acceptance akhir masih diperlukan. Server dan browser lokal memerlukan izin di luar sandbox.

## 19. Sesi frontend 2026-10-15 — integrasi browser ke backend/database asli

**Status:** QA lokal PASS. Menggantikan batas verifikasi backend live pada bagian 18;
host publik dan acceptance akhir tetap terbuka. Pembagian terbaru: teman landing page,
pengguna frontend aplikasi.

- Tambah `npm run test:live` untuk smoke browser data/ML dan workflow dengan respons asli.
  FIRMS live adalah tes opt-in `LIVE_FIRMS_SYNC=1`, terpisah dari suite mock.
- Tambah server loopback `backend/scripts/serve_browser_qa.py`: dependency database asli
  memakai savepoint pada transaksi luar, request diserialkan hingga cleanup dependency,
  dan seluruh write domain di-rollback pada shutdown. Sync NASA ditolak kecuali flag
  `--allow-live-sync` dipilih; flag tersebut mempertahankan cache/riwayat NASA.
- Metrics dan forecast BRG3/BRG6 diverifikasi terhadap artifact, termasuk tanggal target,
  baseline, versi, gate dan penolakan input terkini. Nilai GWT UI cocok API asli.
- Browser dashboard/hotspots dan workflow 2 laporan/9 riwayat/reload/tab baru lulus.
- FIRMS live browser HTTP 200 menerima 50 baris; status database cocok run. Percobaan ulang
  HTTP 429; petugas tidak mendapat tombol sinkron. Key hanya tersimpan pada `.env` backend.
- Keenam halaman dicek setelah data selesai dimuat pada 1440/768/375/320 px: tanpa overflow.
  Screenshot dashboard/ML mobile dan ML desktop diperiksa. Tidak ada error JS/hydration
  atau kegagalan HTTP/CORS pada smoke read/ML.
- Build REST, lint/typecheck, 60 tes data dan Ruff backend lulus. Server QA dihentikan;
  rollback terverifikasi, task/laporan/riwayat kembali ke 0/0/0. Tidak ada task uji tertinggal.

Prosedur, hasil lengkap, env, batasan dan cara mengulang tersedia di
[live-integration-qa.md](live-integration-qa.md). Build lokal terakhir memakai REST port 8001;
server QA tidak dibiarkan berjalan. Bangun ulang sesuai env sebelum menjalankan aplikasi.

## 20. Pembaruan tracker — 15 Oktober 2026

Implementasi ML dan bukti QA browser asli sudah tercatat pada commit `5720bd0`;
panduan startup root pada `8fcef3a`. Status “belum commit/push” pada entri sesi terdahulu
merupakan keadaan saat sesi tersebut, bukan status checkout sekarang. Push/review akhir
tidak disimpulkan hanya dari keberadaan commit lokal.

Deployment ditunda sementara sesuai arahan pengguna. Fokus berikutnya: review kontrak,
acceptance lokal, integrasi landing page, startup bersih, panduan/skenario demo dan bahan
submission. FE-11 bagian deployment serta smoke publik tetap terbuka dan ditunda.
Hasil tes pada tracker merujuk bukti sesi sebelumnya; pembaruan ini hanya mengubah dokumen.

## 21. UI ringkas dan kalender — 15 Oktober 2026

**Status:** IMPLEMENTED pada working tree. Deployment tetap ditunda.

- Keenam halaman mengutamakan data, grafik, status dan aksi. Eyebrow/deskripsi berulang,
  kartu bantuan sidebar dan pengulangan peran dihapus. Sumber/mode diringkas pada bar global;
  label DEMO/SIMULASI, data terkini yang belum tersedia dan gate ML tetap terlihat.
- Filter menjadi panel **Filter data** dengan satu tombol periode dan wilayah. Penjelasan
  cutoff/sumber ada di **Detail data**; indikator lengkap, alasan tambahan, versi aturan dan
  snapshot audit ada di **Detail penilaian**; metadata/metode/batasan ML ada di **Detail eksperimen**.
- Panduan hanya dibuka melalui tombol header; tidak ada modal otomatis. Isi panduan diperbaiki
  agar membedakan data contoh, data server dan laporan SIMULASI.
- Kalender React DayPicker 9.14.0 + date-fns locale Indonesia + Radix Popover mengikuti tema
  aplikasi. Pilihan bulan/tahun, keyboard, batas tanggal, draft rentang dan Terapkan/Batal tersedia.
  Escape atau klik di luar membatalkan draft. Filter tetap terpisah per mode, cutoff tidak berubah.
- ML memakai tanggal tunggal; laporan memakai kalender + input angka jam/menit/detik dalam
  zona waktu lokal browser, lalu dikirim sebagai ISO UTC melalui mekanisme form yang ada.
  Input tanggal native dan datetime-local sudah diganti. API/schema/backend tidak diubah.

Verifikasi: lint, typecheck, build production mock dan REST, serta 61 tes data lulus.
Tes tanggal mencakup WIB, UTC negatif, pergantian DST dan tahun kabisat. Browser ML dengan
respons REST terkontrol lulus untuk kalender, metrics, forecast OK/REJECTED, pergantian stasiun,
detail via keyboard dan error/retry. Suite browser final mock **14/14 PASS**, termasuk workflow/follow-up/reload, validasi
waktu laporan, kalender draft/batal/sorotan/batas/keyboard, serta enam halaman pada
1440/768/375/320 px tanpa overflow. Screenshot kalender 320 px, dashboard desktop/mobile,
prioritas mobile dan ML REST desktop/mobile diperiksa.

Batas verifikasi: sesi UI ini tidak mengulang koneksi database/NASA asli. Bukti live pada bagian 19
merupakan hasil sesi sebelumnya; selector suite live diperbarui mengikuti kalender baru.
Screenshot desktop/mobile ditulis di `/tmp/gambutops-ui-qa/` (di luar Git). Build akhir memakai
mock; bangun ulang dengan env REST untuk memakai backend. Server QA dihentikan setelah verifikasi.


## 22. Dropdown select konsisten — 15 Oktober 2026

**Status:** IMPLEMENTED pada working tree. Deployment tetap ditunda.

- Tambah Select bersama berbasis Radix Select 2.4.1: chevron, penanda pilihan, sorotan hover/fokus,
  menu dengan scroll dan pembatas viewport. Mendukung keyboard, typeahead, opsi disabled,
  placeholder serta kelompok opsi.
- Terapkan pada pengguna/peran demo, wilayah, stasiun groundwater, stasiun ML, prioritas,
  petugas pada dialog pembuatan tugas dan penugasan ulang, serta bulan/tahun kalender.
  Dropdown native tidak lagi dipakai sebagai kontrol UI aplikasi.
- Stasiun menampilkan kode ringkas pada trigger; menu mengelompokkan wilayah dan menampilkan
  akhir periode pengukuran. Menu peran menampilkan keterangan koordinator/petugas.
- Opsi Semua wilayah dan Tentukan nanti tetap dipetakan ke nilai kosong/null yang sama.
  Form tugas memakai Controller React Hook Form; kontrak API dan state machine tetap sama.
- Selaraskan Radix Dialog ke 1.3.1 agar berbagi layer/focus scope dengan Select/Popover.
  Escape menutup dropdown terlebih dahulu tanpa menutup dialog induk. Perbaiki lapisan
  navigasi kalender agar pemilih bulan/tahun dapat diklik.

Verifikasi: lint, typecheck, build produksi mock/REST, 61 tes data dan **15/15 tes browser mock PASS**.
Mencakup Home/End/Enter/Escape, opsi kosong, stasiun/URL, dialog 320 px, prioritas dan assignee
tersimpan, penugasan setelah tugas OPEN, reload, workflow, kalender bertingkat dan drawer.
Screenshot stasiun desktop, wilayah 320 px, dialog tugas 320 px dan kalender diperiksa;
file QA berada di `/tmp/gambutops-select-qa/` (di luar Git).

Selector suite live/ML diperbarui agar memilih melalui menu yang terlihat. Tes database/NASA
live tidak diulang pada sesi UI ini. Browser ML pada build REST dengan respons API terkontrol
**PASS**: pergantian stasiun, kalender dengan dropdown bulan/tahun, forecast OK/REJECTED,
detail via keyboard, error/retry dan responsif. Build akhir dikembalikan ke mock dan server QA
dihentikan; server development pengguna pada port 3000 tidak dihentikan.


## 23. Pemulihan cache development — 15 Oktober 2026

Server development lama masih menyimpan jalur Radix bersarang dari sebelum deduplikasi npm.
`npm ls` memverifikasi dependency valid; `react-primitive` kini terselesaikan dari paket root.
Server proyek di port 3000 dihentikan, cache `.next/dev` dipindahkan ke backup `dev.stale-*`
di dalam `.next`, lalu server dijalankan ulang dengan konfigurasi NEXT_PUBLIC sebelumnya.
Tidak ada perubahan dependency tambahan atau kontrak aplikasi pada perbaikan ini.

Smoke browser development PASS: keenam route HTTP 200, judul halaman termuat, tidak ada
ENOENT/Module not found atau exception browser, serta menu wilayah dan pemilih tahun
kalender dapat dibuka/ditutup. Server development dibiarkan aktif di http://localhost:3000.
## 18. Sesi frontend 2026-10-15 — landing page (`feat/landing-page`)

**Status:** IMPLEMENTED, belum commit/push. Branch dari `main` setelah PR #11.

- `/` tidak lagi redirect ke `/dashboard`; menjadi landing statis (server component, tanpa MapLibre/Recharts/panduan otomatis).
- Struktur route: root layout hanya `<html>/<body>`; halaman aplikasi dipindah ke `src/app/(app)/` dengan layout `AppProviders` + `AppShell`. URL tidak berubah. Halaman 404 berdiri sendiri dengan tautan ke Ringkasan dan beranda.
- Isi: header lengket (logo, anchor, "Buka aplikasi"), hero, masalah (3 kartu, tanpa angka tanpa sumber), Cegah·Deteksi·Tindak dengan screenshot, alur tugas + dua peran (teks dari `guide-content`), data & batasan, CTA penutup + catatan darurat 112/BPBD, footer stack. Metadata + Open Graph.
- Screenshot asli aplikasi (data contoh DEMO) di `public/landing/*.jpg` (±500 KB total), dibuat oleh `scripts/capture-landing-screens.mjs`; gambar memakai `next/image` `unoptimized` dengan ukuran tetap (tanpa layout shift).
- Di bawah 400 px logo hanya ikon agar tombol "Buka aplikasi" muat.

| Perintah | Hasil |
| --- | --- |
| `npm run lint` / `typecheck` / `build` | Lulus; semua route tetap statis |
| `npm run test:data` | 58/58 lulus |
| `npm run test:shell` (production, mock) | 13/13 lulus (tes baru `landing.test.mjs`: satu h1, section, alt gambar, aset 200, anchor, CTA, tanpa overflow 1024/768/375/320) |
| Sapuan responsif 6 halaman aplikasi × 320–1280 | Tanpa overflow |

### 18b. Login demo sebelum masuk aplikasi

- `/login` (di luar shell aplikasi): daftar akun dari `listUsers`, pilih akun → `repository.signIn` (REST: `GET /auth/me` dengan Bearer peran, peran harus cocok; mock: akun demo dikenal) → sesi di `localStorage` → kembali ke `?next=`.
- `AuthGate` membungkus `src/app/(app)/layout.tsx`: tanpa sesi → `/login?next=<path+query>`; selama status sesi belum diketahui tampil "Memeriksa sesi…". `safeNextPath` menolak `//…`, `/\…`, URL absolut, dan `/login`.
- Pemilih peran di header diganti **menu akun** (nama, peran, tombol Keluar). Berganti peran = keluar lalu masuk dengan akun lain; halaman tujuan dipertahankan.
- Landing: tombol "Masuk" / "Masuk ke aplikasi" langsung ke `/login`; teks "Tanpa login" diganti.
- Tes: helper `tests/shell/helpers.mjs` (`signIn`, `signOut`, `switchRole`); tes baru `auth.test.mjs` (semua route dijaga, kembali ke tujuan, sesi bertahan setelah reload, `next` berbahaya diabaikan, sesi rusak, 320 px). Semua tes lain masuk lewat halaman login.

| Perintah | Hasil |
| --- | --- |
| `npm run lint` / `typecheck` / `build` | Lulus (`/login` statis) |
| `npm run test:data` | 60/60 lulus (signIn REST + mock) |
| `npm run test:shell` (production, mock) | 14/14 lulus |
| `auth`, `workflow`, `dashboard` test di dev REST ke backend `:8000` | Lulus; `GET /auth/me` tercatat di log backend |
| Sapuan responsif `/`, `/login`, 6 halaman aplikasi × 320–1280 | Tanpa overflow (ditemukan dan diperbaiki: header kartu login 320 px pada mode SERVER) |

## 19. Style guide v2 dari referensi (`feat/landing-page`)

`frontend/style.md` diganti dengan v2 (target; kode masih v1). Diturunkan dari d-form.doscom.org (struktur landing), recruitment.doscom.org (tipografi display Bricolage Grotesque, navbar pill, animasi scroll dengan Lenis + Motion) dan halaman login fotomomen.studio/admin (split-screen, label kapital, input bergaris bawah, tombol glow). Isi panel admin fotomomen tidak dapat dilihat (butuh login), sehingga gaya panel diturunkan dari halaman login. Keputusan: warna utama tetap hijau GambutOps `#15803D` (bukan biru referensi); `primary-2 #22C55E` dan `info-bright #1D90FF` hanya untuk dekorasi karena kontras teks < 4,5:1. Animasi memakai komponen React Bits yang dipetakan per section; aplikasi/admin hanya animasi mikro. Urutan migrasi: landing → login → shell admin → halaman modul.

## 20. Landing v2 sesuai style.md (`feat/landing-page`)

- Dependensi baru (versi pasti): `motion@12.43.0`, `gsap@3.15.0`, `@gsap/react@2.1.2`, `lenis@1.3.26`. Font Bricolage Grotesque + Poppins lewat `next/font` hanya pada subtree landing (`themeV2ClassName`); `/dashboard` tidak memuatnya.
- Komponen React Bits dari registry resmi (`reactbits.dev/r/*-TS-TW.json`), ditinjau (hanya impor react/gsap/motion, tanpa akses jaringan/penyimpanan), lalu diperbaiki seminimal mungkin agar lolos TS strict (`noUncheckedIndexedAccess`) dan aturan React Hooks. `LogoLoop` (1.344 baris) diganti marquee CSS.
- Token v2 per subtree (`.theme-v2`), latar `bg-glow-hero`, `bg-band`, `bg-grid-overlay`, `bg-dot-grid`; marquee berhenti saat hover/fokus dan dimatikan saat reduced motion.
- Isi: hero "Cegah kebakaran gambut *sebelum meluas.*", angka faktual (2 wilayah, 8 stasiun, 2 satelit VIIRS, 6 modul), pernyataan masalah ScrollReveal + 3 kartu, panel lengket Cegah·Deteksi·Tindak, 6 fitur, alur 5 langkah + peran, data & batasan + marquee sumber, FAQ (`<details>`), band CTA, catatan darurat, footer.
- Aman: elemen beranimasi tampil tanpa JS (`<noscript>` style untuk `.js-reveal`/`.split-parent`); Lenis mati saat reduced motion.
- Diperbaiki saat uji: `--font-display` merujuk variabel tema yang tidak diterbitkan `@theme inline` sehingga H1 jatuh ke Poppins; judul hero 4 baris di 1440 px.

| Perintah | Hasil |
| --- | --- |
| `npm run lint` / `typecheck` / `build` | Lulus |
| `npm run test:data` | 60/60 |
| `npm run test:shell` (production, mock) | 14/14; `landing.test.mjs` kini menguji navbar pill, anchor, FAQ keyboard, reduced motion, dan tampilan tanpa JavaScript |
| Sapuan responsif `/`, `/login`, 6 halaman aplikasi × 320–1280 | Halaman tanpa overflow (marquee sengaja melebar di dalam wadah `overflow-hidden`) |

### 20b. Landing diringkas

Atas masukan: teks dikurangi drastis (±215 kata di `<main>`, halaman desktop 9.028 → 6.257 px, HP 13.141 → 7.001 px), satu ide per section. Dihapus: section Fitur, tiga kartu masalah, poin-poin per langkah, kartu mengambang hero, daftar centang, marquee sumber, kartu peran. Juga dihapus: bayangan/glow tombol, titik di badge, pola titik di latar, bullet bulat, dan pemisah "·" dekoratif (0 di `<main>`). `style.md` diperbarui: tombol tanpa bayangan, larangan titik dekoratif dan teks panjang. `landing.test.mjs` kini membatasi ≤220 kata dan memeriksa tombol tanpa bayangan. test:shell 14/14.

### 20c. Landing: foto hero, tanpa DEMO/angka/badge

- Hero memakai foto Unsplash (Unsplash License) oleh Yosafat Gusti, Kapuas Hulu, Kalimantan Barat (`public/landing/hero-kalimantan.jpg`, 1280×960, ±310 KB) dengan kredit kecil; juga dipakai untuk Open Graph. `dashboard.jpg` dan langkah pengambilannya dihapus.
- Dihapus: badge "JOINTS Hackathon 2026, prototipe", baris angka (2/8/2/6), seluruh teks "DEMO" di landing (badge gambar, FAQ, footer).
- Alur: setiap langkah kini punya penjelasan satu baris.
- `landing.test.mjs` memeriksa tidak ada teks demo/badge acara/baris angka, foto hero + kredit, dan penjelasan per langkah. ±208 kata di `<main>`; test:shell 14/14.

### 20d. Performa scroll, ilustrasi dinamis, peta MapLibre, login v2

- **Audit performa:** scroll terasa berat karena Lenis (menahan input ±1,1 s dan menjalankan JS tiap frame), animasi SVG berulang via JS yang tetap jalan di luar layar, `filter: blur` per kata pada ScrollReveal, dan `backdrop-filter` navbar. Diperbaiki: Lenis dihapus (scroll native, dependensi `lenis` dicabut), animasi berulang jadi CSS `transform`/`opacity` (kelas `lp-*` di `globals.css`) yang berhenti di luar layar (`data-paused`) dan saat reduced motion, blur dihapus. Saat diam: 60 layout/detik → 0. Scroll 60 langkah (CPU 4×): layout 475 → 116, recalc style 869 → 239.
- **Hero:** foto diganti panel pemantauan SVG (kontur kubah gambut, sapuan satelit pelan, denyut titik panas, kartu titik panas + sparkline air tanah). Foto tetap dipakai sebagai gambar Open Graph.
- **Cara kerja:** screenshot diganti visual dinamis: grafik air tanah yang tergambar saat terlihat, peta **MapLibre** titik panas pemantauan terkini dari repository (statis tanpa gesture, dimuat lewat `next/dynamic` saat mendekati layar, sorotan deteksi terbaru), daftar prioritas → "Tugas dikirim".
- Teks: kredit foto dan screenshot alur dihapus; "Jujur soal batasan" → "Prinsip penggunaan data".
- **Login v2:** split 50/50 (form kiri, panel kontur gelap kanan; HP: pita atas), kartu akun dengan ikon, tombol 48 px dengan spinner. Logika masuk tidak berubah. Kontur dipakai bersama lewat `src/components/landing/topo-backdrop.tsx`.
- Tes: `landing.test.mjs` disesuaikan (ilustrasi berlabel, peta siap, hitungan kata tanpa label ilustrasi, FAQ via `#faq details` karena atribusi MapLibre juga `<details>`). `landing` dan `auth` lulus di dev.


## Integrasi PR #13 — 16 Oktober 2026

- Gabungkan `origin/main` ke `feat/backend-ml`; selesaikan 16 file konflik.
- Pertahankan landing/login dan route group dari main bersama UI ML, kalender, Select,
  serta peta hotspot nasional dari branch PR. Penggantian peran memakai keluar/masuk.
- Gabungkan dependency dan lockfile, CSS kalender/landing, dokumentasi dan tes kedua branch.
- Sesuaikan tes ML, kalender, Select dan integrasi REST agar melewati login; tambahkan
  respons `/auth/me` pada fixture browser ML REST.
- Verifikasi: backend **66 passed, 4 skipped**; frontend **65 tes data passed**,
  lint, typecheck, build produksi mock dan **17 tes browser mock passed**.
- Tidak menjalankan sinkronisasi NASA atau tes database live pada sesi resolusi ini.
