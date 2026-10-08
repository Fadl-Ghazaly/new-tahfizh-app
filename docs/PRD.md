# PRD — Tahfizh App Pesantren Darul Ilmi

## 1. Tujuan
Aplikasi web pencatatan tahfidz santri Pesantren Darul Ilmi dengan metode **Sabaq – Sabqi – Manzil**, lengkap dengan laporan bulanan, dashboard visualisasi, dan pengaturan tampilan.

## 2. Istilah & Aturan Bisnis (WAJIB dipatuhi AI)
- **Sabaq** = hafalan baru. **Sabqi** = murojaah hafalan dekat. **Manzil** = murojaah hafalan lama.
- **Hanya SABAQ yang menambah capaian hafalan baru.** Sabqi & manzil hanya dihitung untuk statistik aktivitas.
- Konversi: **15 baris = 1 halaman**, **20 halaman = 1 juz** → **1 juz = 300 baris**. Target 30 juz = 600 halaman = 9.000 baris.
- Format tampilan capaian: `X juz, Y halaman` (contoh: 22 halaman → `1 juz, 2 halaman`; 15 halaman → `0 juz, 15 halaman`). Gunakan util `formatCapaian(totalBaris)`.
- Nilai kelancaran: default **100**, tombol **−5** per kesalahan (min 0). Simpan juga `jumlah_kesalahan`.
- Kehadiran: `hadir | izin | terlambat | alpha | sakit`. Dihitung "hadir" = hadir + terlambat. Tidak hadir = izin + alpha + sakit. Jika tidak hadir, baris = 0.
- Progress % = total baris sabaq / 9000 × 100.
- Juz dianggap "sudah dihafal" jika total baris sabaq pada juz tsb ≥ 300 (toleransi diatur di konstanta).
- Ranking = urut total baris sabaq kumulatif (terbanyak = rank 1).

## 3. Role
| Role | Hak akses |
|---|---|
| admin | Semua menu, CRUD, pengaturan |
| user (ustadz/viewer) | Lihat semua, input setoran, lihat laporan & dashboard; **tidak** boleh hapus data master & pengaturan |

## 4. Alur Halaman
Landing page → Login (admin/user) → Dashboard.

## 5. Menu & Fitur
### 5.1 Data Santri
CRUD. Kolom: No, Nama, JK, Kelas (7–12), Kelas Halaqah, NISN, Ustadz Pengampu, Orangtua, WA Orangtua. Filter kelas. Seed **100** santri.

### 5.2 Data Ustadz
CRUD. Kolom: No, Nama, JK, No WA, Asal Pondok. Filter kelas (kelas yang diampu). Seed **20** ustadz.

### 5.3 Input Setoran
Tab: Sabaq | Sabqi | Manzil. Filter: kelas, ustadz pengampu. Field: tanggal, santri, juz (1–30), surat (114 surat), ayat mulai, ayat selesai, jumlah baris, catatan, kehadiran, nilai kelancaran (tombol −5). Validasi ayat selesai ≥ ayat mulai ≤ jumlah ayat surat.
Seed: data harian 1 tahun s.d. hari ini, variasi capaian santri **1–25 juz**.

### 5.4 Laporan Bulanan (per santri)
Filter: bulan, kelas halaqah, ustadz. Berisi:
- % progress dari 30 juz
- Hafalan baru bulan ini (juz, surat, halaman, baris)
- Aktivitas: hari hadir vs tidak hadir
- Perbandingan dengan 2 bulan sebelumnya
- Ranking santri vs seluruh santri
- Grafik harian tgl 1–31 (bulan lalu vs berjalan): sabaq/sabqi/manzil, jumlah baris, nilai kelancaran
- Daftar juz dihafal (total & belum), daftar surat dihafal (total)
- Kalender kehadiran tgl 1–31
- **Tombol Download PDF**

### 5.5 Dashboard
- 4 kartu atas warna berbeda: Total Santri, Total Ustadz, Total Kelas Halaqah, Total Baris
- Top 10 hafalan terbaik & Top 10 butuh perhatian (format `X juz, Y halaman`)
- Distribusi nilai (bulan lalu vs berjalan)
- Statistik baris harian sabaq/sabqi/manzil (bulan lalu vs berjalan)
- Distribusi kelas & capaian tahfidz per kelas (bulan lalu vs berjalan)
- Pie chart % target pencapaian
- Statistik nilai kelancaran, statistik hafalan, progress tahfidz
- Distribusi hafalan: 0–1, 2–5, 5–10, 10–20, 20–30 juz (**tetapkan batas tegas tanpa tumpang tindih: 0–1, 2–5, 6–10, 11–20, 21–30**)
- Tampilan penuh warna (palet chart beragam)

### 5.6 Pengaturan (admin)
Ubah nama pesantren, upload logo, pilih 1 dari 6 tema (lihat DESIGN.md). Tersimpan di DB dan diterapkan global.

## 6. Non-Fungsional
Responsif (HP/tablet/desktop), bahasa UI Indonesia, loading & empty state di semua halaman, performa dashboard < 2 dtk (gunakan SQL view/agregasi di DB).

## 7. Definisi Selesai
Seed berjalan satu perintah, semua menu berfungsi, role dibatasi, PDF terunduh, tema berganti, build tanpa error.