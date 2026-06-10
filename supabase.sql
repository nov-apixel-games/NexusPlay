-- Admin helper function
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = user_id AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Create site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    platform_name TEXT DEFAULT 'NexusPlay',
    logo_url TEXT DEFAULT 'https://res.cloudinary.com/dpp9889/image/upload/v1/logos/nexus_logo.png',
    slogan TEXT,
    maintenance_mode BOOLEAN DEFAULT false,
    registrations_enabled BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;
CREATE POLICY "Anyone can read site settings" ON public.site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
CREATE POLICY "Admins can update site settings" ON public.site_settings FOR UPDATE USING (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins can insert site settings" ON public.site_settings;
CREATE POLICY "Admins can insert site settings" ON public.site_settings FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- Create settings table for general key-value pairs
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read settings" ON public.settings;
CREATE POLICY "Anyone can read settings" ON public.settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can update settings" ON public.settings;
CREATE POLICY "Admins can update settings" ON public.settings FOR UPDATE USING (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins can insert settings" ON public.settings;
CREATE POLICY "Admins can insert settings" ON public.settings FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- Insert initial site_settings
INSERT INTO public.site_settings (id, platform_name, logo_url, maintenance_mode, registrations_enabled) 
VALUES (1, 'NexusPlay', 'https://res.cloudinary.com/dpp9889/image/upload/v1/logos/nexus_logo.png', false, true)
ON CONFLICT (id) DO NOTHING;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    real_name TEXT,
    display_name TEXT,
    bio TEXT,
    language TEXT,
    country TEXT,
    email TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'developer', 'admin')),
    xp INTEGER DEFAULT 0,
    favorites_count INTEGER DEFAULT 0,
    completed_quests INTEGER DEFAULT 0,
    published_games INTEGER DEFAULT 0,
    followers INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create apps table
CREATE TABLE IF NOT EXISTS public.apps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_name TEXT NOT NULL,
    company_name TEXT,
    description TEXT,
    developer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    icon_url TEXT,
    icon_public_id TEXT,
    screenshots TEXT[],
    screenshots_public_ids TEXT[],
    download_url TEXT,
    size TEXT,
    version TEXT,
    category TEXT,
    price TEXT DEFAULT 'Gratis',
    rating NUMERIC DEFAULT 5.0,
    downloads TEXT DEFAULT '0',
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    favorites_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'published' CHECK (status IN ('pending', 'published', 'rejected')),
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create dev_requests table
CREATE TABLE IF NOT EXISTS public.dev_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    company TEXT,
    experience TEXT,
    portfolio_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dev_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.apps 
ADD COLUMN IF NOT EXISTS version_code TEXT,
ADD COLUMN IF NOT EXISTS changelog TEXT,
ADD COLUMN IF NOT EXISTS previous_versions JSONB DEFAULT '[]'::jsonb;

-- Set up RLS Policies

-- PROFILES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- APPS
DROP POLICY IF EXISTS "Published apps are viewable by everyone." ON public.apps;
CREATE POLICY "Published apps are viewable by everyone." 
ON public.apps FOR SELECT USING (status = 'published' OR auth.uid() = developer_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Developers can insert their own apps." ON public.apps;
CREATE POLICY "Developers can insert their own apps." 
ON public.apps FOR INSERT WITH CHECK (auth.uid() = developer_id);

DROP POLICY IF EXISTS "Developers can update own apps." ON public.apps;
CREATE POLICY "Developers can update own apps." 
ON public.apps FOR UPDATE USING (auth.uid() = developer_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins or developers can delete apps." ON public.apps;
CREATE POLICY "Admins or developers can delete apps." 
ON public.apps FOR DELETE USING (auth.uid() = developer_id OR public.is_admin(auth.uid()));

-- DEV REQUESTS
DROP POLICY IF EXISTS "Users can view own dev requests." ON public.dev_requests;
CREATE POLICY "Users can view own dev requests." 
ON public.dev_requests FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can insert own dev requests." ON public.dev_requests;
CREATE POLICY "Users can insert own dev requests." 
ON public.dev_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can view own notifications." ON public.notifications;
CREATE POLICY "Users can view own notifications." 
ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications." ON public.notifications;
CREATE POLICY "Users can update own notifications." 
ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- To allow our auth to insert a new profile when user signs up de forma 100% segura
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
DECLARE
  base_username TEXT;
  new_username TEXT;
  email_name TEXT;
  meta_username TEXT;
  meta_real_name TEXT;
  meta_avatar TEXT;
  is_unique BOOLEAN := false;
  loop_counter INTEGER := 0;
BEGIN
  -- Extraer valores de metadata en forma segura
  IF new.raw_user_meta_data IS NOT NULL THEN
    meta_username := COALESCE(
      new.raw_user_meta_data->>'username', 
      new.raw_user_meta_data->>'preferred_username'
    );
    meta_real_name := COALESCE(
      new.raw_user_meta_data->>'real_name', 
      new.raw_user_meta_data->>'full_name', 
      new.raw_user_meta_data->>'name'
    );
    meta_avatar := COALESCE(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'avatar',
      new.raw_user_meta_data->>'picture'
    );
  END IF;

  -- Separar parte del correo
  IF new.email IS NOT NULL THEN
    email_name := split_part(new.email, '@', 1);
  ELSE
    email_name := 'user';
  END IF;

  -- 1. Determinar el nombre base
  base_username := COALESCE(meta_username, email_name, 'user');
  
  -- 2. Limpiar caracteres especiales para evitar errores de sintaxis o formato
  base_username := regexp_replace(lower(base_username), '[^a-z0-9_]', '', 'g');
  
  -- 3. Si quedó vacío o muy corto
  IF base_username IS NULL OR length(base_username) < 3 THEN
    base_username := 'user_' || COALESCE(base_username, '');
  END IF;

  -- 4. Truncar longitud si es extremadamente largo
  IF length(base_username) > 20 THEN
    base_username := substr(base_username, 1, 20);
  END IF;

  -- 5. Ciclo de reintentos para asegurar que el Username sea único en la tabla profiles
  WHILE NOT is_unique AND loop_counter < 10 LOOP
    IF loop_counter = 0 THEN
      new_username := base_username || '_' || substr(md5(random()::text), 1, 4);
    ELSE
      new_username := base_username || '_' || substr(md5(random()::text), 1, 6);
    END IF;

    SELECT NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE username = new_username
    ) INTO is_unique;

    loop_counter := loop_counter + 1;
  END LOOP;

  -- Fallback de seguridad extrema
  IF NOT is_unique THEN
    new_username := 'user_' || substr(md5(new.id::text || random()::text), 1, 10);
  END IF;

  -- 6. Insertar el perfil capturando cualquier posible excepción interna
  BEGIN
    INSERT INTO public.profiles (id, username, real_name, email, role, avatar_url)
    VALUES (
      new.id, 
      new_username, 
      COALESCE(meta_real_name, ''), 
      COALESCE(new.email, 'no-email@nexusplay.app'), 
      'user',
      COALESCE(meta_avatar, '')
    );
  EXCEPTION WHEN OTHERS THEN
    -- Ante cualquier fallo, se registra en el log del servidor pero JAMÁS detiene la transacción de auth
    -- Esto garantiza al 100% que el flujo de registro en Supabase Auth continúe con éxito
    RAISE LOG 'Error saving profile %: %', new.id, SQLERRM;
  END;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger execution
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID REFERENCES public.apps(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Reviews RLS Policies
DROP POLICY IF EXISTS "Reviews are viewable by everyone." ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone." 
ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own reviews." ON public.reviews;
CREATE POLICY "Users can insert their own reviews." 
ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews." ON public.reviews;
CREATE POLICY "Users can update their own reviews." 
ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews." ON public.reviews;
CREATE POLICY "Users can delete their own reviews." 
ON public.reviews FOR DELETE USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Permitir a los usuarios actualizar los votos útiles
DROP POLICY IF EXISTS "Users can update helpful_count." ON public.reviews;
CREATE POLICY "Users can update helpful_count." 
ON public.reviews FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ==========================================
-- NEXUS HUB TABLES (Social Features)
-- ==========================================

DROP TABLE IF EXISTS public.community_messages CASCADE;
DROP TABLE IF EXISTS public.communities CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.message_reactions CASCADE;
DROP TABLE IF EXISTS public.community_members CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;

-- 1. Create communities table
CREATE TABLE IF NOT EXISTS public.communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT,
    image_url TEXT,
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create community_members table
CREATE TABLE IF NOT EXISTS public.community_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(community_id, user_id)
);

-- 3. Create community messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT,
    is_pinned BOOLEAN DEFAULT false,
    deleted BOOLEAN DEFAULT false,
    deleted_by_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reaction TEXT NOT NULL,
    UNIQUE(message_id, user_id, reaction)
);

-- 5. Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- POLICIES
-- ==========================================

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can read communities" ON public.communities;
CREATE POLICY "Authenticated users can read communities" ON public.communities FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Authenticated users can insert communities" ON public.communities;
CREATE POLICY "Authenticated users can insert communities" ON public.communities FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Creator or admin can update" ON public.communities;
CREATE POLICY "Creator or admin can update" ON public.communities FOR UPDATE USING (auth.uid() = creator_id OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Creator or admin can delete" ON public.communities;
CREATE POLICY "Creator or admin can delete" ON public.communities FOR DELETE USING (auth.uid() = creator_id OR public.is_admin(auth.uid()));


ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can read members" ON public.community_members;
CREATE POLICY "Members can read members" ON public.community_members FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Users can join" ON public.community_members;
CREATE POLICY "Users can join" ON public.community_members FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can leave" ON public.community_members;
CREATE POLICY "Users can leave" ON public.community_members FOR DELETE USING (auth.uid() = user_id OR public.is_admin(auth.uid()));


ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Community members can read messages" ON public.messages;
CREATE POLICY "Community members can read messages" ON public.messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Members can insert messages" ON public.messages;
CREATE POLICY "Members can insert messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Author or admin can delete messages" ON public.messages;
CREATE POLICY "Author or admin can delete messages" ON public.messages FOR DELETE USING (
  auth.uid() = user_id 
  OR public.is_admin(auth.uid()) 
  OR EXISTS(SELECT 1 FROM public.communities WHERE id = messages.community_id AND creator_id = auth.uid())
);

DROP POLICY IF EXISTS "Author or admin can update messages" ON public.messages;
CREATE POLICY "Author or admin can update messages" ON public.messages FOR UPDATE USING (
  auth.uid() = user_id 
  OR public.is_admin(auth.uid())
  OR EXISTS(SELECT 1 FROM public.communities WHERE id = messages.community_id AND creator_id = auth.uid())
);


ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read reactions" ON public.message_reactions;
CREATE POLICY "Anyone can read reactions" ON public.message_reactions FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Users can insert own reactions" ON public.message_reactions;
CREATE POLICY "Users can insert own reactions" ON public.message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own reactions" ON public.message_reactions;
CREATE POLICY "Users can delete own reactions" ON public.message_reactions FOR DELETE USING (auth.uid() = user_id OR public.is_admin(auth.uid()));


ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read reports" ON public.reports;
CREATE POLICY "Admins can read reports" ON public.reports FOR SELECT USING (public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- ==========================================
-- FAVORITES
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    app_id UUID REFERENCES public.apps(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, app_id)
);

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public favorites viewable by all." ON public.user_favorites;
CREATE POLICY "Public favorites viewable by all." ON public.user_favorites FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage own favorites." ON public.user_favorites;
CREATE POLICY "Users can manage own favorites." ON public.user_favorites FOR ALL USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_favorites_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.apps SET favorites_count = favorites_count + 1 WHERE id = NEW.app_id;
    UPDATE public.profiles SET favorites_count = favorites_count + 1 WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.apps SET favorites_count = favorites_count - 1 WHERE id = OLD.app_id;
    UPDATE public.profiles SET favorites_count = favorites_count - 1 WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_favorite_change ON public.user_favorites;
CREATE TRIGGER on_favorite_change
  AFTER INSERT OR DELETE ON public.user_favorites
  FOR EACH ROW EXECUTE PROCEDURE public.update_favorites_count();

-- ==========================================
-- STUDIO ASSETS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.studio_assets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    type TEXT,
    modelUrl TEXT,
    thumbnail TEXT,
    polyCount INTEGER DEFAULT 0,
    fileSize TEXT,
    optimizedForMobile BOOLEAN DEFAULT true,
    assetType TEXT,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.studio_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read their own studio assets" ON public.studio_assets;
CREATE POLICY "Users can read their own studio assets" ON public.studio_assets FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own studio assets" ON public.studio_assets;
CREATE POLICY "Users can insert their own studio assets" ON public.studio_assets FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own studio assets" ON public.studio_assets;
CREATE POLICY "Users can delete their own studio assets" ON public.studio_assets FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- ACCOUNT DELETION RPC
-- ==========================================
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
