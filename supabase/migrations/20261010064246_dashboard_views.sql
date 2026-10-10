-- ============================================================
-- TAHFIZH-APP
-- Pesantren Darul Ilmi
--
-- Dashboard Database Views (Security Invoker)
-- ============================================================

begin;

-- ============================================================
-- 1. VIEW: v_dashboard_summary
-- ============================================================
create or replace view public.v_dashboard_summary
with (security_invoker = true)
as
select
  (select count(*)::bigint from public.students where status = 'ACTIVE') as total_students,
  (select count(*)::bigint from public.teachers where is_active = true) as total_teachers,
  (select count(*)::bigint from public.halaqahs where is_active = true) as total_halaqahs,
  coalesce(
    (
      select sum(mr.line_count)::bigint
      from public.memorization_records mr
      join public.students s on s.id = mr.student_id
      where s.status = 'ACTIVE'
        and mr.status = 'ACTIVE'
        and mr.type = 'SABAQ'
    ),
    0
  ) as total_sabaq_lines;

comment on view public.v_dashboard_summary is
'Global summary metrics for dashboard top cards.';


-- ============================================================
-- 2. VIEW: v_student_rankings
-- ============================================================
-- Menggunakan LEFT JOIN ke classes, halaqahs, dan teachers
-- agar RLS tabel master (is_active) tidak menghilangkan santri
-- dari kacamata Ustadz yang mungkin tidak melihat halaqah lain.
-- avg_fluency_score dibiarkan NULL jika belum ada record SABAQ.
-- rank() tanpa s.name agar peringkat berbagi angka saat seri.
-- ============================================================

create or replace view public.v_student_rankings
with (security_invoker = true)
as
select
  s.id as student_id,
  s.name as student_name,
  s.nisn,
  s.gender,
  s.class_id,
  c.name as class_name,
  c.level as class_level,
  s.halaqah_id,
  h.name as halaqah_name,
  t.name as teacher_name,
  coalesce(sum(case when mr.type = 'SABAQ' and mr.status = 'ACTIVE' then mr.line_count else 0 end), 0)::bigint as total_sabaq_lines,
  round(avg(case when mr.type = 'SABAQ' and mr.status = 'ACTIVE' then mr.fluency_score else null end), 1)::numeric as avg_fluency_score,
  floor(coalesce(sum(case when mr.type = 'SABAQ' and mr.status = 'ACTIVE' then mr.line_count else 0 end), 0) / 300)::integer as total_juz_floor,
  rank() over (
    order by
      coalesce(sum(case when mr.type = 'SABAQ' and mr.status = 'ACTIVE' then mr.line_count else 0 end), 0) desc
  )::integer as ranking
from public.students s
left join public.classes c on c.id = s.class_id
left join public.halaqahs h on h.id = s.halaqah_id
left join public.teachers t on t.id = h.teacher_id
left join public.memorization_records mr on mr.student_id = s.id and mr.status = 'ACTIVE'
where s.status = 'ACTIVE'
group by s.id, s.name, s.nisn, s.gender, s.class_id, c.name, c.level, s.halaqah_id, h.name, t.name;

comment on view public.v_student_rankings is
'Student rankings and cumulative sabaq progress for all active students with left joins and shared ranks.';


-- ============================================================
-- 3. VIEW: v_student_monthly_progress
-- ============================================================
create or replace view public.v_student_monthly_progress
with (security_invoker = true)
as
select
  s.id as student_id,
  s.name as student_name,
  s.class_id,
  s.halaqah_id,
  date_trunc('month', mr.date)::date as month_start,
  coalesce(sum(mr.line_count), 0)::bigint as monthly_sabaq_lines,
  count(mr.id)::bigint as monthly_sabaq_records
from public.students s
join public.memorization_records mr on mr.student_id = s.id
where s.status = 'ACTIVE'
  and mr.status = 'ACTIVE'
  and mr.type = 'SABAQ'
group by s.id, s.name, s.class_id, s.halaqah_id, date_trunc('month', mr.date)::date;

comment on view public.v_student_monthly_progress is
'Monthly sabaq memorization progress per student grouped by month_start.';


-- ============================================================
-- 4. VIEW: v_daily_memorization_stats
-- ============================================================
create or replace view public.v_daily_memorization_stats
with (security_invoker = true)
as
select
  mr.date,
  date_trunc('month', mr.date)::date as month_start,
  extract(day from mr.date)::integer as day_of_month,
  coalesce(sum(case when mr.type = 'SABAQ' then mr.line_count else 0 end), 0)::bigint as sabaq_lines,
  coalesce(sum(case when mr.type = 'SABQI' then mr.line_count else 0 end), 0)::bigint as sabqi_lines,
  coalesce(sum(case when mr.type = 'MANZIL' then mr.line_count else 0 end), 0)::bigint as manzil_lines,
  coalesce(sum(mr.line_count), 0)::bigint as total_lines
from public.memorization_records mr
join public.students s on s.id = mr.student_id
where s.status = 'ACTIVE'
  and mr.status = 'ACTIVE'
group by mr.date, date_trunc('month', mr.date)::date, extract(day from mr.date)::integer;

comment on view public.v_daily_memorization_stats is
'Daily line totals for sabaq, sabqi, and manzil grouped by date and month_start.';


-- ============================================================
-- 5. VIEW: v_class_student_count
-- ============================================================
create or replace view public.v_class_student_count
with (security_invoker = true)
as
select
  c.id as class_id,
  c.name as class_name,
  c.level as class_level,
  count(s.id)::bigint as student_count
from public.classes c
left join public.students s on s.class_id = c.id and s.status = 'ACTIVE'
where c.is_active = true
group by c.id, c.name, c.level;

comment on view public.v_class_student_count is
'Active student headcounts snapshot per class level.';


-- ============================================================
-- 6. VIEW: v_class_monthly_progress
-- ============================================================
create or replace view public.v_class_monthly_progress
with (security_invoker = true)
as
select
  c.id as class_id,
  c.name as class_name,
  c.level as class_level,
  date_trunc('month', mr.date)::date as month_start,
  coalesce(sum(mr.line_count), 0)::bigint as total_sabaq_lines
from public.classes c
join public.students s on s.class_id = c.id
join public.memorization_records mr on mr.student_id = s.id
where c.is_active = true
  and s.status = 'ACTIVE'
  and mr.status = 'ACTIVE'
  and mr.type = 'SABAQ'
group by c.id, c.name, c.level, date_trunc('month', mr.date)::date;

comment on view public.v_class_monthly_progress is
'Monthly sabaq lines achieved per class level grouped by month_start.';


-- ============================================================
-- 7. VIEW: v_fluency_distribution
-- ============================================================
create or replace view public.v_fluency_distribution
with (security_invoker = true)
as
select
  date_trunc('month', mr.date)::date as month_start,
  count(case when mr.fluency_score >= 90 then 1 end)::bigint as excellent_count,
  count(case when mr.fluency_score between 75 and 89 then 1 end)::bigint as good_count,
  count(case when mr.fluency_score < 75 then 1 end)::bigint as needs_work_count,
  count(mr.id)::bigint as total_records,
  coalesce(round(avg(mr.fluency_score), 1), 0)::numeric as avg_fluency_score
from public.memorization_records mr
join public.students s on s.id = mr.student_id
where s.status = 'ACTIVE'
  and mr.status = 'ACTIVE'
group by date_trunc('month', mr.date)::date;

comment on view public.v_fluency_distribution is
'Fluency score distribution per month_start across all active records.';


-- ============================================================
-- 8. VIEW: v_juz_distribution
-- ============================================================
create or replace view public.v_juz_distribution
with (security_invoker = true)
as
with student_totals as (
  select
    s.id as student_id,
    floor(coalesce(sum(case when mr.type = 'SABAQ' and mr.status = 'ACTIVE' then mr.line_count else 0 end), 0) / 300)::integer as juz_floor
  from public.students s
  left join public.memorization_records mr on mr.student_id = s.id and mr.status = 'ACTIVE'
  where s.status = 'ACTIVE'
  group by s.id
)
select
  count(case when juz_floor <= 1 then 1 end)::bigint as group_0_1,
  count(case when juz_floor between 2 and 5 then 1 end)::bigint as group_2_5,
  count(case when juz_floor between 6 and 10 then 1 end)::bigint as group_6_10,
  count(case when juz_floor between 11 and 20 then 1 end)::bigint as group_11_20,
  count(case when juz_floor between 21 and 30 then 1 end)::bigint as group_21_30,
  count(*)::bigint as total_students
from student_totals;

comment on view public.v_juz_distribution is
'Distribution of active students across 5 memorization juz floor tiers.';


-- ============================================================
-- 9. PERMISSIONS (REVOKE ALL, GRANT ONLY AUTHENTICATED)
-- ============================================================

revoke all on public.v_dashboard_summary from anon, authenticated;
revoke all on public.v_student_rankings from anon, authenticated;
revoke all on public.v_student_monthly_progress from anon, authenticated;
revoke all on public.v_daily_memorization_stats from anon, authenticated;
revoke all on public.v_class_student_count from anon, authenticated;
revoke all on public.v_class_monthly_progress from anon, authenticated;
revoke all on public.v_fluency_distribution from anon, authenticated;
revoke all on public.v_juz_distribution from anon, authenticated;

grant select on public.v_dashboard_summary to authenticated;
grant select on public.v_student_rankings to authenticated;
grant select on public.v_student_monthly_progress to authenticated;
grant select on public.v_daily_memorization_stats to authenticated;
grant select on public.v_class_student_count to authenticated;
grant select on public.v_class_monthly_progress to authenticated;
grant select on public.v_fluency_distribution to authenticated;
grant select on public.v_juz_distribution to authenticated;

commit;
