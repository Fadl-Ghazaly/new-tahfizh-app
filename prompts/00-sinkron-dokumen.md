KONTEKS
Project: tahfizh-app (Pesantren Darul Ilmi). Stack: Next.js 16, React 19, Tailwind v4,
shadcn/ui berbasis Base UI, Supabase (@supabase/ssr).
Sumber kebenaran skema = semua file di supabase/migrations/ (urut berdasarkan nama file).
Dokumen di docs/ ditulis SEBELUM skema dibuat sehingga sebagian sudah tidak sinkron.

CARA KERJA
Buat RENCANA dulu dan tunggu persetujuan saya sebelum mengedit file apa pun.

TUGAS: hanya memperbarui DOKUMEN. Jangan mengubah kode aplikasi.

1. Baca: RULES.md, AGENTS.md, docs/*.md, dan SEMUA supabase/migrations/*.sql.

2. Tulis ulang docs/SCHEMA.md agar 100% sesuai migrasi (kondisi AKHIR setelah semua migrasi):
   - Daftar tabel beserta kolom, tipe, default, constraint, FK (on delete), dan index.
   - Semua enum beserta nilainya (role ADMIN/USTADZ, attendance_status, memorization_type, dll).
   - Fungsi dan trigger (set_updated_at, handle_new_user, is_admin, is_ustadz,
     current_teacher_id, can_access_student) dan siapa yang boleh mengeksekusinya.
   - Matriks RLS: per tabel x (select/insert/update/delete) x (ADMIN/USTADZ), mencerminkan
     policy terakhir (select students/attendance/memorization_records = semua user login;
     tulis = admin atau ustadz pemilik halaqah).
   - Tabel pemetaan istilah: Indonesia -> kolom DB
     (mis. "kelas halaqah" = halaqahs.name, "ustadz pengampu" = halaqahs.teacher_id,
      "nilai kelancaran" = fluency_score, "jumlah baris" = line_count).
   - Bagian "Keputusan Desain": boleh lebih dari satu record per santri/hari/jenis;
     hapus data hanya admin; pembatalan data lewat status VOID; santri tidak punya kolom ustadz
     langsung (diturunkan dari halaqah).
   - Rencana view/agregasi (nama dalam bahasa Inggris, belum dibuat) untuk Fase 5 dan 6.
   - Aturan seed yang dikoreksi sesuai constraint nyata: teachers.whatsapp wajib, students
     wajib class_id+halaqah_id+parent_name+parent_whatsapp, halaqahs wajib teacher_id,
     line_count 1-300, setoran dengan kehadiran tidak hadir TIDAK dibuat (hanya baris attendance),
     urutan hapus/isi ulang yang aman terhadap FK RESTRICT, seed idempoten,
     akun demo ADMIN dan USTADZ (teachers.profile_id terhubung ke akun USTADZ).

3. Perbarui docs/PRD.md: nama role (ADMIN/USTADZ), pemetaan kolom daftar santri/ustadz,
   filter kelas ustadz diturunkan dari halaqahs.class_id, aturan absensi terpisah dari setoran,
   aturan ranking/dashboard (semua user login boleh melihat semua data, menulis hanya halaqah sendiri).
   Jangan mengubah aturan bisnis lain (15 baris=1 halaman, 20 halaman=1 juz, nilai -5, dst).

4. Perbarui docs/ARCHITECTURE.md: ganti middleware.ts -> proxy.ts (Next.js 16), sebut komponen
   field + Base UI, struktur folder lib/supabase, Server Actions, nama tabel/view yang benar.
   Verifikasi konvensi Next.js 16 dan shadcn Base UI dengan Context7. Jika ragu, tulis
   "perlu diverifikasi", jangan menebak.

5. Perbarui docs/PROMPTS.md: sesuaikan prompt Fase 1, 2, dan 4 dengan skema nyata
   (nama tabel, role, proxy.ts, form setoran menulis ke attendance DAN memorization_records).
   Bagian lain jangan diubah.

6. docs/PANDUAN_LANGKAH.md: hanya perbaiki bagian yang menyebut nama tabel/role lama.
   docs/DESIGN.md: jangan diubah kecuali ada istilah yang bertentangan.

LARANGAN
- Jangan menyentuh: supabase/ (migrasi), app/, components/, lib/, package.json, config apa pun.
- Jangan membuat migrasi baru. Jangan mengubah bagian "Stack Terpasang" di RULES.md.
- Jangan menjalankan perintah terminal selain membaca file. Jangan git commit.

KELUARAN SETELAH SELESAI
(a) Daftar file yang diubah + ringkasan tiap perubahan.
(b) Daftar ketidaksesuaian yang ditemukan antara dokumen lama dan migrasi.
(c) Pertanyaan terbuka atau keputusan yang perlu saya ambil.

