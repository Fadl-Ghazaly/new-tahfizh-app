KONTEKS (baca dulu; kamu mungkin agent baru)
Project: tahfizh-app, Pesantren Darul Ilmi. Next.js 16 (Cache Components), React 19, Tailwind v4, shadcn Base UI, Supabase (@supabase/ssr), Zod 4, Vitest.
Baca RULES.md, AGENTS.md, app/(app)/setoran/* (actions.ts, page.tsx, setoran-content.tsx, setoran-client.tsx, setoran-dialog.tsx, riwayat-dialog.tsx), lib/setoran/rules.ts,
lib/validators/setoran*.ts, lib/formatters.ts, dan POLA di app/(app)/santri/* (filter kelas lewat class_id, optionLabel, dialog kosong, noValidate, zodIssuesToFieldErrors).
Buat RENCANA singkat dulu dan tunggu persetujuan saya. Fase 4 Tahap B (UI /setoran) sudah ditulis dan di-commit sebagai "wip". Migrasi RPC sudah di-push dan terverifikasi; JANGAN mengubah
migrasi, seed, atau fungsi SQL. Working tree bersih; jangan memakai git restore/checkout/reset/clean.

BUKTI DARI SAYA (screenshot dan keluaran terminal; semua masih terjadi)
1. setoran-content.tsx baris 83 memilih relasi tersemat `classes(name, level), halaqahs(id, name, teacher_id, teachers(name))` dan baris 93 memakai
   `query.eq('classes.level', ...)`. Filter pada tabel tersemat di PostgREST hanya MENGOSONGKAN sematan, tidak membuang baris santri. Akibatnya dengan ?class=12 semua santri tetap tampil
   dan kolom Kelas kebanyakan menjadi "-". Dengan filter ustadz, daftar tidak berkurang dan kolom Halaqah menjadi "- (-)" untuk SEMUA baris.
2. Filter menampilkan nilai mentah: Kelas "all"/"12", Ustadz "all" dan UUID (mis. 3663bc08-b085-4...).
3. Dialog Input langsung terisi Juz 1, Surat 1, Ayat 1-1 (nilai bawaan), badge "SABAQ" bertabrakan dengan tombol X, subjudul memakai format ISO "2026-11-04", kehadiran tampil "HADIR".
4. Tab Sabqi dan Manzil tidak berwarna.
5. Setelah toast "Setoran berhasil disimpan", baris santri (Adika Rahardian) masih menampilkan "Belum Absen" dan "Belum ada" pada tangkapan layar. Mungkin hanya waktu pengambilan layar, tetapi harus dibuktikan.
JUMLAH YANG BENAR dari database (santri aktif, tanggal 4 November 2026): per kelas 7=17, 8=17, 9=17, 10=17, 11=16, 12=17 (total 101 termasuk satu santri uji). Per ustadz (lewat halaqah): Ust. Daniswara Perdana 17,
Ust. Kajen Nugroho 16, Ust. Liman Ardiyanti 17, Ust. Luwar Haikal 16, Ust. Mursinin Zulaika 17, Ust. Warji Melinda 17, Ust. Zaki Pranowo 1. Halaman harus menampilkan angka yang sama ("Menampilkan N santri").

TUGAS
1. FILTER (bug fungsional). Petakan level kelas (7-12) ke class_id dari tabel classes lalu filter pada students.class_id. Filter ustadz: ambil id halaqah aktif milik teacher itu lalu .in('halaqah_id', ids)
   (atau relasi !inner pada students -> halaqahs), sehingga baris yang tidak cocok BENAR-BENAR hilang. Pembatasan halaqah untuk USTADZ memakai cara yang sama. count exact dan paginasi mengikuti hasil tersaring.
   Relasi tersemat hanya untuk menampilkan data; kolom Kelas dan Halaqah tidak boleh bergantung pada filter. Bila relasi menghasilkan null, tampilkan "-" saja (bukan "- (-)").
   Tampilkan kode kueri SEBELUM dan SESUDAH.
   Tes (tiruan Supabase dengan spy, pola tests/server-action-setoran.test.ts): filter diterapkan pada kolom students (class_id / halaqah_id), bukan pada tabel tersemat; USTADZ selalu terkunci pada halaqahnya.
   UJI MUTASI: hapus sementara filter kelas lalu filter ustadz, tunjukkan tes gagal, pulihkan dengan edit manual dan tunjukkan git diff kosong untuk file produksi.
2. LABEL SELECT lewat optionLabel di SelectValue: "Semua Kelas"/"Kelas 12", "Semua Ustadz"/nama ustadz dengan withUstadzTitle (server mengirim nama mentah), dan di dialog "Juz 1", "1. Al-Fatihah"
   (nama surat dari quran_surahs, dikirim dari server), "Hadir", "Terlambat", "Izin", "Sakit", "Alpha". Nilai Select tetap string; nilai tak dikenal menampilkan placeholder.
3. DIALOG mulai KOSONG: Juz, Surat, Ayat mulai, Ayat selesai tidak terisi otomatis (placeholder "Pilih juz", "Pilih surat"). Jumlah baris otomatis tampil hanya setelah rentang valid. Mengganti Juz mengosongkan Surat dan
   ayat. Kehadiran awal kosong bila belum ada attendance, atau terisi nilai yang sudah ada. Tes pada fungsi murni untuk keadaan awal dan keadaan setelah juz berubah.
4. TATA LETAK: pindahkan badge jenis ("SABAQ") ke bawah judul/baris deskripsi sehingga tidak menabrak tombol X. Subjudul: "Nama - 4 November 2026" (Intl id-ID, zona Asia/Jakarta).
5. Tab Sabaq/Sabqi/Manzil berwarna menurut jenis dari token tema (hijau, biru, oranye), aktif maupun tidak aktif (tidak aktif cukup berupa tepi atau teks berwarna).
6. SEGARKAN SETELAH SIMPAN. Setelah submitSetoran atau voidSetoran sukses, baris tabel harus langsung menampilkan kehadiran ("Hadir") dan capaian ("N baris") untuk jenis tab aktif tanpa muat ulang manual.
   Periksa apakah revalidatePath('/setoran') dan '/dashboard' sudah memadai; jika tidak, panggil router.refresh() dari klien setelah hasil sukses (di dalam transisi) dan jelaskan alasannya. Pastikan kueri attendance dan
   record pada tanggal terpilih memakai id santri di halaman dan tidak ikut terpengaruh filter tersemat. Tambahkan tes untuk fungsi murni yang menghitung ringkasan baris (kehadiran, jumlah record, total baris).
7. Jangan mengubah perilaku yang sudah benar (jendela tanggal, cakupan USTADZ, pemetaan galat, perhitungan baris di server).

LARANGAN
- Jangan menyentuh migrasi, supabase/seed, /santri, /ustadz, proxy.ts, login, lib/queries/dashboard.ts, app/globals.css, components/ui, .env.local. Jangan git commit, jangan SQL/db push.
- Tanpa any, as unknown as, asChild, required, instant = false, error.message ke UI. Komponen shadcn baru: beri perintah npx dan tunggu persetujuan.
- Peringatan hidrasi "fdprocessedid" berasal dari ekstensi browser; jangan mengubah apa pun untuk itu.

VERIFIKASI (jalankan SETELAH perubahan terakhir; tempel keluaran MENTAH)
npm test (sertakan baris "Test Files ... Tests ..." apa adanya; jika keluaran progres menutupinya, jalankan `npm test 2>&1 | Select-String "Test Files","Tests "`), npm run lint (0 peringatan), npm run typecheck, npm run build.
Jangan menulis "lulus" atau "Exit code: 0" tanpa keluaran itu. Yang diverifikasi = unit test, lint, typecheck, build; yang TIDAK = tampilan dan perilaku di browser (kamu tidak punya akses login).

KELUARAN
Rencana (sebelum mengedit); lalu kode kueri sebelum dan sesudah, daftar file, keluaran mentah verifikasi, bukti uji mutasi, dan daftar uji manual. BERHENTI.