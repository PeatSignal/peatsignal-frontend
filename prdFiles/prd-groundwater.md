# PRD Fitur 1 — Groundwater Intelligence (P0)

## User story
Sebagai koordinator, saya ingin memilih stasiun dan melihat tren muka air tanah historis agar dapat menentukan lokasi yang perlu ditinjau.

## UI
Dropdown stasiun; date range; grafik garis GWT; kartu nilai terakhir/rata-rata/terdalam; gap dan missing count; tooltip tanggal, unit, sumber; label HISTORIS.

## Perhitungan
GWT negatif berarti di bawah permukaan; nilai semakin negatif berarti muka air semakin dalam. Hitung tren 7/14 hari hanya untuk observasi valid yang jaraknya sesuai. Tampilkan batas penelitian sebagai konteks, bukan probabilitas kebakaran atau threshold universal.

## API
`GET /api/v1/stations`; `GET /api/v1/stations/{id}/groundwater?from=&to=`.

## Acceptance criteria
- [ ] BRG6 dan BRG3 tampil dari DB.
- [ ] Filter tanggal memperbarui grafik dan KPI.
- [ ] Gap tampil sebagai gap, bukan nilai nol.
- [ ] Data GWT 2018–2019 tidak diberi label live.
