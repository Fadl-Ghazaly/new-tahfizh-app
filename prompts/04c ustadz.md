KONTEKS (baca dulu; kamu mungkin agent baru)
Project: tahfizh-app, Pesantren Darul Ilmi. Next.js 16 (Cache Components), React 19, Tailwind v4, shadcn Base UI, Supabase (@supabase/ssr),
Zod, react-hook-form. Baca RULES.md, AGENTS.md, docs/PRD.md (5.2), docs/SCHEMA.md, semua supabase/migrations/*.sql, dan SELURUH folder
app/(app)/santri/ beserta lib/validators/ dan tests/ terkait. Gunakan Context7 untuk Next.js 16 dan Base UI. Buat RENCANA singkat dulu
dan tunggu persetujuan saya.

TUJUAN: kerjakan ulang /ustadz dengan pola yang SAMA dengan /santri yang sudah selesai dan lolos uji. Jangan menemukan ulang pola.

PELAJARAN DARI /santri (wajib dipatuhi)
- page.tsx SINKRON (PageHeader + <Suspense fallback>) yang hanya meneruskan promise searchParams. Komponen async anak
  (ustadz-content.tsx) memulai dengan `await connection()` (import dari 'next/server') sebagai PERNYATAAN PERTAMA, baru await searchParams
  dan akses data. DILARANG memakai `instant = false`.
- Tidak ada API route. Hapus app/api/ustadz-list dan app/(app)/ustadz/ustadz-client-content.tsx (diganti ustadz-client.tsx).
- Parameter URL (kelas, halaman, pencarian, nonaktif) divalidasi lewat fungsi murni di lib/validators/list-params.ts (pakai ulang; tambahkan
  hanya bila perlu). Ukuran halaman tetap 20. Pencarian memakai whitelist (huruf Unicode, angka, spasi, apostrof, tanda hubung; maks 50).
- Server Action: requireAdmin() (lib/auth/require-admin.ts), validasi Zod di server, hasil { ok } / { ok:false, error }, pesan error lewat
  mapDbError (JANGAN pernah menyertakan error.message dalam pesan ke UI; detail hanya console.error di server), revalidatePath('/ustadz').
- Token tema sudah lengkap (popover, input, ring, secondary, destructive). Dialog dan popup berlatar solid. Link tombol memakai
  buttonVariants. Enter di kolom pencarian memicu pencarian.
- SELECT WAJIB menampilkan label, bukan nilai mentah (di /santri sempat tampil UUID dan "L"). Pakai children berupa fungsi pada
  SelectValue (Base UI) yang memanggil satu helper murni bersama (mis. optionLabel(options, value, placeholder) di lib/formatters.ts)
  untuk SEMUA Select, termasuk saat dialog Edit terbuka dengan nilai awal. Nilai tak dikenal atau null menampilkan placeholder,
  bukan nilai mentah. Trigger memakai w-full dan min-w-0 dengan teks truncate agar dialog tidak melebar.
- Lint harus dijalankan PENUH (npm run lint) dan 0 error. Jangan memakai `any`; tipe parameter parser harus sama dengan tipe
  searchParams Next.js (Record<string, string | string[] | undefined>) sehingga tes tidak butuh cast.
- Input pencarian yang nilainya berasal dari URL HARUS terkontrol (state + onChange), bukan `defaultValue` yang berubah setelah
  navigasi. Base UI memberi galat konsol "changing the default value state of an uncontrolled FieldControl" bila defaultValue
  berubah (itu terjadi di /santri). Sinkronkan state dengan prop dari server memakai pola "sesuaikan state saat render"
  (bandingkan prop dengan nilai sebelumnya) atau `key` pada input, bukan setState di dalam useEffect. Console harus bersih.
- VALIDASI FORM: elemen <form> dialog memakai `noValidate` agar validasi bawaan browser (tooltip "Please fill out this field." berbahasa
  Inggris, hanya satu kolom sekaligus) TIDAK mendahului validasi Zod. Pesan Zod berbahasa Indonesia tampil di bawah SETIAP kolom yang tidak
  valid sekaligus (aria-invalid dan aria-describedby), fokus pindah ke kolom tidak valid pertama, pesan hilang saat kolom diubah, dan tidak ada
  permintaan ke server bila tidak valid. Pemetaan isu Zod ke pesan per kolom berupa fungsi murni dengan tes.
- GELAR: "Ust." hanya ditentukan di satu fungsi murni di sisi tampilan (server mengirim nama mentah; jangan menempelkan "Ust." sebagai teks
  tetap); pakai withUstadzTitle dan buildHalaqahLabel. Dialog Tambah mulai kosong dan mereset semua state; nilai Select selalu string.
  Tombol Cari memakai varian dengan kontras cukup (secondary atau outline).

FITUR (PRD 5.2)
- Tabel: No, Nama Ustadz, Jenis Kelamin (badge), No WA, Asal Pondok, Halaqah yang diampu (daftar nama), Kelas (diturunkan dari halaqah),
  Status, Aksi (hanya ADMIN). Nomor urut mengikuti halaman. Paginasi server, urutan nama lalu id, total ditampilkan.
- Filter kelas (7-12): ustadz yang mengampu halaqah aktif pada kelas itu (gunakan relasi inner join pada halaqahs dan filter class_id; pastikan
  hasilnya tidak duplikat dan count benar). Pencarian nama. Toggle "Tampilkan nonaktif" hanya untuk ADMIN (RLS menyembunyikan ustadz nonaktif
  dari non-admin; jangan menampilkan toggle yang tidak berfungsi untuk USTADZ).
- Dialog Tambah/Edit (react-hook-form + Zod + field): nama (wajib), jenis kelamin (L/P, tampil "Laki-laki"/"Perempuan"), no WA (wajib,
  dinormalisasi lewat fungsi yang sama dengan santri), asal pondok (opsional). teachers.profile_id TIDAK boleh diubah dari UI.
- Nonaktifkan (alert-dialog) = teachers.is_active = false. DITOLAK dengan pesan jelas bila ustadz masih mengampu halaqah aktif:
  "Ganti ustadz pengampu halaqah <nama> terlebih dahulu." Aktifkan kembali diperbolehkan. Tidak ada hapus permanen.
- Mengganti ustadz pengampu halaqah BELUM ada di PRD; jangan membuatnya. Jangan menyentuh tabel profiles atau akun login.

KEAMANAN
- Semua mutasi hanya ADMIN aktif (role dari tabel profiles lewat requireAdmin). RLS teachers sudah membatasi tulis ke admin; jangan mengubah RLS.
- Tidak boleh memakai SUPABASE_SERVICE_ROLE_KEY. Jangan menjalankan SQL/db push apa pun ke database.

TES (vitest; tiruan Supabase seperti tests/dashboard-stats.test.ts)
- Skema Zod ustadz (valid/tidak valid), aturan "tidak boleh dinonaktifkan bila masih mengampu halaqah aktif" sebagai fungsi murni
  (termasuk ustadz tanpa halaqah, halaqah nonaktif tidak menghalangi, aktivasi kembali diperbolehkan), pemetaan error tanpa error.message,
  dan guard admin. Jumlah tes harus naik dan SELURUH npm run lint harus 0 peringatan (peringatan lama di ustadz-client-content.tsx hilang
  karena file dihapus).

LARANGAN
- Jangan menyentuh /santri, supabase/, proxy.ts, login, lib/queries/, lib/dashboard-utils.ts, app/globals.css, dan .env.local.
- Jangan git commit. Jangan menambah paket atau komponen shadcn tanpa memberi perintahnya dan menunggu persetujuan.
- Kejujuran verifikasi: kamu tidak punya password akun demo. Nyatakan eksplisit apa yang TIDAK dapat kamu verifikasi (halaman terproteksi,
  dev overlay, tampilan visual). Jangan menulis "overlay bersih" atau "UI terverifikasi" bila tidak bisa membuktikannya.

KELUARAN
Rencana (sebelum mengedit); lalu daftar file dibuat/dihapus/diubah, keluaran MENTAH npm test (baris "Test Files ... Tests ..."), lint,
typecheck, build, konfirmasi app/api tidak lagi memuat ustadz-list dan rute build tidak memuat /api/*, lalu BERHENTI dan beri daftar uji manual.