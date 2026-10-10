Baca RULES.md, AGENTS.md, docs/PRD.md (bagian 5.5 Dashboard), docs/SCHEMA.md, docs/DESIGN.md,
docs/design/stitch-tokens.md, dan SEMUA supabase/migrations/*.sql. Ikuti bagian "Stack Terpasang".
Gunakan Context7 untuk Next.js 16, Recharts, dan shadcn Base UI. Buat RENCANA dulu dan tunggu persetujuan saya.

SEBELUM MENGIMPLEMENTASIKAN UI: LIHAT gambar docs/design/dashboard.png dan dashboard-mobile.png secara nyata.
Jika file tidak bisa dibuka, BERHENTI dan beri tahu saya. Buat inventaris komponen dan tabel perbedaan
terhadap rencana. Setelah selesai, bandingkan screenshot hasil (1440px dan 390px) dengan screenshot Stitch.

TUGAS: Dashboard visualisasi data. Dikerjakan dalam DUA TAHAP dengan berhenti di antaranya.

ATURAN BISNIS (wajib)
- Hanya record memorization_records bertipe SABAQ dengan status 'ACTIVE' yang menambah hafalan.
  SABQI dan MANZIL hanya masuk statistik aktivitas. Santri yang dihitung: students.status = 'ACTIVE'.
- 15 baris = 1 halaman, 20 halaman = 1 juz (300 baris), target 30 juz = 9000 baris.
  Semua perhitungan dan format lewat lib/tahfizh.ts (formatCapaian "X juz, Y halaman"). Jangan menulis ulang rumus.
- "Bulan berjalan" dan "bulan lalu" memakai tanggal zona waktu Asia/Jakarta (kolom date).
- Kelompok distribusi hafalan memakai total juz penuh (lantai): 0-1 juz, 2-5, 6-10, 11-20, 21-30.
- "Butuh perhatian": 10 santri dengan total sabaq paling rendah pada bulan berjalan (aktivitas terendah);
  seri diurutkan total hafalan keseluruhan terendah. Tampilkan capaian keseluruhan dalam format "X juz, Y halaman".
  Jika menurut saya perlu definisi lain, saya akan memberi tahu saat menyetujui rencana.
- Semua pengguna login (ADMIN dan USTADZ) boleh melihat seluruh data dashboard.
- Kelompok distribusi hafalan pertama diberi label "kurang dari 2 juz" (floor(total_baris/300) <= 1).
  Sebagian santri punya total 1,8-2,1 juz sehingga batas kelompok harus diuji.
- Satu santri bisa punya lebih dari satu record SABAQ per hari (pemotongan di batas surat/juz);
  hitung hari hadir dari tabel attendance, bukan dari jumlah record.

TAHAP 1 - LAPISAN DATA (berhenti setelah selesai)
1. Usulkan view/fungsi SQL (nama bahasa Inggris, kandidat: v_student_progress, v_daily_summary, v_monthly_summary,
   v_juz_completion) untuk kebutuhan: total santri/ustadz/halaqah/baris, total baris per santri beserta ranking,
   top 10 terbaik dan butuh perhatian, distribusi nilai (fluency_score) bulan lalu vs berjalan, baris harian
   sabaq/sabqi/manzil bulan lalu vs berjalan (tanggal 1-31), distribusi santri per kelas dan capaian per kelas
   (bulan lalu vs berjalan), persentase target pencapaian, statistik kelancaran, statistik hafalan, progress tahfidz,
   dan distribusi hafalan 5 kelompok.
2. WAJIB: setiap view dibuat dengan `with (security_invoker = true)` agar RLS tabel dasar tetap berlaku.
   Fungsi yang dibuat: tidak boleh bisa dieksekusi oleh anon; GRANT hanya ke authenticated.
3. Tulis SQL sebagai file migrasi baru di supabase/migrations/ (JANGAN diubah file lama), JANGAN dijalankan.
   Tampilkan rencana kueri dan indeks yang dibutuhkan. Saya yang menjalankan `npx supabase db push`.
4. Buat kueri tipe-aman di lib/queries/dashboard.ts (Server-only) dan bungkus dengan cache bila sesuai
   dokumentasi Next.js 16 (jelaskan pilihannya). Tambahkan unit test untuk fungsi transformasi data.
5. BERHENTI. Beri saya SQL verifikasi: angka total santri/ustadz/halaqah/baris, 5 santri teratas dan
   5 butuh perhatian, dan jumlah per kelompok distribusi (harus berjumlah 100). Saya akan membandingkan dengan
   hasil hitung manual.

TAHAP 2 - UI (setelah saya konfirmasi Tahap 1 sudah di-push dan angkanya cocok)
1. Halaman app/(app)/dashboard/page.tsx (Server Component) di dalam app shell. Chart sebagai Client Component
   terpisah (Recharts) dengan data dari server. Setiap bagian punya loading (skeleton), empty state,
   dan error state.
2. Komponen sesuai PRD 5.5 dan desain Stitch:
   - 4 kartu atas gradient berbeda: Total Santri, Total Ustadz, Total Kelas Halaqah, Total Baris
     (token warna DESIGN.md, bukan hardcode).
   - Top 10 hafalan terbaik dan Top 10 butuh perhatian ("X juz, Y halaman").
   - Distribusi nilai (bulan lalu vs berjalan), statistik baris harian sabaq/sabqi/manzil (garis atau batang,
     warna fungsional hijau/biru/oranye), distribusi kelas, capaian tahfidz per kelas, pie persentase target,
     statistik kelancaran, statistik hafalan, progress tahfidz, distribusi hafalan 5 kelompok.
   - Palet chart beragam dari DESIGN.md. Tooltip berbahasa Indonesia, sumbu dan legenda terbaca.
3. Responsif: 1440px dan 390px sesuai desain mobile Stitch (kartu 2x2, chart bertumpuk, tabel bisa digulir
   di dalam kontainernya tanpa scroll horizontal pada halaman).
4. Pengujian: npm run lint, typecheck, build, dan test lulus tanpa flag pembungkam. Jalankan dev server,
   ambil screenshot dashboard 1440px dan 390px, bandingkan dengan screenshot Stitch, daftar selisih, perbaiki.
   Pastikan angka di dashboard SAMA dengan hasil SQL verifikasi Tahap 1. Dev overlay tidak boleh menampilkan Issues.
5. BERHENTI dan beri daftar langkah uji manual untuk saya (termasuk uji sebagai ADMIN dan USTADZ).

LARANGAN
- Jangan mengubah migrasi lama, jangan menjalankan db push, jangan git commit, jangan menyentuh .env.local.
- Jangan mengubah logika autentikasi, proxy.ts, atau lib/tahfizh.ts (kecuali menambah fungsi, dengan uji).
- Jangan membuat fitur CRUD, setoran, atau laporan (fase berikutnya).
KELUARAN: rencana, per tahap: file dibuat/diubah, hasil uji, dan pertanyaan terbuka.