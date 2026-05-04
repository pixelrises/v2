
-- Add status column to generated_sites
ALTER TABLE public.generated_sites 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'generated';

-- Create delegation_leads table
CREATE TABLE IF NOT EXISTS public.delegation_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  diagnostic_answers jsonb,
  recommendation text,
  status text NOT NULL DEFAULT 'new',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.delegation_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create leads" ON public.delegation_leads;
DROP POLICY IF EXISTS "Users can view own leads" ON public.delegation_leads;
DROP POLICY IF EXISTS "Admin can view all leads" ON public.delegation_leads;
DROP POLICY IF EXISTS "Admin can update all leads" ON public.delegation_leads;
DROP POLICY IF EXISTS "Admin can delete leads" ON public.delegation_leads;
CREATE POLICY "Users can create leads" ON public.delegation_leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own leads" ON public.delegation_leads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all leads" ON public.delegation_leads
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can update all leads" ON public.delegation_leads
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can delete leads" ON public.delegation_leads
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_delegation_leads_updated_at') THEN
    CREATE TRIGGER update_delegation_leads_updated_at
      BEFORE UPDATE ON public.delegation_leads
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;
