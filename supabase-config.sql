-- 1. Create the bucket (requires admin privileges, or can be done from the UI)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('studio-assets', 'studio-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Note: RLS on storage.objects is enabled by default in Supabase.
-- We removed ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; to avoid the "must be owner of table objects" error.

-- Clean up any existing policies with the same names to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own assets" ON storage.objects;

-- 3. Policy: Allow all users to view assets since it's a public bucket
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'studio-assets' );

-- 4. Policy: Allow authenticated users to upload their own assets
CREATE POLICY "Users can upload their own assets" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'studio-assets' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Policy: Allow users to update their own assets
CREATE POLICY "Users can update their own assets" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'studio-assets' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. Policy: Allow users to delete their own assets
CREATE POLICY "Users can delete their own assets" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'studio-assets' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Table Policies for studio_assets
ALTER TABLE public.studio_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own studio_assets" ON public.studio_assets;
DROP POLICY IF EXISTS "Users can insert their own studio_assets" ON public.studio_assets;
DROP POLICY IF EXISTS "Users can update their own studio_assets" ON public.studio_assets;
DROP POLICY IF EXISTS "Users can delete their own studio_assets" ON public.studio_assets;

CREATE POLICY "Users can view their own studio_assets" 
ON public.studio_assets FOR SELECT 
USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert their own studio_assets" 
ON public.studio_assets FOR INSERT 
WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update their own studio_assets" 
ON public.studio_assets FOR UPDATE 
USING ( auth.uid() = user_id );

CREATE POLICY "Users can delete their own studio_assets" 
ON public.studio_assets FOR DELETE 
USING ( auth.uid() = user_id );
