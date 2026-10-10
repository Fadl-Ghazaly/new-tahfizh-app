Baca RULES.md, AGENTS.md, dan semua file di docs/ (terutama ARCHITECTURE.md, SCHEMA.md, DESIGN.md,
docs/design/stitch-tokens.md). Ikuti bagian "Stack Terpasang". Gunakan Context7 untuk dokumentasi
Next.js 16, @supabase/ssr, dan shadcn Base UI. Buat RENCANA dulu dan tunggu persetujuan saya.

SEBELUM MERENCANAKAN: LIHAT gambar docs/design/dashboard.png dan docs/design/dashboard-mobile.png
(dan layar lain di docs/design/ yang menampilkan sidebar/topbar) dengan membukanya secara nyata.
Jika file tidak bisa dibuka atau tidak terbaca, BERHENTI dan beri tahu saya. Jangan menebak.
Buat inventaris elemen app shell dari desain: lebar dan warna sidebar, logo dan teks di atas menu,
ikon dan teks tiap menu, gaya menu aktif, bagian bawah sidebar, isi topbar, pola navigasi mobile
(bottom nav atau drawer), warna dan jarak. Tampilkan inventaris itu di rencana.

TUGAS: Tahap B - app shell, logout, dan placeholder menu.
Tahap A (klien Supabase, proxy.ts, tema, landing, login) sudah selesai dan sudah di-commit.

1. Layout terproteksi: app/(app)/layout.tsx (Server Component)
   - Verifikasi pengguna dengan getUser() (bukan getSession()). Tidak ada pengguna -> redirect /login.
   - Ambil dari tabel profiles: full_name, role, is_active. Role selalu dari tabel profiles,
     tidak pernah dari user_metadata atau JWT. is_active = false -> sign out dan redirect /login.
   - Ambil nama, logo, tema pesantren lewat fungsi/kueri bersama yang SUDAH ADA (RPC get_public_school_settings,
     jangan membuat panggilan ganda atau pola baru). Fallback nama "Pesantren Darul Ilmi".
   - Teruskan data pengguna ke komponen navigasi lewat props yang minimal (nama, role, nama pesantren, logo).

2. Navigasi 6 menu (sesuai ARCHITECTURE.md untuk path rute)
   - Dashboard, Data Santri, Data Ustadz, Input Setoran, Laporan, Pengaturan. Ikon lucide-react.
   - Pengaturan hanya tampil untuk role ADMIN. Halaman /pengaturan juga WAJIB cek role ADMIN di server
     (Server Component), bukan hanya menyembunyikan menu. USTADZ yang membuka langsung -> redirect /dashboard
     disertai toast/pesan "Anda tidak memiliki akses".
   - Menu aktif dideteksi dari pathname (Client Component kecil hanya untuk bagian ini). Atribut aria-current="page".
   - Warna sidebar dan menu pakai token tema (CSS variables), bukan hardcode, agar ikut berganti tema.

3. Sidebar dan topbar (sesuai desain Stitch)
   - Desktop: sidebar tetap di kiri dengan logo + nama pesantren, 6 menu, dan elemen bawah seperti di desain.
   - Topbar: judul halaman atau nama pesantren sesuai desain, nama pengguna, badge role (ADMIN/USTADZ), tombol logout.
   - Mobile (< 768px): ikuti pola navigasi mobile pada desain Stitch. Jika berupa bottom nav, tampilkan menu
     utama di bawah dan sisanya di menu "Lainnya"; jika drawer, pakai Sheet dengan tombol hamburger.
     Jika desain tidak jelas, tanyakan sebelum mengimplementasikan.
     Drawer menutup otomatis setelah berpindah halaman. Konten tidak tertutup bottom nav.

4. Logout
   - Server Action: supabase.auth.signOut() lalu redirect /login. Dipicu lewat <form action> dengan tombol,
     BUKAN tautan GET. Tampilkan toast "Anda telah keluar" bila memungkinkan.
   - Setelah logout, tombol Back browser tidak boleh menampilkan konten terproteksi (periksa dan jelaskan
     bagaimana Next.js 16 menanganinya; tambahkan header cache bila perlu).

5. Halaman placeholder (6 rute) dalam app shell
   - /dashboard, /santri, /ustadz, /setoran, /laporan, /pengaturan. Masing-masing: komponen PageHeader bersama
     (judul + deskripsi singkat), dan komponen EmptyState bersama dengan teks "Fitur ini sedang dikembangkan".
     Jangan membuat fitur CRUD, setoran, laporan, atau grafik.
   - Tambahkan app/(app)/loading.tsx (skeleton), app/(app)/error.tsx (pesan Bahasa Indonesia + tombol coba lagi),
     dan not-found Bahasa Indonesia untuk grup (app).

6. Aksesibilitas dasar: fokus keyboard terlihat, tombol ikon punya aria-label, kontras warna memadai pada semua
   6 tema (cek minimal tema default dan tema gelap "Malam").

7. Pengujian
   - Otomatis: npm run lint, npm run typecheck, npm run build lulus tanpa flag pembungkam apa pun.
     Dev overlay tidak boleh menampilkan "Issues" (kecuali warning hydration dari ekstensi browser, yang sudah
     diredam dengan suppressHydrationWarning di <body>).
   - Agent tidak punya password akun demo, sehingga halaman terproteksi TIDAK bisa diuji agent. Setelah selesai,
     BERHENTI dan beri daftar langkah uji manual untuk saya. Saya akan mengirim screenshot hasil login
     (1440px dan 390px) untuk Anda bandingkan dengan desain Stitch dan perbaiki selisihnya.
   - Jangan membuat rute atau bypass autentikasi sementara untuk keperluan screenshot.

LARANGAN
- Jangan mengubah supabase/ dan jangan membuat migrasi. Jangan menyentuh .env.local.
- Jangan mengubah logika login (actions.ts) dan aturan proxy.ts kecuali terbukti diperlukan; jelaskan dulu
  alasannya di rencana dan tunggu persetujuan saya.
- Jangan git commit. Jangan menambah paket baru atau komponen shadcn tanpa memberi saya perintah npx-nya
  dan menunggu persetujuan.
- Jangan membuat fitur fase berikutnya.

KELUARAN: inventaris desain, rencana, daftar file dibuat/diubah, hasil uji otomatis, daftar langkah uji manual,
dan pertanyaan terbuka.