# PRD Fitur 3 — Satellite Fire Detection (P0)

## User story
Sebagai koordinator, saya ingin melihat anomali panas dari satelit agar dapat menentukan titik yang perlu diperiksa.

## Sumber
NASA FIRMS Area API (MAP_KEY gratis, server-side); fallback file CSV historis NASA. Produk VIIRS harus menyimpan jenis produk, sensor, waktu pengamatan, dan sinkronisasi.

## Backend
Import latitude, longitude, acq_date, acq_time, satellite/instrument, confidence, FRP jika tersedia. Bentuk key stabil untuk dedup; simpan UTC; filter bbox dan tanggal; cache data agar tidak memanggil NASA setiap render.

## UI
MapLibre point layer, popup detail, filter tanggal/produk/area, daftar hotspot dan fokus peta, `last_synced_at`, status `UNVERIFIED`.

## Aturan
Hotspot bukan bukti kebakaran; confidence tidak boleh disajikan sebagai probabilitas api. Tidak boleh mengklaim deteksi api bawah tanah. Lokasi stasiun tanpa koordinat sah tidak dipakai untuk perhitungan jarak.

## Acceptance criteria
- [ ] Import CSV/API menghasilkan hotspot nyata pada peta.
- [ ] Reimport tidak menggandakan data.
- [ ] Detail mencantumkan waktu, sumber, sensor, FRP jika ada.
- [ ] Error NASA tidak menghilangkan cache historis.
