KONTEKS (baca dulu; kamu mungkin agent baru)
Project: tahfizh-app, Pesantren Darul Ilmi. Next.js 16 (Cache Components), React 19, Tailwind v4, shadcn Base UI,
Supabase (@supabase/ssr), Zod, react-hook-form. Baca RULES.md, AGENTS.md, docs/PRD.md (5.1 dan 5.2), docs/SCHEMA.md,
docs/DESIGN.md, semua supabase/migrations/*.sql, dan lihat docs/design/santri.png bila ada. Gunakan Context7 untuk
dokumentasi Next.js 16 dan shadcn Base UI. Buat RENCANA dulu dan tunggu persetujuan saya.

KEADAAN SAAT INI
- Halaman /santri dan /ustadz masih placeholder di dalam app shell. Dashboard, auth, tema, seed (100 santri, 20 ustadz,
  12 halaqah) sudah selesai dan terverifikasi. 62 tes lulus. Jangan merusak tes atau perilaku dashboard.
- Aturan Next.js 16 di RULES.md: komponen halaman sinkron; data per-request di komponen anak async dalam <Suspense>;
  DILARANG memakai `instant = false` untuk membungkam error; dilarang unstable_cache untuk data berbasis sesi.

KEPUTUSAN BISNIS (sudah diputuskan)
- "Hapus" = NONAKTIFKAN, bukan hapus permanen. Santri: students.status = 'INACTIVE'. Ustadz: teachers.is_active = false.
  Ada aksi "Aktifkan kembali". Tidak ada hapus permanen di fase ini. View dashboard sudah menyaring status ACTIVE.
- Hanya role ADMIN yang boleh menambah, mengubah, menonaktifkan, dan mengaktifkan kembali. USTADZ hanya melihat
  (tanpa tombol aksi).

FAKTA SKEMA YANG HARUS DIPATUHI (periksa ulang di migrasi)
- students: nisn (unik, wajib), name, gender (L/P), class_id, halaqah_id, parent_name, parent_whatsapp (semua wajib),
  photo_url, status (text). Cek apakah sudah ada CHECK status in ('ACTIVE','INACTIVE','GRADUATED'); bila belum, usulkan migrasi.
- teachers: name, gender, whatsapp (wajib), boarding_school, is_active, profile_id (jangan diubah dari UI).
- halaqahs: name, class_id, teacher_id (NOT NULL, ON DELETE RESTRICT), is_active. Kolom "ustadz pengampu" santri
  diturunkan dari halaqah -> teacher; santri tidak punya kolom ustadz langsung.
- classes: level 7-12 (tabel kecil, sudah terisi).
- RLS: SELECT students terbuka untuk semua user login. INSERT/DELETE students hanya admin. CELAH: kebijakan
  students_update_authorized mengizinkan USTADZ mengubah santri di halaqahnya sendiri. USULKAN migrasi BARU yang
  menjadikan UPDATE students hanya untuk admin (jangan mengubah migrasi lama; jangan menjalankan db push; berhenti dan
  minta persetujuan saya). Teachers: INSERT/UPDATE/DELETE hanya admin; SELECT hanya baris aktif bagi non-admin.

FITUR
A. Data Santri (/santri)
   - Tabel (shadcn Table) kolom: No, Nama Santri, Jenis Kelamin, Kelas, Kelas Halaqah, NISN, Ustadz Pengampu, Orangtua,
     WA Orangtua, Status, Aksi (hanya ADMIN). Nomor urut mengikuti halaman.
   - Filter kelas (7-12), pencarian nama atau NISN, dan tombol/toggle "Tampilkan nonaktif". Default hanya ACTIVE.
     Filter, pencarian, dan halaman disimpan di searchParams URL; pembacaan searchParams dilakukan di komponen anak
     async dalam <Suspense>, bukan di komponen halaman.
   - Paginasi di server (mis. 20 per halaman) dengan .range(); urutan stabil (nama, lalu id). Tampilkan total.
   - Dialog Tambah dan Edit: react-hook-form + Zod; komponen form pakai `field` (periksa components/ui; jika belum ada,
     beri perintah npx shadcn@latest add dan tunggu persetujuan). Pilihan Halaqah menampilkan hanya halaqah aktif pada
     kelas yang dipilih; kelas santri HARUS sama dengan class_id halaqahnya (validasi di server).
   - Aksi Nonaktifkan dengan dialog konfirmasi, dan Aktifkan kembali. Santri nonaktif tampil redup dengan badge.
B. Data Ustadz (/ustadz)
   - Tabel kolom: No, Nama Ustadz, Jenis Kelamin, No WA, Asal Pondok, Halaqah yang diampu (daftar nama), Kelas
     (diturunkan dari halaqah), Status, Aksi (ADMIN).
   - Filter kelas (ustadz yang mengampu halaqah di kelas itu), pencarian nama, toggle "Tampilkan nonaktif",
     paginasi server.
   - Dialog Tambah/Edit (nama, jenis kelamin, no WA, asal pondok). profile_id tidak dapat diubah dari UI.
   - Nonaktifkan DITOLAK dengan pesan jelas bila ustadz masih mengampu halaqah aktif ("Ganti ustadz pengampu halaqah X
     terlebih dahulu"). Aktifkan kembali diperbolehkan.
C. (Opsional, tanyakan dulu) Pengelolaan halaqah (mengganti ustadz pengampu) belum ada di PRD. Jangan membuatnya tanpa
   persetujuan saya; cukup tampilkan pesan penolakan di atas.

KEAMANAN (wajib)
- Semua mutasi lewat Server Action. Di setiap action: verifikasi sesi dengan getUser() (bukan getSession()), baca
  role dan is_active dari tabel profiles (BUKAN user_metadata), tolak bila bukan ADMIN aktif. Validasi ulang dengan Zod
  di server (jangan percaya validasi klien). Kembalikan hasil bertipe { ok: true } atau { ok: false, error } dengan pesan
  Bahasa Indonesia; jangan melempar pesan database mentah ke pengguna.
- Validasi data: nama (trim, tidak kosong), jenis kelamin L/P, NISN 10 digit angka, nomor WhatsApp dinormalisasi ke satu
  format (terima 08xxxxxxxxxx, 628xxxxxxxxxx, +628xxxxxxxxxx; simpan satu bentuk konsisten, mis. 08...), nama orangtua tidak kosong.
  Fungsi normalisasi dan skema Zod berupa fungsi murni di lib/validators/ dengan tes.
- NISN duplikat -> pesan ramah ("NISN sudah terdaftar"), bukan error mentah. Tangani kode error unik Postgres (23505)
  di server.
- Parameter searchParams (kelas, halaman, pencarian) divalidasi/dibatasi (kelas 7-12, halaman >= 1); jangan menyisipkan
  pencarian mentah ke filter PostgREST tanpa melarikan karakter khusus (mis. koma, kurung, titik, persen).
- Jangan menyentuh SUPABASE_SERVICE_ROLE_KEY; semua akses lewat klien sesi pengguna dan RLS.

TAMPILAN
- Ikuti app shell yang ada, token tema (tanpa hardcode warna), dan docs/design/santri.png bila ada. Badge warna untuk
  status, jenis kelamin. Skeleton loading, empty state ("Belum ada data" / "Tidak ada hasil untuk filter ini"), error
  state lewat app/(app)/error.tsx. Responsif: pada 390px tabel menggulir di dalam kontainer tanpa scroll horizontal halaman.
- Teks UI Bahasa Indonesia. Tombol aksi ikon punya aria-label. Fokus keyboard terlihat.

PENGUJIAN
- Tes vitest untuk: skema Zod (valid dan tidak valid), normalisasi nomor WA, aturan kelas = kelas halaqah, pembatasan
  parameter searchParams, dan pemeriksaan role pada fungsi guard (tiruan Supabase seperti di tests/dashboard-stats.test.ts:
  vi.hoisted, thenable generik, vi.mock('server-only')). Pastikan jalur error mengembalikan { ok: false } dan tidak melempar
  pesan database mentah.
- npm run lint, typecheck, test, build lulus tanpa flag pembungkam; dev overlay tanpa "Issues".
- Agent tidak punya password akun demo: halaman terproteksi diuji oleh saya. Setelah selesai BERHENTI dan beri daftar
  langkah uji manual (ADMIN dan USTADZ). Jangan membuat rute atau bypass autentikasi sementara.

LARANGAN
- Jangan git commit/push, jangan db push, jangan menyentuh .env.local. Jangan mengubah migrasi lama, proxy.ts, logika login,
  lib/queries/dashboard.ts, atau lib/dashboard-utils.ts. Jangan menambah paket atau komponen shadcn tanpa memberi perintahnya
  dan menunggu persetujuan. Jangan membuat fitur setoran, laporan, atau pengaturan.

KELUARAN: rencana (sebelum mengedit) berisi inventaris desain, daftar file, usulan migrasi (bila ada), model error,
dan pertanyaan terbuka; lalu daftar file dibuat/diubah, keluaran MENTAH ringkas npm test/lint/typecheck/build, dan
daftar langkah uji manual.