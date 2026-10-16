# PRD Fitur 4 — Prevention Decision Engine (P0)

## Tujuan
Menghasilkan **prioritas pemeriksaan**, bukan probabilitas kebakaran. Aturan transparan dan diberi versi.

## Input
GWT dan trennya (jika tersedia dan sezaman), hotspot FIRMS, laporan verifikasi, dan CHIRPS hanya jika integrasi P1 berhasil. Semua input memiliki waktu, sumber, kualitas.

## Aturan awal (heuristik prototype, perlu validasi)
- Hotspot belum diverifikasi → `REVIEW` / perlu inspeksi.
- Tren GWT menurun dan data cukup → `MONITOR` / pemeriksaan tata air.
- Hotspot berulang + laporan mendukung → `ESCALATE`.
- Data kurang atau tidak sezaman → `INSUFFICIENT_DATA` (tidak boleh diartikan aman).

Konversi ke prioritas `LOW/MEDIUM/HIGH/INSUFFICIENT_DATA` melalui tabel aturan terkonfigurasi. Jangan membuat ambang angka seolah-olah ilmiah tanpa sumber/validasi.

## Output
`{mode, as_of, priority, reason_codes, explanation, missing_inputs, rule_version, recommended_actions, scientific_status:'heuristic_not_validated'}`.

## UI
Daftar prioritas, alasan dan input yang dipakai, tanggal, status data, tombol `Buat Tugas Pemeriksaan`.

## Acceptance criteria
- [ ] Input identik menghasilkan output identik.
- [ ] Riwayat assessment menyimpan input dan versi aturan.
- [ ] Historical replay tidak membaca informasi setelah `as_of`.
- [ ] Data tidak tersedia menghasilkan INSUFFICIENT_DATA.
- [ ] Tombol membuat tugas tersimpan di DB.
