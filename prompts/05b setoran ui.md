KONTEKS (baca dulu; kamu mungkin agent baru)
Project: tahfizh-app, Pesantren Darul Ilmi. Next.js 16 (Cache Components), React 19, Tailwind v4, shadcn Base UI, Supabase (@supabase/ssr), Zod 4, Vitest.
Baca RULES.md, AGENTS.md, docs/PRD.md (5.3), docs/DESIGN.md, semua supabase/migrations/*.sql (terutama migrasi setoran_rpc), lib/quran-juz.ts, lib/setoran/rules.ts,
lib/validators/setoran.ts, lib/validators/common.ts, lib/validators/list-params.ts, lib/formatters.ts, lib/auth/require-admin.ts, dan POLA dari app/(app)/santri/* serta
app/(app)/ustadz/* (page sinkron + Suspense, content async, client terpisah, tes aksi dengan tiruan Supabase). Buat RENCANA singkat dulu dan tunggu persetujuan saya.
Ini Fase 4, TAHAP B (UI dan aksi). Tahap A (logika murni dan migrasi RPC submit_setoran dan void_setoran) SUDAH selesai, di-push, dan saya verifikasi. Jangan mengubah
migrasi atau fungsi SQL. Jika kamu butuh perubahan database, tulis SQL-nya dalam rencana dan berhenti.

KEPUTUSAN BISNIS (disepakati; jangan diubah)
1. Jumlah baris dihitung otomatis (computeLinesForRange); USTADZ tidak boleh mengubah; ADMIN boleh mengubah manual 1-300 hanya dengan catatan >= 5 karakter.
2. ADMIN menginput untuk semua santri aktif; USTADZ hanya untuk santri di halaqahnya dan hanya bila ustadz itu aktif. Server memeriksa dan memberi pesan jelas.
3. Tanggal bawaan hari ini (Asia/Jakarta); ADMIN mundur maksimal 30 hari; USTADZ hari ini dan kemarin; masa depan ditolak.
4. Setoran ganda diperbolehkan; koreksi = VOID (void_setoran) dengan alasan, bukan menghapus.
Santri IZIN/SAKIT/ALPHA hanya dicatat kehadirannya. Nilai = max(100 - 5 x kesalahan, 0).

PERSIAPAN
- Regenerasi tipe database: cmd /c "npx supabase gen types typescript --linked > lib\database.types.ts" (hanya membaca skema). Pastikan file terbaca sebagai teks biasa (bukan UTF-16),
  tanpa kunci rahasia, dan `npm run typecheck` lulus. Pakai tipe untuk rpc submit_setoran dan void_setoran.

HALAMAN /setoran (app/(app)/setoran/)
- page.tsx SINKRON (PageHeader + <Suspense fallback>) yang hanya meneruskan promise searchParams. setoran-content.tsx async dengan `await connection()` sebagai PERNYATAAN PERTAMA,
  lalu await searchParams dan akses data. setoran-client.tsx untuk interaksi. DILARANG `instant = false`, API route, unstable_cache, dan asChild (Base UI memakai prop `render`).
- Parameter URL divalidasi lewat fungsi murni baru (lib/validators/setoran-params.ts) dengan tes: tanggal (YYYY-MM-DD dan dalam jendela peran; di luar itu jatuh ke hari ini),
  jenis (SABAQ|SABQI|MANZIL, bawaan SABAQ), kelas (7-12|all), ustadz (UUID|all, hanya ADMIN), q (whitelist huruf Unicode/angka/spasi/apostrof/tanda hubung, maksimum 50),
  halaman (>= 1). Ukuran halaman TETAP 20. Hari ini dihitung SETELAH `await connection()` dengan zona Asia/Jakarta, dioper sebagai string ke fungsi murni.
- Peran dan cakupan: baca role dan is_active dari profiles (BUKAN user_metadata). Untuk USTADZ, cari teachers.profile_id = user.id AND is_active; bila tidak ada, tampilkan
  EmptyState "Akun Anda belum terhubung dengan data ustadz aktif, hubungi admin" tanpa daftar dan tanpa tombol input. USTADZ hanya melihat santri halaqahnya (filter teacher_id
  dipaksa di server); filter ustadz hanya untuk ADMIN. Query santri aktif beserta halaqah dan kelas, filter kelas dan pencarian, urutan nama lalu id, range dan count exact.
- Untuk santri di halaman itu ambil attendance pada tanggal terpilih dan record ACTIVE pada tanggal itu (select id, type, juz, surah_id, ayah_start, ayah_end, line_count,
  fluency_score, notes). Gunakan in('student_id', ids) dengan limit eksplisit.
- Tampilan: filter (tanggal, kelas, ustadz untuk ADMIN, pencarian dengan tombol Cari variant outline dan Enter), tiga tab Sabaq/Sabqi/Manzil berupa tautan yang mempertahankan
  parameter (warna fungsional dari token tema: hijau, biru, oranye), tabel: No, Nama Santri, Kelas, Halaqah, Ustadz (withUstadzTitle; server mengirim nama mentah), Kehadiran
  (badge berwarna sesuai DESIGN.md), Setoran jenis terpilih hari ini (jumlah record dan total baris dengan formatCapaianDenganBaris), Aksi: "Input" dan "Riwayat". Paginasi lewat <Link>.
  Input tanggal bertipe date TERKONTROL (state + penyesuaian saat render, tanpa useEffect) dengan min/max dari allowedDateWindow. Empty state, skeleton, dan error lewat error.tsx.

DIALOG INPUT SETORAN (client)
- <form noValidate>, tanpa atribut required, pesan Zod Indonesia di bawah SETIAP kolom tidak valid sekaligus (zodIssuesToFieldErrors), aria-invalid dan aria-describedby,
  fokus ke kolom tidak valid pertama (tanpa useEffect), pesan kolom hilang saat diubah, tidak ada permintaan ke server bila tidak valid. Semua state direset saat dialog dibuka.
  Nilai Select SELALU string dan label lewat optionLabel di SelectValue. Input terkontrol. Tombol simpan nonaktif selama pending (cegah klik ganda).
- Urutan kolom: Kehadiran (Hadir, Terlambat, Izin, Sakit, Alpha; awal kosong dengan placeholder bila belum ada attendance, atau terisi nilai yang ada). Bila IZIN/SAKIT/ALPHA:
  sembunyikan kolom setoran dan tampilkan keterangan "Hanya kehadiran yang dicatat". Bila ada record ACTIVE hari itu dan pengguna memilih IZIN/SAKIT/ALPHA, tampilkan alasan
  dari canChangeAttendance dan nonaktifkan tombol simpan.
  Bila HADIR/TERLAMBAT: Juz (1-30), Surat (hanya surat dalam juz terpilih lewat getSurahOptionsForJuz; mengganti juz mengosongkan surat dan ayat), Ayat mulai dan Ayat selesai
  (inputMode numeric; tampilkan rentang valid, mis. "1-40"), Jumlah baris (dihitung otomatis dan tampil read-only; ADMIN punya kotak "Ubah jumlah baris manual" yang memunculkan
  isian 1-300 dan mewajibkan catatan >= 5 karakter), Kesalahan: tombol "-5" yang menambah hitungan kesalahan, tampilkan hitungan dan nilai (hitungNilai), tombol "Atur ulang",
  Catatan (Textarea, maksimum 500). Jenis setoran mengikuti tab aktif (ditampilkan sebagai badge, tidak dapat diubah di dialog).
- Setelah sukses: toast, dialog menutup, tabel dimuat ulang (revalidatePath('/setoran') dan '/dashboard'). Galat server tampil di dialog dan toast, tanpa error.message mentah.
- Dialog "Riwayat" (per santri pada tanggal terpilih, semua jenis): daftar record ACTIVE (badge jenis, juz, surat, ayat, baris, nilai, catatan) dengan tombol "Batalkan" yang membuka
  alert-dialog berisi Textarea alasan (3-200 karakter, pesan per kolom) lalu memanggil void. Pesan penolakan ditampilkan di luar AlertDialogDescription dengan role="alert".

SERVER ACTIONS (app/(app)/setoran/actions.ts) DAN HELPER
- Buat lib/auth/require-user.ts (getUser(), role dan is_active dari profiles, teacherId aktif untuk USTADZ) dipakai semua aksi, beserta tes. Jangan menyalin require-admin.
- submitSetoran(input): getUser -> profil aktif -> safeParse Zod (server) -> isDateAllowed -> untuk USTADZ pastikan santri berada di halaqah yang diampu teacherId (jika bukan:
  tolak DENGAN pesan jelas tanpa memanggil rpc) -> hitung baris di server dengan computeLinesForRange dan resolveLineCount (abaikan angka dari klien untuk USTADZ) ->
  supabase.rpc('submit_setoran', ...) -> galat dipetakan lewat mapDbError(error, 'setoran') dari error.code SAJA (jangan pernah memakai error.message) -> revalidatePath. Hasil
  bertipe { ok: true } atau { ok: false, error, fieldErrors? }.
- voidSetoran(recordId, reason): validasi alasan, ambil tanggal record (ACTIVE), terapkan isDateAllowed menurut peran, lalu rpc('void_setoran'). Mapping galat sama.
- Detail galat hanya console.error(code, message) di server; tidak ada data pribadi.

TES (Vitest; tiruan Supabase dengan pola tests/server-action.test.ts: vi.hoisted, routing menurut from(table) dan rpc, vi.mock('server-only'))
submitSetoran: ADMIN HADIR berhasil dan rpc dipanggil dengan parameter yang benar (tipe, juz, surat, ayat, baris hasil hitung server, kesalahan, catatan); USTADZ untuk santri halamannya
berhasil; USTADZ untuk santri halaqah lain ditolak TANPA memanggil rpc; ustadz nonaktif atau tanpa teacher ditolak; tanggal di luar jendela peran ditolak tanpa rpc; USTADZ mengirim
jumlah baris berbeda diabaikan (server memakai hasil hitung); ADMIN ubah manual tanpa catatan ditolak, dengan catatan berhasil; IZIN hanya mengirim parameter kehadiran (tanpa data
setoran); setiap kode TH000-TH005 dan 42501 dipetakan ke pesan benar dan TIDAK memuat error.message; validasi Zod menolak kolom kosong dengan pesan per kolom.
voidSetoran: alasan terlalu pendek ditolak; di luar jendela tanggal ditolak tanpa rpc; sukses memanggil rpc; TH005 dipetakan.
UJI MUTASI pada dua penjaga utama (hapus sementara pemeriksaan cakupan USTADZ, lalu pemeriksaan jendela tanggal): tunjukkan tes gagal, lalu pulihkan. Sebelum memutasi, tunjukkan
`git diff --stat -- <file>` kosong atau buat saya commit sementara dulu; JANGAN memakai git restore/checkout/reset/clean (jika perlu memulihkan, edit manual dan tunjukkan diff).

LARANGAN
- Jangan menyentuh migrasi, supabase/seed, /santri, /ustadz, proxy.ts, login, lib/queries/dashboard.ts, app/globals.css, components/ui, .env.local. Jangan git commit, jangan SQL/db push.
- Tanpa `any`, tanpa `as unknown as`, tanpa asChild, tanpa instant = false, tanpa required pada input, tanpa error.message ke UI. Komponen shadcn baru: beri perintah npx dan tunggu persetujuan.
- Peringatan hidrasi "fdprocessedid" berasal dari ekstensi browser; jangan mengubah apa pun untuk itu.

VERIFIKASI (jalankan SETELAH perubahan terakhir; tempel keluaran MENTAH)
npm test (baris "Test Files ... Tests ..."), npm run lint (0 peringatan), npm run typecheck, npm run build. Jangan menulis "lulus" atau "Exit code: 0" tanpa keluaran itu; jika ada yang gagal,
perbaiki dan jalankan ulang. Yang diverifikasi = unit test, lint, typecheck, build; yang TIDAK = tampilan, konsol, dan perilaku database di browser (kamu tidak punya akses login).

KELUARAN
Rencana (sebelum mengedit) memuat inventaris file, bentuk URL, model galat, dan pertanyaan terbuka; lalu daftar file, keluaran mentah verifikasi, bukti uji mutasi, dan daftar uji manual. BERHENTI.