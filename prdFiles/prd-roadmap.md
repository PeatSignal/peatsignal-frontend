# Roadmap — Implementasi Bertahap

## Milestone 0 — Fondasi (sprint 1)
Next.js, FastAPI, Supabase, environment, auth demo, `/health`, migration DB. **Gate:** frontend publik berhasil memanggil API health.

## Milestone 1 — Data + Groundwater (sprint 1)
ETL `mmc1.xlsx`, audit otomatis, API stasiun, grafik. **Gate:** BRG6/BRG3 dan sumber tampil; missing values ditangani.

## Milestone 2 — FIRMS + Peta (sprint 2)
API key, CSV fallback, import, MapLibre. **Gate:** hotspot NASA nyata muncul, timestamp/sensor jelas.

## Milestone 3 — Decision Engine (sprint 2–3)
Rules v0.1, test, mode historis/terkini, alasan prioritas. **Gate:** data kurang tidak menghasilkan label aman; tidak ada pencampuran tanggal.

## Milestone 4 — Field Workflow (sprint 3)
Tugas, laporan, state machine, dua role. **Gate:** hotspot/assessment → tugas → laporan → status tersimpan.

## Milestone 5 — ML (sprint 3–4, paralel)
Baseline, Random Forest, evaluasi kronologis, UI eksperimen. **Gate:** hasil dibanding baseline, tidak diklaim real-time tanpa input live.

## Milestone 6 — Submission (sprint 4)
Freeze fitur, smoke test URL publik, rekam video, pitch deck, backup data. **Gate:** demo browser incognito tanpa intervensi developer.

## Pembagian tim
1. Data/ML: ETL, audit, baseline, training.
2. Geospatial: FIRMS, import, peta.
3. Backend: DB, API, decision engine, workflow.
4. Frontend: UI, grafik, halaman, integrasi.

## Skenario demo
Pilih Historical Replay → grafik GWT → hotspot historis → prioritas dan alasan → buat tugas → petugas kirim laporan SIMULASI → koordinator verifikasi → opsional evaluasi ML.

## Risiko/fallback
- FIRMS API gagal → CSV historis NASA berlabel sumber.
- Koordinat stasiun tidak terverifikasi → stasiun hanya pada grafik, bukan pin.
- Tidak ada hotspot yang cocok waktu/lokasi → jangan mengarang korelasi; tampilkan modul terpisah.
- ML tidak lebih baik dari baseline → hasil eksperimen saja.
- Waktu habis → selesaikan milestone 0–4, tunda ML.

## Definition of Done
- [ ] P0 end-to-end pada URL publik.
- [ ] Semua sumber dan tanggal transparan.
- [ ] Test ETL, rule engine, status dan E2E happy path.
- [ ] Tidak ada secret dalam frontend/repo.
- [ ] Tidak ada klaim kebakaran pasti atau prediksi nasional.
