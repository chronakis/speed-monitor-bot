-- Fix RLS Policies and User Creation Trigger
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- First, let's check and fix the RLS policies
-- ============================================================================

-- Enable RLS on all tables (make sure they're enabled)
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate them properly)
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
DROP POLICY IF EXISTS "System can create user preferences" ON user_preferences;

-- Recreate user_preferences policies
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- IMPORTANT: Add a policy to allow the trigger function to create preferences
CREATE POLICY "System can create user preferences" ON user_preferences
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- Fix the user creation trigger function
-- ============================================================================

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS create_user_preferences();

-- Create a better trigger function that handles all required fields
CREATE OR REPLACE FUNCTION create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user preferences with all required fields
  INSERT INTO user_preferences (
    user_id,
    use_own_api_key,
    default_units,
    default_map_location,
    data_retention_days,
    email_notifications,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    FALSE,
    'imperial',
    'london',
    90,
    TRUE,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating user preferences for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_preferences();

-- ============================================================================
-- Test the fix
-- ============================================================================

-- Check if RLS is working properly now
SELECT 
  schemaname,
  tablename, 
  rowsecurity,
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count
FROM pg_tables t 
WHERE schemaname = 'public' 
  AND tablename IN ('user_preferences', 'user_api_keys', 'api_usage', 'daily_usage_summary', 'system_config');

-- Show current user_preferences count
SELECT COUNT(*) as user_preferences_count FROM user_preferences; 