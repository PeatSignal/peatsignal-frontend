# QA browser dengan backend asli — 15 Oktober 2026

Frontend production REST telah diuji melalui HTTP ke FastAPI lokal dengan database
Supabase yang dikonfigurasi di `backend/.env`. Tidak ada intersepsi/mocking respons API.

## Hasil

| Pemeriksaan | Hasil |
| --- | --- |
| Smoke backend ASGI + Supabase | PASS; 8 stasiun, GWT, hotspot, ML dan workflow; write di-rollback |
| Browser metrics dan forecast BRG3/BRG6 | PASS; versi, MAE/RMSE dan forecast cocok artifact lokal |
| Forecast input 2026-10-15 tanpa GWT lengkap | REJECTED, pesan terlihat di UI |
| Browser GWT | PASS; nilai tabel cocok data API asli |
| Hotspot pagination dan reset wilayah | PASS; 100 titik/halaman, halaman 2, reset halaman 1 |
| Mode terkini vs historis | PASS; GWT terkini kosong dan ML tetap dijelaskan sebagai historis |
| Workflow tugas/laporan | PASS; 2 laporan, 9 riwayat, tindak lanjut, verifikasi dan reload/tab baru |
| Dashboard dan hotspot interactive tests pada REST | 2/2 PASS, termasuk buat tugas dari hotspot |
| FIRMS live dari browser | PASS; HTTP 200, 50 baris diterima dari NASA, status tersimpan |
| Cooldown FIRMS / peran petugas | PASS; request berikutnya HTTP 429, tombol tidak tersedia bagi petugas |
| Lint/typecheck/60 tes data frontend dan Ruff backend | PASS |
| Build frontend production REST | PASS |
| Enam halaman setelah data termuat, 1440/768/375/320 px | PASS; tanpa overflow, screenshot dashboard/ML diperiksa |

Snapshot evaluasi, task/laporan dan perubahan status hotspot dari tes browser berada dalam
transaksi QA. Penghentian server memicu rollback. Lifecycle server memeriksa kembali jumlah
task, laporan dan riwayat. Cache serta riwayat **FIRMS live** memakai transaksi terpisah dan
dipertahankan sebagai data sumber yang nyata. Key dimuat melalui script konfigurasi backend
ke `.env` yang di-ignore; key tidak dikirim ke browser.

## Menjalankan ulang

Prasyarat: dependency terpasang, database aplikasi sudah dimigrasi/diisi, artifact di
`backend/var/ml`, browser Playwright atau executable Chromium yang tersedia. Tes ini memakai
data aplikasi yang ada; bukan migration test dan tidak melakukan seed otomatis.

Terminal pertama, dari `backend/`:

```bash
CORS_ALLOWED_ORIGINS=http://127.0.0.1:3100,http://localhost:3100 \
  .venv/bin/python scripts/serve_browser_qa.py
```

Server hanya bind ke loopback port 8001, menyerialkan request pada koneksi/transaksi QA,
dan secara default menolak sinkron FIRMS agar tidak ada write di luar rollback.

Terminal kedua, dari `frontend/` (nilai token harus sesuai settings backend; contoh ini
untuk development dengan token demo default):

```bash
NEXT_PUBLIC_DATA_SOURCE=rest \
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001/api/v1 \
NEXT_PUBLIC_DEMO_COORDINATOR_TOKEN=demo-coordinator-token \
NEXT_PUBLIC_DEMO_FIELD_OFFICER_TOKEN=demo-field-officer-token npm run build
npm run start -- --hostname 127.0.0.1 --port 3100
```

Terminal ketiga, dari `frontend/`:

```bash
SHELL_BASE_URL=http://127.0.0.1:3100 \
LIVE_API_BASE_URL=http://127.0.0.1:8001/api/v1 \
LIVE_SCREENSHOT_DIR=/tmp/gambutops-live-qa npm run test:live
```

Jika Chromium Playwright belum terpasang, gunakan `PLAYWRIGHT_EXECUTABLE_PATH` untuk browser
lokal, misalnya `/opt/brave.com/brave/brave`. `test:live` menjalankan smoke data/ML dan workflow;
FIRMS live dilewati kecuali flag opt-in di bawah diisi. Tes membandingkan hasil dengan artifact
lokal sehingga artifact server dan checkout harus sama. Screenshot opsional ditulis di luar Git.

Untuk menguji NASA live, hentikan server QA, konfigurasi key lalu jalankan ulang dengan
`--allow-live-sync`. Flag ini mengizinkan cache/riwayat NASA dipersistenkan di database aplikasi:

```bash
# Dari backend/:
.venv/bin/python scripts/configure_firms_key.py
CORS_ALLOWED_ORIGINS=http://127.0.0.1:3100,http://localhost:3100 \
  .venv/bin/python scripts/serve_browser_qa.py --allow-live-sync
# Dari frontend/, dengan server frontend REST masih aktif:
LIVE_FIRMS_SYNC=1 SHELL_BASE_URL=http://127.0.0.1:3100 \
LIVE_API_BASE_URL=http://127.0.0.1:8001/api/v1 \
  node --test --test-isolation=none tests/integration/firms-live.test.mjs
```

HTTP 429 pada target yang sudah disinkronkan diterima sebagai bukti cooldown; itu bukan bukti
fetch NASA baru. Hasil HTTP 200 dan 50 baris di tabel hasil berasal dari percobaan pertama sesi ini.
Setelah tes, hentikan server QA dengan Ctrl+C dan periksa `Browser QA rollback verified: True`.

## Batas verifikasi

Pengujian memakai runtime lokal dan CORS localhost/127.0.0.1. Host API publik, TLS, reverse
proxy, domain frontend deployment, integrasi landing page dan acceptance akhir belum diuji.
Build `.next` sesi ini menggunakan REST lokal; bangun ulang dengan env deployment sebelum rilis.
Untuk kembali ke mode mock, build ulang dengan `NEXT_PUBLIC_DATA_SOURCE=mock NEXT_PUBLIC_API_BASE_URL=`.
