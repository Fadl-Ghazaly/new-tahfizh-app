KONTEKS (kamu agent baru yang melanjutkan pekerjaan agent sebelumnya; baca ini dulu)
Project: tahfizh-app, Pesantren Darul Ilmi. Stack: Next.js 16, React 19, Tailwind v4, shadcn Base UI,
Supabase. Baca RULES.md, AGENTS.md, docs/PRD.md, docs/SCHEMA.md, dan semua supabase/migrations/*.sql
sebelum mengerjakan apa pun. Gunakan Context7 bila perlu dokumentasi.

CARA KERJA
- Buat RENCANA singkat dulu dan tunggu persetujuan saya sebelum mengedit file.
- Setiap perintah terminal yang kamu jalankan harus berupa perintah baca, uji, lint, typecheck, atau dry-run.
- JANGAN membaca, mencetak, atau menyalin isi .env.local atau kunci apa pun.
- JANGAN menjalankan `npm run seed -- --confirm`. JANGAN menulis ke database. JANGAN git commit atau git push.

KEADAAN SAAT INI (sudah ada di repository; periksa sendiri dengan membaca file)
- lib/tahfizh.ts: konstanta dan fungsi hitung (15 baris = 1 halaman, 20 halaman = 1 juz, 300 baris = 1 juz,
  9000 baris = 30 juz), formatCapaian "X juz, Y halaman", persenProgress, hitungNilai.
- lib/quran-juz.ts: pemetaan 30 juz Mushaf Madinah dan getNextSabaqChunk() yang memotong rekaman di batas juz
  dan batas surat, dengan alokasi baris kumulatif sehingga tiap juz tepat 300 baris.
- tests/tahfizh.test.ts dan tests/quran-juz.test.ts (vitest, 25 tes lulus).
- supabase/seed/seed.ts: pembangkit data dummy (20 teachers, 12 halaqahs, 100 students, attendance harian
  Senin-Sabtu 365 hari, memorization_records SABAQ/SABQI/MANZIL) dengan mode --dry-run (tanpa menulis ke DB)
  dan --confirm (menulis ke DB; jangan dijalankan). Dry-run terakhir: attendance 31.400, records 83.558,
  distribusi santri per kelompok juz 7/33/28/22/10, santri tertinggi 26 juz 9 halaman (melebihi batas).

TUGAS (kerjakan berurutan)
1. BATAS JUZ 21: awal Juz 21 adalah 29:46 (Al-Ankabut ayat 46), bukan 29:1. Periksa lib/quran-juz.ts dan koreksi
   bila perlu (Juz 20 mulai 27:56, Juz 22 mulai 33:31). Tambahkan tes penjaga di tests/quran-juz.test.ts yang
   menegaskan 30 awal juz sama persis dengan daftar kanonik berikut:
   1:1, 2:142, 2:253, 3:93, 4:24, 4:148, 5:82, 6:111, 7:88, 8:41, 9:93, 11:6, 12:53, 15:1, 17:1, 18:75,
   21:1, 23:1, 25:21, 27:56, 29:46, 33:31, 36:28, 39:32, 41:47, 46:1, 51:31, 58:1, 67:1, 78:1.
   Tambahkan juga tes bahwa 29:45 termasuk Juz 20 dan 29:46 termasuk Juz 21.
   Jika daftar kanonik ini berbeda dari sumber tepercaya yang kamu cek, tampilkan perbedaannya
   dan jangan menimpa diam-diam.

2. BATAS MAKSIMUM: total sabaq per santri tidak boleh melebihi 25 juz (7.500 baris). Sesuaikan profil kecepatan
   agar kelompok 21-25 juz terisi (sekitar 10 santri) dan tidak ada yang di atas 25.
   Distribusi target: sekitar 10 santri 1-2 juz, 30 santri 3-6 juz, 30 santri 7-12 juz, 20 santri 13-20 juz,
   10 santri 21-25 juz.

3. STATISTIK TAMBAHAN di dry-run: cetak total sabaq minimum, median, dan maksimum per santri dalam baris dan
   format "X juz, Y halaman". Pastikan minimum >= 300 baris (1 juz). Cetak juga, untuk tiap juz yang tersentuh,
   rentang nomor surat (min-max) pada record yang dihasilkan.

4. VERIFIKASI: jalankan npm test, npm run lint, npm run typecheck, lalu `npm run seed -- --dry-run` DUA KALI
   dan pastikan statistiknya identik (deterministik).

KELUARAN
Daftar file yang diubah, hasil uji, statistik dry-run lengkap, dan pertanyaan terbuka. BERHENTI setelah itu.