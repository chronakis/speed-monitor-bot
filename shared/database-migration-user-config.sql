-- Migration: Merge user_preferences and user_api_keys into user_config
-- Run this in Supabase SQL Editor

-- ============================================================================
-- STEP 1: Create new user_config table
-- ============================================================================
CREATE TABLE user_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- User Preferences (from user_preferences table)
  use_own_api_key BOOLEAN DEFAULT FALSE,
  default_units TEXT DEFAULT 'imperial' CHECK (default_units IN ('metric', 'imperial')),
  default_map_location TEXT DEFAULT 'london',
  data_retention_days INTEGER DEFAULT 90,
  email_notifications BOOLEAN DEFAULT TRUE,
  
  -- API Key Configuration (from user_api_keys table, simplified)
  here_api_key_encrypted TEXT, -- Will store encrypted key
  api_key_status TEXT DEFAULT 'none' CHECK (api_key_status IN ('none', 'pending', 'valid', 'invalid', 'expired')),
  last_validated_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Ensure one record per user
  UNIQUE(user_id)
);

-- ============================================================================
-- STEP 2: Migrate existing data
-- ============================================================================

-- Migrate data from user_preferences and user_api_keys
INSERT INTO user_config (
  user_id,
  use_own_api_key,
  default_units,
  default_map_location,
  data_retention_days,
  email_notifications,
  here_api_key_encrypted,
  api_key_status,
  last_validated_at,
  created_at,
  updated_at
)
SELECT 
  up.user_id,
  up.use_own_api_key,
  up.default_units,
  up.default_map_location,
  up.data_retention_days,
  up.email_notifications,
  uak.here_api_key_encrypted,
  CASE 
    WHEN uak.here_api_key_encrypted IS NOT NULL THEN uak.validation_status
    ELSE 'none'
  END as api_key_status,
  uak.last_validated_at,
  up.created_at,
  GREATEST(up.updated_at, COALESCE(uak.updated_at, up.updated_at)) as updated_at
FROM user_preferences up
LEFT JOIN user_api_keys uak ON up.user_id = uak.user_id;

-- ============================================================================
-- STEP 3: Set up RLS policies for user_config
-- ============================================================================

-- Enable RLS
ALTER TABLE user_config ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own config" ON user_config
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own config" ON user_config
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own config" ON user_config
  FOR UPDATE USING (auth.uid() = user_id);

-- System policy for trigger functions
CREATE POLICY "System can create user config" ON user_config
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- STEP 4: Create updated_at trigger for user_config
-- ============================================================================

CREATE TRIGGER update_user_config_updated_at 
  BEFORE UPDATE ON user_config 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 5: Update the user creation trigger function
-- ============================================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS create_user_preferences();

-- Create new function for user_config
CREATE OR REPLACE FUNCTION create_user_config()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user config with default values
  INSERT INTO user_config (
    user_id,
    use_own_api_key,
    default_units,
    default_map_location,
    data_retention_days,
    email_notifications,
    api_key_status,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    FALSE,
    'imperial',
    'london',
    90,
    TRUE,
    'none',
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating user config for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_config();

-- ============================================================================
-- STEP 6: Update views to use new table
-- ============================================================================

-- Drop existing view
DROP VIEW IF EXISTS user_dashboard_stats;

-- Create updated view using user_config
CREATE VIEW user_dashboard_stats AS
SELECT 
  u.id as user_id,
  u.email,
  uc.use_own_api_key,
  uc.default_units,
  uc.api_key_status,
  COALESCE(SUM(dus.total_calls), 0) as total_api_calls,
  COALESCE(SUM(dus.total_calls) FILTER (WHERE dus.date_key >= CURRENT_DATE - INTERVAL '30 days'), 0) as calls_last_30_days,
  COALESCE(SUM(dus.total_calls) FILTER (WHERE dus.date_key = CURRENT_DATE), 0) as calls_today,
  MAX(dus.date_key) as last_api_call_date
FROM auth.users u
LEFT JOIN user_config uc ON u.id = uc.user_id
LEFT JOIN daily_usage_summary dus ON u.id = dus.user_id
GROUP BY u.id, u.email, uc.use_own_api_key, uc.default_units, uc.api_key_status;

-- ============================================================================
-- STEP 7: Verify migration
-- ============================================================================

-- Check that data was migrated correctly
SELECT 
  'user_config' as table_name,
  COUNT(*) as record_count
FROM user_config
UNION ALL
SELECT 
  'user_preferences' as table_name,
  COUNT(*) as record_count
FROM user_preferences
UNION ALL
SELECT 
  'user_api_keys' as table_name,
  COUNT(*) as record_count
FROM user_api_keys;

-- Show sample of migrated data
SELECT 
  user_id,
  use_own_api_key,
  default_units,
  api_key_status,
  here_api_key_encrypted IS NOT NULL as has_api_key
FROM user_config
LIMIT 5;

-- ============================================================================
-- STEP 8: Clean up old tables (UNCOMMENT AFTER VERIFYING MIGRATION)
-- ============================================================================

-- WARNING: Only run this after verifying the migration worked correctly!
-- 
-- -- Drop old triggers first
-- DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
-- DROP TRIGGER IF EXISTS update_user_api_keys_updated_at ON user_api_keys;
-- 
-- -- Drop old tables
-- DROP TABLE IF EXISTS user_api_keys CASCADE;
-- DROP TABLE IF EXISTS user_preferences CASCADE;
-- 
-- SELECT 'Migration completed successfully!' as status; 