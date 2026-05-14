-- AI Spaces action and template usage proposal.
-- Safe/idempotent: creates only additive tables for future AI Space histories.
-- Do not apply live until the founder validates the Phase 3 report.

create table if not exists public.ai_space_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  space_type text not null check (space_type in ('business', 'student', 'management', 'enterprise', 'creator', 'general')),
  action_kind text not null default '',
  action_label text not null default '',
  status text not null default 'proposed' check (status in ('proposed', 'approved', 'rejected', 'completed', 'failed')),
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_space_templates_used (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  space_type text not null check (space_type in ('business', 'student', 'management', 'enterprise', 'creator', 'general')),
  template_key text not null default '',
  template_title text not null default '',
  source_state text not null default 'example' check (source_state in ('real', 'example', 'mock', 'pending', 'error', 'empty')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.ai_space_actions enable row level security;
alter table public.ai_space_templates_used enable row level security;

create index if not exists ai_space_actions_user_space_idx
  on public.ai_space_actions (user_id, space_type, created_at desc);

create index if not exists ai_space_templates_used_user_space_idx
  on public.ai_space_templates_used (user_id, space_type, created_at desc);

drop policy if exists "Users can read own AI Space actions" on public.ai_space_actions;
create policy "Users can read own AI Space actions"
  on public.ai_space_actions
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own AI Space actions" on public.ai_space_actions;
create policy "Users can insert own AI Space actions"
  on public.ai_space_actions
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own AI Space actions" on public.ai_space_actions;
create policy "Users can update own AI Space actions"
  on public.ai_space_actions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own AI Space templates used" on public.ai_space_templates_used;
create policy "Users can read own AI Space templates used"
  on public.ai_space_templates_used
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own AI Space templates used" on public.ai_space_templates_used;
create policy "Users can insert own AI Space templates used"
  on public.ai_space_templates_used
  for insert
  with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
