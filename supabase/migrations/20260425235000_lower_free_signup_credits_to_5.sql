-- Ajuster l'offre d'inscription gratuite à 5 crédits
ALTER TABLE public.user_credits ALTER COLUMN credits SET DEFAULT 5;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));

  INSERT INTO public.user_credits (user_id, credits)
  VALUES (NEW.id, 5);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$function$;

-- Réaligner uniquement les comptes jamais utilisés qui étaient restés à 10 crédits
UPDATE public.user_credits
SET credits = 5,
    updated_at = now()
WHERE credits = 10
  AND total_used = 0;
