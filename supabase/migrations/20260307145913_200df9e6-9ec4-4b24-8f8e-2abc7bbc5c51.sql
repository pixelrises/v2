
CREATE TABLE public.edge_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  function_name text NOT NULL DEFAULT 'analyze-url',
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ip_address, function_name)
);

ALTER TABLE public.edge_rate_limits ENABLE ROW LEVEL SECURITY;
