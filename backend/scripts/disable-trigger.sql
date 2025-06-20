-- Simple Fix: Disable the problematic trigger
-- Run this in your Supabase SQL Editor

-- Drop the trigger that's causing user creation failures
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS create_user_preferences();

-- We'll handle user preferences creation in the frontend instead
-- This will allow users to sign up successfully

SELECT 'Trigger disabled successfully!' as status; 