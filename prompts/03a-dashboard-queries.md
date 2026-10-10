KONTEKS (baca dulu; kamu mungkin agent baru)
Project: tahfizh-app, Pesantren Darul Ilmi. Next.js 16, React 19, Tailwind v4, shadcn Base UI, Supabase.
Baca RULES.md, AGENTS.md, docs/PRD.md (bagian 5.5), docs/SCHEMA.md, dan semua supabase/migrations/*.sql.
Gunakan Context7 bila perlu dokumentasi. Buat RENCANA singkat dulu dan tunggu persetujuan saya.

KEADAAN SAAT INI
- Migrasi 20261010064246_dashboard_views.sql SUDAH di-push dan terverifikasi (8 view security_invoker:
  v_dashboard_summary, v_student_rankings, v_student_monthly_progress, v_daily_memorization_stats,
  v_class_student_count, v_class_monthly_progress, v_fluency_distribution, v_juz_distribution).
  JANGAN mengubah migrasi itu. Jika perlu perubahan DB, berhenti dan ajukan SQL migrasi BARU dulu.
- Sudah ada: lib/queries/dashboard.ts, lib/dashboard-utils.ts, tests/dashboard.test.ts, lib/tahfizh.ts,
  lib/quran-juz.ts. Data seed: 100 santri, 20 ustadz, 12 halaqah, data setoran sampai 10 Oktober 2026.

TUGAS: rapikan lapisan query dashboard sebelum UI dibangun. Kerjakan berurutan.

1. JANGAN MENELAN ERROR. Bila kueri Supabase mengembalikan error, lempar DashboardQueryError
   (extends Error, berisi nama view dan pesan database; tanpa data sensitif) agar app/(app)/error.tsx
   menampilkannya. Jangan mengembalikan 0 atau data kosong sebagai pengganti kegagalan.
   Data kosong yang valid (mis. bulan tanpa setoran) tetap dikembalikan sebagai kosong/0 yang benar.

2. NILAI KOSONG vs NOL. Rata-rata nilai pada bulan tanpa data = null (bukan 100). Jangan memakai `|| 100`
   atau `|| 0` untuk angka yang bisa bernilai 0 yang valid; gunakan `??` dan penanganan null eksplisit.
   Tipe dan UI menangani null (ditampilkan "-").

3. IMPOR STATIS formatCapaian dari lib/tahfizh di bagian atas file (hapus `await import`).

4. FUNGSI MURNI untuk pemilihan "Top 10 butuh perhatian" di lib/dashboard-utils.ts:
   selectNeedsAttention(rankings, monthlyMap) -> 10 santri; urutan: baris sabaq bulan berjalan menaik,
   lalu total keseluruhan menaik, lalu nama (localeCompare 'id'). Santri tanpa record bulan itu bernilai 0
   dan TETAP ikut. Pastikan lib/queries/dashboard.ts memakainya. Tambahkan tes: 100 santri masuk, hasil tepat 10,
   santri 0 baris ikut, tiga tingkat pemutus seri, input kurang dari 10 santri tidak error.

5. TIPE DATABASE. Generate tipe: jalankan di Windows lewat cmd agar file tidak menjadi UTF-16:
   `cmd /c "npx supabase gen types typescript --linked > lib\database.types.ts"`
   Verifikasi file terbaca sebagai teks UTF-8 biasa (tanpa BOM/UTF-16) dan `npm run typecheck` lulus.
   Pakai tipe itu (Database['public']['Views'][...]['Row']) di semua kueri; hapus tipe manual yang tumpang tindih.
   Kolom view di tipe hasil generate biasanya nullable, tangani dengan benar (jangan `!` sembarangan).
   File itu tidak boleh memuat kunci atau URL rahasia; periksa isinya.

6. TANGGAL AMAN UNTUK NEXT.JS 16. Pembacaan tanggal saat ini (`new Date()`) tidak boleh memicu error
   "Date.now() while prerendering". Gunakan `await connection()` sebelum membaca tanggal atau komponen yang
   membacanya dibungkus <Suspense>. Ikuti pola perbaikan yang sudah dipakai di root layout dan jelaskan pilihanmu.
   getJakartaMonthStarts tetap menerima tanggal acuan sebagai parameter agar mudah diuji.

7. DEFINISI BUTIR PRD YANG SAMAR (tambahkan fungsi query dan fungsi murni + tes, perbarui tabel keterlacakan):
   a. Pie target (getTargetAchievement): tercapai = total baris sabaq; target = jumlah santri aktif x 9000;
      persen tercapai (1 desimal, maks 100) dan sisa. Sertakan teks keterangan "dari target 30 juz seluruh santri".
   b. Statistik hafalan santri (getMemorizationStats): rata-rata, median, dan maksimum total baris sabaq per santri
      (juga dalam format "X juz, Y halaman") dan jumlah santri dengan total di atas 3000 baris (di atas 10 juz).
   c. Progress tahfidz (getProgressSummary): persen keseluruhan menuju target; baris sabaq bulan berjalan sampai tanggal
      N dibandingkan dengan bulan lalu pada rentang tanggal 1..N yang sama (bukan seluruh bulan lalu), selisih baris
      dan persen perubahan (null bila bulan lalu 0). Sumber: v_daily_memorization_stats.
   d. Statistik nilai kelancaran (getFluencyStats): rata-rata dan jumlah per kategori (>=90, 75-89, <75)
      untuk bulan berjalan dan bulan lalu; rata-rata null bila tidak ada data.
   Semua perhitungan baris-ke-juz/halaman lewat lib/tahfizh.ts; jangan menulis ulang rumus.

8. BATAS BARIS PostgREST (default 1000/permintaan): beri .limit() eksplisit yang masuk akal pada setiap kueri,
   beri komentar bila jumlah santri berpotensi melebihi 1000 (perlu paginasi), dan jangan menarik data mentah
   per record ke aplikasi.

9. TANPA CACHE. Jangan memakai unstable_cache atau "use cache" di tahap ini. Klien Supabase server memakai cookie
   sesi pengguna.

10. PERBARUI tabel keterlacakan: butir PRD 5.5 -> view -> fungsi query -> komponen UI (nama komponen untuk Tahap 2).

VERIFIKASI: npm test, npm run lint, npm run typecheck, npm run build (tanpa flag pembungkam dan tanpa
indikator "Issues" di dev overlay). BERHENTI setelah itu.

LARANGAN: jangan git commit/push, jangan db push, jangan menyentuh .env.local atau mencetak kunci,
jangan mengubah migrasi yang sudah di-push, jangan mengubah proxy.ts, logika login, atau komponen layout.

KELUARAN: rencana singkat (sebelum mengedit), lalu daftar file dibuat/diubah, isi lib/queries/dashboard.ts final,
daftar tes beserta kasus yang dicakup, tabel keterlacakan, hasil verifikasi, dan pertanyaan terbuka.