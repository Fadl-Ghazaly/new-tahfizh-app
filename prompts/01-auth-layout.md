Baca RULES.md, AGENTS.md, dan semua file di docs/ (terutama SCHEMA.md, DESIGN.md, ARCHITECTURE.md).
Ikuti bagian "Stack Terpasang". Gunakan Context7 untuk dokumentasi Next.js 16, @supabase/ssr,
dan shadcn Base UI. Buat RENCANA dulu dan tunggu persetujuan saya sebelum mengedit file apa pun.

Rujuk desain di docs/design/ (screenshot) dan docs/DESIGN.md. Ikuti tampilan Stitch untuk landing, login,
app shell, dan navigasi mobile; bandingkan hasil di browser dengan screenshot tersebut.
Gunakan Supabase MCP hanya untuk membaca (jangan membuat atau mengubah skema).

TUGAS: Fase 1 - landing page, login, proteksi route, dan app shell.

1. Supabase client
   - lib/supabase/client.ts (browser), lib/supabase/server.ts (Server Components/Actions),
     dan helper untuk proxy.ts, memakai @supabase/ssr.
   - Variabel env: NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY
     (gunakan persis nama ini). Jangan menyentuh SUPABASE_SERVICE_ROLE_KEY di Fase ini.
   - Verifikasi sesi di server dengan getUser(), bukan getSession().

2. proxy.ts (Next.js 16, pengganti middleware.ts)
   - Segarkan sesi Supabase di setiap request.
   - Belum login -> akses ke /dashboard dan semua route aplikasi dialihkan ke /login.
   - Sudah login -> /login dialihkan ke /dashboard.
   - Halaman /pengaturan hanya untuk role ADMIN; USTADZ dialihkan ke /dashboard dengan pesan.
   - Cek role dan is_active juga di Server Component/Server Action (defense in depth),
     bukan hanya di proxy.ts. Akun dengan is_active = false tidak boleh masuk.
   - Validasi parameter redirect setelah login (hanya path internal, cegah open redirect).

3. Halaman publik
   - / : landing sesuai DESIGN.md (hero logo + nama pesantren dari school_settings, 3 kartu
     Sabaq/Sabqi/Manzil, tombol "Masuk").
   - /login : kartu di tengah, email + password, validasi Zod, pesan error Bahasa Indonesia,
     loading state. Pakai Server Action. Pakai field + react-hook-form Controller.
   - Landing dan login dibaca oleh pengunjung belum login, jadi nama/logo/tema diambil
     lewat cara yang aman. Jangan membuka RLS school_settings ke anon. Jika perlu, usulkan
     solusi di rencana dan tunggu persetujuan saya (mis. fungsi RPC khusus atau nilai default sementara).

4. App shell di app/(app)/layout.tsx
   - Sidebar 6 menu berwarna: Dashboard, Data Santri, Data Ustadz, Input Setoran, Laporan,
     Pengaturan. Menu Pengaturan hanya tampil untuk ADMIN.
   - Topbar: logo, nama pesantren, nama pengguna + role, tombol logout.
   - Mobile: ikuti pola navigasi pada desain mobile Stitch (bottom nav atau drawer/Sheet).
     Jika desain tidak jelas, tanyakan sebelum mengimplementasikan.
   - Halaman placeholder untuk 6 menu (judul + empty state), belum ada fitur.
   - Ambil profil (full_name, role) dari tabel profiles.
   - Baca components/ui/ sebelum memakai komponen. Jika butuh komponen yang belum ada
     (mis. field), tampilkan perintah `npx shadcn@latest add ...` yang diperlukan dan tunggu persetujuan saya.
   - Pasang <Toaster /> (sonner) di root layout untuk notifikasi.

5. Tema
   - Terapkan 6 tema dari DESIGN.md sebagai CSS variables di app/globals.css (Tailwind v4),
     dipilih lewat atribut data-theme pada <html>. Nilai DB theme-1..theme-6 dipetakan
     sesuai tabel di DESIGN.md. Tema aktif dibaca dari school_settings. Belum perlu UI pengganti tema.
   - Warna fungsional sabaq/sabqi/manzil dan 4 kartu dashboard sebagai token, bukan hardcode.

6. Pengujian
   - Otomatis: npm run lint, npm run typecheck, npm run build sampai lulus.
   - Browser (screenshot), hanya alur tanpa login: / tampil, /dashboard dialihkan ke /login,
     tampilan / dan /login pada 360px dan 1440px, pesan validasi saat form kosong.
   - Alur setelah login (login admin, login ustadz tanpa menu Pengaturan, /pengaturan oleh ustadz
     dialihkan, logout) akan SAYA uji sendiri. Setelah selesai, berhenti dan berikan daftar langkah uji manualnya.
   - Jangan meminta, menyimpan, atau menampilkan password akun demo di file mana pun.

LARANGAN
- Jangan mengubah supabase/ dan jangan membuat migrasi sendiri. Jika butuh perubahan DB,
  tulis SQL-nya di rencana dan berhenti. Setelah saya setujui, baru boleh membuat file migrasi;
  saya yang menjalankan `npx supabase db push`. Fungsi yang diusulkan wajib memakai
  SECURITY DEFINER, set search_path = '', hanya mengembalikan school_name, logo_url, theme,
  dan GRANT EXECUTE hanya ke anon dan authenticated untuk fungsi itu saja.
- Jangan git commit. Jangan menulis atau menampilkan isi .env.local.
- Jangan membuat fitur CRUD, setoran, laporan, atau dashboard (itu fase berikutnya).

KELUARAN: daftar file dibuat/diubah, hasil uji otomatis dan browser, daftar langkah uji manual
untuk saya, dan pertanyaan terbuka.