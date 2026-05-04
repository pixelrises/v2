create table if not exists public.site_page_views (
  id uuid primary key default gen_random_uuid(),
  generated_site_id uuid not null references public.generated_sites(id) on delete cascade,
  hostname text,
  path text,
  referrer text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_site_page_views_site_id
  on public.site_page_views (generated_site_id);

create index if not exists idx_site_page_views_created_at
  on public.site_page_views (created_at desc);

alter table public.site_page_views enable row level security;

drop policy if exists "Public can insert site page views" on public.site_page_views;
create policy "Public can insert site page views"
on public.site_page_views
for insert
to anon, authenticated
with check (true);

drop policy if exists "Users can read their own site page views" on public.site_page_views;
create policy "Users can read their own site page views"
on public.site_page_views
for select
to authenticated
using (
  exists (
    select 1
    from public.generated_sites gs
    where gs.id = site_page_views.generated_site_id
      and gs.user_id = auth.uid()
  )
);
