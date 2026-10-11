KONTEKS (baca dulu; kamu mungkin agent baru)
Project: tahfizh-app, Pesantren Darul Ilmi. Next.js 16, React 19, Tailwind v4, shadcn Base UI, Supabase, Recharts.
Baca RULES.md, AGENTS.md, docs/PRD.md (5.5), docs/DESIGN.md, docs/design/stitch-tokens.md, lib/queries/dashboard.ts,
lib/dashboard-utils.ts, lib/tahfizh.ts. Gunakan Context7 untuk Recharts dan Next.js 16.
Buat RENCANA dulu dan tunggu persetujuan saya. Lapisan data (view SQL dan lib/queries/dashboard.ts) sudah selesai
dan terverifikasi; JANGAN mengubahnya kecuali ada bug yang kamu buktikan, dan berhenti dulu untuk persetujuan.

SEBELUM MERENCANAKAN: LIHAT gambar docs/design/dashboard.png dan dashboard-mobile.png dan file docs/design/dashboard.html dan dashboard-mobile.html secara nyata.
Jika file tidak bisa dibuka, BERHENTI dan beri tahu saya. Buat inventaris komponen dan TABEL PERBEDAAN antara desain
Stitch dan butir PRD 5.5. Desain Stitch memuat contoh data dan mungkin komponen di luar PRD (mis. sapaan nama,
tren mingguan, distribusi kehadiran, angka contoh). Jangan menyalin angka, nama, atau teks karangan.
Komponen yang tidak ada di PRD: jangan dibuat; cantumkan di tabel perbedaan agar saya putuskan.

TUGAS: UI dashboard di app/(app)/dashboard/page.tsx (ganti placeholder; pertahankan dashboard-toast.tsx yang
menampilkan pesan "tidak punya akses" saat redirect dari /pengaturan).

STRUKTUR
1. Page = Server Component. Tanggal acuan dibaca setelah `await connection()` (atau di dalam <Suspense>), lalu
   getJakartaMonthStarts. Tiap bagian halaman adalah komponen async sendiri dalam <Suspense> dengan skeleton,
   sehingga bagian cepat tampil lebih dulu. Panggil query paralel (Promise.all) di dalam bagian yang butuh banyak data.
2. Chart = Client Component terpisah di components/dashboard/ ("use client"), menerima data lewat props yang sudah
   dibentuk di server. Pakai Recharts + ResponsiveContainer dengan tinggi tetap, tooltip dan legenda berbahasa
   Indonesia, angka diformat Intl.NumberFormat('id-ID'). Warna dari token tema (CSS variables), bukan hardcode,
   agar ikut berganti tema (termasuk tema gelap "Malam"). Warna fungsional: sabaq hijau, sabqi biru, manzil oranye.
3. Tiap chart punya aria-label dan ringkasan teks atau tabel sr-only sebagai alternatif.

KOMPONEN (urutan atas ke bawah sesuai desain; sumber data = fungsi di lib/queries/dashboard.ts)
- StatCards: 4 kartu gradient berbeda: Total Santri (biru), Total Ustadz (hijau), Total Kelas Halaqah (oranye),
  Total Baris Hafalan (pink). Gradient dari token DESIGN.md.
- TopTenBestTable dan TopTenAttentionTable: peringkat, nama, halaqah, capaian "X juz, Y halaman"; tabel terbaik
  menampilkan nilai kelancaran rata-rata (null -> "-"); tabel perhatian menampilkan capaian bulan berjalan dan total.
  Tabel digulir di dalam kontainernya pada mobile, bukan menggulir halaman.
- DailyMemorizationChart: garis/area sabaq, sabqi, manzil per tanggal 1-31, bulan lalu vs bulan berjalan
  (dua seri/tab). Bulan berjalan hanya sampai hari ini.
- FluencyDistributionChart dan FluencyStatsWidget: distribusi >=90, 75-89, <75 bulan lalu vs berjalan; rata-rata nilai.
- ClassDistributionChart (jumlah santri per kelas, snapshot) dan ClassProgressChart (baris sabaq per kelas,
  bulan lalu vs berjalan).
- TargetAchievementPie: donut tercapai vs belum, dengan keterangan "dari target 30 juz seluruh santri".
- StudentMemorizationStats: rata-rata, median, maksimum, dan jumlah santri di atas 10 juz.
- OverallProgressWidget: persen menuju target dan perbandingan bulan berjalan sampai tanggal N vs bulan lalu
  pada rentang yang sama (persen perubahan null -> "-").
- JuzDistributionChart: 5 kelompok. Label kelompok pertama "Kurang dari 2 juz", lainnya 2-5, 6-10, 11-20, 21-30 juz.

ATURAN DATA
- Semua angka berasal dari query; tidak ada angka, nama, atau teks karangan di UI.
- Kosong yang valid (mis. bulan berjalan belum ada setoran) menampilkan empty state "Belum ada setoran bulan ini",
  bukan grafik 0 yang menyesatkan. Data seed berakhir 10 Oktober 2026; bulan berikutnya akan tampak kosong, itu wajar.
- Kegagalan query dilempar sebagai error (ditangani app/(app)/error.tsx). Jangan menampilkan 0 sebagai pengganti error.

RESPONSIF dan TAMPILAN
- 1440px: kartu 4 kolom, chart berdampingan sesuai desain. 390px: kartu 2x2, chart bertumpuk, tanpa scroll horizontal
  pada halaman, tabel menggulir di dalam kontainer. Sesuaikan dengan dashboard-mobile.png.
- Jarak, radius, bayangan, dan tipografi mengikuti token (stitch-tokens.md, DESIGN.md).

PENGUJIAN
- Otomatis: npm run lint, typecheck, test, build lulus tanpa flag pembungkam; dev overlay tanpa "Issues"
  (kecuali warning hydration dari ekstensi browser yang sudah diredam).
- Agent tidak punya password akun demo, jadi halaman terproteksi tidak bisa diuji agent. Setelah selesai, BERHENTI
  dan beri daftar langkah uji manual. Saya akan mengirim screenshot (1440px dan 390px; admin dan ustadz) untuk
  dibandingkan dengan desain Stitch lalu diperbaiki selisihnya. Jangan membuat rute atau bypass autentikasi sementara.

LARANGAN
- Jangan mengubah supabase/, proxy.ts, logika login, components/layout, atau lib/queries (kecuali dengan persetujuan).
- Jangan git commit/push. Jangan menyentuh .env.local. Jangan menambah paket atau komponen shadcn baru tanpa
  menyebut perintahnya dan menunggu persetujuan saya.
- Jangan membuat fitur CRUD, setoran, laporan, atau pengaturan.

KELUARAN: inventaris desain, tabel perbedaan Stitch vs PRD, rencana (sebelum mengedit), lalu daftar file
dibuat/diubah, hasil uji otomatis, daftar langkah uji manual, dan pertanyaan terbuka.