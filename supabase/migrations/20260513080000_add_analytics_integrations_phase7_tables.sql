-- Phase 7 local proposal: Analytics + Integrations.
-- Non-destructive: creates missing tables only. Do not apply live before reviewing RLS in Supabase.
-- These tables store statuses, runs and business signals without secrets or raw provider payloads.

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  integration_key text not null,
  status text not null default 'not_configured' check (
    status in ('connected', 'not_configured', 'beta', 'coming_soon', 'blocked', 'error', 'dry_run')
  ),
  data_state text not null default 'real' check (data_state in ('real', 'example', 'mock', 'pending', 'error', 'empty')),
  required_permissions text[] not null default '{}'::text[],
  risk_level text not null default 'low' check (risk_level in ('low', 'medium', 'high')),
  metadata_redacted jsonb not null default '{}'::jsonb,
  connected_at timestamptz,
  last_sync_at timestamptz,
  error_redacted text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, integration_key)
);

create table if not exists public.integration_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  integration_key text not null,
  event_type text not null,
  status text not null default 'dry_run' check (
    status in ('connected', 'not_configured', 'beta', 'coming_soon', 'blocked', 'error', 'dry_run')
  ),
  data_state text not null default 'real' check (data_state in ('real', 'example', 'mock', 'pending', 'error', 'empty')),
  metadata_redacted jsonb not null default '{}'::jsonb,
  error_redacted text,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  source text not null default 'pixelrises',
  status text not null default 'new' check (status in ('new', 'qualified', 'contacted', 'won', 'lost', 'archived')),
  data_redacted jsonb not null default '{}'::jsonb,
  data_state text not null default 'real' check (data_state in ('real', 'example', 'mock', 'pending', 'error', 'empty')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  form_key text not null default 'default',
  data_redacted jsonb not null default '{}'::jsonb,
  data_state text not null default 'real' check (data_state in ('real', 'example', 'mock', 'pending', 'error', 'empty')),
  created_at timestamptz not null default now()
);

create index if not exists integration_connections_user_idx on public.integration_connections(user_id, integration_key);
create index if not exists integration_logs_user_idx on public.integration_logs(user_id, created_at desc);
create index if not exists leads_user_created_idx on public.leads(user_id, created_at desc);
create index if not exists leads_project_created_idx on public.leads(project_id, created_at desc);
create index if not exists form_submissions_user_created_idx on public.form_submissions(user_id, created_at desc);
create index if not exists form_submissions_project_created_idx on public.form_submissions(project_id, created_at desc);

alter table public.integration_connections enable row level security;
alter table public.integration_logs enable row level security;
alter table public.leads enable row level security;
alter table public.form_submissions enable row level security;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'integration_connections',
    'integration_logs',
    'leads',
    'form_submissions'
  ]
  loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = target_table
        and policyname = target_table || '_own_rows'
    ) then
      execute format(
        'create policy %I on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)',
        target_table || '_own_rows',
        target_table
      );
    end if;
  end loop;
end $$;
