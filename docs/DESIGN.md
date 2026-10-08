# DESIGN — Tahfizh App

## Karakter Visual
Islami modern, bersih, ramah, **penuh warna** tapi tetap terbaca. Kartu membulat (radius 16px), bayangan lembut, ikon lucide, ruang putih cukup.

## Tipografi
- UI: **Plus Jakarta Sans** (fallback: Inter, system-ui). Menggunakan *tabular figures* untuk angka (juz, baris, dll) agar sejajar di tabel.
- Weights: 400 (Body), 600 (Labels), 700/800 (Headlines).
- Teks Arab (jika dipakai): **Amiri** / Noto Naskh Arabic
- Skala: 12 / 14 / 16 / 20 / 24 / 32

## Radius & Bayangan
- **Cards & Data Modules**: 16px (`1rem` / `rounded-2xl`)
- **Inputs & Action Buttons**: 12px (`0.75rem` / `rounded-xl`)
- **Tahfizh Status Badges & Method Chips**: Penuh (`9999px` / `rounded-full`)
- **Icon Enclosures**: 10px (`0.625rem` / `rounded-lg`)
- **Shadows**:
  - Level 1 (Default): `0 4px 16px -2px rgba(5, 150, 105, 0.05), 0 2px 6px -2px rgba(15, 23, 42, 0.03)`
  - Level 2 (Hover/Active): `0 12px 24px -4px rgba(5, 150, 105, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.04)`
  - Spiritual Glow (Milestones/Mutqin): `0 8px 24px -2px rgba(245, 158, 11, 0.18)`

## Warna Fungsional (tetap di semua tema)
| Fungsi | Warna |
|---|---|
| Sabaq | `#10B981` (Teks/Aksen), `#ECFDF5` (Bg), `#A7F3D0` (Border) |
| Sabqi | `#3B82F6` (Teks/Aksen), `#EFF6FF` (Bg), `#BFDBFE` (Border) |
| Manzil | `#F59E0B` (Teks/Aksen), `#FFFBEB` (Bg), `#FDE68A` (Border) |
| Hadir | `#22C55E` · Izin `#06B6D4` · Terlambat `#EAB308` · Alpha `#EF4444` · Sakit `#A855F7` |
| Nilai | ≥90 (hijau) / 75–89 (kuning) / <75 (merah) |

## 4 Kartu Dashboard (gradient berbeda)
1. Total Santri — biru `#3B82F6 → #6366F1`
2. Total Ustadz — hijau `#10B981 → #14B8A6`
3. Total Kelas Halaqah — oranye `#F59E0B → #F97316`
4. Total Baris — pink `#EC4899 → #F43F5E`

## Palet Chart
`#6366F1 #10B981 #F59E0B #EC4899 #06B6D4 #8B5CF6 #F97316 #14B8A6`

## 6 Tema (CSS variables via `data-theme`)
| Kode (DB) | Nama | Primary | Accent | Background |
|---|---|---|---|---|
| theme-1 | Zamrud (default) | `#059669` | `#F59E0B` | `#F0FDF4` |
| theme-2 | Samudra | `#0284C7` | `#06B6D4` | `#F0F9FF` |
| theme-3 | Ungu Royal | `#7C3AED` | `#EC4899` | `#FAF5FF` |
| theme-4 | Senja | `#EA580C` | `#EAB308` | `#FFF7ED` |
| theme-5 | Mawar | `#E11D48` | `#F59E0B` | `#FFF1F2` |
| theme-6 | Malam (gelap) | `#6366F1` | `#22D3EE` | `#0F172A` |

Variabel wajib per tema: `--primary --primary-foreground --accent --background --foreground --card --muted --border --sidebar`.
*(Catatan: Kartu memiliki background `#FFFFFF` dan border tipis `#E2E8F0` pada tema terang)*

## Layout
- **Grid**: Berbasis kelipatan 8pt.
- **Desktop**: 12 Kolom (Maksimal `1280px` rata tengah), `1.25rem` (20px) gutters.
- **App Shell**: Sidebar di kiri, menetap (pinned) untuk navigasi Desktop. Di Tablet/Mobile sidebar menjadi *slide-over drawer*. Topbar (logo, nama pesantren, avatar/logout).
- **Menu Sidebar**: Dashboard, Data Santri, Data Ustadz, Input Setoran, Laporan, Pengaturan.
- **Tabel**: Header berwarna lembut, baris zebra berselang-seling (`#FFFFFF` & `#F8FAFC`), badge warna untuk status/metode, pagination.
- **Form setoran**: Tiga tab berwarna (hijau/biru/oranye), tombol **−5** besar berwarna merah dengan counter kesalahan dan nilai live.
- **Landing**: Hero (logo + nama pesantren), 3 keunggulan (Sabaq/Sabqi/Manzil), tombol "Masuk".
- **Login**: Kartu tengah, input email & password, pilih/tampilkan role dari akun.

## Prinsip UX
Empty state ilustratif, skeleton loading, toast sukses/gagal, konfirmasi sebelum hapus, semua teks Bahasa Indonesia.

## Prompt untuk Google Stitch
Lihat `PROMPTS.md` bagian "Stitch".