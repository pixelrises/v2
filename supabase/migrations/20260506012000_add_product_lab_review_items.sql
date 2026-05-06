-- Product Lab review items.
-- GitHub Actions writes proposed improvements here with a service role key.
-- Admin users can read them in /admin and decide: approve, review, ignore, or request an alternative.
-- No production deployment or merge is triggered from this table.

create table if not exists public.product_lab_review_items (
  id uuid primary key default gen_random_uuid(),
  item_id text not null unique,
  source_run jsonb not null default '{}'::jsonb,
  queue_summary jsonb not null default '{}'::jsonb,
  review_item jsonb not null default '{}'::jsonb,
  decision_kind text not null default 'human_validation' check (decision_kind in ('auto_safe', 'human_validation')),
  title text not null default '',
  module text not null default '',
  priority text not null default '',
  risk text not null default '',
  status text not null default 'open' check (status in ('open', 'archived')),
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.product_lab_review_items enable row level security;

create index if not exists product_lab_review_items_generated_idx
  on public.product_lab_review_items (generated_at desc);

create index if not exists product_lab_review_items_module_idx
  on public.product_lab_review_items (module, generated_at desc);

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
