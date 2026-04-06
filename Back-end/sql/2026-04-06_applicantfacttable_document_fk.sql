-- Run this in Supabase SQL Editor
-- Goal:
-- 1) Add document_id to applicantfacttable
-- 2) Backfill using applicant_no -> document(applicant_no)
-- 3) Enforce FK applicantfacttable.document_id -> document.document_id

begin;

alter table public.applicantfacttable
  add column if not exists document_id varchar;

update public.applicantfacttable af
set document_id = d.document_id
from public.document d
where af.applicant_no = d.applicant_no
  and (af.document_id is null or af.document_id = '');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'applicantfacttable_document_id_fkey'
      and conrelid = 'public.applicantfacttable'::regclass
  ) then
    alter table public.applicantfacttable
      add constraint applicantfacttable_document_id_fkey
      foreign key (document_id)
      references public.document(document_id)
      on delete set null;
  end if;
end $$;

create index if not exists idx_applicantfacttable_document_id
  on public.applicantfacttable(document_id);

commit;
