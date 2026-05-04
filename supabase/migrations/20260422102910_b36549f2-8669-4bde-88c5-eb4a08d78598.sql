-- Lot 2: default credits = 10
ALTER TABLE public.user_credits ALTER COLUMN credits SET DEFAULT 10;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_credits (user_id, credits) VALUES (NEW.id, 10);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$function$;

-- Lot 4: status = draft
UPDATE public.generated_sites SET status = 'draft' WHERE status = 'generated';
ALTER TABLE public.generated_sites ALTER COLUMN status SET DEFAULT 'draft';