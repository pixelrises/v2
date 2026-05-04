ALTER TABLE public.generated_sites
ADD COLUMN IF NOT EXISTS content_json JSONB;

UPDATE public.generated_sites
SET content_json = generated_content
WHERE content_json IS NULL
  AND generated_content IS NOT NULL;
