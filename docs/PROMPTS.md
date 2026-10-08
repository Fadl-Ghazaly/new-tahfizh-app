# PROMPTS.md — Panduan Vibecoding Tahfizh App

## A. Persiapan (sekali saja)
1. Buat folder `tahfizh-app/`, buka di Antigravity.
2. Buat folder `docs/` dan masukkan: `PRD.md`, `ARCHITECTURE.md`, `SCHEMA.md`, `DESIGN.md`.
3. Taruh `RULES.md` sebagai **Rules** Antigravity (via panel Customizations/Rules di agent, atau folder `.agent/rules/`; cek UI versi terbaru). Salin juga ke root sebagai cadangan.
4. Buat akun Supabase, buat project, catat URL, anon key, service role key.
5. `git init` dan commit setiap fase selesai (titik kembali jika AI merusak sesuatu).

## B. MCP yang disarankan
| MCP | Fungsi | Cara pakai |
|---|---|---|
| **Supabase MCP** | Agent membuat tabel, migrasi, RLS, cek data langsung | Tambahkan di *Manage MCP Servers* → isi project ref & access token. Gunakan mode read-only/terbatas ke project dev |
| **Context7** | Dokumentasi library terbaru (Next.js, shadcn, Recharts) agar kode tidak usang | Tambahkan, lalu akhiri prompt dengan "use context7" |
| **Stitch MCP** | Agent menarik desain dari Google Stitch ke kode | Aktifkan jika tersedia di akun Anda (cek dokumentasi Stitch terbaru), isi API key |
| **Browser agent bawaan Antigravity** | Agent membuka localhost, klik, screenshot untuk verifikasi UI | Minta: "jalankan dev server, buka halaman X di browser, uji alurnya, beri screenshot" |
| GitHub MCP (opsional) | Commit/PR otomatis | Pakai token fine-grained |

Cara menambah MCP di Antigravity: menu agent → *Manage MCP Servers* → *View raw config* → tempel JSON server (nama, command/args, env). Verifikasi ikon hijau/aktif sebelum dipakai. Nama menu bisa berubah antar versi.

## C. Google Stitch — Prompt Desain
Buat dalam 3 batch agar hasil konsisten. Awali tiap batch dengan konteks ini:

> App web tahfidz Pesantren Darul Ilmi, gaya Islami modern, ramah, penuh warna, font Plus Jakarta Sans, kartu membulat, tema hijau zamrud dengan aksen oranye, bahasa Indonesia, desktop 1440px + versi mobile.

**Batch 1:** "Landing page dengan hero logo & nama pesantren, 3 kartu fitur (Sabaq hijau, Sabqi biru, Manzil oranye), tombol Masuk. Lalu halaman Login dengan kartu di tengah."
**Batch 2:** "App shell dengan sidebar berwarna 6 menu (Dashboard, Data Santri, Data Ustadz, Input Setoran, Laporan, Pengaturan). Halaman Data Santri: tabel kolom No, Nama, JK, Kelas, Kelas Halaqah, NISN, Ustadz Pengampu, Orangtua, WA Orangtua, filter kelas, tombol tambah/edit/hapus. Form Input Setoran dengan 3 tab, field juz, surat, ayat mulai/selesai, jumlah baris, catatan, kehadiran, nilai 100 dengan tombol −5."
**Batch 3:** "Dashboard dengan 4 kartu gradient berbeda warna (Total Santri biru, Ustadz hijau, Halaqah oranye, Baris pink), top 10 terbaik & top 10 butuh perhatian, bar/line/pie chart berwarna-warni. Halaman Laporan Bulanan per santri dengan kalender kehadiran, grafik harian, daftar juz & surat, tombol Download PDF. Halaman Pengaturan: nama, logo, 6 kartu pilihan tema."

Setelah puas: ekspor ke kode/Figma, atau ambil `DESIGN.md` dari Stitch dan gabungkan ke `docs/DESIGN.md`. Simpan screenshot di `docs/design/` dan rujuk dalam prompt ("ikuti tampilan pada docs/design/dashboard.png").

## D. Prompt per Fase (salin berurutan, satu per sesi)

### Fase 0 — Setup
```
Baca semua file di docs/ dan RULES.md. Lalu buat rencana (belum coding).
Setelah saya setuju: inisialisasi Next.js 15 + TypeScript + Tailwind + shadcn/ui,
pasang supabase-js, zod, react-hook-form, recharts, @tanstack/react-table.
Buat struktur folder sesuai ARCHITECTURE.md, .env.example, dan README singkat.
Pastikan npm run build lulus.
```

### Fase 1 — Auth & Layout
```
Baca semua file di docs/ dan RULES.md.
Buat landing page, halaman login (Supabase Auth email+password), proxy.ts untuk proteksi route
(pengganti middleware.ts di Next.js 16), dan app shell (sidebar 6 menu + topbar) sesuai DESIGN.md
dan docs/design/.
Role ADMIN & USTADZ dibaca dari tabel profiles. Sembunyikan menu/aksi admin-only untuk role USTADZ.
Gunakan Context7 untuk dokumentasi @supabase/ssr dan Next.js 16 terbaru.
```

### Fase 2 — Database & Seed
```
Baca SCHEMA.md (sudah diperbarui sesuai migrasi).
Migrasi sudah ada di supabase/migrations/. Buat:
- lib/quran-data.ts berisi 114 surah (nomor, nama, jumlah ayat, juz awal) dari tabel quran_surahs
- lib/tahfizh.ts (konversi baris/halaman/juz, formatCapaian) beserta unit test
- Skrip seed di supabase/seed/ sesuai bagian "Aturan Seed" di SCHEMA.md
  (tabel: teachers, halaqahs, students, attendance, memorization_records).
  Seed harus idempoten. Hanya buat memorization_records untuk hari hadir (HADIR/TERLAMBAT).
  Akun demo: admin@darulilmi.test (ADMIN) dan ustadz@darulilmi.test (USTADZ).
Setelah selesai, verifikasi lewat query:
jumlah students=100, teachers=20, rentang tanggal, sebaran juz capaian 1-25.
Laporkan hasil verifikasi.
```

### Fase 3 — CRUD Santri & Ustadz
```
Bangun menu Data Santri dan Data Ustadz sesuai PRD 5.1 & 5.2: tabel (TanStack), filter kelas,
pencarian, pagination, dialog tambah/edit (Zod), konfirmasi hapus. Hanya admin boleh
tambah/edit/hapus. Verifikasi di browser untuk kedua role.
```

### Fase 4 — Input Setoran
```
Bangun menu Input Setoran sesuai PRD 5.3.
Form menulis ke DUA tabel: attendance (kehadiran) dan memorization_records (data hafalan).
3 tab sabaq/sabqi/manzil, filter kelas & ustadz (diturunkan dari halaqahs),
pilih santri, kehadiran (attendance_status), juz 1-30,
surah (dropdown 114 surah dari quran_surahs), validasi ayat terhadap ayah_count,
nilai default 100 dengan tombol -5 (mistake_count naik, fluency_score turun, min 0).
Jika kehadiran bukan HADIR/TERLAMBAT maka hanya record attendance yang dibuat
(tanpa memorization_records). line_count harus 1-300.
Tampilkan riwayat setoran terbaru di bawah form.
```

### Fase 5 — Laporan Bulanan + PDF
```
Bangun menu Laporan Bulanan sesuai PRD 5.4 memakai SQL view dari SCHEMA.md.
Filter bulan, halaqah, ustadz, lalu pilih santri. Tampilkan semua bagian laporan,
grafik harian bulan lalu vs berjalan (tgl 1-31), kalender kehadiran, ranking,
perbandingan 2 bulan sebelumnya. Tambahkan tombol Download PDF (layout A4 rapi, logo & nama pesantren dari settings).
```

### Fase 6 — Dashboard
```
Bangun Dashboard sesuai PRD 5.5 dan DESIGN.md: 4 kartu gradient, top 10 terbaik & butuh perhatian
(format "X juz, Y halaman"), semua grafik bulan lalu vs berjalan, pie target, distribusi hafalan
(0-1, 2-5, 6-10, 11-20, 21-30 juz). Ambil data dari SQL view. Pastikan angka konsisten dengan halaman Laporan.
```

### Fase 7 — Pengaturan & Tema
```
Bangun menu Pengaturan (admin only): ubah nama pesantren, upload logo ke Supabase Storage,
pilih 1 dari 6 tema (DESIGN.md) dengan pratinjau langsung. Simpan di tabel settings dan terapkan
global via data-theme + CSS variables. Pastikan chart & sidebar ikut berubah.
```

### Fase 8 — QA & Deploy
```
Lakukan audit: lint, build, responsif HP/tablet, aksesibilitas dasar, uji alur admin vs user di browser,
cek tidak ada secret bocor, cek performa dashboard. Perbaiki temuan, lalu siapkan panduan deploy Vercel + env.
```

## E. Template Prompt Perbaikan (saat ada bug)
```
Masalah: [apa yang terjadi]
Seharusnya: [hasil yang diharapkan]
Halaman/file: [path]
Langkah reproduksi: [1,2,3]
Lampiran: [screenshot / pesan error]
Batasan: perbaiki akar masalah, jangan ubah fitur lain, jelaskan perubahan.
```

## F. Tips Agar Hasil Maksimal
1. **Satu fase = satu sesi**; commit Git sebelum dan sesudah.
2. Minta AI **membuktikan** (screenshot browser, query DB), bukan hanya bilang selesai.
3. Jangan campur banyak permintaan; fitur kecil lebih akurat.
4. Jika AI mulai "lupa" aturan, mulai sesi baru dan suruh baca ulang `docs/` + `RULES.md`.
5. Verifikasi angka manual untuk 1 santri (hitung baris → halaman → juz) agar logika terjamin.
6. Gunakan model terkuat untuk Fase 2 dan 5 (logika berat), model cepat untuk perbaikan UI.