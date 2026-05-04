-- Secure publication/domain activation and keep admin credit grants transactional.

create or replace function public.admin_apply_credit_transaction(
  p_user_id uuid,
  p_delta integer,
  p_source_type text,
  p_source_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception 'admin role required';
  end if;

  if p_source_type not like 'admin_%' then
    raise exception 'admin source_type required';
  end if;

  return public.apply_credit_transaction(
    p_user_id,
    p_delta,
    p_source_type,
    p_source_id,
    coalesce(p_metadata, '{}'::jsonb),
    auth.uid()
  );
end;
$$;

grant execute on function public.admin_apply_credit_transaction(uuid, integer, text, text, jsonb)
to authenticated, service_role;

create or replace function public.can_update_generated_site(
  p_site_id uuid,
  p_user_id uuid,
  p_status text,
  p_custom_domain text,
  p_domain_status text
)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_existing record;
  v_credits integer;
  v_publish_requested boolean;
  v_domain_requested boolean;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    return false;
  end if;

  select status, custom_domain, domain_status
  into v_existing
  from public.generated_sites
  where id = p_site_id and user_id = p_user_id;

  if not found then
    return true;
  end if;

  if v_existing.status = 'published' then
    return true;
  end if;

  v_publish_requested := coalesce(v_existing.status, '') <> 'published'
    and coalesce(p_status, '') = 'published';

  v_domain_requested := (
    coalesce(v_existing.custom_domain, '') is distinct from coalesce(p_custom_domain, '')
    or coalesce(v_existing.domain_status, '') is distinct from coalesce(p_domain_status, '')
  ) and nullif(trim(coalesce(p_custom_domain, '')), '') is not null;

  if v_publish_requested or v_domain_requested then
    select credits
    into v_credits
    from public.user_credits
    where user_id = p_user_id;

    return coalesce(v_credits, 0) >= 3;
  end if;

  return true;
end;
$$;

drop policy if exists "Users can update own sites" on public.generated_sites;
create policy "Users can update own sites"
on public.generated_sites
for update
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and public.can_update_generated_site(id, user_id, status, custom_domain, domain_status)
);
