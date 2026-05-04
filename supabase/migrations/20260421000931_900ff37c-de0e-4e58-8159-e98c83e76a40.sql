CREATE TABLE IF NOT EXISTS public.stripe_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  payload jsonb
);

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view stripe events" ON public.stripe_events;
CREATE POLICY "Admin can view stripe events"
ON public.stripe_events
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
