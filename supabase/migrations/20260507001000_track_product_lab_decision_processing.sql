-- Product Lab decision processing status.
-- Safe/idempotent: tracks whether an admin-approved V2 improvement has been processed into a PR.
-- This does not modify V1 data, users, credits, payments, Stripe, generated sites, or any secrets.

alter table public.product_lab_decisions
  add column if not exists application_status text not null default 'pending',
  add column if not exists processed_at timestamptz,
  add column if not exists processed_run jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'product_lab_decisions_application_status_check'
      and conrelid = 'public.product_lab_decisions'::regclass
  ) then
    alter table public.product_lab_decisions
      add constraint product_lab_decisions_application_status_check
      check (application_status in ('pending', 'pr_ready', 'skipped', 'validation_failed'));
  end if;
end$$;

create index if not exists product_lab_decisions_application_status_idx
  on public.product_lab_decisions (application_status, processed_at desc);
