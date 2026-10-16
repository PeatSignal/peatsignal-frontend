# PRD Induk — GambutOps

## Ringkasan
Aplikasi web pendukung pemantauan kerentanan kebakaran gambut, deteksi anomali panas satelit, dan verifikasi tindak lanjut. Kebaruan diarahkan pada **keputusan dan tindakan yang dapat ditelusuri**, bukan peta hotspot saja.

## Persona
- **Koordinator**: melihat indikator, menilai prioritas, menugaskan inspeksi.
- **Petugas**: menerima tugas dan mengirim hasil verifikasi.
- **Peninjau demo**: memutar data historis dan melihat alasan keputusan.

## Tujuan
1. Menyajikan data muka air tanah historis yang transparan.
2. Menampilkan anomali panas NASA FIRMS dengan waktu/sensor.
3. Mengubah data tersedia menjadi prioritas pemeriksaan dengan alasan eksplisit.
4. Mendukung alur indikasi → tugas → laporan → status.
5. Menguji model GWT satu hari ke depan terhadap baseline sebagai P1.

## Scope
**P0:** pipeline data, dashboard, Groundwater Intelligence, Satellite Fire Detection, Prevention Decision Engine, Field Action & Verification. **P1:** ML Forecasting dan CHIRPS bila tersedia.

**Di luar scope:** prediksi kebakaran nasional, deteksi api bawah tanah, deteksi deforestasi otomatis, sensor real-time, rute patroli, chatbot.

## Halaman
`/dashboard`, `/groundwater`, `/hotspots`, `/priorities`, `/tasks`, `/experiments/ml` (P1).

## Mode
- **Historical Replay:** semua data dibatasi oleh `as_of` dan provenance; label HISTORIS.
- **Current Monitoring:** hotspot baru + tanggal sinkronisasi; jika GWT live tidak tersedia, tulis 'Data muka air terkini tidak tersedia'.

## Nonfungsional
Responsif, UI Bahasa Indonesia, API keys hanya server-side, state loading/error/empty, filter tanggal konsisten, log alasan dan versi aturan, auth role untuk perubahan data.

## Metrik selesai
- [ ] Dashboard dari API dan database, bukan angka fiktif.
- [ ] Peta hotspot dengan waktu dan sumber.
- [ ] Prioritas pemeriksaan disertai alasan dan status kelengkapan data.
- [ ] Tugas dan laporan tersimpan setelah reload.
- [ ] Tidak ada pencampuran data GWT 2019 dengan hotspot 2026 dalam satu skor.
- [ ] Demo publik dapat digunakan tanpa developer.
