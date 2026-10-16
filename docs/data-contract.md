# Kontrak data frontend (F0 data)

Sumber kebenaran kontrak: schema Zod di `src/lib/schemas/`. Tipe TypeScript di `src/types/` diturunkan dari schema tersebut (`z.infer`), sehingga validasi runtime dan tipe statis selalu sama.

## Struktur

| Lokasi | Isi |
| --- | --- |
| `src/lib/schemas/` | Schema Zod entitas, respons, dan input mutasi |
| `src/types/` | Tipe entitas hasil `z.infer` |
| `src/lib/api/repository.ts` | Interface `GambutOpsRepository` dan tipe query |
| `src/lib/api/rest-repository.ts` | `createRestRepository()` — fetch + validasi Zod + pemetaan error |
| `src/lib/api/rest-schemas.ts` | Schema Zod **respons backend** (stations/GWT/hotspots), meniru Pydantic/OpenAPI |
| `src/lib/api/rest-mappers.ts` | Pemetaan murni respons backend → model UI |
| `src/lib/mock/` | `createMockRepository()`, fixture deterministik, localStorage store, mock decision engine |
| `src/lib/domain/` | State machine tugas, area, periode, label, komposisi dashboard |
| `src/components/providers/` | `RepositoryProvider`, cache query, `MonitoringProvider`, hook data |

Komponen hanya memakai hook di `src/components/providers/data-hooks.ts`. Komponen tidak mengimpor fixture, `fetch`, atau `localStorage` secara langsung.

## Entitas

- `Station` — `id` opaque (UUID pada REST; jangan ditampilkan), `code` (mis. BRG6) sebagai label. `region`, `source`, `period_start/end` boleh null. `lat`/`lon` boleh null. Koordinat tanpa `coordinate_source` ditolak. Stasiun tanpa koordinat hanya tampil di grafik/daftar.
- `GroundwaterObservation` — `gwt_m` dalam meter (negatif = di bawah permukaan). `null` hanya untuk `MISSING` (tidak ada pengamatan) atau `DUPLICATE_FLAGGED` (konflik duplikat); keduanya tidak pernah nol dan maknanya berbeda. `source_id`/`source_sha256` opsional (hanya dari REST).
- `GroundwaterSeries` — `availability: AVAILABLE | NOT_AVAILABLE` + `notice`. AVAILABLE = ada baris pada hasil, bukan semua bernilai. Current Monitoring tanpa observasi terbaru → `NOT_AVAILABLE`.
- `Hotspot` — `observed_at` UTC, `confidence_raw` mentah FIRMS (bukan probabilitas), `frp_mw` nullable, `verification_status`, `imported_at` (waktu import CSV lokal; null pada mock), `daynight` null bila sumber tidak menyediakannya.
- `HotspotCollection` — satu halaman: `items`, `total` (seluruh hasil filter), `limit`, `offset`, `last_synced_at` + `last_synced_scope` (`PAGE_IMPORT` = waktu import terbaru item halaman ini; `SYNC` = waktu sync sumber, saat ini hanya mock).
- `PriorityAssessment` — `mode`, `as_of`, `priority`, `decision`, `reason_codes`, `missing_inputs`, `input_snapshot` (dengan sumber dan waktu), `rule_version`, `scientific_status: "heuristic_not_validated"`.
- `InspectionTask` / `InspectionTaskDetail` — status, `history` (aktor + peran + waktu), `mode`, `area_id`, `reports`.
- `FieldReport` — `observed_at`, `result`, `note`, `evidence_url`, `is_simulation`.
- `User` — `coordinator | field_officer`.
- ML — `MlMetricsResponse` (`NOT_AVAILABLE` atau `AVAILABLE` + eksperimen), `MlForecastResponse` (`REJECTED` atau `OK`).

Setiap observasi membawa provenance: `source`, `observed_at`, `quality_flag`, `mode`.

## Aturan mode

- Kunci cache query selalu diawali mode (`useModeQuery`), sehingga Historical Replay dan Current Monitoring tidak berbagi data.
- Filter periode/area disimpan terpisah per mode di `MonitoringProvider`. `as_of` = akhir periode.
- REST adapter menolak (`INVALID_PAYLOAD`) hotspot/assessment yang mode-nya berbeda dari permintaan atau `as_of`-nya melewati permintaan.
- REST adapter menyembunyikan observasi GWT lama pada Current Monitoring dan mengembalikan `NOT_AVAILABLE`.

## Read API backend → model UI

Acuan bentuk JSON adalah OpenAPI backend ([handoff](../../backend/docs/read-api-handoff.md), contoh nyata di `backend/docs/examples/read-api.json`). Payload mentah divalidasi dengan `rest-schemas.ts`, lalu dipetakan oleh `rest-mappers.ts`. Field wajib hilang, tipe salah, atau mode/stasiun tidak sesuai permintaan → `INVALID_PAYLOAD`.

| Backend | Model UI |
| --- | --- |
| Stations `latitude`/`longitude` | `lat`/`lon` |
| Stations `id`, `code` | `id` tetap UUID (dipakai pada query), `code` untuk label |
| GWT respons berupa **array** | dibungkus `{station_id, mode, from, to, availability, notice, observations}` dari query + hasil; diurutkan per tanggal, gap tidak diisi |
| GWT `observed_date` | `observed_at` (YYYY-MM-DD). `observed_at` backend (00:00 UTC) tidak dipakai karena jam pengukuran tidak diketahui |
| GWT kosong | `NOT_AVAILABLE` + `HISTORICAL_GWT_EMPTY_NOTICE` (Historical) atau `CURRENT_GWT_NOTICE` (Current) |
| `quality_flag: DUPLICATE` | `DUPLICATE_FLAGGED` (nilai tetap null) |
| Hotspot `acquired_at`, `sensor`, `frp` | `observed_at`, `instrument`, `frp_mw` |
| Hotspot `last_synced_at` | `imported_at` per item; koleksi: maksimum di halaman ini, `last_synced_scope: "PAGE_IMPORT"`, null bila halaman kosong |
| Hotspot (tidak ada) | `daynight: null`, `area_id` dari lookup bbox DEMO (`areaIdForPoint`), `is_simulation: false` |
| `{items,total,limit,offset}` | `HotspotCollection` + `mode` dari query |

Pagination hotspot: `limit` default 200, maksimum 1000 (`src/lib/domain/pagination.ts`); `offset` mulai 0. Urutan: waktu akuisisi turun, lalu ID. Halaman yang memakai `useHotspots({ limit, offset })` memegang state offset dan **mereset offset ke 0 saat mode/filter berubah**. Tidak ada pengambilan seluruh halaman otomatis. Dashboard memakai `total`, bukan `items.length`; `unverified` hanya dihitung dari halaman yang dimuat, ditandai `unverified_scope: "PAGE"` bila ada halaman lain.

Mock mengikuti kontrak yang sama (pagination, urutan, kode satelit `N`/`N20`). ID stasiun mock tetap `BRG6` dkk.; UI harus selalu menampilkan `code`.

Menjalankan REST lokal: `NEXT_PUBLIC_DATA_SOURCE=rest NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1`. CORS backend default hanya `http://localhost:3000`; buka frontend lewat `localhost`, bukan `127.0.0.1`, atau tambahkan origin di `CORS_ALLOWED_ORIGINS`.

## State machine tugas

`OPEN → ASSIGNED → IN_PROGRESS → SUBMITTED → VERIFIED | DISMISSED | NEEDS_FOLLOWUP`; `NEEDS_FOLLOWUP → ASSIGNED`.

| Ke status | Peran | Syarat |
| --- | --- | --- |
| ASSIGNED | coordinator | assignee terisi |
| IN_PROGRESS | field_officer | aktor = assignee |
| SUBMITTED | field_officer | hanya lewat `createReport`, aktor = assignee |
| VERIFIED / DISMISSED / NEEDS_FOLLOWUP | coordinator | — |

Pelanggaran → `RepositoryError` dengan kode `ILLEGAL_TRANSITION` atau `FORBIDDEN`.

## Error

`RepositoryError.code`: `NETWORK`, `HTTP`, `INVALID_PAYLOAD`, `NOT_FOUND`, `VALIDATION`, `ILLEGAL_TRANSITION`, `FORBIDDEN`, `ABORTED`. Pemetaan HTTP: 404 → NOT_FOUND, 401/403 → FORBIDDEN, 409 → ILLEGAL_TRANSITION, 400/422 → VALIDATION, lainnya → HTTP. `detail` FastAPI dipakai sebagai pesan.

## Mock repository

- Metadata stasiun (ID, wilayah, periode) mengikuti `mmc1.xlsx`. Nilai GWT dan hotspot **sintetis** dari PRNG ber-seed — tidak memakai `Math.random()`.
- Current Monitoring memakai tanggal demo tetap `2026-10-12` agar demo deterministik.
- Prioritas dihitung oleh mock engine `demo-rules-0.1` per blok area (3 blok per wilayah), hanya memakai tanda tren GWT tanpa ambang angka. Data kurang → `INSUFFICIENT_DATA`.
- Tugas dan laporan tersimpan di `localStorage` (`gambutops:demo-store:v1`), divalidasi Zod saat dibaca. Data rusak diganti seed dan memicu toast.
- ML mengembalikan `NOT_AVAILABLE` / `REJECTED`. Tidak ada metrik rekaan.

## Kebutuhan API untuk backend

Stations, GWT, dan hotspots sudah memakai kontrak backend (lihat bagian di atas). Usulan berikut masih untuk endpoint yang belum tersedia:

1. Status/waktu sync FIRMS global (tahap FIRMS live) agar `last_synced_scope: "SYNC"` dapat dipakai pada REST.
2. `daynight` hotspot bila tersedia dari sumber.
3. ~~Priorities~~ — sudah tersedia (BE-05). Adapter mengirim `as_of` sebagai cutoff UTC akhir hari (tidak pernah di masa depan) dan memetakan `input_snapshot` objek ke indikator UI; snapshot asli disimpan di `raw_input_snapshot`.
4. ~~Tasks/reports/users~~ — sudah tersedia (BE-06, `backend/docs/tasks-handoff.md`). Mutasi memakai `Authorization: Bearer <token>` sesuai peran demo; `X-Actor-Id` tidak dikirim lagi.
5. Usulan: kirim `history[]` berurutan waktu, dengan entri pembuatan (`from: null`) lebih dulu bila timestamp sama. Frontend sudah mengurutkan sendiri, tetapi urutan dari server memudahkan klien lain.
6. Usulan: `created_at`/waktu evaluasi pada assessment priorities (saat ini frontend memakai `as_of`).
7. Usulan: `GET /api/v1/users` menyertakan lebih dari satu petugas demo agar penugasan ulang dapat didemokan.
8. Transisi ilegal dikembalikan sebagai **409** dengan `detail` berbahasa Indonesia; validasi sebagai 422.
9. `GET /api/v1/ml/metrics` → `{status:"NOT_AVAILABLE",reason}` atau `{status:"AVAILABLE",experiments:[...]}`; `POST /api/v1/ml/forecast` → `{status:"REJECTED",reason}` atau `{status:"OK",...}`.
10. CORS allowlist untuk origin frontend.
