-- Seed script for CallDesk database
-- Run this AFTER the admin user is created in Supabase Auth

-- Set admin user's role to admin
-- (This assumes you created admin@example.com via the Supabase Auth dashboard)
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@example.com';

-- Optional: Create demo data
-- Uncomment these lines to add sample developers and managers

-- Add demo developers
-- INSERT INTO auth.users (id, email, email_confirmed_at, encrypted_password, raw_app_meta_data, raw_user_meta_data, is_super_admin)
-- VALUES
--   (gen_random_uuid(), 'alice@example.com', now(), crypt('password123', gen_salt('bf')), '{"provider":"email","providers":["email"]}', '{"full_name":"Alice Developer","role":"developer"}', false),
--   (gen_random_uuid(), 'bob@example.com', now(), crypt('password123', gen_salt('bf')), '{"provider":"email","providers":["email"]}', '{"full_name":"Bob Developer","role":"developer"}', false);

-- Note: Creating auth users via SQL is complex and requires proper password hashing.
-- It's recommended to create users via the Supabase Auth API or dashboard instead.
-- This seed script mainly ensures the admin role is properly set.
