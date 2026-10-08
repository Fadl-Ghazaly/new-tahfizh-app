# DESIGN — Tahfizh App

## Karakter Visual
Islami modern, bersih, ramah, **penuh warna** tapi tetap terbaca. Kartu membulat (radius 16px), bayangan lembut, ikon lucide, ruang putih cukup.

## Tipografi
- UI: **Plus Jakarta Sans** (fallback: Inter, system-ui)
- Teks Arab (jika dipakai): **Amiri** / Noto Naskh Arabic
- Skala: 12 / 14 / 16 / 20 / 24 / 32

## Warna Fungsional (tetap di semua tema)
| Fungsi | Warna |
|---|---|
| Sabaq | `#10B981` hijau |
| Sabqi | `#3B82F6` biru |
| Manzil | `#F59E0B` oranye |
| Hadir | `#22C55E` · Izin `#06B6D4` · Terlambat `#EAB308` · Alpha `#EF4444` · Sakit `#A855F7` |
| Nilai ≥90 / 75–89 / <75 | hijau / kuning / merah |

## 4 Kartu Dashboard (gradient berbeda)
1. Total Santri — biru `#3B82F6 → #6366F1`
2. Total Ustadz — hijau `#10B981 → #14B8A6`
3. Total Kelas Halaqah — oranye `#F59E0B → #F97316`
4. Total Baris — pink `#EC4899 → #F43F5E`

## Palet Chart
`#6366F1 #10B981 #F59E0B #EC4899 #06B6D4 #8B5CF6 #F97316 #14B8A6`

## 6 Tema (CSS variables via `data-theme`)
| Kode | Nama | Primary | Accent | Background |
|---|---|---|---|---|
| emerald | Zamrud (default) | `#059669` | `#F59E0B` | `#F0FDF4` |
| ocean | Samudra | `#0284C7` | `#06B6D4` | `#F0F9FF` |
| royal | Ungu Royal | `#7C3AED` | `#EC4899` | `#FAF5FF` |
| sunset | Senja | `#EA580C` | `#EAB308` | `#FFF7ED` |
| rose | Mawar | `#E11D48` | `#F59E0B` | `#FFF1F2` |
| midnight | Malam (gelap) | `#6366F1` | `#22D3EE` | `#0F172A` |

Variabel wajib per tema: `--primary --primary-foreground --accent --background --foreground --card --muted --border --sidebar`.

## Layout
- **Landing**: hero (logo + nama pesantren), 3 keunggulan (Sabaq/Sabqi/Manzil), tombol "Masuk".
- **Login**: kartu tengah, input email & password, pilih/tampilkan role dari akun.
- **App shell**: sidebar kiri berwarna (6 menu: Dashboard, Data Santri, Data Ustadz, Input Setoran, Laporan, Pengaturan) + topbar (logo, nama pesantren, avatar/logout). Di HP sidebar menjadi drawer.
- Tabel: header berwarna lembut, zebra row, badge warna untuk status, pagination.
- Form setoran: tiga tab berwarna (hijau/biru/oranye), tombol **−5** besar berwarna merah dengan counter kesalahan dan nilai live.

## Prinsip UX
Empty state ilustratif, skeleton loading, toast sukses/gagal, konfirmasi sebelum hapus, semua teks Bahasa Indonesia.

## Prompt untuk Google Stitch
Lihat `PROMPTS.md` bagian "Stitch".

Nilai DB	Tema
theme-1	Zamrud (default)
theme-2	Samudra
theme-3	Ungu Royal
theme-4	Senja
theme-5	Mawar
theme-6	Malam