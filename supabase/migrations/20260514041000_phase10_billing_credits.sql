-- Phase 10: billing, credits, quotas and Stripe sync foundation.
-- Non destructive: keeps user_credits and extends existing credit_transactions/stripe_events.

create table if not exists public.billing_plans (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  stripe_price_id text,
  monthly_credits integer,
  features jsonb not null default '[]'::jsonb,
  limits jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_key text not null default 'free',
  status text not null default 'free',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  trial_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  balance integer not null default 0,
  monthly_allowance integer not null default 5,
  bonus_balance integer not null default 0,
  lifetime_used integer not null default 0,
  last_refill_at timestamptz,
  next_refill_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credit_wallets_balance_non_negative check (balance >= 0),
  constraint credit_wallets_bonus_non_negative check (bonus_balance >= 0)
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null,
  builder_type text,
  entity_id text,
  credits_estimated integer not null default 0,
  credits_charged integer not null default 0,
  status text not null default 'pending',
  idempotency_key text,
  error_code text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint usage_events_status_check check (
    status in ('pending', 'succeeded', 'failed', 'cancelled', 'refunded', 'blocked')
  )
);

create table if not exists public.credit_cost_rules (
  id uuid primary key default gen_random_uuid(),
  action_type text not null,
  builder_type text,
  base_cost integer not null,
  complexity_level text not null default 'medium',
  quality_mode text not null default 'standard',
  plan_multiplier numeric(8,2) not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (action_type, builder_type, quality_mode)
);

create table if not exists public.plan_limits (
  id uuid primary key default gen_random_uuid(),
  plan_key text not null,
  limit_key text not null,
  limit_value integer,
  reset_period text not null default 'month',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_key, limit_key)
);

create table if not exists public.quota_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_key text not null default 'free',
  action_type text not null,
  count integer not null default 1,
  period_start timestamptz not null,
  period_end timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.credit_transactions
  add column if not exists amount integer,
  add column if not exists type text,
  add column if not exists reason text,
  add column if not exists action_type text,
  add column if not exists related_entity_type text,
  add column if not exists related_entity_id text,
  add column if not exists status text not null default 'succeeded',
  add column if not exists idempotency_key text;

update public.credit_transactions
set amount = abs(delta)
where amount is null;

update public.credit_transactions
set type = case
  when delta < 0 then 'debit'
  when source_type ilike '%refund%' then 'refund'
  when source_type ilike 'admin_%' then 'adjustment'
  when source_type ilike '%invoice%' then 'monthly_refill'
  else 'grant'
end
where type is null;

update public.credit_transactions
set reason = source_type
where reason is null;

alter table public.credit_transactions
  alter column amount set default 0,
  alter column type set default 'grant',
  alter column reason set default 'credit_event';

alter table public.stripe_events
  add column if not exists stripe_event_id text,
  add column if not exists status text not null default 'ok',
  add column if not exists error text,
  add column if not exists payload_summary jsonb,
  add column if not exists created_at timestamptz not null default now();

update public.stripe_events
set stripe_event_id = id
where stripe_event_id is null;

create unique index if not exists stripe_events_stripe_event_id_unique
  on public.stripe_events (stripe_event_id)
  where stripe_event_id is not null;

create unique index if not exists user_subscriptions_user_id_unique
  on public.user_subscriptions (user_id);
create unique index if not exists user_subscriptions_stripe_customer_id_idx
  on public.user_subscriptions (stripe_customer_id)
  where stripe_customer_id is not null;
create unique index if not exists user_subscriptions_stripe_subscription_id_idx
  on public.user_subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;
create unique index if not exists credit_wallets_user_id_unique
  on public.credit_wallets (user_id);
create unique index if not exists usage_events_idempotency_key_unique
  on public.usage_events (idempotency_key)
  where idempotency_key is not null;
create index if not exists usage_events_user_id_created_at_idx
  on public.usage_events (user_id, created_at desc);
create index if not exists usage_events_status_idx
  on public.usage_events (status);
create index if not exists credit_transactions_idempotency_key_idx
  on public.credit_transactions (idempotency_key)
  where idempotency_key is not null;
create index if not exists credit_wallets_user_id_idx
  on public.credit_wallets (user_id);
create index if not exists quota_events_user_period_idx
  on public.quota_events (user_id, period_start, period_end);

insert into public.billing_plans (
  key,
  name,
  description,
  monthly_credits,
  features,
  limits,
  is_active,
  sort_order
)
values
  (
    'free',
    'Decouverte',
    'Tester Pixelrises sans risque avec des limites anti-abus.',
    5,
    '["Test site IA", "Agent simple", "Historique court"]'::jsonb,
    '{"max_daily_actions":5,"max_monthly_heavy_generations":1,"max_site_generations":1,"max_game_generations":0,"max_agent_creations":1,"max_premium_actions":0,"max_parallel_actions":1}'::jsonb,
    true,
    0
  ),
  (
    'starter',
    'Starter',
    'Usage leger pour creer et ameliorer un premier projet.',
    80,
    '["Sites IA", "Ameliorations", "Agents simples", "Exports standards"]'::jsonb,
    '{"max_daily_actions":18,"max_monthly_heavy_generations":6,"max_site_generations":4,"max_game_generations":1,"max_agent_creations":3,"max_premium_actions":2,"max_parallel_actions":1}'::jsonb,
    true,
    1
  ),
  (
    'pro',
    'Pro',
    'Le meilleur equilibre pour lancer, iterer et convertir.',
    240,
    '["Builders complets", "Mode qualite", "Exports avances", "Historique et versions"]'::jsonb,
    '{"max_daily_actions":45,"max_monthly_heavy_generations":18,"max_site_generations":12,"max_game_generations":4,"max_agent_creations":8,"max_premium_actions":10,"max_parallel_actions":2}'::jsonb,
    true,
    2
  ),
  (
    'business',
    'Business',
    'Usage intensif avec quotas plus hauts et marge protegee.',
    850,
    '["Usage equipe", "Premium Multi-IA", "Alertes rentabilite", "Support prioritaire"]'::jsonb,
    '{"max_daily_actions":120,"max_monthly_heavy_generations":60,"max_site_generations":35,"max_game_generations":12,"max_agent_creations":20,"max_premium_actions":35,"max_parallel_actions":4}'::jsonb,
    true,
    3
  ),
  (
    'enterprise',
    'Enterprise',
    'Contrat sur mesure, securite et quotas negocies.',
    null,
    '["Contrat dedie", "Quotas sur mesure", "Securite renforcee", "Accompagnement"]'::jsonb,
    '{"max_daily_actions":null,"max_monthly_heavy_generations":null,"max_site_generations":null,"max_game_generations":null,"max_agent_creations":null,"max_premium_actions":null,"max_parallel_actions":null}'::jsonb,
    true,
    4
  )
on conflict (key) do update
set name = excluded.name,
    description = excluded.description,
    monthly_credits = excluded.monthly_credits,
    features = excluded.features,
    limits = excluded.limits,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order,
    updated_at = now();

insert into public.plan_limits (plan_key, limit_key, limit_value, reset_period)
select key, limit_key, nullif(limit_value::text, 'null')::integer, 'month'
from public.billing_plans,
lateral jsonb_each(limits) as entries(limit_key, limit_value)
on conflict (plan_key, limit_key) do update
set limit_value = excluded.limit_value,
    reset_period = excluded.reset_period,
    updated_at = now();

insert into public.credit_cost_rules (
  action_type,
  builder_type,
  base_cost,
  complexity_level,
  quality_mode,
  plan_multiplier,
  is_active
)
values
  ('general_question', 'ai_space', 1, 'simple', 'economy', 1, true),
  ('quick_rewrite', 'ai_space', 1, 'simple', 'standard', 1, true),
  ('student_sheet', 'ai_space', 3, 'medium', 'standard', 1, true),
  ('student_quiz', 'ai_space', 4, 'medium', 'standard', 1, true),
  ('creator_script', 'ai_space', 5, 'medium', 'standard', 1, true),
  ('business_plan', 'ai_space', 7, 'advanced', 'quality', 1, true),
  ('site_generation', 'site', 5, 'advanced', 'standard', 1, true),
  ('site_section_improve', 'site', 3, 'medium', 'standard', 1, true),
  ('site_seo_analysis', 'site', 8, 'medium', 'quality', 1, true),
  ('site_export_advanced', 'export', 10, 'advanced', 'standard', 1, true),
  ('game_blueprint', 'game', 13, 'advanced', 'standard', 1, true),
  ('game_prototype', 'game', 32, 'premium', 'quality', 1, true),
  ('game_package', 'game', 36, 'premium', 'quality', 1, true),
  ('game_script_generation', 'game', 18, 'advanced', 'quality', 1, true),
  ('agent_generation', 'agent', 12, 'advanced', 'standard', 1, true),
  ('agent_improve', 'agent', 7, 'medium', 'standard', 1, true),
  ('agent_test_chat', 'agent', 1, 'simple', 'economy', 1, true),
  ('automation_scenario', 'automation', 7, 'medium', 'standard', 1, true),
  ('analytics_recommendation', 'analytics', 4, 'medium', 'standard', 1, true)
on conflict (action_type, builder_type, quality_mode) do update
set base_cost = excluded.base_cost,
    complexity_level = excluded.complexity_level,
    plan_multiplier = excluded.plan_multiplier,
    is_active = excluded.is_active,
    updated_at = now();

insert into public.credit_wallets (
  user_id,
  balance,
  monthly_allowance,
  bonus_balance,
  lifetime_used,
  last_refill_at
)
select
  user_id,
  credits,
  5,
  0,
  total_used,
  null
from public.user_credits
on conflict (user_id) do update
set balance = excluded.balance,
    lifetime_used = greatest(public.credit_wallets.lifetime_used, excluded.lifetime_used),
    updated_at = now();

insert into public.user_subscriptions (user_id, plan_key, status)
select id, 'free', 'free'
from auth.users
on conflict (user_id) do nothing;

alter table public.billing_plans enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.credit_wallets enable row level security;
alter table public.usage_events enable row level security;
alter table public.credit_cost_rules enable row level security;
alter table public.plan_limits enable row level security;
alter table public.quota_events enable row level security;
alter table public.stripe_events enable row level security;

drop policy if exists "Authenticated can read active billing plans" on public.billing_plans;
create policy "Authenticated can read active billing plans"
on public.billing_plans
for select
to authenticated
using (is_active = true);

drop policy if exists "Authenticated can read active credit cost rules" on public.credit_cost_rules;
create policy "Authenticated can read active credit cost rules"
on public.credit_cost_rules
for select
to authenticated
using (is_active = true);

drop policy if exists "Authenticated can read plan limits" on public.plan_limits;
create policy "Authenticated can read plan limits"
on public.plan_limits
for select
to authenticated
using (true);

drop policy if exists "Users can read own subscriptions" on public.user_subscriptions;
create policy "Users can read own subscriptions"
on public.user_subscriptions
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Admin can read all subscriptions" on public.user_subscriptions;
create policy "Admin can read all subscriptions"
on public.user_subscriptions
for select
to authenticated
using (public.has_role((select auth.uid()), 'admin'::public.app_role));

drop policy if exists "Users can read own wallets" on public.credit_wallets;
create policy "Users can read own wallets"
on public.credit_wallets
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Admin can read all wallets" on public.credit_wallets;
create policy "Admin can read all wallets"
on public.credit_wallets
for select
to authenticated
using (public.has_role((select auth.uid()), 'admin'::public.app_role));

drop policy if exists "Users can read own usage events" on public.usage_events;
create policy "Users can read own usage events"
on public.usage_events
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Admin can read all usage events" on public.usage_events;
create policy "Admin can read all usage events"
on public.usage_events
for select
to authenticated
using (public.has_role((select auth.uid()), 'admin'::public.app_role));

drop policy if exists "Users can read own quota events" on public.quota_events;
create policy "Users can read own quota events"
on public.quota_events
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Admin can read all quota events" on public.quota_events;
create policy "Admin can read all quota events"
on public.quota_events
for select
to authenticated
using (public.has_role((select auth.uid()), 'admin'::public.app_role));

drop policy if exists "Users can read own credit transactions" on public.credit_transactions;
create policy "Users can read own credit transactions"
on public.credit_transactions
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Admin can read all credit transactions" on public.credit_transactions;
create policy "Admin can read all credit transactions"
on public.credit_transactions
for select
to authenticated
using (public.has_role((select auth.uid()), 'admin'::public.app_role));

drop policy if exists "Admin can read stripe events" on public.stripe_events;
create policy "Admin can read stripe events"
on public.stripe_events
for select
to authenticated
using (public.has_role((select auth.uid()), 'admin'::public.app_role));

grant usage on schema public to authenticated, service_role;
grant select on public.billing_plans to authenticated;
grant select on public.credit_cost_rules to authenticated;
grant select on public.plan_limits to authenticated;
grant select on public.user_subscriptions to authenticated;
grant select on public.credit_wallets to authenticated;
grant select on public.credit_transactions to authenticated;
grant select on public.usage_events to authenticated;
grant select on public.quota_events to authenticated;
grant select on public.stripe_events to authenticated;
grant all on public.billing_plans to service_role;
grant all on public.user_subscriptions to service_role;
grant all on public.credit_wallets to service_role;
grant all on public.credit_transactions to service_role;
grant all on public.usage_events to service_role;
grant all on public.credit_cost_rules to service_role;
grant all on public.plan_limits to service_role;
grant all on public.quota_events to service_role;
grant all on public.stripe_events to service_role;

create or replace function public.ensure_credit_wallet(p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet_id uuid;
  v_credits integer;
  v_total_used integer;
begin
  if p_user_id is null then
    raise exception 'user_id is required';
  end if;

  select credits, total_used
  into v_credits, v_total_used
  from public.user_credits
  where user_id = p_user_id;

  if v_credits is null then
    insert into public.user_credits (user_id, credits, total_used)
    values (p_user_id, 5, 0)
    on conflict (user_id) do update
    set updated_at = now()
    returning credits, total_used into v_credits, v_total_used;
  end if;

  insert into public.credit_wallets (
    user_id,
    balance,
    monthly_allowance,
    bonus_balance,
    lifetime_used
  )
  values (
    p_user_id,
    coalesce(v_credits, 5),
    5,
    0,
    coalesce(v_total_used, 0)
  )
  on conflict (user_id) do update
  set updated_at = now()
  returning id into v_wallet_id;

  return v_wallet_id;
end;
$$;

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
  v_current_credits integer;
  v_transaction_type text;
  v_reason text;
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and not public.has_role((select auth.uid()), 'admin'::public.app_role) then
    raise exception 'credit_mutation_not_allowed';
  end if;

  if p_user_id is null then
    raise exception 'user_id is required';
  end if;

  if p_delta = 0 then
    raise exception 'delta must be non-zero';
  end if;

  perform public.ensure_credit_wallet(p_user_id);

  if p_source_id is not null then
    select id
    into v_transaction_id
    from public.credit_transactions
    where source_type = p_source_type
      and source_id = p_source_id
    limit 1;

    if v_transaction_id is not null then
      select credits
      into v_existing_credits
      from public.user_credits
      where user_id = p_user_id;

      return jsonb_build_object(
        'applied', false,
        'duplicate', true,
        'credits', coalesce(v_existing_credits, 0),
        'delta', p_delta,
        'transaction_id', v_transaction_id
      );
    end if;
  end if;

  select credits
  into v_current_credits
  from public.user_credits
  where user_id = p_user_id
  for update;

  if p_delta < 0 and coalesce(v_current_credits, 0) < abs(p_delta) then
    raise exception 'insufficient_credits';
  end if;

  v_transaction_type := case
    when p_delta < 0 then 'debit'
    when p_source_type ilike '%refund%' then 'refund'
    when p_source_type ilike 'admin_%' then 'adjustment'
    when p_source_type ilike '%invoice%' then 'monthly_refill'
    when p_source_type ilike '%purchase%' then 'purchase'
    else 'grant'
  end;

  v_reason := coalesce(p_metadata->>'reason', p_source_type);

  insert into public.credit_transactions (
    user_id,
    delta,
    amount,
    type,
    reason,
    action_type,
    related_entity_type,
    related_entity_id,
    source_type,
    source_id,
    status,
    idempotency_key,
    metadata,
    created_by
  )
  values (
    p_user_id,
    p_delta,
    abs(p_delta),
    v_transaction_type,
    v_reason,
    p_metadata->>'action_type',
    p_metadata->>'related_entity_type',
    p_metadata->>'related_entity_id',
    p_source_type,
    p_source_id,
    'succeeded',
    coalesce(p_metadata->>'idempotency_key', p_source_id),
    coalesce(p_metadata, '{}'::jsonb),
    p_created_by
  )
  returning id into v_transaction_id;

  update public.user_credits
  set credits = greatest(0, credits + p_delta),
      total_used = case when p_delta < 0 then total_used + abs(p_delta) else total_used end,
      updated_at = now()
  where user_id = p_user_id
  returning credits into v_new_credits;

  update public.credit_wallets
  set balance = v_new_credits,
      lifetime_used = case when p_delta < 0 then lifetime_used + abs(p_delta) else lifetime_used end,
      updated_at = now()
  where user_id = p_user_id;

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

create or replace function public.start_usage_event(
  p_user_id uuid,
  p_action_type text,
  p_builder_type text default null,
  p_entity_id text default null,
  p_credits_estimated integer default 0,
  p_idempotency_key text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.usage_events%rowtype;
  v_event_id uuid;
  v_balance integer;
  v_status text := 'pending';
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and not public.has_role((select auth.uid()), 'admin'::public.app_role) then
    raise exception 'usage_mutation_not_allowed';
  end if;

  perform public.ensure_credit_wallet(p_user_id);

  if p_idempotency_key is not null then
    select *
    into v_existing
    from public.usage_events
    where idempotency_key = p_idempotency_key
    limit 1;

    if v_existing.id is not null then
      return jsonb_build_object(
        'allowed', v_existing.status <> 'blocked',
        'duplicate', true,
        'usage_id', v_existing.id,
        'status', v_existing.status,
        'credits_estimated', v_existing.credits_estimated
      );
    end if;
  end if;

  select credits
  into v_balance
  from public.user_credits
  where user_id = p_user_id
  for update;

  if coalesce(v_balance, 0) < greatest(p_credits_estimated, 0) then
    v_status := 'blocked';
  end if;

  insert into public.usage_events (
    user_id,
    action_type,
    builder_type,
    entity_id,
    credits_estimated,
    credits_charged,
    status,
    idempotency_key,
    error_code,
    metadata
  )
  values (
    p_user_id,
    p_action_type,
    p_builder_type,
    p_entity_id,
    greatest(p_credits_estimated, 0),
    0,
    v_status,
    p_idempotency_key,
    case when v_status = 'blocked' then 'credits_insufficient' else null end,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_event_id;

  return jsonb_build_object(
    'allowed', v_status = 'pending',
    'duplicate', false,
    'usage_id', v_event_id,
    'status', v_status,
    'credits_available', coalesce(v_balance, 0),
    'credits_estimated', greatest(p_credits_estimated, 0)
  );
end;
$$;

create or replace function public.complete_usage_event(
  p_usage_id uuid,
  p_status text,
  p_credits_charged integer default null,
  p_error_code text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.usage_events%rowtype;
  v_charged integer;
  v_credit_result jsonb;
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and not public.has_role((select auth.uid()), 'admin'::public.app_role) then
    raise exception 'usage_mutation_not_allowed';
  end if;

  if p_status not in ('succeeded', 'failed', 'cancelled', 'refunded') then
    raise exception 'invalid_usage_status';
  end if;

  select *
  into v_event
  from public.usage_events
  where id = p_usage_id
  for update;

  if v_event.id is null then
    raise exception 'usage_event_not_found';
  end if;

  if v_event.status in ('succeeded', 'failed', 'cancelled', 'refunded') then
    return jsonb_build_object(
      'applied', false,
      'duplicate', true,
      'usage_id', v_event.id,
      'status', v_event.status,
      'credits_charged', v_event.credits_charged
    );
  end if;

  v_charged := coalesce(p_credits_charged, v_event.credits_estimated, 0);

  if p_status = 'succeeded' then
    v_credit_result := public.apply_credit_transaction(
      v_event.user_id,
      -abs(v_charged),
      'usage_event',
      v_event.id::text,
      coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
        'action_type', v_event.action_type,
        'builder_type', v_event.builder_type,
        'related_entity_type', v_event.builder_type,
        'related_entity_id', v_event.entity_id,
        'idempotency_key', v_event.idempotency_key
      ),
      null
    );
  elsif p_status = 'refunded' then
    v_credit_result := public.apply_credit_transaction(
      v_event.user_id,
      abs(v_charged),
      'usage_refund',
      v_event.id::text,
      coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
        'action_type', v_event.action_type,
        'builder_type', v_event.builder_type,
        'reason', 'automatic_refund'
      ),
      null
    );
  else
    v_charged := 0;
  end if;

  update public.usage_events
  set status = p_status,
      credits_charged = case when p_status = 'succeeded' then abs(v_charged) else 0 end,
      error_code = p_error_code,
      metadata = metadata || coalesce(p_metadata, '{}'::jsonb),
      completed_at = now(),
      updated_at = now()
  where id = v_event.id;

  return jsonb_build_object(
    'applied', true,
    'duplicate', false,
    'usage_id', v_event.id,
    'status', p_status,
    'credits_charged', case when p_status = 'succeeded' then abs(v_charged) else 0 end,
    'credit_result', v_credit_result
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
  if not public.has_role((select auth.uid()), 'admin'::public.app_role) then
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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (user_id) do nothing;

  insert into public.user_credits (user_id, credits)
  values (new.id, 5)
  on conflict (user_id) do nothing;

  insert into public.credit_wallets (user_id, balance, monthly_allowance)
  values (new.id, 5, 5)
  on conflict (user_id) do nothing;

  insert into public.user_subscriptions (user_id, plan_key, status)
  values (new.id, 'free', 'free')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

grant execute on function public.ensure_credit_wallet(uuid) to service_role;
grant execute on function public.apply_credit_transaction(uuid, integer, text, text, jsonb, uuid) to authenticated, service_role;
grant execute on function public.start_usage_event(uuid, text, text, text, integer, text, jsonb) to service_role;
grant execute on function public.complete_usage_event(uuid, text, integer, text, jsonb) to service_role;
grant execute on function public.admin_adjust_credits(uuid, integer, text) to authenticated, service_role;
