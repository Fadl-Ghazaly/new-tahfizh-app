# ARCHITECTURE — Tahfizh App

## Tech Stack

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Framework | Next.js 16 (App Router) + TypeScript | Fullstack satu repo, `params`/`searchParams`/`cookies()`/`headers()` async |
| UI | Tailwind CSS v4 + shadcn/ui (Base UI) | Komponen siap pakai, komposisi via prop `render` (bukan `asChild`). Konfigurasi di `app/globals.css`, bukan `tailwind.config.js` |
| Komponen Form | `field` + react-hook-form `Controller` | Komponen `form` lama tidak tersedia di shadcn Base UI. Selalu baca file di `components/ui/` sebelum memakai |
| Chart | Recharts | Bar, line, pie, area — cukup semua kebutuhan dashboard |
| Tabel | TanStack Table | Filter, sort, pagination |
| Validasi | React Hook Form + Zod | Validasi client **dan** server action |
| Database & Auth | Supabase (PostgreSQL + Auth + Storage + RLS) via `@supabase/ssr` | Role ADMIN/USTADZ, upload logo, SQL view untuk agregasi |
| PDF | @react-pdf/renderer (atau jsPDF + autotable) | Laporan per santri |
| Seed | Script TypeScript + @faker-js/faker (locale id_ID) | 100 santri, 20 ustadz, setoran 1 tahun |
| Deploy | Vercel + Supabase Cloud | Gratis untuk tahap awal |

## Struktur Folder

```
new-tahfizh-app/
├─ docs/                  # PRD.md, DESIGN.md, SCHEMA.md, ARCHITECTURE.md, dll.
├─ supabase/
│  ├─ migrations/         # SQL schema, RLS, seed data referensi
│  └─ seed/               # skrip seed (TypeScript)
├─ app/
│  ├─ globals.css         # Tailwind v4 config + CSS variables tema
│  ├─ (public)/page.tsx            # landing
│  ├─ (auth)/login/page.tsx
│  └─ (app)/
│     ├─ dashboard/
│     ├─ santri/          # → tabel students
│     ├─ ustadz/          # → tabel teachers
│     ├─ setoran/         # → tabel attendance + memorization_records
│     ├─ laporan/
│     └─ pengaturan/      # → tabel school_settings
├─ components/ (ui/, charts/, tables/, forms/, layout/)
├─ lib/
│  ├─ supabase/ (client.ts, server.ts)
│  ├─ tahfizh.ts          # formatCapaian, konversi baris↔halaman↔juz
│  ├─ quran-data.ts       # 114 surah + jumlah ayat + juz
│  ├─ validators/         # skema Zod
│  └─ pdf/
├─ hooks/
├─ types/
├─ proxy.ts               # proteksi route + cek role (pengganti middleware.ts di Next.js 16)
├─ RULES.md
├─ AGENTS.md
└─ package.json
```

> **Catatan Next.js 16:** `proxy.ts` menggantikan `middleware.ts`. Lihat dokumentasi Next.js 16 untuk detail.
> `params`, `searchParams`, `cookies()`, `headers()` bersifat **async** — selalu gunakan `await`.

## Pemetaan Menu → Tabel Database

| Menu UI (Indonesia) | Tabel Database (Inggris) |
|---|---|
| Data Santri | `students` (+ join `classes`, `halaqahs`, `teachers`) |
| Data Ustadz | `teachers` (+ join `halaqahs`, `classes`) |
| Input Setoran | `attendance` + `memorization_records` |
| Laporan Bulanan | View: `v_student_progress`, `v_daily_summary`, `v_monthly_summary`, `v_juz_completion`, `v_surah_completion` |
| Dashboard | View: `v_student_progress` + agregasi dari `memorization_records`, `attendance`, `students` |
| Pengaturan | `school_settings` |

## Alur Data

```
UI (Server Components untuk baca, Server Actions untuk tulis)
  → Supabase (@supabase/ssr, RLS aktif)
  → SQL View agregasi (progress, ranking, harian, bulanan)
  → Recharts (visualisasi)
```

- **Baca**: Server Component memanggil Supabase client (`lib/supabase/server.ts`) → RLS memfilter berdasarkan role.
- **Tulis**: Server Action menerima form data, validasi Zod, lalu insert/update via Supabase client → RLS menegakkan hak akses.
- Form setoran **menulis ke dua tabel**: `attendance` (kehadiran) + `memorization_records` (data hafalan, hanya jika hadir).

## Proteksi Akses (Dua Lapis)

1. **`proxy.ts`** — mengarahkan ulang user yang belum login ke `/login`, dan membatasi akses halaman berdasarkan role (UI-level).
2. **RLS (Row Level Security)** — menegakkan hak akses di level database. Lihat matriks lengkap di `SCHEMA.md` §7.

## Prinsip

1. Logika perhitungan **hanya** di `lib/tahfizh.ts` (satu sumber kebenaran).
2. Agregasi berat dilakukan di SQL view, bukan di React.
3. Tema memakai CSS variables; diganti dengan atribut `data-theme` pada `<html>`.
4. Akses ditegakkan di dua lapis: `proxy.ts` (UI) + RLS (data).
5. Nama tabel & kolom dalam bahasa Inggris (sesuai migrasi). UI dalam Bahasa Indonesia.
6. Semua komponen shadcn/ui memakai **Base UI** — gunakan prop `render` untuk komposisi, bukan `asChild`.

## Urutan Pembangunan (Fase)

0. Setup project + Supabase + env
1. Auth, layout, landing, login, role (proxy.ts)
2. Skema DB (migrasi) + seed
3. CRUD Santri & Ustadz
4. Input Setoran (attendance + memorization_records)
5. Laporan bulanan + PDF (SQL view)
6. Dashboard (SQL view)
7. Pengaturan + 6 tema
8. QA, responsif, deploy