Baca RULES.md, AGENTS.md, docs/PRD.md, docs/SCHEMA.md, dan SEMUA supabase/migrations/*.sql.
Ikuti bagian "Stack Terpasang". Gunakan Context7 bila perlu. Buat RENCANA dulu dan tunggu persetujuan saya.

TUGAS: Fase 2 - data referensi Al-Quran, util perhitungan, dan seed data dummy.
Migrasi adalah sumber kebenaran skema. Jangan mengubah supabase/ dan jangan membuat migrasi.

1. Util perhitungan: lib/tahfizh.ts (satu-satunya sumber logika hitung, dengan unit test vitest)
   - Konstanta: BARIS_PER_HALAMAN = 15, HALAMAN_PER_JUZ = 20, BARIS_PER_JUZ = 300, TOTAL_BARIS_30_JUZ = 9000.
   - barisKeHalaman, barisKeJuzHalaman(totalBaris) -> { juz, halaman, barisSisa }.
   - formatCapaian(totalBaris) -> "X juz, Y halaman". Contoh wajib lulus uji:
     330 baris (22 halaman) -> "1 juz, 2 halaman"; 225 baris (15 halaman) -> "0 juz, 15 halaman";
     0 -> "0 juz, 0 halaman"; 9000 -> "30 juz, 0 halaman".
   - persenProgress(totalBaris) = min(total/9000*100, 100).
   - hitungNilai(jumlahKesalahan) = max(100 - 5*kesalahan, 0).
   Jika vitest belum terpasang atau gagal diinstal (konflik @types/node), tampilkan perintah perbaikannya
   dan tunggu saya (jangan memakai --force atau --legacy-peer-deps).

2. Data referensi Al-Quran: lib/quran-juz.ts
   Awal tiap juz (nomor surat:ayat), standar mushaf Madinah. Verifikasi dengan sumber tepercaya
   (Context7/dokumentasi) sebelum dipakai, dan tandai jika ada yang berbeda:
   J1 1:1, J2 2:142, J3 2:253, J4 3:93, J5 4:24, J6 4:148, J7 5:82, J8 6:111, J9 7:88, J10 8:41,
   J11 9:93, J12 11:6, J13 12:53, J14 15:1, J15 17:1, J16 18:75, J17 21:1, J18 23:1, J19 25:21, J20 27:56,
   J21 29:1, J22 33:31, J23 36:28, J24 39:32, J25 41:47, J26 46:1, J27 51:31, J28 58:1, J29 67:1, J30 78:1.
   Jumlah ayat per surat diambil dari tabel quran_surahs di migrasi (114 surat, total 6236 ayat).
   Model sederhana yang disepakati: setiap juz = 300 baris, dibagi rata per ayat dalam rentangnya.
   Sediakan fungsi: daftar bagian (surat, ayat mulai, ayat selesai) per juz, dan pembagi
   "ambil N baris berikutnya dari posisi X" yang MEMOTONG rekaman di batas juz dan batas surat
   (satu record memorization_records hanya boleh satu juz dan satu surat).
   Tambahkan uji: total ayat semua juz = 6236, tiap juz = 300 baris, tidak ada ayat terlewat atau tumpang tindih.

3. Skrip seed: supabase/seed/seed.ts (dijalankan dengan `npm run seed`)
   - Pakai @faker-js/faker (locale id_ID) dengan seed tetap (hasil reproducible). Pakai SUPABASE_SERVICE_ROLE_KEY
     dari .env.local via dotenv. Jangan pernah mencetak nilai kunci atau URL penuh ke log.
   - Pengaman: jalankan hanya dengan flag --confirm; tampilkan ringkasan project (ref saja) dan jumlah baris
     yang akan dihapus sebelum menjalankan. Periksa bahwa SUPABASE_SERVICE_ROLE_KEY ada tanpa mencetak nilainya.
   - Mode --dry-run: membangkitkan SEMUA data di memori tanpa menulis ke database, lalu mencetak statistik:
     jumlah baris per tabel, distribusi total juz per santri (kelompok 0-1, 2-5, 6-10, 11-20, 21-30),
     jumlah record per type, jumlah attendance per status, rentang tanggal, dan santri dengan total tertinggi.
     Tanpa flag apa pun, skrip hanya menampilkan petunjuk pemakaian. Perintah: `npm run seed -- --dry-run`
     dan `npm run seed -- --confirm`.
   - Penghapusan data lama dilakukan bertahap (chunk) agar tidak timeout, dengan urutan aman terhadap FK.
   - Idempoten: hapus lalu isi ulang HANYA data dummy: memorization_records, attendance, students, halaqahs,
     teachers (urutan aman terhadap FK RESTRICT). JANGAN menyentuh profiles, auth.users, classes,
     quran_surahs, school_settings.
   - Data:
     a. 20 teachers (nama Indonesia, gender L/P, whatsapp wajib format 08xxxxxxxxxx, boarding_school bervariasi).
        Hubungkan SATU teacher ke profil ustadz@darulilmi.test lewat teachers.profile_id (cari id profil dari email).
     b. 12 halaqahs: 2 per kelas (7-12), nama contoh "Halaqah 7A", "Halaqah 7B", masing-masing satu teacher berbeda.
     c. 100 students: kelas acak 7-12 (sebaran wajar), halaqah_id dari halaqah di kelas yang sama,
        NISN 10 digit unik, parent_name, parent_whatsapp, status 'ACTIVE'.
     d. Rentang waktu: 365 hari terakhir sampai hari ini (zona waktu Asia/Jakarta), hari kerja Senin-Sabtu.
     e. attendance: satu baris per santri per hari kerja. Status berbobot: HADIR ~86%, TERLAMBAT ~4%, IZIN ~4%,
        SAKIT ~3%, ALPHA ~3%. recorded_by = profil ADMIN (cari dari email admin@darulilmi.test).
     f. memorization_records HANYA untuk hari ber-status HADIR atau TERLAMBAT (line_count minimal 1):
        - SABAQ: maju berurutan mulai Juz 30 lalu mundur (29, 28, ...) lewat util di langkah 2;
          ayat selalu berurutan dan konsisten dengan surat/juz.
        - SABQI: mengulang bagian sabaq 1-5 hari terakhir (juz/surat/ayat valid).
        - MANZIL: bergilir pada bagian yang sudah dihafal sebelumnya.
        - mistake_count acak (sebagian besar 0-4), fluency_score = hitungNilai(mistake_count),
          notes sesekali, status 'ACTIVE', recorded_by profil ADMIN (atau profil teacher bila terhubung).
     g. "Profil kecepatan" per santri agar total sabaq setahun bervariasi 1 sampai 25 juz:
        ~10 santri 1-2 juz, ~30 santri 3-6 juz, ~30 santri 7-12 juz, ~20 santri 13-20 juz, ~10 santri 21-25 juz.
        Ambil sebagian kecil santri yang aktivitasnya MENURUN drastis di bulan berjalan (untuk uji "butuh perhatian").
     h. Insert bertahap (batch sekitar 1000 baris) dengan progress log tanpa data sensitif.
   - Validasi sebelum insert: semua constraint tabel terpenuhi (line_count 1-300, ayah_end >= ayah_start,
     surah_id 1-114, juz 1-30, fluency_score 0-100).

4. Verifikasi (jalankan setelah seed, tampilkan hasilnya)
   Beri SQL yang saya jalankan sendiri di Supabase SQL Editor, dan jalankan versi baca-saja lewat Supabase MCP:
   - jumlah teachers = 20, halaqahs = 12, students = 100, rentang tanggal attendance dan memorization_records.
   - distribusi total juz per santri (sum line_count SABAQ / 300) dalam kelompok 0-1, 2-5, 6-10, 11-20, 21-30.
   - tidak ada santri dengan total di atas 30 juz.
   - jumlah record per type, dan jumlah attendance per status.
   - tidak ada record dengan tanggal di hari ber-status IZIN/SAKIT/ALPHA.

LARANGAN
- Jangan mengubah supabase/ (migrasi), app/, components/, proxy.ts, atau logika autentikasi.
- Jangan git commit. Jangan menampilkan isi .env.local atau kunci apa pun. Jangan menjalankan seed sebelum saya setujui.
KELUARAN: rencana, file yang dibuat, hasil uji vitest, dan perintah seed. Setelah saya menjalankan seed,
tampilkan hasil verifikasi.