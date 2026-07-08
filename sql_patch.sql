ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS group_id UUID,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + interval '24 hours');

-- Check if pg_cron is enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Add cron job if not exists
SELECT cron.schedule(
    'delete-expired-notifications',
    '0 * * * *',
    $$ DELETE FROM public.notifications WHERE expires_at <= timezone('utc'::text, now()); $$
);
