-- Pixelrises V2 AI Spaces persistence.
-- Non-destructive foundation: conversations, messages, usage logs, feedback and preferences.
-- Secrets are never stored here; AI provider keys must remain in Edge Function / CI / server env only.

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.ai_space_preferences (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  preferred_space text not null default 'business'
    check (preferred_space in ('business', 'student', 'management', 'enterprise', 'creator', 'general')),
  profile_level text not null default 'beginner'
    check (profile_level in ('beginner', 'advanced')),
  objective text not null default '',
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.ai_space_conversations (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  space_type text not null
    check (space_type in ('business', 'student', 'management', 'enterprise', 'creator', 'general')),
  title text not null default 'Nouvelle conversation',
  summary text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_space_messages (
  id text primary key,
  conversation_id text not null references public.ai_space_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null default '',
  source text not null default 'mock-fallback' check (source in ('real', 'mock-fallback')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_space_usage_logs (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id text references public.ai_space_conversations(id) on delete set null,
  space_type text not null
    check (space_type in ('business', 'student', 'management', 'enterprise', 'creator', 'general')),
  provider text not null default '',
  model text not null default '',
  source text not null default 'mock-fallback' check (source in ('real', 'mock-fallback')),
  estimated_tokens integer not null default 0 check (estimated_tokens >= 0),
  estimated_cost numeric(12, 6) not null default 0 check (estimated_cost >= 0),
  duration_ms integer not null default 0 check (duration_ms >= 0),
  success boolean not null default true,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_space_feedback (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id text references public.ai_space_conversations(id) on delete cascade,
  message_id text references public.ai_space_messages(id) on delete set null,
  space_type text not null
    check (space_type in ('business', 'student', 'management', 'enterprise', 'creator', 'general')),
  rating integer check (rating between 1 and 5),
  feedback text not null default '',
  created_at timestamptz not null default now()
);

alter table public.ai_space_preferences enable row level security;
alter table public.ai_space_conversations enable row level security;
alter table public.ai_space_messages enable row level security;
alter table public.ai_space_usage_logs enable row level security;
alter table public.ai_space_feedback enable row level security;

create index if not exists ai_space_preferences_user_idx
  on public.ai_space_preferences (user_id);

create index if not exists ai_space_conversations_user_space_idx
  on public.ai_space_conversations (user_id, space_type, updated_at desc);

create index if not exists ai_space_messages_conversation_idx
  on public.ai_space_messages (conversation_id, created_at asc);

create index if not exists ai_space_usage_logs_user_space_idx
  on public.ai_space_usage_logs (user_id, space_type, created_at desc);

create index if not exists ai_space_feedback_user_space_idx
  on public.ai_space_feedback (user_id, space_type, created_at desc);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'update_ai_space_preferences_updated_at') then
    create trigger update_ai_space_preferences_updated_at
      before update on public.ai_space_preferences
      for each row execute function public.update_updated_at_column();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'update_ai_space_conversations_updated_at') then
    create trigger update_ai_space_conversations_updated_at
      before update on public.ai_space_conversations
      for each row execute function public.update_updated_at_column();
  end if;
end$$;

drop policy if exists "Users can read own AI Space preferences" on public.ai_space_preferences;
create policy "Users can read own AI Space preferences"
  on public.ai_space_preferences
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own AI Space preferences" on public.ai_space_preferences;
create policy "Users can insert own AI Space preferences"
  on public.ai_space_preferences
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own AI Space preferences" on public.ai_space_preferences;
create policy "Users can update own AI Space preferences"
  on public.ai_space_preferences
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own AI Space conversations" on public.ai_space_conversations;
create policy "Users can read own AI Space conversations"
  on public.ai_space_conversations
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own AI Space conversations" on public.ai_space_conversations;
create policy "Users can insert own AI Space conversations"
  on public.ai_space_conversations
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own AI Space conversations" on public.ai_space_conversations;
create policy "Users can update own AI Space conversations"
  on public.ai_space_conversations
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own AI Space messages" on public.ai_space_messages;
create policy "Users can read own AI Space messages"
  on public.ai_space_messages
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own AI Space messages" on public.ai_space_messages;
create policy "Users can insert own AI Space messages"
  on public.ai_space_messages
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.ai_space_conversations c
      where c.id = conversation_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "Users can read own AI Space usage logs" on public.ai_space_usage_logs;
create policy "Users can read own AI Space usage logs"
  on public.ai_space_usage_logs
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own AI Space usage logs" on public.ai_space_usage_logs;
create policy "Users can insert own AI Space usage logs"
  on public.ai_space_usage_logs
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own AI Space feedback" on public.ai_space_feedback;
create policy "Users can read own AI Space feedback"
  on public.ai_space_feedback
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own AI Space feedback" on public.ai_space_feedback;
create policy "Users can insert own AI Space feedback"
  on public.ai_space_feedback
  for insert
  with check (auth.uid() = user_id);
