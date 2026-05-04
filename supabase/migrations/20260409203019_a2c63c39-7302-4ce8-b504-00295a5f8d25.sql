
-- Create app_role enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typnamespace = 'public'::regnamespace
      AND typname = 'app_role'
  ) THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END$$;

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User credits table
CREATE TABLE IF NOT EXISTS public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  credits INTEGER NOT NULL DEFAULT 3,
  total_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Generated sites table
CREATE TABLE IF NOT EXISTS public.generated_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_type TEXT,
  city TEXT,
  services TEXT,
  style TEXT,
  colors TEXT,
  objective TEXT,
  cta TEXT,
  description TEXT,
  generated_content JSONB,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.generated_sites ENABLE ROW LEVEL SECURITY;

-- User roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text = _role::text
  )
$$;

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_credits_updated_at') THEN
    CREATE TRIGGER update_user_credits_updated_at BEFORE UPDATE ON public.user_credits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_generated_sites_updated_at') THEN
    CREATE TRIGGER update_generated_sites_updated_at BEFORE UPDATE ON public.generated_sites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

-- Auto-create profile and credits on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.user_credits (user_id, credits) VALUES (NEW.id, 3)
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END$$;

-- RLS Policies: Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies: Credits
DROP POLICY IF EXISTS "Users can view own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Admin can view all credits" ON public.user_credits;
DROP POLICY IF EXISTS "Admin can update all credits" ON public.user_credits;
CREATE POLICY "Users can view own credits" ON public.user_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all credits" ON public.user_credits FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update all credits" ON public.user_credits FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies: Generated Sites
DROP POLICY IF EXISTS "Users can view own sites" ON public.generated_sites;
DROP POLICY IF EXISTS "Users can create own sites" ON public.generated_sites;
DROP POLICY IF EXISTS "Users can update own sites" ON public.generated_sites;
DROP POLICY IF EXISTS "Users can delete own sites" ON public.generated_sites;
DROP POLICY IF EXISTS "Admin can view all sites" ON public.generated_sites;
DROP POLICY IF EXISTS "Admin can update all sites" ON public.generated_sites;
DROP POLICY IF EXISTS "Admin can delete all sites" ON public.generated_sites;
CREATE POLICY "Users can view own sites" ON public.generated_sites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own sites" ON public.generated_sites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sites" ON public.generated_sites FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sites" ON public.generated_sites FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all sites" ON public.generated_sites FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update all sites" ON public.generated_sites FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete all sites" ON public.generated_sites FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies: Roles
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can manage roles" ON public.user_roles;
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
