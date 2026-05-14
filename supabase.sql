-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    real_name TEXT,
    email TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'developer', 'admin')),
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

-- Set up RLS Policies

-- PROFILES
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- APPS
CREATE POLICY "Published apps are viewable by everyone." 
ON public.apps FOR SELECT USING (status = 'published' OR auth.uid() = developer_id);

CREATE POLICY "Developers can insert their own apps." 
ON public.apps FOR INSERT WITH CHECK (auth.uid() = developer_id);

CREATE POLICY "Developers can update own apps." 
ON public.apps FOR UPDATE USING (auth.uid() = developer_id);

-- DEV REQUESTS
CREATE POLICY "Users can view own dev requests." 
ON public.dev_requests FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dev requests." 
ON public.dev_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications." 
ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications." 
ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- To allow our auth to insert a new profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, real_name, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'real_name', new.email, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile automatically (optional, depends on how your app inserts it, we handle it on frontend but good practice)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
