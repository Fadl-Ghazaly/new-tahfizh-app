Rencana perbaikan /santri disetujui dengan koreksi di bawah. Ini satu-satunya instruksi yang berlaku; abaikan instruksi
sebelumnya yang bertentangan. Baca RULES.md dan AGENTS.md. Gunakan Context7 untuk Base UI dan Next.js 16.

BUKTI DARI SAYA (hasil pemeriksaan saya, bukan asumsi)
1. santri-content.tsx langsung `await searchParams` lalu createClient(). Kata `connection` TIDAK ADA di page.tsx maupun
   santri-content.tsx, dan tidak ada Date/new Date di dua file itu. Pola dashboard-content.tsx belum diterapkan.
2. app/globals.css: --popover, --popover-foreground, --input, --ring, --secondary, --secondary-foreground TIDAK pernah didefinisikan
   dan tidak terdaftar di @theme inline. --destructive tidak ditemukan sebagai variabel (Tahap B menambah --color-destructive;
   periksa apakah nilainya tertulis langsung). Token yang sudah ada dan terdaftar: --background, --foreground, --primary-foreground,
   --accent, --accent-foreground, --muted, --muted-foreground, --card, --card-foreground, --border.
   Blok tema 1-5 hanya menimpa --primary, --accent, --accent-foreground, --background; token lain diwarisi dari :root.
   Tema gelap (theme-6) menimpa nilai-nilainya dengan versi gelap.

TUGAS

A. ERROR Date.now() (Blocking Route di /santri)
   - Tambahkan `await connection()` (import dari 'next/server') sebagai PERNYATAAN PERTAMA SantriContent, seperti dashboard-content.tsx.
   - Anggap ini percobaan. Jika error "Date.now()" tetap ada setelah itu, jalankan `next build --debug-prerender`, periksa SantriClient
     dan komponen dialog/Select, dan laporkan file serta barisnya. JANGAN memakai `instant = false`.
   - page.tsx tetap sinkron dan hanya meneruskan promise searchParams.

B. TOKEN TEMA (globals.css)
   1. Jalankan dan TAMPILKAN hasil dua perintah ini lebih dulu:
      Get-ChildItem components\ui -Recurse -Include *.tsx | Select-String -Pattern "(bg|text|border|ring|outline|fill|stroke|divide|shadow)-(popover|input|ring|secondary|destructive|sidebar|chart|primary|accent|muted|card|background|foreground)[\w/\-\[\]\.]*" -AllMatches | ForEach-Object { $_.Matches.Value } | Sort-Object -Unique
      $files = Get-ChildItem app,components -Recurse -Include *.tsx; $files | Select-String "bg-accent","text-accent","border-accent"
   2. Tambahkan token HANYA di :root dan di blok tema gelap (jangan salin ke tema 1-5):
      terang: --popover #FFFFFF; --popover-foreground #0F172A; --input #CBD5E1; --ring var(--primary);
              --secondary #F1F5F9; --secondary-foreground #0F172A; --destructive #DC2626
      gelap:  --popover #1E293B; --popover-foreground #F8FAFC; --input #475569;
              --secondary #334155; --secondary-foreground #F8FAFC; --destructive #F87171
      Daftarkan --color-popover, --color-popover-foreground, --color-input, --color-ring, --color-secondary, --color-secondary-foreground,
      dan --color-destructive di @theme inline (ganti entri --color-destructive yang sudah ada agar merujuk var(--destructive); jangan duplikat).
      Token lain dari daftar kelas di langkah 1 yang belum terdefinisi: usulkan nilainya dan laporkan sebelum menambah.
   3. KONTRAS: --accent-foreground putih di atas --accent terang memberi kontras sekitar 1,9-3,5:1 pada tema terang (teks sorotan item
      Select/Dropdown nyaris tak terbaca). Ubah --accent-foreground pada :root dan tema 1-5 menjadi #0F172A; tema gelap tetap #1E293B.
      JANGAN mengubah --accent. Jika hasil pencarian bg-accent/text-accent menunjukkan kode yang mengandalkan teks putih di atas aksen,
      berhenti dan laporkan sebelum mengubahnya.
   4. Bandingkan tampilan SEBELUM dan SESUDAH untuk dashboard, landing, login, dialog, dan dropdown pada tema terang (theme-1) dan gelap
      (theme-6), karena token tema mempengaruhi seluruh aplikasi. Jelaskan perubahan yang terlihat di halaman selain santri.

C. UI /santri
   1. Label Select: cek dokumentasi Base UI via Context7 (apakah ada prop pemetaan nilai ke label, mis. items). Pilih satu cara dan jelaskan
      alasannya. Select Kelas dan Halaqah harus menampilkan "Kelas 7" / "Halaqah 7A" (bukan UUID); jenis kelamin "Laki-laki" / "Perempuan".
      Fungsi pemformat murni tetap untuk L/P dan nama, dengan tes.
   2. Dialog dan popup Select berlatar solid, berada di atas tabel (z-index), tidak bertumpuk dengan teks trigger.
   3. Tombol Cari: bergaya sebagai tombol; Enter di kolom pencarian juga memicu pencarian. Tombol berbasis Link memakai buttonVariants.
   4. Badge JK konsisten untuk L dan P memakai token tema, tanpa hardcode warna.
   5. Pastikan tes list-params mencakup: 'x%,id.not.is.null', "O'Brien", "Müller", "a,b", "(", ")", "%", ".".

D. BATAS
   - DILARANG menyentuh /ustadz, app/api/ustadz-list, supabase/, proxy.ts, login, lib/queries/, lib/dashboard-utils.ts, dan .env.local.
   - Jangan memakai `instant = false`. Jangan git commit, jangan menjalankan SQL/db push apa pun ke database.

E. KEJUJURAN VERIFIKASI
   Kamu tidak punya password akun demo. Nyatakan eksplisit apa yang TIDAK dapat kamu verifikasi (halaman terproteksi, dev overlay, tampilan
   visual). Jangan menulis "overlay bersih" atau "UI terverifikasi" bila tidak bisa membuktikannya.

KELUARAN
   Hasil dua perintah di B.1, daftar token yang ditambah, penjelasan sebab-akibat error Date.now() (apa yang kamu ubah dan mengapa),
   keluaran MENTAH ringkas npm test (baris "Test Files ... Tests ..."), lint (0 peringatan untuk file santri), typecheck, build,
   perbandingan sebelum/sesudah, lalu BERHENTI dan beri daftar uji manual untuk saya.