-- Product Lab PR / controlled auto-merge status.
-- Safe/idempotent: tracks PR status for V1/V2 Product Lab decisions only.
-- Does not touch auth, payments, Stripe, credits, generated sites, API keys, or production deploys.

create extension if not exists pgcrypto;

create table if not exists public.product_lab_pr_status (
  id uuid primary key default gen_random_uuid(),
  item_id text not null,
  decision_id uuid,
  branch text not null default '',
  pr_url text not null default '',
  pr_number integer,
  pr_status text not null default 'not_created',
  test_status text not null default 'pending',
  build_status text not null default 'pending',
  auto_merge_status text not null default 'not_requested',
  auto_merge_block_reason text not null default '',
  risk_level text not null default 'low',
  touched_sensitive_files jsonb not null default '[]'::jsonb,
  last_error text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_lab_v1_pr_status (
  id uuid primary key default gen_random_uuid(),
  item_id text not null,
  decision_id uuid,
  branch text not null default '',
  pr_url text not null default '',
  pr_number integer,
  pr_status text not null default 'not_created',
  test_status text not null default 'pending',
  build_status text not null default 'pending',
  auto_merge_status text not null default 'not_requested',
  auto_merge_block_reason text not null default '',
  risk_level text not null default 'low',
  touched_sensitive_files jsonb not null default '[]'::jsonb,
  last_error text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.product_lab_decisions
  add column if not exists pr_url text not null default '',
  add column if not exists pr_number integer,
  add column if not exists branch text not null default '',
  add column if not exists pr_status text not null default 'not_created',
  add column if not exists test_status text not null default 'pending',
  add column if not exists build_status text not null default 'pending',
  add column if not exists auto_merge_status text not null default 'not_requested',
  add column if not exists auto_merge_block_reason text not null default '',
  add column if not exists risk_level text not null default 'low',
  add column if not exists touched_sensitive_files jsonb not null default '[]'::jsonb;

alter table public.product_lab_v1_decisions
  add column if not exists branch text not null default '',
  add column if not exists pr_status text not null default 'not_created',
  add column if not exists test_status text not null default 'pending',
  add column if not exists build_status text not null default 'pending',
  add column if not exists auto_merge_status text not null default 'not_requested',
  add column if not exists auto_merge_block_reason text not null default '',
  add column if not exists risk_level text not null default 'low',
  add column if not exists touched_sensitive_files jsonb not null default '[]'::jsonb;

create unique index if not exists product_lab_pr_status_item_id_uidx
  on public.product_lab_pr_status (item_id);

create unique index if not exists product_lab_v1_pr_status_item_id_uidx
  on public.product_lab_v1_pr_status (item_id);

create index if not exists product_lab_pr_status_auto_merge_idx
  on public.product_lab_pr_status (auto_merge_status, updated_at desc);

create index if not exists product_lab_v1_pr_status_auto_merge_idx
  on public.product_lab_v1_pr_status (auto_merge_status, updated_at desc);

alter table public.product_lab_pr_status enable row level security;
alter table public.product_lab_v1_pr_status enable row level security;

do $product_lab_pr_status_triggers$
begin
  if to_regprocedure('public.update_updated_at_column()') is not null then
    if not exists (select 1 from pg_trigger where tgname = 'update_product_lab_pr_status_updated_at') then
      create trigger update_product_lab_pr_status_updated_at
        before update on public.product_lab_pr_status
        for each row execute function public.update_updated_at_column();
    end if;

    if not exists (select 1 from pg_trigger where tgname = 'update_product_lab_v1_pr_status_updated_at') then
      create trigger update_product_lab_v1_pr_status_updated_at
        before update on public.product_lab_v1_pr_status
        for each row execute function public.update_updated_at_column();
    end if;
  end if;
end$product_lab_pr_status_triggers$;

drop policy if exists "Admins can read product lab pr status" on public.product_lab_pr_status;
create policy "Admins can read product lab pr status"
  on public.product_lab_pr_status
  for select
  using (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins can insert product lab pr status" on public.product_lab_pr_status;
create policy "Admins can insert product lab pr status"
  on public.product_lab_pr_status
  for insert
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins can update product lab pr status" on public.product_lab_pr_status;
create policy "Admins can update product lab pr status"
  on public.product_lab_pr_status
  for update
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins can read product lab v1 pr status" on public.product_lab_v1_pr_status;
create policy "Admins can read product lab v1 pr status"
  on public.product_lab_v1_pr_status
  for select
  using (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins can insert product lab v1 pr status" on public.product_lab_v1_pr_status;
create policy "Admins can insert product lab v1 pr status"
  on public.product_lab_v1_pr_status
  for insert
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins can update product lab v1 pr status" on public.product_lab_v1_pr_status;
create policy "Admins can update product lab v1 pr status"
  on public.product_lab_v1_pr_status
  for update
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

select pg_notify('pgrst', 'reload schema');
