# SCHEMA — Database (PostgreSQL / Supabase)

```sql
-- ENUM
create type jenis_kelamin as enum ('L','P');
create type jenis_setoran as enum ('sabaq','sabqi','manzil');
create type kehadiran as enum ('hadir','izin','terlambat','alpha','sakit');
create type app_role as enum ('admin','user');

-- PROFIL LOGIN (terhubung ke auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null,
  role app_role not null default 'user',
  created_at timestamptz default now()
);

-- PENGATURAN (1 baris)
create table settings (
  id int primary key default 1 check (id = 1),
  nama_pesantren text not null default 'Pesantren Darul Ilmi',
  logo_url text,
  theme text not null default 'emerald'
);

-- USTADZ
create table ustadz (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  jenis_kelamin jenis_kelamin not null,
  no_wa text,
  asal_pondok text,
  kelas_diampu int[] default '{}',   -- contoh {7,8}
  created_at timestamptz default now()
);

-- KELAS HALAQAH
create table halaqah (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,         -- contoh 'Halaqah 7A'
  kelas int not null check (kelas between 7 and 12),
  ustadz_id uuid references ustadz(id) on delete set null
);

-- SANTRI
create table santri (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  jenis_kelamin jenis_kelamin not null,
  kelas int not null check (kelas between 7 and 12),
  halaqah_id uuid references halaqah(id) on delete set null,
  nisn text unique,
  ustadz_id uuid references ustadz(id) on delete set null,
  nama_ortu text,
  wa_ortu text,
  created_at timestamptz default now()
);

-- SETORAN
create table setoran (
  id uuid primary key default gen_random_uuid(),
  santri_id uuid not null references santri(id) on delete cascade,
  tanggal date not null,
  jenis jenis_setoran not null,
  juz int not null check (juz between 1 and 30),
  surat_no int not null check (surat_no between 1 and 114),
  surat_nama text not null,
  ayat_mulai int not null check (ayat_mulai >= 1),
  ayat_selesai int not null,
  jumlah_baris int not null default 0 check (jumlah_baris >= 0),
  catatan text,
  kehadiran kehadiran not null default 'hadir',
  jumlah_kesalahan int not null default 0,
  nilai int not null default 100 check (nilai between 0 and 100),
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  check (ayat_selesai >= ayat_mulai),
  unique (santri_id, tanggal, jenis)
);
create index on setoran (santri_id, tanggal);
create index on setoran (tanggal, jenis);
```

## View yang disarankan (agregasi di DB)
- `v_santri_total` : total baris sabaq per santri → juz, halaman, % progress, rank (`rank() over (order by total desc)`).
- `v_harian` : per santri/tanggal → baris per jenis, nilai rata-rata, status hadir.
- `v_bulanan` : per santri/bulan → baris sabaq, hari hadir, hari tidak hadir, rata-rata nilai.
- `v_juz_hafal` : per santri/juz → total baris sabaq (hafal jika ≥ 300).
- `v_surat_hafal` : per santri/surat → daftar surat yang ayatnya sudah tercakup.

## RLS
- Semua tabel: `select` untuk user terautentikasi.
- `santri`, `ustadz`, `halaqah`, `settings`: `insert/update/delete` hanya `role = 'admin'`.
- `setoran`: `insert/update` untuk admin & user; `delete` hanya admin.
- Buat fungsi `is_admin()` (security definer) agar policy ringkas.

## Seed (kunci agar data masuk akal)
- 20 ustadz, ± 12 halaqah (kelas 7–12), 100 santri tersebar acak kelas 7–12.
- Hari kerja saja, 1 tahun s.d. hari ini, kehadiran acak berbobot (hadir ±85%).
- Tiap santri punya "profil kecepatan": rendah (1–3 juz/tahun) s.d. tinggi (hingga 25 juz/tahun). Sabaq maju berurutan (mulai Juz 30 mundur ke Juz 1 atau Juz 1 maju) dengan surat/ayat konsisten terhadap `quran-data.ts`.
- Sabqi = 1–5 hari terakhir hafalan baru; manzil = hafalan lama bergilir.
- Nilai acak berdistribusi dominan 80–100 dengan beberapa di bawah 70.
- Buat user login: `admin@darulilmi.test` (admin) dan `user@darulilmi.test` (user).