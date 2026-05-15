-- Phase live setup hardening.
-- Sensitive billing, credit, usage and Stripe tables must not be queryable by anon.
-- Authenticated users keep read access through RLS policies; service_role keeps server mutations.

revoke all on public.user_subscriptions from anon;
revoke all on public.credit_wallets from anon;
revoke all on public.credit_transactions from anon;
revoke all on public.usage_events from anon;
revoke all on public.stripe_events from anon;
revoke all on public.quota_events from anon;

grant select on public.billing_plans to anon, authenticated;
grant select on public.plan_limits to anon, authenticated;

grant select on public.user_subscriptions to authenticated;
grant select on public.credit_wallets to authenticated;
grant select on public.credit_transactions to authenticated;
grant select on public.usage_events to authenticated;
grant select on public.stripe_events to authenticated;
grant select on public.quota_events to authenticated;

grant all on public.user_subscriptions to service_role;
grant all on public.credit_wallets to service_role;
grant all on public.credit_transactions to service_role;
grant all on public.usage_events to service_role;
grant all on public.stripe_events to service_role;
grant all on public.quota_events to service_role;

select pg_notify('pgrst', 'reload schema');
