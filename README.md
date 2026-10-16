# PeatSignal — Frontend

**Prevent · Detect · Act.** Aplikasi pemantauan lahan gambut untuk prototype JOINTS Hackathon 2026, dengan antarmuka berbahasa Indonesia.

Panduan ini menjelaskan cara memasang dan menjalankan frontend di komputer sendiri. Secara default, aplikasi memakai data demo (simulasi), sehingga **bisa langsung dicoba tanpa backend, API key, atau file `.env`**.

## 1. Persiapan

Pastikan sudah memasang:

- Node.js minimal versi **22.13** (disarankan Node.js 24).
- npm versi **11**.

Cek versi melalui terminal:

```bash
node --version
npm --version
```

## 2. Instalasi

Unduh atau clone repository frontend, lalu buka terminal di folder yang berisi file `package.json`.

Jika terminal masih berada di folder induk proyek, masuk ke folder frontend:

```bash
cd peat-signal-frontend
```

Pasang dependency aplikasi:

```bash
npm ci
```

Tunggu sampai proses selesai. Instalasi membutuhkan koneksi internet.

## 3. Menjalankan aplikasi

Jalankan perintah berikut dari folder frontend:

```bash
npm run dev
```

Setelah server siap, buka **http://localhost:3000** di browser. Biarkan terminal tetap terbuka selama aplikasi digunakan.

Untuk mencoba aplikasi, buka **http://localhost:3000/login**, lalu pilih akun demo **Koordinator**, **Petugas**, atau **Masyarakat**. Mode demo tidak membutuhkan kata sandi. Peta dasar membutuhkan koneksi internet.

Untuk menghentikan server, tekan **Ctrl+C** di terminal. Saat ingin menjalankan kembali, cukup gunakan `npm run dev`; tidak perlu mengulang instalasi.

## 4. Menjalankan versi production (opsional)

Untuk mencoba hasil build di komputer sendiri, hentikan server development dengan **Ctrl+C**, lalu jalankan secara berurutan:

```bash
npm run build
npm run start
```

Buka **http://localhost:3000**. Setelah mengubah kode atau konfigurasi, jalankan ulang build sebelum menjalankan versi production.

Panduan hosting tersedia di [SPLIT_REPOSITORY.md](SPLIT_REPOSITORY.md).

## 5. Menghubungkan ke backend (opsional)

Lewati bagian ini jika hanya ingin mencoba data demo.

1. Buat file `.env.local` di folder frontend, sejajar dengan `package.json`.
2. Isi konfigurasi berikut. Sesuaikan alamat API dan token demo dengan backend yang digunakan:

```dotenv
NEXT_PUBLIC_DATA_SOURCE=rest
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_DEMO_COORDINATOR_TOKEN=isi-token-demo-koordinator
NEXT_PUBLIC_DEMO_FIELD_OFFICER_TOKEN=isi-token-demo-petugas
```

3. Pastikan backend sudah berjalan. Token demo diperlukan untuk login Koordinator/Petugas dan perubahan data.
4. Hentikan frontend, lalu jalankan kembali `npm run dev` agar konfigurasi terbaca.

Lihat [.env.example](.env.example) untuk contoh konfigurasi. Semua nilai `NEXT_PUBLIC_*` dapat dibaca dari browser; gunakan token khusus demo dan jangan masukkan kredensial database atau API key rahasia.

Untuk kembali ke data demo, ubah `NEXT_PUBLIC_DATA_SOURCE=mock`, lalu jalankan ulang frontend. Portal Masyarakat selalu memakai data simulasi lokal, termasuk saat mode REST aktif.

## Kendala yang sering muncul

- **Perintah `node` atau `npm` tidak ditemukan:** pasang Node.js dan npm, lalu buka ulang terminal.
- **Instalasi gagal karena versi Node.js:** periksa `node --version` dan gunakan versi yang sesuai persyaratan di atas.
- **Port 3000 sedang digunakan:** jalankan `npm run dev -- --port 3001`, lalu buka **http://localhost:3001**.
- **Error `ENOENT` setelah memperbarui dependency:** hentikan server sebelum menjalankan `npm ci`, lalu jalankan kembali `npm run dev`.
- **Login Koordinator/Petugas gagal pada mode REST:** pastikan backend aktif, alamat API benar, dan token demo sesuai konfigurasi backend.

## Pemeriksaan kode (opsional)

Jalankan dari folder frontend:

```bash
npm run lint
npm run typecheck
npm run test:data
```

Dokumentasi teknis lanjutan: [kontrak data](docs/data-contract.md), [catatan implementasi dan pengujian](docs/implementation-plan.md), serta [pengujian integrasi backend](docs/live-integration-qa.md).
