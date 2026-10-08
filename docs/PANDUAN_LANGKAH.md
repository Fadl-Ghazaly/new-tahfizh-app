# PANDUAN LANGKAH LENGKAP — Tahfizh App (dari folder kosong sampai siap pakai)

Estimasi waktu: 5–10 hari kerja santai (±2–3 jam/hari). Centang `[ ]` saat selesai.
Perintah terminal berlaku untuk Windows (PowerShell), macOS, dan Linux kecuali disebut lain.

---

## TAHAP 0 — Siapkan Akun & Aplikasi (±45 menit)

- [ ] **Node.js LTS** (v20 ke atas) → https://nodejs.org . Cek: `node -v` dan `npm -v`
- [ ] **Git** → https://git-scm.com . Cek: `git --version`
- [ ] **Antigravity** (IDE agent Google) → unduh dari situs resminya, login dengan akun Google.
- [ ] **Akun GitHub** → https://github.com
- [ ] **Akun Supabase** → https://supabase.com (login dengan GitHub)
- [ ] **Akun Vercel** → https://vercel.com (login dengan GitHub, paket Hobby gratis)
- [ ] **Google Stitch** → https://stitch.withgoogle.com (akun Google)
- [ ] Atur identitas Git (sekali saja):
  ```
  git config --global user.name "Nama Anda"
  git config --global user.email "email@anda.com"
  ```

---

## TAHAP 1 — Buat Folder & Project Dasar (±30 menit)

### 1.1 Buat folder dan inisialisasi project
Buka terminal di lokasi kerja (mis. `Documents`):
```
mkdir tahfizh-app
cd tahfizh-app
```
> Jalankan `create-next-app` DULU di folder kosong, baru tambahkan file docs setelahnya (menghindari konflik).

### 1.2 Buat aplikasi Next.js
```
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```
Jika ditanya opsi lain (Turbopack, dll.), pilih default (Enter).

### 1.3 Tes jalan
```
npm run dev
```
Buka http://localhost:3000 → tampil halaman Next.js. Hentikan dengan `Ctrl + C`.

### 1.4 Pasang shadcn/ui
```
npx shadcn@latest init
```
Pilih: style default, base color **Slate** (tema kita atur sendiri nanti). Lalu tambah komponen:
```
npx shadcn@latest add button card input label select dialog table tabs badge dropdown-menu sonner form textarea popover sheet skeleton avatar separator checkbox calendar alert-dialog
```

### 1.5 Pasang library tambahan
```
npm i @supabase/supabase-js @supabase/ssr zod react-hook-form @hookform/resolvers recharts @tanstack/react-table @react-pdf/renderer date-fns lucide-react
npm i -D tsx @faker-js/faker dotenv vitest
```

### 1.6 Tambahkan script di `package.json` (bagian `"scripts"`)
```
"seed": "tsx supabase/seed/seed.ts",
"test": "vitest run",
"typecheck": "tsc --noEmit"
```

### 1.7 Buat folder dokumentasi dan salin file konteks
```
mkdir docs
mkdir docs\design        (macOS/Linux: mkdir -p docs/design)
mkdir supabase
mkdir supabase\migrations
mkdir supabase\seed
```
- [ ] Salin `PRD.md`, `ARCHITECTURE.md`, `SCHEMA.md`, `DESIGN.md`, `PROMPTS.md`, `PANDUAN_LANGKAH.md` ke `docs/`
- [ ] Salin `RULES.md` ke **root** project (sejajar `package.json`)

### 1.8 Siapkan `.env.example` (isi nanti) dan commit pertama
Buat file `.env.example`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```
Pastikan `.gitignore` memuat `.env*.local` (bawaan Next.js sudah ada). Lalu:
```
git add .
git commit -m "chore: init project + docs"
```

### 1.9 Buat repository GitHub
- [ ] GitHub → New repository → nama `tahfizh-app` → **Private** → tanpa README.
- [ ] Jalankan perintah yang ditampilkan GitHub, biasanya:
  ```
  git branch -M main
  git remote add origin https://github.com/USERNAME/tahfizh-app.git
  git push -u origin main
  ```

---

## TAHAP 2 — Supabase: Database & Autentikasi (±45 menit)

### 2.1 Buat project Supabase
- [ ] Dashboard → **New project** → nama `tahfizh-app`.
- [ ] Buat **Database Password** kuat dan **simpan** (password manager/catatan aman).
- [ ] Region: **Southeast Asia (Singapore)** (terdekat dari Indonesia).
- [ ] Tunggu ±2 menit sampai status siap.

### 2.2 Ambil kunci API
Project Settings → **API** (atau API Keys):
- [ ] Salin **Project URL**
- [ ] Salin kunci **anon/publishable**
- [ ] Salin kunci **service_role/secret** (RAHASIA, jangan dibagikan atau di-commit)

### 2.3 Buat `.env.local` (file ini tidak masuk Git)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=isi_anon_key
SUPABASE_SERVICE_ROLE_KEY=isi_service_role_key
```

### 2.4 Atur autentikasi untuk pengembangan
- [ ] Authentication → Sign In / Providers → **Email**: aktif.
- [ ] Matikan **Confirm email** selama pengembangan (aktifkan lagi saat produksi bila perlu).

### 2.5 Buat dua akun demo
Authentication → Users → **Add user** (centang auto-confirm):
- [ ] `admin@darulilmi.test` / password kuat
- [ ] `ustadz@darulilmi.test` / password kuat

(Baris `profiles` + role ADMIN/USTADZ dibuat oleh migrasi/seed di Tahap 5.)

---

## TAHAP 3 — Siapkan Antigravity & MCP (±45 menit)

### 3.1 Buka project
- [ ] Antigravity → **Open Folder** → pilih `tahfizh-app`.
- [ ] Pilih mode kerja agent: gunakan **Planning** (agent membuat rencana dulu) untuk tugas besar.

### 3.2 Pasang Rules
- [ ] Buka pengaturan Rules/Customizations di Antigravity, tambahkan isi `RULES.md` sebagai rule workspace (folder `.agent/rules/` pada versi yang mendukung). Jika menu berbeda di versi Anda, cukup tulis di awal tiap sesi: *"Baca RULES.md dan docs/ dulu."*

### 3.3 Tambah MCP server
Buka **Manage MCP Servers → View raw config**, tambahkan (sesuaikan nilai):
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest", "--project-ref=PROJECT_REF_ANDA"],
      "env": { "SUPABASE_ACCESS_TOKEN": "TOKEN_ANDA" }
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```
- **PROJECT_REF**: potongan awal URL Supabase (`xxxx` dari `https://xxxx.supabase.co`).
- **Access token**: Supabase → Account → Access Tokens → Generate new token.
- [ ] Pastikan kedua server berstatus aktif (hijau). Bila gagal, cek `node -v` dan koneksi internet.
- [ ] Keamanan: hanya hubungkan ke project **pengembangan**. Tambahkan `--read-only` jika ingin agent hanya membaca (hapus saat Fase DB agar bisa migrasi).
- Stitch MCP: tambahkan hanya bila tersedia di akun Anda (ikuti dokumentasi Stitch terbaru).

---

## TAHAP 4 — Desain di Google Stitch (±1–2 jam)

- [ ] Buka Stitch, pilih mode web/desktop.
- [ ] Jalankan **3 batch prompt** dari `PROMPTS.md` bagian C satu per satu (Landing+Login → Shell+Santri+Setoran → Dashboard+Laporan+Pengaturan).
- [ ] Revisi dengan prompt singkat: "buat kartu atas lebih kontras", "ubah sidebar jadi hijau zamrud", dll.
- [ ] Buat juga versi **mobile** untuk Dashboard dan Input Setoran.
- [ ] Ekspor screenshot tiap halaman → simpan di `docs/design/` dengan nama jelas: `landing.png`, `login.png`, `dashboard.png`, `santri.png`, `setoran.png`, `laporan.png`, `pengaturan.png`.
- [ ] Jika Stitch menyediakan `DESIGN.md`, gabungkan isinya ke `docs/DESIGN.md`.
- [ ] Commit:
  ```
  git add . && git commit -m "docs: add design references"
  ```

---

## TAHAP 5 — Bangun Bertahap dengan Agent (inti pekerjaan)

**Aturan emas tiap fase:**
1. Buat **sesi/percakapan baru** di Antigravity.
2. Awali dengan: *"Baca RULES.md dan semua file di docs/ terlebih dahulu."*
3. Tempel prompt fase dari `PROMPTS.md` bagian D.
4. Baca **rencana** agent; setujui atau minta revisi.
5. Setelah selesai: jalankan sendiri `npm run dev`, uji manual, minta agent menunjukkan bukti (screenshot browser).
6. `git add . && git commit -m "feat: ..."` dan `git push`.

### Fase 0 — Struktur & Setup (±30 menit)
Prompt: Fase 0. **Cek:** `npm run build` sukses, struktur folder sesuai `ARCHITECTURE.md`.

### Fase 1 — Auth, Landing, Login, Layout (±3 jam)
Prompt: Fase 1. **Cek:**
- [ ] `/` menampilkan landing; tombol Masuk → `/login`
- [ ] Login admin berhasil → masuk `/dashboard`; password salah → pesan error
- [ ] Buka `/dashboard` tanpa login → dialihkan ke `/login`
- [ ] Logout berfungsi; sidebar 6 menu muncul; di HP berubah jadi drawer

### Fase 2 — Database, Seed, Logika Inti (±4 jam)
Prompt: Fase 2 (aktifkan Supabase MCP tanpa `--read-only`). Hasil yang harus ada:
- `supabase/migrations/*.sql` (tabel, enum, index, RLS, fungsi — sudah dibuat)
- `lib/quran-data.ts` (114 surah), `lib/tahfizh.ts` + test
- `supabase/seed/seed.ts` memakai `SUPABASE_SERVICE_ROLE_KEY`, membuat 20 teachers, halaqahs, 100 students, attendance + memorization_records 1 tahun, dan mengisi `profiles` untuk 2 akun demo (ADMIN & USTADZ)

Jalankan seed:
```
npm run seed
```
**Cek di Supabase → Table Editor / SQL Editor:**
```sql
select count(*) from students;      -- 100
select count(*) from teachers;      -- 20
select min(date), max(date) from memorization_records;
select student_id, sum(line_count)/300.0 as juz
from memorization_records where type='SABAQ' and status='ACTIVE'
group by 1 order by 2 desc limit 5; -- ada yang mendekati 25
```
- [ ] Jalankan `npm test` → util konversi lulus (contoh: 330 baris = 22 halaman = `1 juz, 2 halaman`).
- [ ] Jalankan seed dua kali → tidak membuat duplikat (seed harus idempoten: hapus & isi ulang).

### Fase 3 — CRUD Santri & Ustadz (±4 jam)
**Cek:**
- [ ] 100 santri tampil dengan pagination; filter kelas 7–12 bekerja
- [ ] Tambah, edit, hapus (dengan konfirmasi) berhasil sebagai admin
- [ ] Login sebagai `ustadz`: tombol tambah/edit/hapus tidak muncul **dan** gagal bila dipanggil langsung (RLS)
- [ ] Ustadz: 20 data, filter kelas, CRUD berfungsi

### Fase 4 — Input Setoran (±4 jam)
**Cek:**
- [ ] 3 tab sabaq/sabqi/manzil, filter kelas & ustadz mengubah daftar santri
- [ ] Surat 114 pilihan; ayat selesai < ayat mulai → ditolak; ayat > jumlah ayat surat → ditolak
- [ ] Tombol −5: 100 → 95 → 90 … tidak di bawah 0, counter kesalahan naik
- [ ] Pilih izin/alpha/sakit → baris otomatis 0
- [ ] Data tersimpan dan muncul di riwayat

### Fase 5 — Laporan Bulanan & PDF (±6 jam)
**Cek:**
- [ ] Filter bulan/halaqah/ustadz → pilih santri → semua bagian laporan tampil
- [ ] Grafik tgl 1–31 bulan lalu vs berjalan benar
- [ ] **Verifikasi manual 1 santri:** jumlahkan baris sabaq di Table Editor → bandingkan dengan angka laporan (harus sama)
- [ ] Ranking konsisten dengan urutan total baris
- [ ] Tombol Download PDF menghasilkan A4 rapi dengan logo & nama pesantren

### Fase 6 — Dashboard (±6 jam)
**Cek:**
- [ ] 4 kartu beda warna; angka sama dengan hitungan di DB (100, 20, jumlah halaqah, total baris)
- [ ] Top 10 terbaik & top 10 butuh perhatian berformat `X juz, Y halaman`
- [ ] Semua grafik terisi, warna beragam, bulan lalu vs berjalan
- [ ] Distribusi hafalan: jumlah santri semua kategori = 100
- [ ] Waktu muat < 2–3 detik

### Fase 7 — Pengaturan & 6 Tema (±3 jam)
**Cek:**
- [ ] Ubah nama pesantren → topbar, login, landing, PDF ikut berubah
- [ ] Upload logo (Supabase Storage bucket publik `logos`) → tampil di semua tempat
- [ ] 6 tema berganti langsung, tersimpan setelah refresh dan login ulang
- [ ] Role `user` tidak bisa mengakses menu ini

### Fase 8 — QA Akhir (±4 jam)
Prompt: Fase 8. Lalu lakukan sendiri **Checklist QA** di Tahap 6.

---

## TAHAP 6 — Checklist QA Sebelum Rilis

**Fungsional**
- [ ] Semua menu berfungsi untuk admin; user terbatas sesuai PRD
- [ ] Tidak ada error merah di konsol browser (F12)
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` semua lulus

**Tampilan**
- [ ] Uji lebar 360px (HP), 768px (tablet), 1440px (desktop) — tidak ada tabel/grafik terpotong
- [ ] Semua halaman punya loading, empty, dan error state
- [ ] Semua teks Bahasa Indonesia

**Keamanan**
- [ ] `.env.local` tidak ada di Git: `git ls-files | findstr env` (macOS/Linux: `git ls-files | grep env`) hanya menampilkan `.env.example`
- [ ] Service role key tidak muncul di kode client (cari `SERVICE_ROLE` di folder `src/`: hanya boleh di kode server)
- [ ] RLS aktif di semua tabel (Supabase → Authentication → Policies)

---

## TAHAP 7 — Deploy ke Internet (±45 menit)

### 7.1 Push kode terbaru
```
git add . && git commit -m "chore: ready for deploy" && git push
```

### 7.2 Deploy di Vercel
- [ ] Vercel → **Add New → Project** → impor repo `tahfizh-app`.
- [ ] Framework: Next.js (otomatis).
- [ ] **Environment Variables**: isi 3 variabel dari `.env.local`.
- [ ] Klik **Deploy**, tunggu selesai, catat URL (mis. `https://tahfizh-app.vercel.app`).

### 7.3 Hubungkan Supabase dengan URL produksi
Supabase → Authentication → **URL Configuration**:
- [ ] **Site URL**: URL Vercel Anda
- [ ] **Redirect URLs**: tambahkan `https://tahfizh-app.vercel.app/**` dan `http://localhost:3000/**`

### 7.4 Uji produksi
- [ ] Login admin & user di URL produksi
- [ ] Input satu setoran, lihat di laporan, unduh PDF
- [ ] Ganti tema, refresh, tema tetap

---

## TAHAP 8 — Siap Pakai untuk Pesantren

- [ ] **Hapus data dummy:** jalankan di SQL Editor (hati-hati, tidak bisa dibatalkan)
  ```sql
  truncate table memorization_records, attendance, students, halaqahs, teachers restart identity cascade;
  ```
- [ ] **Ganti akun demo:** hapus `admin@darulilmi.test` dan `ustadz@darulilmi.test`, buat akun asli dengan password kuat; atur role di tabel `profiles` (ADMIN/USTADZ).
- [ ] Isi data asli santri/ustadz lewat menu CRUD (atau impor CSV via Table Editor Supabase).
- [ ] Atur nama, logo, tema pesantren di menu Pengaturan.
- [ ] Aktifkan kembali **Confirm email** bila ingin pendaftaran terverifikasi.
- [ ] **Backup:** Supabase → Database → Backups (paket gratis terbatas; ekspor CSV berkala tabel penting).
- [ ] Opsional: domain sendiri (Vercel → Settings → Domains).
- [ ] Buat panduan singkat untuk ustadz (cara login & input setoran).

---

## TAHAP 9 — Pemecahan Masalah Umum

| Masalah | Penyebab umum | Solusi |
|---|---|---|
| `npm run build` gagal tipe | Tipe `any`/props salah | Salin pesan error ke agent: "perbaiki akar masalah, jangan ubah fitur lain" |
| Login berhasil tapi langsung terlempar | Cookie/proxy.ts salah atau `profiles` kosong | Cek baris `profiles` untuk user; minta agent audit `proxy.ts` |
| Data kosong padahal ada di DB | RLS memblokir `select` | Cek Policies; pastikan policy select untuk user terautentikasi |
| Seed gagal "permission denied" | Memakai anon key | Seed harus memakai `SUPABASE_SERVICE_ROLE_KEY` |
| Angka laporan ≠ dashboard | Logika hitung terduplikasi | Paksa semua memakai `lib/tahfizh.ts` / view yang sama; pastikan filter `status = 'ACTIVE'` |
| Logo tidak tampil | Bucket Storage tidak publik / policy | Jadikan bucket publik atau buat policy baca |
| Di Vercel error env | Variabel belum diisi | Settings → Environment Variables → isi → Redeploy |
| Agent "lupa" aturan | Sesi terlalu panjang | Mulai sesi baru, suruh baca `RULES.md` + `docs/` |
| MCP tidak aktif | Node/token salah | Cek `node -v`, buat ulang access token, restart Antigravity |

---

## Ringkasan Garis Waktu
| Hari | Tahap |
|---|---|
| 1 | Tahap 0–3 (akun, project, Supabase, Antigravity) |
| 2 | Tahap 4 (Stitch) + Fase 0–1 |
| 3 | Fase 2 (DB + seed) |
| 4 | Fase 3–4 |
| 5–6 | Fase 5–6 |
| 7 | Fase 7–8 + QA |
| 8 | Deploy + data asli + pelatihan ustadz |