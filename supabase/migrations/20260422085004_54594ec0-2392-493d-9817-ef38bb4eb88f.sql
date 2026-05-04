-- Add publication & domain fields to generated_sites
ALTER TABLE public.generated_sites
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS published_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS custom_domain text,
  ADD COLUMN IF NOT EXISTS domain_status text NOT NULL DEFAULT 'none';

-- Unique slug when set
CREATE UNIQUE INDEX IF NOT EXISTS generated_sites_slug_unique
  ON public.generated_sites (slug)
  WHERE slug IS NOT NULL;

-- Constrain domain_status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'generated_sites_domain_status_check'
  ) THEN
    ALTER TABLE public.generated_sites
      ADD CONSTRAINT generated_sites_domain_status_check
      CHECK (domain_status IN ('none','pending','connected','error'));
  END IF;
END$$;

-- Public preview policy: only published sites should be readable by anon
DROP POLICY IF EXISTS "Public can view sites by id" ON public.generated_sites;

CREATE POLICY "Public can view published sites"
ON public.generated_sites
FOR SELECT
TO anon
USING (status = 'published');