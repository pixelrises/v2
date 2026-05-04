create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta integer not null,
  source_type text not null,
  source_id text,
  balance_after integer,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists credit_transactions_source_unique
  on public.credit_transactions (source_type, source_id)
  where source_id is not null;

create index if not exists credit_transactions_user_id_created_at_idx
  on public.credit_transactions (user_id, created_at desc);

alter table public.credit_transactions enable row level security;

drop policy if exists "Users can read own credit transactions" on public.credit_transactions;
create policy "Users can read own credit transactions"
on public.credit_transactions
for select
using (auth.uid() = user_id);

drop policy if exists "Admin can read all credit transactions" on public.credit_transactions;
create policy "Admin can read all credit transactions"
on public.credit_transactions
for select
using (public.has_role(auth.uid(), 'admin'::public.app_role));

create or replace function public.apply_credit_transaction(
  p_user_id uuid,
  p_delta integer,
  p_source_type text,
  p_source_id text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_created_by uuid default auth.uid()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction_id uuid;
  v_new_credits integer;
  v_existing_credits integer;
begin
  if p_user_id is null then
    raise exception 'user_id is required';
  end if;

  if p_delta = 0 then
    raise exception 'delta must be non-zero';
  end if;

  if p_source_type like 'admin_%' and not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception 'admin role required';
  end if;

  if p_source_id is not null then
    insert into public.credit_transactions (
      user_id,
      delta,
      source_type,
      source_id,
      metadata,
      created_by
    )
    values (
      p_user_id,
      p_delta,
      p_source_type,
      p_source_id,
      coalesce(p_metadata, '{}'::jsonb),
      p_created_by
    )
    on conflict (source_type, source_id) do nothing
    returning id into v_transaction_id;

    if v_transaction_id is null then
      select credits
      into v_existing_credits
      from public.user_credits
      where user_id = p_user_id;

      return jsonb_build_object(
        'applied', false,
        'duplicate', true,
        'credits', coalesce(v_existing_credits, 0),
        'delta', p_delta
      );
    end if;
  else
    insert into public.credit_transactions (
      user_id,
      delta,
      source_type,
      source_id,
      metadata,
      created_by
    )
    values (
      p_user_id,
      p_delta,
      p_source_type,
      null,
      coalesce(p_metadata, '{}'::jsonb),
      p_created_by
    )
    returning id into v_transaction_id;
  end if;

  update public.user_credits
  set credits = greatest(0, credits + p_delta),
      updated_at = now()
  where user_id = p_user_id
  returning credits into v_new_credits;

  if not found then
    insert into public.user_credits (user_id, credits, total_used)
    values (p_user_id, greatest(p_delta, 0), 0)
    returning credits into v_new_credits;
  end if;

  update public.credit_transactions
  set balance_after = v_new_credits
  where id = v_transaction_id;

  return jsonb_build_object(
    'applied', true,
    'duplicate', false,
    'credits', v_new_credits,
    'delta', p_delta,
    'transaction_id', v_transaction_id
  );
end;
$$;

create or replace function public.admin_adjust_credits(
  p_user_id uuid,
  p_delta integer,
  p_reason text default null
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

  return public.apply_credit_transaction(
    p_user_id,
    p_delta,
    case when p_delta > 0 then 'admin_manual_add' else 'admin_manual_remove' end,
    null,
    jsonb_build_object('reason', coalesce(p_reason, '')),
    auth.uid()
  );
end;
$$;

grant execute on function public.apply_credit_transaction(uuid, integer, text, text, jsonb, uuid) to anon, authenticated, service_role;
grant execute on function public.admin_adjust_credits(uuid, integer, text) to authenticated, service_role;
