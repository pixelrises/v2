-- Product Lab human validation decisions.
-- Stores admin approvals/refusals so automation can apply only validated changes later.
-- Never store API keys, provider secrets, auth tokens, or full private prompts here.

create table if not exists public.product_lab_decisions (
  id uuid primary key default gen_random_uuid(),
  item_id text not null unique,
  source_run jsonb not null default '{}'::jsonb,
  review_item jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'needs_review')),
  admin_note text not null default '',
  correction_request text not null default '',
  rejection_mode text check (rejection_mode in ('ignore', 'alternative')),
  automation_action text not null default 'hold' check (automation_action in ('hold', 'authorize_next_run', 'ignore', 'request_alternative')),
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.product_lab_decisions enable row level security;

create index if not exists product_lab_decisions_status_idx on public.product_lab_decisions (status, decided_at desc);
create index if not exists product_lab_decisions_action_idx on public.product_lab_decisions (automation_action, decided_at desc);

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
