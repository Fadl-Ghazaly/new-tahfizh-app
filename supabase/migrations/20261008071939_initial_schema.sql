-- ============================================================
-- TAHFIZH-APP
-- Pesantren Darul Ilmi
--
-- Initial Database Schema
-- ============================================================

begin;

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================

create extension if not exists "pgcrypto";


-- ============================================================
-- 2. ENUM TYPES
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'app_role'
  ) then
    create type public.app_role as enum (
      'ADMIN',
      'USTADZ'
    );
  end if;

  if not exists (
    select 1 from pg_type where typname = 'gender_type'
  ) then
    create type public.gender_type as enum (
      'L',
      'P'
    );
  end if;

  if not exists (
    select 1 from pg_type where typname = 'memorization_type'
  ) then
    create type public.memorization_type as enum (
      'SABAQ',
      'SABQI',
      'MANZIL'
    );
  end if;

  if not exists (
    select 1 from pg_type where typname = 'attendance_status'
  ) then
    create type public.attendance_status as enum (
      'HADIR',
      'IZIN',
      'TERLAMBAT',
      'ALPHA',
      'SAKIT'
    );
  end if;

  if not exists (
    select 1 from pg_type where typname = 'record_status'
  ) then
    create type public.record_status as enum (
      'ACTIVE',
      'VOID'
    );
  end if;
end $$;


-- ============================================================
-- 3. UPDATED_AT TRIGGER FUNCTION
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ============================================================
-- 4. PROFILES
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key
    references auth.users(id)
    on delete cascade,

  full_name text not null,

  role public.app_role not null default 'USTADZ',

  phone text,

  avatar_url text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);


comment on table public.profiles is
'Application profile connected to Supabase Auth users.';


-- ============================================================
-- 5. TEACHERS
-- ============================================================

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),

  profile_id uuid unique
    references public.profiles(id)
    on delete set null,

  name text not null,

  gender public.gender_type not null,

  whatsapp text not null,

  boarding_school text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  constraint teachers_name_not_empty
    check (length(trim(name)) > 0),

  constraint teachers_whatsapp_not_empty
    check (length(trim(whatsapp)) > 0)
);


comment on table public.teachers is
'Teacher/Ustadz master data.';


-- ============================================================
-- 6. CLASSES
-- ============================================================

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),

  name text not null,

  level smallint not null,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  constraint classes_level_check
    check (level between 7 and 12),

  constraint classes_level_unique
    unique (level)
);


comment on table public.classes is
'School class levels.';


-- ============================================================
-- 7. HALAQahs
-- ============================================================

create table if not exists public.halaqahs (
  id uuid primary key default gen_random_uuid(),

  name text not null,

  class_id uuid not null
    references public.classes(id)
    on delete restrict,

  teacher_id uuid not null
    references public.teachers(id)
    on delete restrict,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  constraint halaqahs_name_not_empty
    check (length(trim(name)) > 0)
);


comment on table public.halaqahs is
'Quran memorization groups/halaqah.';


-- ============================================================
-- 8. STUDENTS
-- ============================================================

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),

  nisn text not null,

  name text not null,

  gender public.gender_type not null,

  class_id uuid not null
    references public.classes(id)
    on delete restrict,

  halaqah_id uuid not null
    references public.halaqahs(id)
    on delete restrict,

  parent_name text not null,

  parent_whatsapp text not null,

  photo_url text,

  status text not null default 'ACTIVE',

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  constraint students_nisn_unique
    unique (nisn),

  constraint students_name_not_empty
    check (length(trim(name)) > 0),

  constraint students_parent_name_not_empty
    check (length(trim(parent_name)) > 0),

  constraint students_parent_whatsapp_not_empty
    check (length(trim(parent_whatsapp)) > 0)
);


comment on table public.students is
'Student master data.';


-- ============================================================
-- 9. QURAN SURAHS
-- ============================================================

create table if not exists public.quran_surahs (
  id smallint primary key,

  number smallint not null,

  name_arabic text not null,

  name_latin text not null,

  name_translation text not null,

  ayah_count smallint not null,

  constraint quran_surahs_number_unique
    unique (number),

  constraint quran_surahs_number_check
    check (number between 1 and 114),

  constraint quran_surahs_ayah_count_check
    check (ayah_count > 0)
);


comment on table public.quran_surahs is
'Reference data containing all 114 Quran surahs.';


-- ============================================================
-- 10. ATTENDANCE
-- ============================================================

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),

  student_id uuid not null
    references public.students(id)
    on delete restrict,

  date date not null,

  status public.attendance_status not null,

  notes text,

  recorded_by uuid not null
    references public.profiles(id)
    on delete restrict,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  constraint attendance_student_date_unique
    unique (student_id, date)
);


comment on table public.attendance is
'Daily attendance record. One record per student per day.';


-- ============================================================
-- 11. MEMORIZATION RECORDS
-- ============================================================

create table if not exists public.memorization_records (
  id uuid primary key default gen_random_uuid(),

  student_id uuid not null
    references public.students(id)
    on delete restrict,

  recorded_by uuid not null
    references public.profiles(id)
    on delete restrict,

  date date not null,

  type public.memorization_type not null,

  juz smallint not null,

  surah_id smallint not null
    references public.quran_surahs(id)
    on delete restrict,

  ayah_start smallint not null,

  ayah_end smallint not null,

  line_count smallint not null,

  mistake_count smallint not null default 0,

  fluency_score smallint not null default 100,

  notes text,

  status public.record_status not null default 'ACTIVE',

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  constraint memorization_juz_check
    check (juz between 1 and 30),

  constraint memorization_ayah_start_check
    check (ayah_start >= 1),

  constraint memorization_ayah_end_check
    check (ayah_end >= ayah_start),

  constraint memorization_line_count_check
    check (line_count between 1 and 300),

  constraint memorization_mistake_count_check
    check (mistake_count >= 0),

  constraint memorization_fluency_score_check
    check (fluency_score between 0 and 100)
);


comment on table public.memorization_records is
'Transactional Quran memorization submissions.';


-- ============================================================
-- 12. SCHOOL SETTINGS
-- ============================================================

create table if not exists public.school_settings (
  id uuid primary key default gen_random_uuid(),

  school_name text not null default 'Pesantren Darul Ilmi',

  logo_url text,

  theme text not null default 'theme-1',

  updated_by uuid
    references public.profiles(id)
    on delete set null,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  constraint school_settings_school_name_not_empty
    check (length(trim(school_name)) > 0),

  constraint school_settings_theme_check
    check (
      theme in (
        'theme-1',
        'theme-2',
        'theme-3',
        'theme-4',
        'theme-5',
        'theme-6'
      )
    )
);


comment on table public.school_settings is
'Global Pesantren Darul Ilmi application settings.';


-- ============================================================
-- 13. UPDATED_AT TRIGGERS
-- ============================================================

drop trigger if exists set_profiles_updated_at
on public.profiles;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();


drop trigger if exists set_teachers_updated_at
on public.teachers;

create trigger set_teachers_updated_at
before update on public.teachers
for each row
execute function public.set_updated_at();


drop trigger if exists set_classes_updated_at
on public.classes;

create trigger set_classes_updated_at
before update on public.classes
for each row
execute function public.set_updated_at();


drop trigger if exists set_halaqahs_updated_at
on public.halaqahs;

create trigger set_halaqahs_updated_at
before update on public.halaqahs
for each row
execute function public.set_updated_at();


drop trigger if exists set_students_updated_at
on public.students;

create trigger set_students_updated_at
before update on public.students
for each row
execute function public.set_updated_at();


drop trigger if exists set_attendance_updated_at
on public.attendance;

create trigger set_attendance_updated_at
before update on public.attendance
for each row
execute function public.set_updated_at();


drop trigger if exists set_memorization_records_updated_at
on public.memorization_records;

create trigger set_memorization_records_updated_at
before update on public.memorization_records
for each row
execute function public.set_updated_at();


drop trigger if exists set_school_settings_updated_at
on public.school_settings;

create trigger set_school_settings_updated_at
before update on public.school_settings
for each row
execute function public.set_updated_at();


-- ============================================================
-- 14. AUTH PROFILE TRIGGER
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    role
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      split_part(coalesce(new.email, 'User'), '@', 1)
    ),
    'USTADZ'
  );

  return new;
end;
$$;


drop trigger if exists on_auth_user_created
on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();


-- ============================================================
-- 15. HELPER FUNCTIONS FOR RLS
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'ADMIN'::public.app_role
      and is_active = true
  );
$$;


create or replace function public.is_ustadz()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'USTADZ'::public.app_role
      and is_active = true
  );
$$;


create or replace function public.current_teacher_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id
  from public.teachers
  where profile_id = auth.uid()
    and is_active = true
  limit 1;
$$;


create or replace function public.can_access_student(
  target_student_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.students s
      join public.halaqahs h
        on h.id = s.halaqah_id
      where s.id = target_student_id
        and h.teacher_id = public.current_teacher_id()
    );
$$;


-- ============================================================
-- 16. INDEXES
-- ============================================================

create index if not exists idx_students_class_id
on public.students(class_id);

create index if not exists idx_students_halaqah_id
on public.students(halaqah_id);

create index if not exists idx_students_nisn
on public.students(nisn);

create index if not exists idx_halaqahs_class_id
on public.halaqahs(class_id);

create index if not exists idx_halaqahs_teacher_id
on public.halaqahs(teacher_id);

create index if not exists idx_attendance_student_id
on public.attendance(student_id);

create index if not exists idx_attendance_date
on public.attendance(date);

create index if not exists idx_attendance_student_date
on public.attendance(student_id, date);

create index if not exists idx_memorization_student_id
on public.memorization_records(student_id);

create index if not exists idx_memorization_date
on public.memorization_records(date);

create index if not exists idx_memorization_type
on public.memorization_records(type);

create index if not exists idx_memorization_recorded_by
on public.memorization_records(recorded_by);

create index if not exists idx_memorization_student_date
on public.memorization_records(student_id, date);

create index if not exists idx_memorization_date_type
on public.memorization_records(date, type);


-- ============================================================
-- 17. ENABLE ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;

alter table public.teachers enable row level security;

alter table public.classes enable row level security;

alter table public.halaqahs enable row level security;

alter table public.students enable row level security;

alter table public.quran_surahs enable row level security;

alter table public.attendance enable row level security;

alter table public.memorization_records enable row level security;

alter table public.school_settings enable row level security;


-- ============================================================
-- 18. REVOKE DEFAULT ACCESS
-- ============================================================

revoke all on table public.profiles
from anon, authenticated;

revoke all on table public.teachers
from anon, authenticated;

revoke all on table public.classes
from anon, authenticated;

revoke all on table public.halaqahs
from anon, authenticated;

revoke all on table public.students
from anon, authenticated;

revoke all on table public.quran_surahs
from anon, authenticated;

revoke all on table public.attendance
from anon, authenticated;

revoke all on table public.memorization_records
from anon, authenticated;

revoke all on table public.school_settings
from anon, authenticated;


-- ============================================================
-- 19. GRANT AUTHENTICATED ACCESS
-- ============================================================

grant select, insert, update, delete
on public.profiles
to authenticated;

grant select, insert, update, delete
on public.teachers
to authenticated;

grant select, insert, update, delete
on public.classes
to authenticated;

grant select, insert, update, delete
on public.halaqahs
to authenticated;

grant select, insert, update, delete
on public.students
to authenticated;

grant select
on public.quran_surahs
to authenticated;

grant select, insert, update, delete
on public.attendance
to authenticated;

grant select, insert, update, delete
on public.memorization_records
to authenticated;

grant select, insert, update, delete
on public.school_settings
to authenticated;


-- ============================================================
-- 20. PROFILES POLICIES
-- ============================================================

drop policy if exists profiles_select_self_or_admin
on public.profiles;

create policy profiles_select_self_or_admin
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or (select public.is_admin())
);


drop policy if exists profiles_update_self_or_admin
on public.profiles;

create policy profiles_update_self_or_admin
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  or (select public.is_admin())
)
with check (
  id = auth.uid()
  or (select public.is_admin())
);


drop policy if exists profiles_insert_admin
on public.profiles;

create policy profiles_insert_admin
on public.profiles
for insert
to authenticated
with check (
  (select public.is_admin())
);


drop policy if exists profiles_delete_admin
on public.profiles;

create policy profiles_delete_admin
on public.profiles
for delete
to authenticated
using (
  (select public.is_admin())
);


-- ============================================================
-- 21. TEACHER POLICIES
-- ============================================================

drop policy if exists teachers_select_authenticated
on public.teachers;

create policy teachers_select_authenticated
on public.teachers
for select
to authenticated
using (
  is_active = true
  or profile_id = auth.uid()
  or (select public.is_admin())
);


drop policy if exists teachers_insert_admin
on public.teachers;

create policy teachers_insert_admin
on public.teachers
for insert
to authenticated
with check (
  (select public.is_admin())
);


drop policy if exists teachers_update_admin
on public.teachers;

create policy teachers_update_admin
on public.teachers
for update
to authenticated
using (
  (select public.is_admin())
)
with check (
  (select public.is_admin())
);


drop policy if exists teachers_delete_admin
on public.teachers;

create policy teachers_delete_admin
on public.teachers
for delete
to authenticated
using (
  (select public.is_admin())
);


-- ============================================================
-- 22. CLASS POLICIES
-- ============================================================

drop policy if exists classes_select_authenticated
on public.classes;

create policy classes_select_authenticated
on public.classes
for select
to authenticated
using (
  is_active = true
  or (select public.is_admin())
);


drop policy if exists classes_insert_admin
on public.classes;

create policy classes_insert_admin
on public.classes
for insert
to authenticated
with check (
  (select public.is_admin())
);


drop policy if exists classes_update_admin
on public.classes;

create policy classes_update_admin
on public.classes
for update
to authenticated
using (
  (select public.is_admin())
)
with check (
  (select public.is_admin())
);


drop policy if exists classes_delete_admin
on public.classes;

create policy classes_delete_admin
on public.classes
for delete
to authenticated
using (
  (select public.is_admin())
);


-- ============================================================
-- 23. HALAQAH POLICIES
-- ============================================================

drop policy if exists halaqahs_select_authenticated
on public.halaqahs;

create policy halaqahs_select_authenticated
on public.halaqahs
for select
to authenticated
using (
  is_active = true
  or (select public.is_admin())
);


drop policy if exists halaqahs_insert_admin
on public.halaqahs;

create policy halaqahs_insert_admin
on public.halaqahs
for insert
to authenticated
with check (
  (select public.is_admin())
);


drop policy if exists halaqahs_update_admin
on public.halaqahs;

create policy halaqahs_update_admin
on public.halaqahs
for update
to authenticated
using (
  (select public.is_admin())
)
with check (
  (select public.is_admin())
);


drop policy if exists halaqahs_delete_admin
on public.halaqahs;

create policy halaqahs_delete_admin
on public.halaqahs
for delete
to authenticated
using (
  (select public.is_admin())
);


-- ============================================================
-- 24. STUDENT POLICIES
-- ============================================================

drop policy if exists students_select_authorized
on public.students;

create policy students_select_authorized
on public.students
for select
to authenticated
using (
  (select public.can_access_student(id))
);


drop policy if exists students_insert_admin
on public.students;

create policy students_insert_admin
on public.students
for insert
to authenticated
with check (
  (select public.is_admin())
);


drop policy if exists students_update_authorized
on public.students;

create policy students_update_authorized
on public.students
for update
to authenticated
using (
  (select public.can_access_student(id))
)
with check (
  (select public.is_admin())
  or (select public.can_access_student(id))
);


drop policy if exists students_delete_admin
on public.students;

create policy students_delete_admin
on public.students
for delete
to authenticated
using (
  (select public.is_admin())
);


-- ============================================================
-- 25. QURAN SURAH POLICIES
-- ============================================================

drop policy if exists quran_surahs_select_authenticated
on public.quran_surahs;

create policy quran_surahs_select_authenticated
on public.quran_surahs
for select
to authenticated
using (
  true
);


drop policy if exists quran_surahs_insert_admin
on public.quran_surahs;

create policy quran_surahs_insert_admin
on public.quran_surahs
for insert
to authenticated
with check (
  (select public.is_admin())
);


drop policy if exists quran_surahs_update_admin
on public.quran_surahs;

create policy quran_surahs_update_admin
on public.quran_surahs
for update
to authenticated
using (
  (select public.is_admin())
)
with check (
  (select public.is_admin())
);


drop policy if exists quran_surahs_delete_admin
on public.quran_surahs;

create policy quran_surahs_delete_admin
on public.quran_surahs
for delete
to authenticated
using (
  (select public.is_admin())
);


-- ============================================================
-- 26. ATTENDANCE POLICIES
-- ============================================================

drop policy if exists attendance_select_authorized
on public.attendance;

create policy attendance_select_authorized
on public.attendance
for select
to authenticated
using (
  (select public.can_access_student(student_id))
);


drop policy if exists attendance_insert_authorized
on public.attendance;

create policy attendance_insert_authorized
on public.attendance
for insert
to authenticated
with check (
  (select public.can_access_student(student_id))
);


drop policy if exists attendance_update_authorized
on public.attendance;

create policy attendance_update_authorized
on public.attendance
for update
to authenticated
using (
  (select public.can_access_student(student_id))
)
with check (
  (select public.can_access_student(student_id))
);


drop policy if exists attendance_delete_admin
on public.attendance;

create policy attendance_delete_admin
on public.attendance
for delete
to authenticated
using (
  (select public.is_admin())
);


-- ============================================================
-- 27. MEMORIZATION POLICIES
-- ============================================================

drop policy if exists memorization_select_authorized
on public.memorization_records;

create policy memorization_select_authorized
on public.memorization_records
for select
to authenticated
using (
  (select public.can_access_student(student_id))
);


drop policy if exists memorization_insert_authorized
on public.memorization_records;

create policy memorization_insert_authorized
on public.memorization_records
for insert
to authenticated
with check (
  (select public.can_access_student(student_id))
);


drop policy if exists memorization_update_authorized
on public.memorization_records;

create policy memorization_update_authorized
on public.memorization_records
for update
to authenticated
using (
  (select public.can_access_student(student_id))
)
with check (
  (select public.can_access_student(student_id))
);


drop policy if exists memorization_delete_admin
on public.memorization_records;

create policy memorization_delete_admin
on public.memorization_records
for delete
to authenticated
using (
  (select public.is_admin())
);


-- ============================================================
-- 28. SCHOOL SETTINGS POLICIES
-- ============================================================

drop policy if exists school_settings_select_authenticated
on public.school_settings;

create policy school_settings_select_authenticated
on public.school_settings
for select
to authenticated
using (
  true
);


drop policy if exists school_settings_insert_admin
on public.school_settings;

create policy school_settings_insert_admin
on public.school_settings
for insert
to authenticated
with check (
  (select public.is_admin())
);


drop policy if exists school_settings_update_admin
on public.school_settings;

create policy school_settings_update_admin
on public.school_settings
for update
to authenticated
using (
  (select public.is_admin())
)
with check (
  (select public.is_admin())
);


drop policy if exists school_settings_delete_admin
on public.school_settings;

create policy school_settings_delete_admin
on public.school_settings
for delete
to authenticated
using (
  (select public.is_admin())
);


-- ============================================================
-- 29. INITIAL CLASSES
-- ============================================================

insert into public.classes (
  name,
  level
)
values
  ('Kelas 7', 7),
  ('Kelas 8', 8),
  ('Kelas 9', 9),
  ('Kelas 10', 10),
  ('Kelas 11', 11),
  ('Kelas 12', 12)
on conflict (level) do nothing;


-- ============================================================
-- 30. INITIAL SCHOOL SETTINGS
-- ============================================================

insert into public.school_settings (
  school_name,
  theme
)
select
  'Pesantren Darul Ilmi',
  'theme-1'
where not exists (
  select 1
  from public.school_settings
);


-- ============================================================
-- 31. QURAN SURAH REFERENCE DATA
-- ============================================================

insert into public.quran_surahs (
  id,
  number,
  name_arabic,
  name_latin,
  name_translation,
  ayah_count
)
values
  (1,1,'الفاتحة','Al-Fatihah','Pembukaan',7),
  (2,2,'البقرة','Al-Baqarah','Sapi Betina',286),
  (3,3,'آل عمران','Ali Imran','Keluarga Imran',200),
  (4,4,'النساء','An-Nisa','Wanita',176),
  (5,5,'المائدة','Al-Maidah','Hidangan',120),
  (6,6,'الأنعام','Al-Anam','Binatang Ternak',165),
  (7,7,'الأعراف','Al-Araf','Tempat Tertinggi',206),
  (8,8,'الأنفال','Al-Anfal','Rampasan Perang',75),
  (9,9,'التوبة','At-Taubah','Pengampunan',129),
  (10,10,'يونس','Yunus','Yunus',109),
  (11,11,'هود','Hud','Hud',123),
  (12,12,'يوسف','Yusuf','Yusuf',111),
  (13,13,'الرعد','Ar-Rad','Guruh',43),
  (14,14,'إبراهيم','Ibrahim','Ibrahim',52),
  (15,15,'الحجر','Al-Hijr','Al-Hijr',99),
  (16,16,'النحل','An-Nahl','Lebah',128),
  (17,17,'الإسراء','Al-Isra','Perjalanan Malam',111),
  (18,18,'الكهف','Al-Kahf','Penghuni Gua',110),
  (19,19,'مريم','Maryam','Maryam',98),
  (20,20,'طه','Ta-Ha','Ta-Ha',135),
  (21,21,'الأنبياء','Al-Anbiya','Para Nabi',112),
  (22,22,'الحج','Al-Hajj','Haji',78),
  (23,23,'المؤمنون','Al-Muminun','Orang-Orang Mukmin',118),
  (24,24,'النور','An-Nur','Cahaya',64),
  (25,25,'الفرقان','Al-Furqan','Pembeda',77),
  (26,26,'الشعراء','Ash-Shuara','Para Penyair',227),
  (27,27,'النمل','An-Naml','Semut',93),
  (28,28,'القصص','Al-Qasas','Kisah-Kisah',88),
  (29,29,'العنكبوت','Al-Ankabut','Laba-Laba',69),
  (30,30,'الروم','Ar-Rum','Bangsa Romawi',60),
  (31,31,'لقمان','Luqman','Luqman',34),
  (32,32,'السجدة','As-Sajdah','Sajdah',30),
  (33,33,'الأحزاب','Al-Ahzab','Golongan yang Bersekutu',73),
  (34,34,'سبأ','Saba','Saba',54),
  (35,35,'فاطر','Fatir','Pencipta',45),
  (36,36,'يس','Ya-Sin','Ya-Sin',83),
  (37,37,'الصافات','As-Saffat','Barisan-Barisan',182),
  (38,38,'ص','Sad','Sad',88),
  (39,39,'الزمر','Az-Zumar','Rombongan-Rombongan',75),
  (40,40,'غافر','Ghafir','Yang Mengampuni',85),
  (41,41,'فصلت','Fussilat','Yang Dijelaskan',54),
  (42,42,'الشورى','Ash-Shura','Musyawarah',53),
  (43,43,'الزخرف','Az-Zukhruf','Perhiasan',89),
  (44,44,'الدخان','Ad-Dukhan','Kabut',59),
  (45,45,'الجاثية','Al-Jathiyah','Yang Berlutut',37),
  (46,46,'الأحقاف','Al-Ahqaf','Bukit-Bukit Pasir',35),
  (47,47,'محمد','Muhammad','Muhammad',38),
  (48,48,'الفتح','Al-Fath','Kemenangan',29),
  (49,49,'الحجرات','Al-Hujurat','Kamar-Kamar',18),
  (50,50,'ق','Qaf','Qaf',45),
  (51,51,'الذاريات','Adh-Dhariyat','Angin yang Menerbangkan',60),
  (52,52,'الطور','At-Tur','Bukit',49),
  (53,53,'النجم','An-Najm','Bintang',62),
  (54,54,'القمر','Al-Qamar','Bulan',55),
  (55,55,'الرحمن','Ar-Rahman','Yang Maha Pengasih',78),
  (56,56,'الواقعة','Al-Waqiah','Hari Kiamat',96),
  (57,57,'الحديد','Al-Hadid','Besi',29),
  (58,58,'المجادلة','Al-Mujadilah','Gugatan',22),
  (59,59,'الحشر','Al-Hashr','Pengusiran',24),
  (60,60,'الممتحنة','Al-Mumtahanah','Wanita yang Diuji',13),
  (61,61,'الصف','As-Saff','Barisan',14),
  (62,62,'الجمعة','Al-Jumah','Hari Jumat',11),
  (63,63,'المنافقون','Al-Munafiqun','Orang-Orang Munafik',11),
  (64,64,'التغابن','At-Taghabun','Hari Dinampakkan Kesalahan',18),
  (65,65,'الطلاق','At-Talaq','Talak',12),
  (66,66,'التحريم','At-Tahrim','Pengharaman',12),
  (67,67,'الملك','Al-Mulk','Kerajaan',30),
  (68,68,'القلم','Al-Qalam','Pena',52),
  (69,69,'الحاقة','Al-Haqqah','Hari Kiamat',52),
  (70,70,'المعارج','Al-Maarij','Tempat-Tempat Naik',44),
  (71,71,'نوح','Nuh','Nuh',28),
  (72,72,'الجن','Al-Jinn','Jin',28),
  (73,73,'المزمل','Al-Muzzammil','Orang yang Berselimut',20),
  (74,74,'المدثر','Al-Muddaththir','Orang yang Berkemul',56),
  (75,75,'القيامة','Al-Qiyamah','Kiamat',40),
  (76,76,'الإنسان','Al-Insan','Manusia',31),
  (77,77,'المرسلات','Al-Mursalat','Malaikat yang Diutus',50),
  (78,78,'النبأ','An-Naba','Berita Besar',40),
  (79,79,'النازعات','An-Naziat','Malaikat yang Mencabut',46),
  (80,80,'عبس','Abasa','Ia Bermuka Masam',42),
  (81,81,'التكوير','At-Takwir','Penggulungan',29),
  (82,82,'الانفطار','Al-Infitar','Terbelah',19),
  (83,83,'المطففين','Al-Mutaffifin','Orang-Orang Curang',36),
  (84,84,'الانشقاق','Al-Inshiqaq','Terbelah',25),
  (85,85,'البروج','Al-Buruj','Gugusan Bintang',22),
  (86,86,'الطارق','At-Tariq','Yang Datang di Malam Hari',17),
  (87,87,'الأعلى','Al-Ala','Yang Maha Tinggi',19),
  (88,88,'الغاشية','Al-Ghashiyah','Hari Pembalasan',26),
  (89,89,'الفجر','Al-Fajr','Fajar',30),
  (90,90,'البلد','Al-Balad','Negeri',20),
  (91,91,'الشمس','Ash-Shams','Matahari',15),
  (92,92,'الليل','Al-Lail','Malam',21),
  (93,93,'الضحى','Ad-Duha','Waktu Duha',11),
  (94,94,'الشرح','Ash-Sharh','Melapangkan',8),
  (95,95,'التين','At-Tin','Buah Tin',8),
  (96,96,'العلق','Al-Alaq','Segumpal Darah',19),
  (97,97,'القدر','Al-Qadr','Kemuliaan',5),
  (98,98,'البينة','Al-Bayyinah','Bukti Nyata',8),
  (99,99,'الزلزلة','Az-Zalzalah','Kegoncangan',8),
  (100,100,'العاديات','Al-Adiyat','Kuda Perang yang Berlari Kencang',11),
  (101,101,'القارعة','Al-Qariah','Hari Kiamat',11),
  (102,102,'التكاثر','At-Takathur','Bermegah-Megahan',8),
  (103,103,'العصر','Al-Asr','Masa',3),
  (104,104,'الهمزة','Al-Humazah','Pengumpat',9),
  (105,105,'الفيل','Al-Fil','Gajah',5),
  (106,106,'قريش','Quraysh','Suku Quraisy',4),
  (107,107,'الماعون','Al-Maun','Barang-Barang yang Berguna',7),
  (108,108,'الكوثر','Al-Kawthar','Nikmat yang Banyak',3),
  (109,109,'الكافرون','Al-Kafirun','Orang-Orang Kafir',6),
  (110,110,'النصر','An-Nasr','Pertolongan',3),
  (111,111,'المسد','Al-Masad','Sabut',5),
  (112,112,'الإخلاص','Al-Ikhlas','Ikhlas',4),
  (113,113,'الفلق','Al-Falaq','Waktu Subuh',5),
  (114,114,'الناس','An-Nas','Manusia',6)
on conflict (id) do update set
  number = excluded.number,
  name_arabic = excluded.name_arabic,
  name_latin = excluded.name_latin,
  name_translation = excluded.name_translation,
  ayah_count = excluded.ayah_count;


commit;