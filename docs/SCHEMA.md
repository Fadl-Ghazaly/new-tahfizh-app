# SCHEMA — Database (PostgreSQL / Supabase)

> **Sumber kebenaran**: file `supabase/migrations/*.sql` (urut berdasarkan nama).
> Dokumen ini adalah ringkasan kondisi akhir setelah semua migrasi diterapkan.

---

## 1. Extension

- `pgcrypto` — digunakan untuk `gen_random_uuid()`.

---

## 2. Enum Types

| Enum | Nilai |
|---|---|
| `app_role` | `'ADMIN'`, `'USTADZ'` |
| `gender_type` | `'L'`, `'P'` |
| `memorization_type` | `'SABAQ'`, `'SABQI'`, `'MANZIL'` |
| `attendance_status` | `'HADIR'`, `'IZIN'`, `'TERLAMBAT'`, `'ALPHA'`, `'SAKIT'` |
| `record_status` | `'ACTIVE'`, `'VOID'` |

---

## 3. Tabel

### 3.1 `profiles`

Profil aplikasi terhubung ke Supabase Auth.

| Kolom | Tipe | Default | NOT NULL | Keterangan |
|---|---|---|---|---|
| `id` | `uuid` PK | — | ✓ | FK → `auth.users(id)` ON DELETE CASCADE |
| `full_name` | `text` | — | ✓ | |
| `role` | `app_role` | `'USTADZ'` | ✓ | |
| `phone` | `text` | — | | |
| `avatar_url` | `text` | — | | |
| `is_active` | `boolean` | `true` | ✓ | |
| `created_at` | `timestamptz` | `now()` | ✓ | |
| `updated_at` | `timestamptz` | `now()` | ✓ | Auto-update via trigger |

---

### 3.2 `teachers`

Data master ustadz/guru tahfizh.

| Kolom | Tipe | Default | NOT NULL | Keterangan |
|---|---|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` | ✓ | |
| `profile_id` | `uuid` UNIQUE | — | | FK → `profiles(id)` ON DELETE SET NULL |
| `name` | `text` | — | ✓ | |
| `gender` | `gender_type` | — | ✓ | |
| `whatsapp` | `text` | — | ✓ | |
| `boarding_school` | `text` | — | | Asal pondok |
| `is_active` | `boolean` | `true` | ✓ | |
| `created_at` | `timestamptz` | `now()` | ✓ | |
| `updated_at` | `timestamptz` | `now()` | ✓ | Auto-update via trigger |

**Constraints:**
- `teachers_name_not_empty` — `CHECK (length(trim(name)) > 0)`
- `teachers_whatsapp_not_empty` — `CHECK (length(trim(whatsapp)) > 0)`

---

### 3.3 `classes`

Tingkat kelas sekolah (7–12).

| Kolom | Tipe | Default | NOT NULL | Keterangan |
|---|---|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` | ✓ | |
| `name` | `text` | — | ✓ | Contoh: 'Kelas 7' |
| `level` | `smallint` | — | ✓ | |
| `is_active` | `boolean` | `true` | ✓ | |
| `created_at` | `timestamptz` | `now()` | ✓ | |
| `updated_at` | `timestamptz` | `now()` | ✓ | Auto-update via trigger |

**Constraints:**
- `classes_level_check` — `CHECK (level BETWEEN 7 AND 12)`
- `classes_level_unique` — `UNIQUE (level)` — satu kelas per tingkat

**Seed awal:** 6 baris (Kelas 7 s.d. 12), `ON CONFLICT (level) DO NOTHING`.

---

### 3.4 `halaqahs`

Kelompok halaqah (kelas tahfizh).

| Kolom | Tipe | Default | NOT NULL | Keterangan |
|---|---|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` | ✓ | |
| `name` | `text` | — | ✓ | Contoh: 'Halaqah 7A' |
| `class_id` | `uuid` | — | ✓ | FK → `classes(id)` ON DELETE RESTRICT |
| `teacher_id` | `uuid` | — | ✓ | FK → `teachers(id)` ON DELETE RESTRICT |
| `is_active` | `boolean` | `true` | ✓ | |
| `created_at` | `timestamptz` | `now()` | ✓ | |
| `updated_at` | `timestamptz` | `now()` | ✓ | Auto-update via trigger |

**Constraints:**
- `halaqahs_name_not_empty` — `CHECK (length(trim(name)) > 0)`

---

### 3.5 `students`

Data master santri.

| Kolom | Tipe | Default | NOT NULL | Keterangan |
|---|---|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` | ✓ | |
| `nisn` | `text` | — | ✓ | |
| `name` | `text` | — | ✓ | |
| `gender` | `gender_type` | — | ✓ | |
| `class_id` | `uuid` | — | ✓ | FK → `classes(id)` ON DELETE RESTRICT |
| `halaqah_id` | `uuid` | — | ✓ | FK → `halaqahs(id)` ON DELETE RESTRICT |
| `parent_name` | `text` | — | ✓ | |
| `parent_whatsapp` | `text` | — | ✓ | |
| `photo_url` | `text` | — | | |
| `status` | `text` | `'ACTIVE'` | ✓ | Bukan enum, kolom text biasa |
| `created_at` | `timestamptz` | `now()` | ✓ | |
| `updated_at` | `timestamptz` | `now()` | ✓ | Auto-update via trigger |

**Constraints:**
- `students_nisn_unique` — `UNIQUE (nisn)`
- `students_name_not_empty` — `CHECK (length(trim(name)) > 0)`
- `students_parent_name_not_empty` — `CHECK (length(trim(parent_name)) > 0)`
- `students_parent_whatsapp_not_empty` — `CHECK (length(trim(parent_whatsapp)) > 0)`

> **Catatan:** Santri tidak punya kolom `teacher_id` langsung. Ustadz pengampu diturunkan dari `halaqahs.teacher_id` melalui join `students.halaqah_id → halaqahs.teacher_id`.

---

### 3.6 `quran_surahs`

Data referensi 114 surah Al-Quran.

| Kolom | Tipe | Default | NOT NULL | Keterangan |
|---|---|---|---|---|
| `id` | `smallint` PK | — | ✓ | Sama dengan nomor surah |
| `number` | `smallint` | — | ✓ | |
| `name_arabic` | `text` | — | ✓ | Nama surah dalam huruf Arab |
| `name_latin` | `text` | — | ✓ | Transliterasi Latin |
| `name_translation` | `text` | — | ✓ | Terjemahan Indonesia |
| `ayah_count` | `smallint` | — | ✓ | Jumlah ayat |

**Constraints:**
- `quran_surahs_number_unique` — `UNIQUE (number)`
- `quran_surahs_number_check` — `CHECK (number BETWEEN 1 AND 114)`
- `quran_surahs_ayah_count_check` — `CHECK (ayah_count > 0)`

**Seed awal:** 114 surah lengkap, `ON CONFLICT (id) DO UPDATE`.

**Grant khusus:** hanya `SELECT` untuk `authenticated` (tidak boleh INSERT/UPDATE/DELETE via client).

---

### 3.7 `attendance`

Catatan kehadiran harian. Satu rekaman per santri per hari.

| Kolom | Tipe | Default | NOT NULL | Keterangan |
|---|---|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` | ✓ | |
| `student_id` | `uuid` | — | ✓ | FK → `students(id)` ON DELETE RESTRICT |
| `date` | `date` | — | ✓ | |
| `status` | `attendance_status` | — | ✓ | |
| `notes` | `text` | — | | |
| `recorded_by` | `uuid` | — | ✓ | FK → `profiles(id)` ON DELETE RESTRICT |
| `created_at` | `timestamptz` | `now()` | ✓ | |
| `updated_at` | `timestamptz` | `now()` | ✓ | Auto-update via trigger |

**Constraints:**
- `attendance_student_date_unique` — `UNIQUE (student_id, date)` — maksimal satu record per santri per hari

---

### 3.8 `memorization_records`

Catatan setoran hafalan (transaksi).

| Kolom | Tipe | Default | NOT NULL | Keterangan |
|---|---|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` | ✓ | |
| `student_id` | `uuid` | — | ✓ | FK → `students(id)` ON DELETE RESTRICT |
| `recorded_by` | `uuid` | — | ✓ | FK → `profiles(id)` ON DELETE RESTRICT |
| `date` | `date` | — | ✓ | |
| `type` | `memorization_type` | — | ✓ | SABAQ / SABQI / MANZIL |
| `juz` | `smallint` | — | ✓ | |
| `surah_id` | `smallint` | — | ✓ | FK → `quran_surahs(id)` ON DELETE RESTRICT |
| `ayah_start` | `smallint` | — | ✓ | |
| `ayah_end` | `smallint` | — | ✓ | |
| `line_count` | `smallint` | — | ✓ | Jumlah baris setoran |
| `mistake_count` | `smallint` | `0` | ✓ | |
| `fluency_score` | `smallint` | `100` | ✓ | Nilai kelancaran |
| `notes` | `text` | — | | |
| `status` | `record_status` | `'ACTIVE'` | ✓ | ACTIVE / VOID |
| `created_at` | `timestamptz` | `now()` | ✓ | |
| `updated_at` | `timestamptz` | `now()` | ✓ | Auto-update via trigger |

**Constraints:**
- `memorization_juz_check` — `CHECK (juz BETWEEN 1 AND 30)`
- `memorization_ayah_start_check` — `CHECK (ayah_start >= 1)`
- `memorization_ayah_end_check` — `CHECK (ayah_end >= ayah_start)`
- `memorization_line_count_check` — `CHECK (line_count BETWEEN 1 AND 300)`
- `memorization_mistake_count_check` — `CHECK (mistake_count >= 0)`
- `memorization_fluency_score_check` — `CHECK (fluency_score BETWEEN 0 AND 100)`

> **Catatan:** Tidak ada constraint UNIQUE per santri/hari/tipe. Boleh lebih dari satu record per santri per hari per jenis setoran.

---

### 3.9 `school_settings`

Pengaturan global aplikasi. Dijamin hanya 1 baris.

| Kolom | Tipe | Default | NOT NULL | Keterangan |
|---|---|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` | ✓ | |
| `school_name` | `text` | `'Pesantren Darul Ilmi'` | ✓ | |
| `logo_url` | `text` | — | | |
| `theme` | `text` | `'theme-1'` | ✓ | |
| `updated_by` | `uuid` | — | | FK → `profiles(id)` ON DELETE SET NULL |
| `created_at` | `timestamptz` | `now()` | ✓ | |
| `updated_at` | `timestamptz` | `now()` | ✓ | Auto-update via trigger |

**Constraints:**
- `school_settings_school_name_not_empty` — `CHECK (length(trim(school_name)) > 0)`
- `school_settings_theme_check` — `CHECK (theme IN ('theme-1','theme-2','theme-3','theme-4','theme-5','theme-6'))`
- `school_settings_single_row` — `UNIQUE ((true))` — menjamin hanya satu baris

**Seed awal:** 1 baris (`'Pesantren Darul Ilmi'`, `'theme-1'`), hanya insert jika belum ada.

---

## 4. Indeks

| Nama Indeks | Tabel | Kolom |
|---|---|---|
| `idx_students_class_id` | students | `(class_id)` |
| `idx_students_halaqah_id` | students | `(halaqah_id)` |
| `idx_students_nisn` | students | `(nisn)` |
| `idx_halaqahs_class_id` | halaqahs | `(class_id)` |
| `idx_halaqahs_teacher_id` | halaqahs | `(teacher_id)` |
| `idx_attendance_student_id` | attendance | `(student_id)` |
| `idx_attendance_date` | attendance | `(date)` |
| `idx_attendance_student_date` | attendance | `(student_id, date)` |
| `idx_memorization_student_id` | memorization_records | `(student_id)` |
| `idx_memorization_date` | memorization_records | `(date)` |
| `idx_memorization_type` | memorization_records | `(type)` |
| `idx_memorization_recorded_by` | memorization_records | `(recorded_by)` |
| `idx_memorization_student_date` | memorization_records | `(student_id, date)` |
| `idx_memorization_date_type` | memorization_records | `(date, type)` |
| `school_settings_single_row` | school_settings | `((true))` UNIQUE |

---

## 5. Fungsi & Trigger

### 5.1 Fungsi

| Fungsi | Bahasa | Sifat | Hak Eksekusi | Keterangan |
|---|---|---|---|---|
| `set_updated_at()` | plpgsql | trigger fn | default (public) | Mengisi `new.updated_at = now()` |
| `handle_new_user()` | plpgsql | trigger fn, SECURITY DEFINER | **tidak ada** (revoke dari public, anon, authenticated) | Insert ke `profiles` dengan role `'USTADZ'` saat user baru dibuat di `auth.users` |
| `is_admin()` → boolean | sql | STABLE, SECURITY DEFINER | `authenticated` | Cek `profiles` WHERE `id = auth.uid()` AND `role = 'ADMIN'` AND `is_active = true` |
| `is_ustadz()` → boolean | sql | STABLE, SECURITY DEFINER | `authenticated` | Cek `profiles` WHERE `id = auth.uid()` AND `role = 'USTADZ'` AND `is_active = true` |
| `current_teacher_id()` → uuid | sql | STABLE, SECURITY DEFINER | `authenticated` | Ambil `teachers.id` WHERE `profile_id = auth.uid()` AND `is_active = true` LIMIT 1 |
| `can_access_student(uuid)` → boolean | sql | STABLE, SECURITY DEFINER | `authenticated` | `is_admin()` OR student berada di halaqah yang diajar oleh `current_teacher_id()` |

### 5.2 Trigger

| Trigger | Tabel | Event | Fungsi |
|---|---|---|---|
| `set_profiles_updated_at` | profiles | BEFORE UPDATE | `set_updated_at()` |
| `set_teachers_updated_at` | teachers | BEFORE UPDATE | `set_updated_at()` |
| `set_classes_updated_at` | classes | BEFORE UPDATE | `set_updated_at()` |
| `set_halaqahs_updated_at` | halaqahs | BEFORE UPDATE | `set_updated_at()` |
| `set_students_updated_at` | students | BEFORE UPDATE | `set_updated_at()` |
| `set_attendance_updated_at` | attendance | BEFORE UPDATE | `set_updated_at()` |
| `set_memorization_records_updated_at` | memorization_records | BEFORE UPDATE | `set_updated_at()` |
| `set_school_settings_updated_at` | school_settings | BEFORE UPDATE | `set_updated_at()` |
| `on_auth_user_created` | auth.users | AFTER INSERT | `handle_new_user()` |

---

## 6. Hak Akses Tabel (GRANT)

Semua tabel: `REVOKE ALL FROM anon, authenticated` terlebih dahulu, lalu:

| Tabel | GRANT ke `authenticated` |
|---|---|
| profiles | SELECT, INSERT, UPDATE, DELETE |
| teachers | SELECT, INSERT, UPDATE, DELETE |
| classes | SELECT, INSERT, UPDATE, DELETE |
| halaqahs | SELECT, INSERT, UPDATE, DELETE |
| students | SELECT, INSERT, UPDATE, DELETE |
| quran_surahs | **SELECT saja** |
| attendance | SELECT, INSERT, UPDATE, DELETE |
| memorization_records | SELECT, INSERT, UPDATE, DELETE |
| school_settings | SELECT, INSERT, UPDATE, DELETE |

> Hak tabel hanya menentukan operasi yang dimungkinkan. RLS policy (§7) membatasi baris mana yang dapat diakses.

---

## 7. Matriks RLS (Row Level Security)

Semua tabel memiliki RLS aktif. Berikut kondisi akhir setelah semua migrasi:

| Tabel | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| profiles | diri sendiri OR ADMIN | ADMIN | diri sendiri OR ADMIN | ADMIN |
| teachers | aktif OR profil sendiri OR ADMIN | ADMIN | ADMIN | ADMIN |
| classes | aktif OR ADMIN | ADMIN | ADMIN | ADMIN |
| halaqahs | aktif OR ADMIN | ADMIN | ADMIN | ADMIN |
| students | **semua authenticated** | ADMIN | halaqah sendiri OR ADMIN | ADMIN |
| quran_surahs | **semua authenticated** | ADMIN | ADMIN | ADMIN |
| attendance | **semua authenticated** | halaqah sendiri | halaqah sendiri | ADMIN |
| memorization_records | **semua authenticated** | halaqah sendiri | halaqah sendiri | ADMIN |
| school_settings | **semua authenticated** | ADMIN | ADMIN | ADMIN |

**Keterangan:**
- **diri sendiri** = `id = auth.uid()` (untuk profiles) atau `profile_id = auth.uid()` (untuk teachers)
- **aktif** = `is_active = true`
- **ADMIN** = `is_admin()` — role ADMIN dan `is_active = true`
- **halaqah sendiri** = `can_access_student(student_id)` — ADMIN, atau student berada di halaqah yang di-ajar oleh ustadz yang sedang login
- **semua authenticated** = `USING (true)` — semua user yang sudah login, tanpa syarat

### Detail Policy (nama di database)

**profiles:**
- `profiles_select_self_or_admin` — SELECT — `id = auth.uid() OR is_admin()`
- `profiles_update_self_or_admin` — UPDATE — `id = auth.uid() OR is_admin()` (using + with check)
- `profiles_insert_admin` — INSERT — `is_admin()`
- `profiles_delete_admin` — DELETE — `is_admin()`

**teachers:**
- `teachers_select_authenticated` — SELECT — `is_active = true OR profile_id = auth.uid() OR is_admin()`
- `teachers_insert_admin` — INSERT — `is_admin()`
- `teachers_update_admin` — UPDATE — `is_admin()`
- `teachers_delete_admin` — DELETE — `is_admin()`

**classes:**
- `classes_select_authenticated` — SELECT — `is_active = true OR is_admin()`
- `classes_insert_admin` — INSERT — `is_admin()`
- `classes_update_admin` — UPDATE — `is_admin()`
- `classes_delete_admin` — DELETE — `is_admin()`

**halaqahs:**
- `halaqahs_select_authenticated` — SELECT — `is_active = true OR is_admin()`
- `halaqahs_insert_admin` — INSERT — `is_admin()`
- `halaqahs_update_admin` — UPDATE — `is_admin()`
- `halaqahs_delete_admin` — DELETE — `is_admin()`

**students:**
- `students_select_all` — SELECT — `true` *(menggantikan `students_select_authorized` dari migrasi awal)*
- `students_insert_admin` — INSERT — `is_admin()`
- `students_update_authorized` — UPDATE — using: `can_access_student(id)`, with check: `is_admin() OR can_access_student(id)`
- `students_delete_admin` — DELETE — `is_admin()`

**quran_surahs:**
- `quran_surahs_select_authenticated` — SELECT — `true`
- `quran_surahs_insert_admin` — INSERT — `is_admin()`
- `quran_surahs_update_admin` — UPDATE — `is_admin()`
- `quran_surahs_delete_admin` — DELETE — `is_admin()`

**attendance:**
- `attendance_select_all` — SELECT — `true` *(menggantikan `attendance_select_authorized` dari migrasi awal)*
- `attendance_insert_authorized` — INSERT — `can_access_student(student_id)`
- `attendance_update_authorized` — UPDATE — `can_access_student(student_id)`
- `attendance_delete_admin` — DELETE — `is_admin()`

**memorization_records:**
- `memorization_select_all` — SELECT — `true` *(menggantikan `memorization_select_authorized` dari migrasi awal)*
- `memorization_insert_authorized` — INSERT — `can_access_student(student_id)`
- `memorization_update_authorized` — UPDATE — `can_access_student(student_id)`
- `memorization_delete_admin` — DELETE — `is_admin()`

**school_settings:**
- `school_settings_select_authenticated` — SELECT — `true`
- `school_settings_insert_admin` — INSERT — `is_admin()`
- `school_settings_update_admin` — UPDATE — `is_admin()`
- `school_settings_delete_admin` — DELETE — `is_admin()`

---

## 8. Pemetaan Istilah Indonesia → Kolom Database

| Istilah Indonesia | Tabel.Kolom |
|---|---|
| Kelas halaqah / nama halaqah | `halaqahs.name` |
| Ustadz pengampu (dari santri) | `halaqahs.teacher_id` (diturunkan via `students.halaqah_id → halaqahs.teacher_id`) |
| Tingkat kelas (7–12) | `classes.level` |
| Nama kelas | `classes.name` |
| NISN | `students.nisn` |
| Nama orangtua | `students.parent_name` |
| WA orangtua | `students.parent_whatsapp` |
| Jenis kelamin | `students.gender` / `teachers.gender` (enum `gender_type`: L/P) |
| No WA ustadz | `teachers.whatsapp` |
| Asal pondok | `teachers.boarding_school` |
| Jenis setoran | `memorization_records.type` (enum `memorization_type`: SABAQ/SABQI/MANZIL) |
| Jumlah baris | `memorization_records.line_count` |
| Nilai kelancaran | `memorization_records.fluency_score` |
| Jumlah kesalahan | `memorization_records.mistake_count` |
| Catatan | `memorization_records.notes` / `attendance.notes` |
| Status kehadiran | `attendance.status` (enum `attendance_status`) |
| Status record (aktif/batal) | `memorization_records.status` (enum `record_status`: ACTIVE/VOID) |
| Nama pesantren | `school_settings.school_name` |
| Logo | `school_settings.logo_url` |
| Tema | `school_settings.theme` (text: 'theme-1' s.d. 'theme-6') |
| Dicatat oleh | `attendance.recorded_by` / `memorization_records.recorded_by` (FK → profiles) |

---

## 9. Keputusan Desain

1. **Boleh lebih dari satu record setoran per santri/hari/jenis.**
   Tabel `memorization_records` tidak memiliki constraint UNIQUE per `(student_id, date, type)`. Satu santri bisa memiliki beberapa setoran sabaq dalam satu hari (misalnya pagi dan sore).

2. **Kehadiran unik per santri per hari.**
   Tabel `attendance` memiliki `UNIQUE (student_id, date)`. Satu santri hanya punya satu record kehadiran per hari.

3. **Kehadiran dan setoran adalah tabel terpisah.**
   Berbeda dengan desain awal (satu tabel `setoran` dengan kolom `kehadiran`), skema ini memisahkan `attendance` dan `memorization_records`. Jika santri tidak hadir, hanya dibuat record `attendance` tanpa record `memorization_records`.

4. **Hapus data hanya oleh ADMIN.**
   Semua tabel: policy DELETE hanya untuk `is_admin()`.

5. **Pembatalan data via status VOID.**
   Alih-alih menghapus, record setoran dibatalkan dengan mengubah `memorization_records.status` menjadi `'VOID'`. Query agregasi harus memfilter `WHERE status = 'ACTIVE'`.

6. **Santri tidak punya kolom ustadz langsung.**
   Hubungan santri → ustadz diturunkan dari `students.halaqah_id → halaqahs.teacher_id`. Ini menghindari data ganda dan menjamin konsistensi.

7. **Kelas (classes) dipisah dari halaqah.**
   `classes` mewakili tingkat sekolah (7–12, UNIQUE per level). `halaqahs` mewakili kelompok tahfizh, masing-masing terhubung ke satu kelas dan satu guru.

8. **Semua user login boleh MELIHAT semua data santri, setoran, dan kehadiran.**
   Policy SELECT pada `students`, `attendance`, dan `memorization_records` mengizinkan semua `authenticated` tanpa syarat (`USING (true)`). Ini untuk mendukung fitur ranking dan dashboard lintas halaqah.

9. **Menulis hanya ke halaqah sendiri.**
   INSERT dan UPDATE pada `attendance` dan `memorization_records` menggunakan `can_access_student()` — admin bisa semua, ustadz hanya untuk santri di halaqah yang dia ampu.

10. **Pengaturan dijamin satu baris.**
    `school_settings` memiliki `UNIQUE ((true))` yang mencegah lebih dari satu baris.

11. **Profil otomatis dibuat saat registrasi.**
    Trigger `on_auth_user_created` memanggil `handle_new_user()` yang membuat baris `profiles` dengan role default `'USTADZ'`.

12. **ON DELETE RESTRICT pada data transaksional.**
    Tidak bisa menghapus santri/guru/kelas/halaqah/surah yang masih direferensikan oleh record lain. Ini mencegah kehilangan data tak sengaja.

---

## 10. Rencana View / Agregasi (belum dibuat — untuk Fase 5 & 6)

| Nama View | Deskripsi | Dipakai di |
|---|---|---|
| `v_student_progress` | Total baris SABAQ (status ACTIVE) per santri → juz, halaman, % progress (dari 9000 baris), rank via `RANK() OVER (ORDER BY total DESC)` | Dashboard, Laporan |
| `v_daily_summary` | Per santri/tanggal → baris per jenis setoran, rata-rata fluency_score, status kehadiran | Laporan (grafik harian) |
| `v_monthly_summary` | Per santri/bulan → baris sabaq, hari hadir, hari tidak hadir, rata-rata fluency_score | Laporan (perbandingan bulanan) |
| `v_juz_completion` | Per santri/juz → total baris SABAQ (dianggap hafal jika ≥ 300) | Laporan (daftar juz) |
| `v_surah_completion` | Per santri/surah → daftar surah yang ayatnya sudah tercakup | Laporan (daftar surah) |

> Semua view harus memfilter `memorization_records.status = 'ACTIVE'` untuk mengabaikan record VOID.

---

## 11. Aturan Seed (untuk skrip `supabase/seed/`)

### Constraint yang harus dipatuhi

1. `teachers.whatsapp` — **wajib**, tidak boleh string kosong.
2. `students` — **wajib**: `class_id`, `halaqah_id`, `parent_name`, `parent_whatsapp` (semua NOT NULL + check not empty untuk text).
3. `halaqahs.teacher_id` — **wajib** (NOT NULL, FK ke teachers).
4. `memorization_records.line_count` — range **1–300** (bukan 0).
5. Setoran untuk santri yang **tidak hadir** (IZIN/ALPHA/SAKIT) → **jangan buat** record `memorization_records`, cukup buat record `attendance` saja.

### Urutan hapus/isi yang aman (FK RESTRICT)

**Hapus** (urutan wajib untuk menghindari FK violation):
```
1. memorization_records
2. attendance
3. students
4. halaqahs
5. teachers  (kecuali yang direferensikan oleh profiles)
```

> `classes`, `quran_surahs`, `school_settings` di-seed oleh migrasi dan biasanya tidak perlu dihapus ulang.

**Isi** (urutan wajib):
```
1. profiles  (untuk akun demo, lewat auth.users + trigger handle_new_user, atau langsung upsert)
2. teachers  (hubungkan profile_id ke akun demo USTADZ)
3. halaqahs  (butuh teacher_id + class_id yang valid)
4. students  (butuh class_id + halaqah_id yang valid)
5. attendance (butuh student_id + recorded_by/profile_id)
6. memorization_records (butuh student_id + recorded_by + surah_id)
```

### Seed harus idempoten

Jalankan dua kali tanpa error dan tanpa duplikat. Gunakan pola:
- Hapus data lama dulu (urutan di atas)
- Isi ulang
- Atau gunakan `ON CONFLICT ... DO UPDATE/NOTHING`

### Akun demo

| Email | Role | Keterangan |
|---|---|---|
| `admin@darulilmi.test` | ADMIN | profiles.role = 'ADMIN' |
| `ustadz@darulilmi.test` | USTADZ | profiles.role = 'USTADZ', hubungkan `teachers.profile_id` ke profile ini |

### Jumlah data seed

- 20 teachers, ±12 halaqahs (kelas 7–12), 100 students tersebar acak.
- Hari kerja saja, 1 tahun s.d. hari ini, kehadiran acak berbobot (hadir ±85%).
- Tiap santri punya "profil kecepatan": rendah (1–3 juz/tahun) s.d. tinggi (hingga 25 juz/tahun).
- Sabaq maju berurutan (konsisten terhadap `quran_surahs`); sabqi = 1–5 hari terakhir; manzil = hafalan lama bergilir.
- Fluency_score acak berdistribusi dominan 80–100 dengan beberapa di bawah 70.
- Hanya buat `memorization_records` untuk hari di mana santri hadir (HADIR/TERLAMBAT).