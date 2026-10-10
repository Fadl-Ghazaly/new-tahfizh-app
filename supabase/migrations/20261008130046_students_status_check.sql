begin;
alter table public.students
  add constraint students_status_check
  check (status in ('ACTIVE','INACTIVE','GRADUATED'));
commit;