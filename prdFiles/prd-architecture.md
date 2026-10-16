# PRD Arsitektur & API

## Stack
Frontend **Next.js + TypeScript + Tailwind + shadcn/ui + MapLibre GL JS + Recharts**. Backend **Python FastAPI + Pydantic + SQLAlchemy**. Database **Supabase PostgreSQL + PostGIS**. ETL **pandas/openpyxl**. ML P1 **scikit-learn/joblib**. HTTP eksternal **httpx**. Deploy Vercel + Render + Supabase (cek limit paket sebelum deploy).

## Aliran
`mmc1.xlsx → ETL → PostgreSQL → FastAPI → Next.js`; `NASA FIRMS → sync/CSV importer → PostGIS → FastAPI → MapLibre`; `GWT/hotspot → rule engine → assessment → task → report`.

## API v1
- `GET /health`
- `GET /api/v1/stations`
- `GET /api/v1/stations/{id}/groundwater?from=&to=`
- `GET /api/v1/hotspots?from=&to=&bbox=`
- `POST /api/v1/admin/hotspots/sync` (admin)
- `GET /api/v1/priorities?mode=&as_of=`
- `POST /api/v1/tasks`; `GET /api/v1/tasks`; `GET /api/v1/tasks/{id}`
- `PATCH /api/v1/tasks/{id}`; `POST /api/v1/tasks/{id}/reports`
- P1: `GET /api/v1/ml/metrics`; `POST /api/v1/ml/forecast`

## Kontrak dasar
Setiap observasi memuat `source`, `observed_at`, `quality_flag`, `mode`; setiap assessment memuat `rule_version`, `input_snapshot`, `reason_codes`, `missing_inputs`. Semua waktu satelit disimpan UTC; frontend tampilkan zona waktu dengan jelas.

## Keamanan
`FIRMS_MAP_KEY`, `DATABASE_URL`, token auth hanya di backend. Endpoint write memakai role coordinator/field_officer. Rate limit import, pagination, bbox limit, CORS allowlist. Import idempotent.

## Pengujian
Unit test parser/aturan/status; integration test API + DB; E2E browser dari prioritas sampai laporan. Fallback CSV FIRMS historis jika API gagal.
