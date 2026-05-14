-- Phase 8 local proposal: Game Builder beta premium + Prototype Mode.
-- Non-destructive: creates missing tables only. Review RLS before applying live.
-- These tables store game blueprints, scripts, assets, versions and exports without secrets or platform tokens.

create table if not exists public.game_blueprints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  game_id uuid references public.games(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  platform text not null,
  genre text not null,
  data_state text not null default 'real' check (data_state in ('real', 'example', 'mock', 'pending', 'error', 'empty')),
  blueprint jsonb not null default '{}'::jsonb,
  quality_gate jsonb not null default '{}'::jsonb,
  source_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  game_id uuid references public.games(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  source_action text not null check (source_action in ('generate', 'improve', 'manual_edit', 'restore', 'export')),
  changed_area text not null default 'full_package',
  summary text not null,
  blueprint_snapshot jsonb not null default '{}'::jsonb,
  quality_gate jsonb not null default '{}'::jsonb,
  data_state text not null default 'real' check (data_state in ('real', 'example', 'mock', 'pending', 'error', 'empty')),
  created_at timestamptz not null default now()
);

create table if not exists public.game_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  game_id uuid references public.games(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  asset_type text not null,
  title text not null,
  prompt text not null,
  data_state text not null default 'example' check (data_state in ('real', 'example', 'mock', 'pending', 'error', 'empty')),
  metadata_redacted jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.game_scripts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  game_id uuid references public.games(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  platform text not null,
  language_or_format text not null,
  file_name text not null,
  where_to_place_it text not null,
  purpose text not null,
  code_or_pseudocode text not null,
  setup_instructions text[] not null default '{}'::text[],
  test_instructions text[] not null default '{}'::text[],
  warnings text[] not null default '{}'::text[],
  data_state text not null default 'real' check (data_state in ('real', 'example', 'mock', 'pending', 'error', 'empty')),
  metadata_redacted jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.game_quality_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  game_id uuid references public.games(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  score_key text not null,
  score integer not null check (score >= 0 and score <= 100),
  status text not null check (status in ('pass', 'warning', 'fail')),
  reason text not null,
  recommendation text,
  data_state text not null default 'real' check (data_state in ('real', 'example', 'mock', 'pending', 'error', 'empty')),
  created_at timestamptz not null default now()
);

create table if not exists public.game_exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  game_id uuid references public.games(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  export_type text not null check (export_type in ('json', 'markdown', 'scripts', 'checklist', 'asset_prompts', 'web_prototype')),
  status text not null default 'ready' check (status in ('ready', 'beta', 'coming_soon', 'not_configured', 'error')),
  content_redacted jsonb not null default '{}'::jsonb,
  data_state text not null default 'real' check (data_state in ('real', 'example', 'mock', 'pending', 'error', 'empty')),
  created_at timestamptz not null default now()
);

create index if not exists game_blueprints_user_created_idx on public.game_blueprints(user_id, created_at desc);
create index if not exists game_versions_user_created_idx on public.game_versions(user_id, created_at desc);
create index if not exists game_versions_game_created_idx on public.game_versions(game_id, created_at desc);
create index if not exists game_assets_game_created_idx on public.game_assets(game_id, created_at desc);
create index if not exists game_scripts_game_created_idx on public.game_scripts(game_id, created_at desc);
create index if not exists game_quality_scores_game_created_idx on public.game_quality_scores(game_id, created_at desc);
create index if not exists game_exports_game_created_idx on public.game_exports(game_id, created_at desc);

alter table public.game_blueprints enable row level security;
alter table public.game_versions enable row level security;
alter table public.game_assets enable row level security;
alter table public.game_scripts enable row level security;
alter table public.game_quality_scores enable row level security;
alter table public.game_exports enable row level security;

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'game_blueprints',
    'game_versions',
    'game_assets',
    'game_scripts',
    'game_quality_scores',
    'game_exports'
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
