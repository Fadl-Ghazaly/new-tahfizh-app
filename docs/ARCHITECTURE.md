# ARCHITECTURE — Tahfizh App

## Tech Stack
| Lapisan | Pilihan | Alasan |
|---|---|---|
| Framework | Next.js 15 (App Router) + TypeScript | Paling banyak dikuasai AI, fullstack satu repo |
| UI | Tailwind CSS + shadcn/ui | Komponen siap pakai, mudah di-tema |
| Chart | Recharts | Bar, line, pie, area — cukup semua kebutuhan dashboard |
| Tabel | TanStack Table | Filter, sort, pagination |
| Form & validasi | React Hook Form + Zod | Validasi ayat/juz aman |
| Database & Auth | Supabase (PostgreSQL + Auth + Storage + RLS) | Role admin/user, upload logo, SQL view untuk agregasi |
| PDF | @react-pdf/renderer (atau jsPDF + autotable) | Laporan per santri |
| Seed | Script TypeScript + @faker-js/faker (locale id_ID) | 100 santri, 20 ustadz, setoran 1 tahun |
| Deploy | Vercel + Supabase Cloud | Gratis untuk tahap awal |

> Alternatif lebih sederhana (jika belum nyaman backend): Next.js + SQLite/Prisma + NextAuth. Namun Supabase lebih cepat untuk auth, role, dan upload logo.

## Struktur Folder
```
tahfizh-app/
├─ docs/                  # PRD.md, DESIGN.md, RULES.md, SCHEMA.md, ARCHITECTURE.md
├─ supabase/
│  ├─ migrations/         # SQL schema, view, RLS
│  └─ seed/               # skrip seed
├─ src/
│  ├─ app/
│  │  ├─ (public)/page.tsx            # landing
│  │  ├─ (auth)/login/page.tsx
│  │  └─ (app)/
│  │     ├─ dashboard/
│  │     ├─ santri/
│  │     ├─ ustadz/
│  │     ├─ setoran/
│  │     ├─ laporan/
│  │     └─ pengaturan/
│  ├─ components/ (ui/, charts/, tables/, forms/, layout/)
│  ├─ lib/
│  │  ├─ supabase/ (client.ts, server.ts)
│  │  ├─ tahfizh.ts       # formatCapaian, konversi baris↔halaman↔juz
│  │  ├─ quran-data.ts    # 114 surat + jumlah ayat + juz
│  │  ├─ validators/      # skema Zod
│  │  └─ pdf/
│  ├─ hooks/
│  └─ types/
└─ middleware.ts          # proteksi route + cek role
```

## Alur Data
UI (Server Components untuk baca, Server Actions untuk tulis) → Supabase (RLS) → SQL View agregasi (progress, ranking, harian) → Recharts.

## Prinsip
1. Logika perhitungan **hanya** di `lib/tahfizh.ts` (satu sumber kebenaran).
2. Agregasi berat dilakukan di SQL view, bukan di React.
3. Tema memakai CSS variables; diganti dengan atribut `data-theme` pada `<html>`.
4. Akses ditegakkan di dua lapis: middleware (UI) + RLS (data).

## Urutan Pembangunan (Fase)
0. Setup project + Supabase + env
1. Auth, layout, landing, login, role
2. Skema DB + seed
3. CRUD Santri & Ustadz
4. Input Setoran
5. Laporan bulanan + PDF
6. Dashboard
7. Pengaturan + 6 tema
8. QA, responsif, deploy