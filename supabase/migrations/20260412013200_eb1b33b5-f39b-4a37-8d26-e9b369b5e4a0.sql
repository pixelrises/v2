
-- Fix overly permissive INSERT policy on delegation_leads
DROP POLICY IF EXISTS "Users can create leads" ON public.delegation_leads;
CREATE POLICY "Users can create leads" ON public.delegation_leads
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Also allow anonymous lead creation (for non-logged-in users filling diagnostic)
CREATE POLICY "Anonymous can create leads" ON public.delegation_leads
  FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);
