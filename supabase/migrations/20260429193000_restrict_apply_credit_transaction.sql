-- Restrict credit transaction RPC to backend/service role only.
revoke execute on function public.apply_credit_transaction(uuid, integer, text, text, jsonb, uuid) from anon;
revoke execute on function public.apply_credit_transaction(uuid, integer, text, text, jsonb, uuid) from authenticated;

grant execute on function public.apply_credit_transaction(uuid, integer, text, text, jsonb, uuid) to service_role;
