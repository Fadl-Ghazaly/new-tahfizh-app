# RULES — Aturan untuk AI Agent (Antigravity)

> Baca `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/SCHEMA.md`, `docs/DESIGN.md` sebelum mengerjakan tugas apa pun.

## Perilaku
1. **Rencanakan dulu** (Planning mode): tulis rencana singkat dan daftar file yang akan diubah, tunggu persetujuan untuk tugas besar.
2. Kerjakan **satu fase/fitur per sesi**. Jangan menyentuh fitur di luar permintaan.
3. Jangan menambah library baru tanpa menyebut alasan.
4. Jika instruksi ambigu atau bertentangan dengan PRD, **tanyakan**, jangan menebak.
5. Setelah selesai: jalankan `npm run lint` dan `npm run build`, perbaiki error, lalu ringkas apa yang berubah.

## Kode
- TypeScript strict, tanpa `any`. Komponen fungsional, nama file `kebab-case`.
- Server Component secara default; `"use client"` hanya bila perlu interaksi.
- Validasi semua input dengan Zod (client **dan** server action).
- Semua teks UI **Bahasa Indonesia**.
- Jangan hardcode warna; gunakan CSS variables/token tema dan Tailwind.
- Jangan salin logika hitung; **selalu** impor dari `lib/tahfizh.ts`.

## Domain (tidak boleh dilanggar)
- 15 baris = 1 halaman; 20 halaman = 1 juz (300 baris).
- Hanya sabaq yang menambah hafalan baru.
- Format capaian `X juz, Y halaman` lewat `formatCapaian()`.
- Nilai default 100, −5 per kesalahan, minimal 0.

## Keamanan
- Jangan pernah commit `.env*`. Simpan kunci di `.env.local`; sediakan `.env.example`.
- `SUPABASE_SERVICE_ROLE_KEY` hanya di server/seed, jangan dipakai di client.
- Wajib RLS di setiap tabel; cek role di middleware **dan** server action.

## Database
- Perubahan skema hanya lewat file migrasi di `supabase/migrations/`.
- Agregasi berat memakai SQL view, bukan loop di React.

## UI
- Responsif mobile-first. Setiap halaman punya loading, empty, dan error state.
- Ikuti `DESIGN.md` (warna fungsional sabaq/sabqi/manzil, 4 kartu dashboard, 6 tema).

## Definisi Selesai (per fitur)
Fungsi sesuai PRD, tanpa error konsol, lint & build lulus, tampil baik di HP dan desktop, diuji untuk role admin dan user.

## Stack Terpasang

- Next.js 16 (Cache Components, instant navigation): komponen halaman sinkron; pembacaan data per-request (cookies, headers, searchParams, connection(), query Supabase dengan sesi) berada di komponen anak async yang dibungkus <Suspense> sedekat mungkin dengan data; data publik yang tidak bergantung request (mis. pengaturan sekolah) memakai "use cache" + cacheTag; `export const instant = false` hanya untuk segmen yang butuh data request di puncak pohon (auth gating), wajib berkomentar alasan, dan dilarang dipakai untuk membungkam error. (WAJIB diikuti, bukan versi di dokumen lama)
- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 (konfigurasi di app/globals.css, bukan tailwind.config.js).
- shadcn/ui berbasis **Base UI** (bukan Radix): komposisi memakai prop `render`, bukan `asChild`.
  Selalu baca file di components/ui/ sebelum memakainya.
- Komponen form: gunakan `field` + react-hook-form `Controller` (komponen `form` lama tidak tersedia).
- Next.js 16: `params`/`searchParams`/`cookies()`/`headers()` bersifat async (gunakan await).
  Gunakan `proxy.ts` (pengganti `middleware.ts`) untuk proteksi route; verifikasi di dokumentasi.
- Supabase: @supabase/ssr. Tabel & kolom memakai nama di supabase/migrations (bahasa Inggris, role ADMIN/USTADZ);
  migrasi adalah sumber kebenaran. docs/SCHEMA.md hanya referensi awal.
- Selalu gunakan Context7 untuk dokumentasi library sebelum menulis kode.
- Next.js 16 (Cache Components): komponen halaman sinkron dan statis. Semua pembacaan data per-request
  (cookies, headers, searchParams, connection(), query Supabase) berada di komponen anak async yang dibungkus
  <Suspense> dengan skeleton. Dilarang memakai `export const instant = false` untuk membungkam error.