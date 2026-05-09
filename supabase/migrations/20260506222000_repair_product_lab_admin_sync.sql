-- Product Lab admin sync repair.
-- Safe/idempotent: creates or repairs only Product Lab tables used by Pixelrises V2 automation.
-- This does not modify V1 data, users, credits, payments, Stripe, or generated sites.

create extension if not exists pgcrypto;

do $$
begin
  create type public.app_role as enum ('admin', 'user');
exception
  when duplicate_object then null;
end$$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null default 'user',
  unique (user_id, role)
);

do $$
begin
  if to_regprocedure('public.update_updated_at_column()') is null then
    execute $function$
      create function public.update_updated_at_column()
      returns trigger
      language plpgsql
      as $$
      begin
        new.updated_at = now();
        return new;
      end;
      $$;
    $function$;
  end if;
end$$;

do $$
begin
  if to_regprocedure('public.has_role(uuid,public.app_role)') is null then
    execute $function$
      create function public.has_role(_user_id uuid, _role public.app_role)
      returns boolean
      language sql
      stable
      security definer
      set search_path = public
      as $$
        select exists (
          select 1
          from public.user_roles
          where user_id = _user_id
            and role::text = _role::text
        )
      $$;
    $function$;
  end if;
end$$;

create table if not exists public.product_lab_review_items (
  id uuid primary key default gen_random_uuid(),
  item_id text not null,
  source_run jsonb not null default '{}'::jsonb,
  queue_summary jsonb not null default '{}'::jsonb,
  review_item jsonb not null default '{}'::jsonb,
  decision_kind text not null default 'human_validation',
  title text not null default '',
  module text not null default '',
  priority text not null default '',
  risk text not null default '',
  status text not null default 'open',
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.product_lab_review_items
  add column if not exists source_run jsonb not null default '{}'::jsonb,
  add column if not exists queue_summary jsonb not null default '{}'::jsonb,
  add column if not exists review_item jsonb not null default '{}'::jsonb,
  add column if not exists decision_kind text not null default 'human_validation',
  add column if not exists title text not null default '',
  add column if not exists module text not null default '',
  add column if not exists priority text not null default '',
  add column if not exists risk text not null default '',
  add column if not exists status text not null default 'open',
  add column if not exists generated_at timestamptz not null default now(),
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists product_lab_review_items_item_id_uidx
  on public.product_lab_review_items (item_id);

create index if not exists product_lab_review_items_generated_idx
  on public.product_lab_review_items (generated_at desc);

create index if not exists product_lab_review_items_module_idx
  on public.product_lab_review_items (module, generated_at desc);

alter table public.product_lab_review_items enable row level security;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'update_product_lab_review_items_updated_at') then
    create trigger update_product_lab_review_items_updated_at
      before update on public.product_lab_review_items
      for each row execute function public.update_updated_at_column();
  end if;
end$$;

drop policy if exists "Admins can read product lab review items" on public.product_lab_review_items;
create policy "Admins can read product lab review items"
  on public.product_lab_review_items
  for select
  using (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins can insert product lab review items" on public.product_lab_review_items;
create policy "Admins can insert product lab review items"
  on public.product_lab_review_items
  for insert
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins can update product lab review items" on public.product_lab_review_items;
create policy "Admins can update product lab review items"
  on public.product_lab_review_items
  for update
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

create table if not exists public.product_lab_decisions (
  id uuid primary key default gen_random_uuid(),
  item_id text not null,
  source_run jsonb not null default '{}'::jsonb,
  review_item jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  admin_note text not null default '',
  correction_request text not null default '',
  rejection_mode text,
  automation_action text not null default 'hold',
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.product_lab_decisions
  add column if not exists source_run jsonb not null default '{}'::jsonb,
  add column if not exists review_item jsonb not null default '{}'::jsonb,
  add column if not exists status text not null default 'pending',
  add column if not exists admin_note text not null default '',
  add column if not exists correction_request text not null default '',
  add column if not exists rejection_mode text,
  add column if not exists automation_action text not null default 'hold',
  add column if not exists decided_by uuid references auth.users(id) on delete set null,
  add column if not exists decided_at timestamptz not null default now(),
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists product_lab_decisions_item_id_uidx
  on public.product_lab_decisions (item_id);

create index if not exists product_lab_decisions_status_idx
  on public.product_lab_decisions (status, decided_at desc);

create index if not exists product_lab_decisions_action_idx
  on public.product_lab_decisions (automation_action, decided_at desc);

alter table public.product_lab_decisions enable row level security;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'update_product_lab_decisions_updated_at') then
    create trigger update_product_lab_decisions_updated_at
      before update on public.product_lab_decisions
      for each row execute function public.update_updated_at_column();
  end if;
end$$;

drop policy if exists "Admins can read product lab decisions" on public.product_lab_decisions;
create policy "Admins can read product lab decisions"
  on public.product_lab_decisions
  for select
  using (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins can insert product lab decisions" on public.product_lab_decisions;
create policy "Admins can insert product lab decisions"
  on public.product_lab_decisions
  for insert
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins can update product lab decisions" on public.product_lab_decisions;
create policy "Admins can update product lab decisions"
  on public.product_lab_decisions
  for update
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));
