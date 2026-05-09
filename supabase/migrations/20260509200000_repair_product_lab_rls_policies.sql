-- Repair Product Lab RLS policies for the shared V1/V2 admin review center.
-- Safe/idempotent: updates policies only on Product Lab tables.
-- Does not touch credits, payments, Stripe, generated sites, API keys, or frontend secrets.

create or replace function public.has_role(_user_id uuid, _role public.app_role)
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
  );
$$;

alter table public.product_lab_review_items enable row level security;
alter table public.product_lab_decisions enable row level security;
alter table public.product_lab_v1_review_items enable row level security;
alter table public.product_lab_v1_decisions enable row level security;

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

drop policy if exists "Admins can read product lab v1 review items" on public.product_lab_v1_review_items;
create policy "Admins can read product lab v1 review items"
  on public.product_lab_v1_review_items
  for select
  using (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins can insert product lab v1 review items" on public.product_lab_v1_review_items;
create policy "Admins can insert product lab v1 review items"
  on public.product_lab_v1_review_items
  for insert
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins can update product lab v1 review items" on public.product_lab_v1_review_items;
create policy "Admins can update product lab v1 review items"
  on public.product_lab_v1_review_items
  for update
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins can read product lab v1 decisions" on public.product_lab_v1_decisions;
create policy "Admins can read product lab v1 decisions"
  on public.product_lab_v1_decisions
  for select
  using (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins can insert product lab v1 decisions" on public.product_lab_v1_decisions;
create policy "Admins can insert product lab v1 decisions"
  on public.product_lab_v1_decisions
  for insert
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins can update product lab v1 decisions" on public.product_lab_v1_decisions;
create policy "Admins can update product lab v1 decisions"
  on public.product_lab_v1_decisions
  for update
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

select pg_notify('pgrst', 'reload schema');
