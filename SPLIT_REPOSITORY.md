# PeatSignal frontend — repository terpisah

Semua perintah berikut dijalankan dari root repository frontend.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Untuk backend asli, aktifkan `NEXT_PUBLIC_DATA_SOURCE=rest` dan isi
`NEXT_PUBLIC_API_BASE_URL=https://URL-BACKEND/api/v1` serta token peran demo
pada `.env.local` atau environment hosting. Jangan commit `.env.local`.

## Hosting Vercel

- Root Directory: kosong/default (kode frontend sudah di root).
- Framework: Next.js; Install: `npm ci`; Build: `npm run build`.
- Gunakan nama environment sesuai `.env.example`.

## Pengujian

```bash
npm run lint
npm run typecheck
npm run test:data
npm run build
```

Fixture kontrak dan metrik ML berada di `tests/fixtures/`; tes tidak memerlukan
checkout backend. Tes integrasi live tetap memerlukan API/database berjalan dan
artefak backend yang cocok dengan fixture. Perbarui fixture ketika kontrak/model berubah.
PRD berada di `prdFiles/`. Catatan QA lama mungkin masih menyebut struktur monorepo.
