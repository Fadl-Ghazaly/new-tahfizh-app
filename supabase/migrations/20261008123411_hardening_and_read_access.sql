begin;

-- 1. Batasi eksekusi fungsi
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_ustadz() from public, anon;
revoke execute on function public.current_teacher_id() from public, anon;
revoke execute on function public.can_access_student(uuid) from public, anon;
grant execute on function
  public.is_admin(), public.is_ustadz(),
  public.current_teacher_id(), public.can_access_student(uuid)
to authenticated;

-- 2. Pengaturan hanya boleh 1 baris
create unique index if not exists school_settings_single_row
on public.school_settings ((true));

-- 3. Semua user login boleh MELIHAT data santri/setoran/absensi (untuk ranking & dashboard)
drop policy if exists students_select_authorized on public.students;
create policy students_select_all on public.students
  for select to authenticated using (true);

drop policy if exists attendance_select_authorized on public.attendance;
create policy attendance_select_all on public.attendance
  for select to authenticated using (true);

drop policy if exists memorization_select_authorized on public.memorization_records;
create policy memorization_select_all on public.memorization_records
  for select to authenticated using (true);

commit;