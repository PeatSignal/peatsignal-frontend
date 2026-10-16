# PRD Data & Database (Tahap 1)

## Sumber
- `mmc1.xlsx` sheet `gwt` (P0) dan `wrc` (arsip penelitian).
- NASA FIRMS VIIRS CSV/API (P0).
- CHIRPS hujan harian (P1 opsional).

## Temuan audit awal
`gwt` 3.929 baris, 3.536 valid numerik, 393 `#N/A`; 8 stasiun; periode gabungan Apr 2018–Des 2019. `wrc` 110 baris. BRG5 mempunyai duplikasi tanggal; BRG6 dan BRG3 kandidat eksperimen ML. **Pipeline wajib menghitung ulang audit ini dan memvalidasi hasilnya.**

## ETL
1. Simpan file raw dan SHA-256.
2. Konversi serial Excel ke tanggal ISO, `#N/A` menjadi NULL.
3. Simpan GWT dalam meter dengan tanda negatif apa adanya.
4. Validasi `(station_id, observed_date)` unik; duplikat ditandai untuk resolusi eksplisit.
5. Hitung missing values, gap kalender, min/max, tanggal pertama/terakhir.
6. Jangan menginterpolasi celah panjang otomatis; jangan mengklaim seluruh nilai adalah pengukuran langsung karena sumber mungkin sudah melakukan interpolasi pendek.
7. Data tanpa koordinat stasiun terverifikasi tidak diberi pin peta pasti.

## Tabel minimal
- `data_sources(id, name, url, sha256, imported_at)`
- `stations(id, region, lat NULL, lon NULL, coordinate_source NULL)`
- `groundwater_observations(id, station_id, observed_date, gwt_m NULL, quality_flag, source_id, UNIQUE(station_id, observed_date))`
- `hotspots(id, external_key UNIQUE, source_product, acquired_at, geom, frp NULL, confidence_raw NULL, verification_status)`
- `priority_assessments(id, mode, as_of, priority, reasons_json, inputs_json, rule_version)`
- `inspection_tasks(id, assessment_id NULL, hotspot_id NULL, status, title, assignee_id NULL)`
- `field_reports(id, task_id, observed_at, result, note, is_simulation, evidence_url NULL)`
- `users(id, role, display_name)`.

## Acceptance criteria
- [ ] Dua kali import tidak menghasilkan duplikasi.
- [ ] Data kosong tidak berubah menjadi nol.
- [ ] Audit CSV/JSON bisa dihasilkan ulang.
- [ ] Provenance lengkap pada setiap observasi.
- [ ] Tanggal historis dan terkini tidak dicampur.
