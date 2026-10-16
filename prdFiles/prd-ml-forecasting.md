# PRD Fitur 2 — Groundwater ML Forecasting (P1)

## Tujuan
Uji prediksi GWT **satu hari ke depan**, bukan prediksi kebakaran. Kandidat BRG6 dan BRG3 dari audit dataset.

## Pipeline
1. Normalisasi GWT per stasiun, urut tanggal.
2. Buat lag 1/3/7 hari dan rolling mean yang digeser (`shift`) agar tanpa data leakage.
3. Jangan menyeberangkan gap panjang seolah hari berurutan.
4. Baseline persistence: `GWT(t+1)=GWT(t)`.
5. Model: `RandomForestRegressor`.
6. Split train/validation/test **kronologis**; tuning hanya sebelum test.
7. Evaluasi MAE dan RMSE (cm), ukuran test, selisih dibanding baseline.
8. Simpan `model_version`, training period, fitur, metrics, model `.joblib`.

## Integrasi
Halaman `/experiments/ml`: plot actual vs prediction, baseline vs model, input dan batasan. `GET /api/v1/ml/metrics`; `POST /api/v1/ml/forecast`.

## Gate rilis
Jika ML tidak mengalahkan baseline, tampilkan sebagai **eksperimen**, jangan dipakai dalam decision engine. Jika input GWT terbaru tidak tersedia, jangan tampilkan forecast kondisi 2026. Prediksi historis hanya pada tanggal dengan lag lengkap.

## Acceptance criteria
- [ ] Reproducible training script.
- [ ] Test kronologis dan baseline dibandingkan pada tanggal sama.
- [ ] Plot dan metrik test transparan.
- [ ] API menolak input tidak cukup.
