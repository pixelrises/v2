-- Phase 6 local proposal: Agents IA + Automatisations.
-- Non-destructive: creates missing tables only. Do not apply live before reviewing RLS in Supabase.

create table if not exists public.agent_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  role text not null,
  status text not null default 'beta',
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_permissions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid,
  user_id uuid not null default auth.uid(),
  permission_key text not null,
  requires_validation boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid,
  user_id uuid not null default auth.uid(),
  project_id uuid,
  prompt_redacted text,
  status text not null default 'prepared',
  risk_level text not null default 'low',
  data_state text not null default 'real',
  result jsonb not null default '{}'::jsonb,
  error_redacted text,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_messages (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid,
  run_id uuid,
  user_id uuid not null default auth.uid(),
  role text not null,
  content_redacted text not null,
  data_state text not null default 'real',
  created_at timestamptz not null default now()
);

create table if not exists public.agent_actions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid,
  user_id uuid not null default auth.uid(),
  project_id uuid,
  title text not null,
  description text not null,
  action_type text not null,
  target_module text not null,
  risk_level text not null default 'low',
  requires_confirmation boolean not null default true,
  status text not null default 'proposed',
  proposed_payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  error_redacted text,
  approved_at timestamptz,
  executed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  trigger_key text not null,
  status text not null default 'beta',
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  description text,
  trigger_key text not null,
  conditions jsonb not null default '{}'::jsonb,
  ai_analysis text,
  proposed_action text,
  validation_required boolean not null default true,
  required_tools text[] not null default '{}'::text[],
  risk_level text not null default 'low',
  status text not null default 'draft',
  data_state text not null default 'real',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_steps (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid,
  user_id uuid not null default auth.uid(),
  step_key text not null,
  label text not null,
  config jsonb not null default '{}'::jsonb,
  requires_validation boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid,
  user_id uuid not null default auth.uid(),
  trigger_key text not null,
  status text not null default 'prepared',
  risk_level text not null default 'low',
  validation_required boolean not null default true,
  result jsonb not null default '{}'::jsonb,
  error_redacted text,
  data_state text not null default 'real',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_logs (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid,
  run_id uuid,
  user_id uuid not null default auth.uid(),
  level text not null default 'info',
  message_redacted text not null,
  data_state text not null default 'real',
  created_at timestamptz not null default now()
);

create index if not exists agent_permissions_user_idx on public.agent_permissions(user_id);
create index if not exists agent_runs_user_idx on public.agent_runs(user_id, created_at desc);
create index if not exists agent_messages_user_idx on public.agent_messages(user_id, created_at desc);
create index if not exists agent_actions_user_idx on public.agent_actions(user_id, created_at desc);
create index if not exists automations_user_idx on public.automations(user_id, created_at desc);
create index if not exists automation_steps_user_idx on public.automation_steps(user_id, automation_id);
create index if not exists automation_runs_user_idx on public.automation_runs(user_id, created_at desc);
create index if not exists automation_logs_user_idx on public.automation_logs(user_id, created_at desc);

alter table public.agent_permissions enable row level security;
alter table public.agent_runs enable row level security;
alter table public.agent_messages enable row level security;
alter table public.agent_actions enable row level security;
alter table public.automations enable row level security;
alter table public.automation_steps enable row level security;
alter table public.automation_runs enable row level security;
alter table public.automation_logs enable row level security;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'agent_permissions',
    'agent_runs',
    'agent_messages',
    'agent_actions',
    'automations',
    'automation_steps',
    'automation_runs',
    'automation_logs'
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
