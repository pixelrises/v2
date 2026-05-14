-- Phase 12 Product Lab observability.
-- Non-destructive: records scheduled/manual/local Product Lab runs and redacted reports.
-- Review before applying live. No anon access is granted here.

create table if not exists public.product_lab_runs (
  id uuid primary key default gen_random_uuid(),
  run_id text not null unique,
  version text not null default 'v2',
  source text not null default 'scheduled' check (source in ('scheduled', 'manual', 'local', 'workflow_dispatch')),
  mode text not null default 'proposalOnly' check (mode in ('dryRun', 'proposalOnly', 'prMode', 'autoMergeControlled')),
  status text not null default 'completed' check (status in ('started', 'completed', 'failed', 'skipped')),
  dry_run boolean not null default false,
  force_generate boolean not null default false,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  proposals_generated integer not null default 0,
  proposals_saved integer not null default 0,
  proposals_rejected integer not null default 0,
  errors_count integer not null default 0,
  warnings_count integer not null default 0,
  commit_sha text not null default '',
  branch text not null default '',
  workflow_run_url text not null default '',
  report_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_lab_v1_runs (
  id uuid primary key default gen_random_uuid(),
  run_id text not null unique,
  version text not null default 'v1',
  source text not null default 'scheduled' check (source in ('scheduled', 'manual', 'local', 'workflow_dispatch')),
  mode text not null default 'proposalOnly' check (mode in ('dryRun', 'proposalOnly', 'prMode', 'autoMergeControlled')),
  status text not null default 'completed' check (status in ('started', 'completed', 'failed', 'skipped')),
  dry_run boolean not null default false,
  force_generate boolean not null default false,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  proposals_generated integer not null default 0,
  proposals_saved integer not null default 0,
  proposals_rejected integer not null default 0,
  errors_count integer not null default 0,
  warnings_count integer not null default 0,
  commit_sha text not null default '',
  branch text not null default '',
  workflow_run_url text not null default '',
  report_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_lab_reports (
  id uuid primary key default gen_random_uuid(),
  run_id text not null unique,
  version text not null default 'v2',
  report_path text not null default '',
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_lab_v1_reports (
  id uuid primary key default gen_random_uuid(),
  run_id text not null unique,
  version text not null default 'v1',
  report_path text not null default '',
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.product_lab_runs enable row level security;
alter table public.product_lab_reports enable row level security;
alter table public.product_lab_v1_runs enable row level security;
alter table public.product_lab_v1_reports enable row level security;

create index if not exists product_lab_runs_started_idx
  on public.product_lab_runs (started_at desc);
create index if not exists product_lab_runs_status_idx
  on public.product_lab_runs (status, started_at desc);
create index if not exists product_lab_v1_runs_started_idx
  on public.product_lab_v1_runs (started_at desc);
create index if not exists product_lab_v1_runs_status_idx
  on public.product_lab_v1_runs (status, started_at desc);

do $product_lab_run_triggers$
begin
  if to_regprocedure('public.update_updated_at_column()') is not null then
    if not exists (select 1 from pg_trigger where tgname = 'update_product_lab_runs_updated_at') then
      create trigger update_product_lab_runs_updated_at
        before update on public.product_lab_runs
        for each row execute function public.update_updated_at_column();
    end if;

    if not exists (select 1 from pg_trigger where tgname = 'update_product_lab_reports_updated_at') then
      create trigger update_product_lab_reports_updated_at
        before update on public.product_lab_reports
        for each row execute function public.update_updated_at_column();
    end if;

    if not exists (select 1 from pg_trigger where tgname = 'update_product_lab_v1_runs_updated_at') then
      create trigger update_product_lab_v1_runs_updated_at
        before update on public.product_lab_v1_runs
        for each row execute function public.update_updated_at_column();
    end if;

    if not exists (select 1 from pg_trigger where tgname = 'update_product_lab_v1_reports_updated_at') then
      create trigger update_product_lab_v1_reports_updated_at
        before update on public.product_lab_v1_reports
        for each row execute function public.update_updated_at_column();
    end if;
  end if;
end$product_lab_run_triggers$;

drop policy if exists "Admins can read product lab runs" on public.product_lab_runs;
create policy "Admins can read product lab runs"
  on public.product_lab_runs
  for select
  using (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins can read product lab reports" on public.product_lab_reports;
create policy "Admins can read product lab reports"
  on public.product_lab_reports
  for select
  using (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins can read product lab v1 runs" on public.product_lab_v1_runs;
create policy "Admins can read product lab v1 runs"
  on public.product_lab_v1_runs
  for select
  using (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins can read product lab v1 reports" on public.product_lab_v1_reports;
create policy "Admins can read product lab v1 reports"
  on public.product_lab_v1_reports
  for select
  using (public.has_role(auth.uid(), 'admin'::public.app_role));

revoke all on table
  public.product_lab_runs,
  public.product_lab_reports,
  public.product_lab_v1_runs,
  public.product_lab_v1_reports
from anon;

grant usage on schema public to authenticated, service_role;

grant select on table
  public.product_lab_runs,
  public.product_lab_reports,
  public.product_lab_v1_runs,
  public.product_lab_v1_reports
to authenticated;

grant all on table
  public.product_lab_runs,
  public.product_lab_reports,
  public.product_lab_v1_runs,
  public.product_lab_v1_reports
to service_role;

select pg_notify('pgrst', 'reload schema');
