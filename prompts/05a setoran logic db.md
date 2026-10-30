KONTEKS (baca dulu; kamu mungkin agent baru)
Project: tahfizh-app, Pesantren Darul Ilmi. Next.js 16 (Cache Components), React 19, Tailwind v4, shadcn Base UI, Supabase (@supabase/ssr), Zod 4, Vitest.
Baca RULES.md, AGENTS.md, docs/PRD.md (bagian 5.3 Input Setoran), docs/SCHEMA.md, SEMUA supabase/migrations/*.sql, lib/quran-juz.ts, lib/tahfizh.ts,
lib/validators/*, lib/auth/require-admin.ts, dan tests/server-action.test.ts (pola tiruan Supabase). Buat RENCANA singkat dulu dan tunggu persetujuan saya.
Fase 1-3 selesai: auth, app shell, dashboard, CRUD santri dan ustadz (117 tes lulus). Ini adalah Fase 4, TAHAP A: logika murni dan migrasi RPC. UI dikerjakan di tahap B
(prompt terpisah) SETELAH saya menjalankan dan memverifikasi migrasinya. Jangan membuat UI di tahap ini.

KEPUTUSAN BISNIS (sudah disepakati; jangan diubah)
1. Jumlah baris DIHITUNG OTOMATIS dari juz + surat + ayat memakai model alokasi kumulatif yang SAMA dengan seed (lib/quran-juz.ts; tiap juz = 300 baris dibagi rata
   per ayat). Hasil minimal 1. ADMIN boleh mengubah manual (1-300) hanya bila catatan terisi (minimal 5 karakter). USTADZ tidak boleh mengubah.
2. Hak tulis: ADMIN untuk semua santri aktif; USTADZ hanya untuk santri di halaqah yang diampunya dan hanya bila ustadz itu aktif (RLS can_access_student sudah
   mengaturnya; ustadz nonaktif kehilangan akses tulis). Server memeriksa dan memberi pesan jelas; RLS tetap lapisan terakhir.
3. Tanggal: bawaan hari ini (zona Asia/Jakarta). ADMIN boleh mundur maksimal 30 hari; USTADZ hanya hari ini dan kemarin; tanggal masa depan DITOLAK.
4. Setoran ganda pada hari yang sama diperbolehkan. Koreksi = VOID (memorization_records.status = 'VOID'), BUKAN menghapus. View dashboard hanya menghitung ACTIVE.

ATURAN BISNIS TETAP
- Hanya SABAQ menambah hafalan baru; SABQI dan MANZIL hanya aktivitas. Satu record = satu juz dan satu surat. 15 baris = 1 halaman, 300 baris = 1 juz.
- Santri berstatus IZIN, SAKIT, atau ALPHA hanya mendapat baris attendance (TANPA memorization_records). HADIR dan TERLAMBAT boleh memiliki setoran.
- attendance: satu baris per santri per tanggal (UNIQUE student_id, date). Status tidak boleh diubah ke IZIN/SAKIT/ALPHA bila hari itu masih ada record ACTIVE.
- Nilai kelancaran = max(100 - 5 x jumlah_kesalahan, 0); simpan juga mistake_count. Gunakan hitungNilai di lib/tahfizh.ts.
- Validasi ayat terhadap jumlah ayat surat (quran_surahs.ayah_count) dan terhadap batas juz (lib/quran-juz.ts). line_count 1-300 (CHECK tabel).

TAHAP A1 - LOGIKA MURNI + TES (tanpa database, tanpa tanggal saat ini di dalam fungsi; tanggal selalu dioper sebagai string ISO YYYY-MM-DD)
1. lib/quran-juz.ts: tambahkan computeLinesForRange(juz, surahId, ayahStart, ayahEnd) memakai alokasi kumulatif yang SAMA dengan getNextSabaqChunk, hasil minimal 1,
   dan getSurahOptionsForJuz(juz) (surat beserta rentang ayat yang termasuk juz itu). Tes wajib: seluruh rentang satu juz = tepat 300; partisi berurutan satu juz
   berjumlah tepat 300 dan konsisten dengan getNextSabaqChunk; satu ayat di Juz 30 tetap menghasilkan minimal 1; rentang di luar juz ditolak.
2. lib/validators/setoran.ts: skema Zod 4 (discriminated menurut attendance) berbahasa Indonesia: HADIR/TERLAMBAT mewajibkan jenis, juz, surat, ayat mulai/selesai
   (ayah_end >= ayah_start, dalam jumlah ayat surat dan dalam juz), jumlah_kesalahan 0-50, catatan maksimum 500; IZIN/SAKIT/ALPHA tidak boleh membawa data setoran.
   Pakai zodIssuesToFieldErrors dari lib/validators/common.ts untuk pesan per kolom.
3. lib/setoran/rules.ts: allowedDateWindow(role, todayIso) -> { min, max }; isDateAllowed(role, dateIso, todayIso); canChangeAttendance(newStatus, activeRecordCount);
   resolveLineCount({ role, computed, requested, notes }) (USTADZ selalu computed; ADMIN boleh mengubah 1-300 hanya dengan catatan >= 5 karakter, selain itu galat);
   validateVoidReason(reason) (minimal 3 karakter, maksimum 200). Tes untuk semua batas (hari ini, kemarin, 30 hari, 31 hari, besok; pergantian bulan dan tahun).
4. lib/validators/list-params.ts: perluas mapDbError dengan konteks 'setoran' untuk kode khusus berikut dan kode umum (23505/23503/23514/42501). Pesan Indonesia, TANPA
   error.message mentah. TH000 sesi tidak valid; TH001 tanggal masa depan; TH002 jumlah baris tidak valid; TH003 ayat melebihi jumlah ayat surat; TH004 tidak dapat mengubah
   kehadiran karena masih ada setoran aktif; TH005 setoran tidak ditemukan atau sudah dibatalkan; 42501 tidak punya akses ke santri ini. Tes untuk setiap kode dan
   pastikan perilaku konteks 'santri' dan 'ustadz' tidak berubah.

TAHAP A2 - MIGRASI SQL (tulis file, JANGAN dijalankan)
Buat dengan `npx supabase migration new setoran_rpc` (cap waktu sistem). Bungkus begin/commit. Dua fungsi, keduanya SECURITY INVOKER (BUKAN security definer),
`set search_path = ''`, semua nama berawalan public., dan:
  revoke all on function ... from public, anon;  grant execute on function ... to authenticated;
1. public.submit_setoran(p_student_id uuid, p_date date, p_attendance public.attendance_status, p_type public.memorization_type default null,
   p_juz smallint default null, p_surah_id smallint default null, p_ayah_start smallint default null, p_ayah_end smallint default null,
   p_line_count smallint default null, p_mistake_count smallint default 0, p_notes text default null) returns uuid
   - uid = auth.uid(); null -> raise exception dengan SQLSTATE 'TH000'.
   - p_date > tanggal hari ini zona Asia/Jakarta ((now() at time zone 'Asia/Jakarta')::date) -> 'TH001'.
   - Bila HADIR/TERLAMBAT: semua kolom setoran wajib terisi; p_line_count 1-300 ('TH002'); p_ayah_end <= quran_surahs.ayah_count surat itu dan p_ayah_start >= 1,
     p_ayah_end >= p_ayah_start ('TH003'); p_mistake_count 0-50; p_notes maksimum 500 karakter. fluency_score = greatest(100 - 5 x p_mistake_count, 0) dihitung DI FUNGSI.
   - Bila IZIN/SAKIT/ALPHA: bila ada record ACTIVE hari itu untuk santri tsb -> 'TH004'; upsert attendance saja dan kembalikan null.
   - Bila HADIR/TERLAMBAT: upsert attendance (INSERT ... ON CONFLICT (student_id, date) DO UPDATE SET status, recorded_by = uid) lalu INSERT memorization_records
     (recorded_by = uid, status 'ACTIVE') dalam transaksi yang sama; kembalikan id record. recorded_by SELALU dari auth.uid(), bukan dari parameter.
   - Biarkan RLS bekerja (INSERT/UPDATE melanggar kebijakan menghasilkan 42501); jangan menangkapnya.
2. public.void_setoran(p_record_id uuid, p_reason text) returns void
   - uid wajib ('TH000'); alasan 3-200 karakter; UPDATE memorization_records SET status = 'VOID', notes = trim(coalesce(notes, '') || ' [VOID: ' || p_reason || ']')
     WHERE id = p_record_id AND status = 'ACTIVE'; bila tidak ada baris yang terpengaruh -> 'TH005' (tidak ditemukan, sudah dibatalkan, atau tanpa akses lewat RLS).
Sertakan di keluaran SKRIP SQL UJI (untuk saya jalankan di Supabase SQL Editor) yang dibungkus `begin; ... rollback;` agar tidak mengubah data, dengan peniruan peran
(pencarian auth.users DILAKUKAN SEBELUM `set local role authenticated`; atur request.jwt.claims). Kasus: admin menyimpan sabaq HADIR (attendance dan record terbentuk,
fluency_score benar); tanggal besok ditolak TH001; ayat melebihi jumlah ayat ditolak TH003; IZIN setelah ada record aktif ditolak TH004; IZIN tanpa record menghasilkan null
dan hanya attendance; ustadz menyimpan untuk santri di halaqahnya (berhasil) dan untuk santri halaqah lain (42501); void berhasil lalu void kedua kali TH005.
Tampilkan seluruh SQL migrasi dan skrip uji, lalu BERHENTI.

KEAMANAN DAN LARANGAN
- DILARANG menjalankan SQL, db push, atau apply_migration ke database lewat CLI atau MCP. Hanya menulis file. Saya yang menjalankan db push.
- Jangan mengubah migrasi lama, supabase/seed, proxy.ts, login, /santri, /ustadz, lib/queries/dashboard.ts, app/globals.css, components/ui, .env.local. Jangan git commit,
  dan jangan memakai git restore/checkout/reset/clean.
- Tanpa `any`, tanpa `as unknown as`, tanpa `asChild`, tanpa `instant = false`. Fungsi murni tanpa impor server (server-only, Supabase, next/headers).

VERIFIKASI (jalankan SETELAH perubahan terakhir; tempel keluaran MENTAH)
npm test (baris "Test Files ... Tests ..."), npm run lint, npm run typecheck, npm run build. Jangan menulis "lulus" atau "Exit code: 0" tanpa keluaran itu.
Yang diverifikasi = unit test, lint, typecheck, build; yang TIDAK = perilaku SQL (saya yang menguji).

KELUARAN
Rencana (sebelum mengedit); lalu daftar file, tanda tangan fungsi final, isi migrasi lengkap, skrip SQL uji, keluaran mentah verifikasi, dan pertanyaan terbuka. BERHENTI.