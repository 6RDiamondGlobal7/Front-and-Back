-- Run this in Supabase SQL Editor
-- Goal:
-- 1) Keep document_id as PK but make it different from applicant_no
-- 2) Add applicant_no FK to public.applicant(applicant_no)
-- 3) Add document presence booleans for easy filtering

begin;

-- Ensure required columns exist
alter table public.document
  add column if not exists applicant_no varchar,
  add column if not exists prc_id text,
  add column if not exists prc_id_url boolean not null default false,
  add column if not exists has_resume boolean not null default false,
  add column if not exists has_cover_letter boolean not null default false,
  add column if not exists has_prc_id boolean not null default false;

-- Migrate legacy rows where document_id was used as applicant_no
update public.document
set applicant_no = document_id
where applicant_no is null
  and document_id is not null;

-- Recompute booleans from URL fields
update public.document
set has_resume = coalesce(resume, false),
    has_cover_letter = coalesce(cover_letter, false),
    prc_id_url = coalesce(prc_id_url, false),
    has_prc_id = coalesce(prc_id_url, false);

-- Generate new PK values so document_id is no longer applicant_no
with ranked as (
  select ctid, row_number() over (order by applicant_no nulls last, document_id) as rn
  from public.document
)
update public.document d
set document_id = 'DOC-' || to_char(r.rn, 'FM000000')
from ranked r
where d.ctid = r.ctid;

-- Enforce applicant_no NOT NULL
alter table public.document
  alter column applicant_no set not null;

-- Ensure one document row per applicant
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'document_applicant_no_key'
      and conrelid = 'public.document'::regclass
  ) then
    alter table public.document
      add constraint document_applicant_no_key unique (applicant_no);
  end if;
end $$;

-- Add FK constraint
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'document_applicant_no_fkey'
      and conrelid = 'public.document'::regclass
  ) then
    alter table public.document
      add constraint document_applicant_no_fkey
      foreign key (applicant_no)
      references public.applicant(applicant_no)
      on delete cascade;
  end if;
end $$;

commit;
