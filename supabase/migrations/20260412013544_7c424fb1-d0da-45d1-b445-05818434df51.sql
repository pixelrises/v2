
DROP POLICY IF EXISTS "Public can view sites by id" ON public.generated_sites;
CREATE POLICY "Public can view sites by id" ON public.generated_sites
  FOR SELECT TO anon
  USING (true);
