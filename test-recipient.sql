-- Test script to demonstrate recipient functionality
-- Run this in your Supabase SQL Editor

-- First, let's create a test user in auth.users
-- Note: This requires admin privileges, so you might need to do this through the Supabase dashboard

-- Insert a test user (you'll need to do this through Supabase dashboard or with admin API)
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
-- VALUES (
--   gen_random_uuid(),
--   'test@example.com',
--   crypt('testpassword', gen_salt('bf')),
--   now(),
--   now(),
--   now(),
--   '{"full_name": "Test User", "name": "Test User"}'::jsonb
-- );

-- Alternative: Update the database function to handle the current situation better
-- Let's update one of the existing used codes to have a dummy user ID for testing

-- First, let's see what users exist in auth.users
SELECT id, email, raw_user_meta_data FROM auth.users LIMIT 5;

-- If there are users, we can update one of the used codes to reference them
-- UPDATE invite_codes 
-- SET used_by = (SELECT id FROM auth.users LIMIT 1)
-- WHERE code = 'NAHDYEP' AND used_by IS NULL;

-- If no users exist, let's create a simple test by updating the function to show mock data
-- This is just for demonstration purposes
