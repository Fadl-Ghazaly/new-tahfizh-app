begin;

alter table public.students drop constraint if exists students_status_check;
alter table public.students
  add constraint students_status_check
  check (status in ('ACTIVE', 'INACTIVE', 'GRADUATED'));

drop policy if exists students_update_authorized on public.students;
drop policy if exists students_update_admin on public.students;

create policy students_update_admin
on public.students
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

commit;