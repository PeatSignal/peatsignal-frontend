# PRD Fitur 5 — Field Action & Verification (P0)

## User story
Sebagai koordinator, saya ingin menugaskan inspeksi dan melihat laporan; sebagai petugas, saya ingin melaporkan hasil agar indikasi dapat diverifikasi.

## Peran
`coordinator` membuat/menugaskan/meninjau; `field_officer` menerima tugas dan mengirim laporan. Akun demo boleh dibuat, tetapi perubahan data tidak anonim.

## Alur
`OPEN → ASSIGNED → IN_PROGRESS → SUBMITTED → VERIFIED | DISMISSED | NEEDS_FOLLOWUP`; `NEEDS_FOLLOWUP → ASSIGNED`.

## Form
Judul tugas, referensi assessment/hotspot, prioritas, assignee; laporan berisi waktu observasi, hasil, catatan, bukti opsional, `is_simulation`. Semua laporan demo diberi label SIMULASI.

## API
`POST/GET /api/v1/tasks`; `GET/PATCH /api/v1/tasks/{id}`; `POST /api/v1/tasks/{id}/reports`.

## Acceptance criteria
- [ ] Tugas dari assessment/hotspot bisa dibuat.
- [ ] Petugas bisa submit laporan; data bertahan setelah reload.
- [ ] Perubahan status ilegal ditolak.
- [ ] Riwayat status dan aktor tercatat.
- [ ] Laporan demo tidak diklaim hasil lapangan nyata.
