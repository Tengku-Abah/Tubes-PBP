-- Add avatar path column to users for Admin display
-- Stores Storage path like 'avatars/<filename>'
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS user_avatar text;

-- Optional: ensure NULL default
ALTER TABLE public.users
ALTER COLUMN user_avatar DROP NOT NULL;