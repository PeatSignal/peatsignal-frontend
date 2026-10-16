# GambutOps — Modular PRD

**Satu aplikasi, implementasi bertahap.** Tagline: *Prevent · Detect · Act*. Target: prototype JOINTS Hackathon 2026.

## Urutan pengerjaan
1. `prd.md` — visi, pengguna, scope.
2. `prd-architecture.md` — stack, API, integrasi.
3. `prd-data.md` — pipeline dataset dan database.
4. `prd-groundwater.md` — monitoring muka air (P0).
5. `prd-fire-detection.md` — NASA FIRMS (P0).
6. `prd-decision-engine.md` — prioritas pemeriksaan (P0).
7. `prd-field-verification.md` — tugas dan laporan (P0).
8. `prd-ml-forecasting.md` — prediksi ML (P1).
9. `prd-roadmap.md` — sprint, acceptance criteria, demo.

## Aturan produk
- **Historical Replay**: GWT dan hotspot harus sejaman; jangan pakai informasi masa depan.
- **Current Monitoring**: tampilkan hotspot terbaru, tetapi GWT 2018–2019 **tidak** boleh ditampilkan sebagai GWT terkini.
- Hotspot adalah anomali panas satelit, bukan bukti kebakaran terkonfirmasi.
- Skor engine adalah **prioritas pemeriksaan heuristik**, bukan probabilitas kebakaran ilmiah.
- Data laporan petugas simulasi diberi label **SIMULASI**.
- ML +1 hari hanya dapat dijalankan jika pengamatan GWT terbaru pada tanggal prediksi tersedia.

## Referensi
- Data GWT: https://pmc.ncbi.nlm.nih.gov/articles/PMC8847808/
- FIRMS API: https://firms.modaps.eosdis.nasa.gov/api/area/
- CHIRPS: https://developers.google.com/earth-engine/datasets/catalog/UCSB-CHG_CHIRPS_DAILY
