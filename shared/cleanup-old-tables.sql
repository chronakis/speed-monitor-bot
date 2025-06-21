-- Cleanup script: Remove old user_preferences and user_api_keys tables
-- WARNING: Only run this AFTER verifying the migration to user_config worked correctly!

-- ============================================================================
-- STEP 1: Verify migration worked correctly
-- ============================================================================

-- Check record counts match
SELECT 
  'Verification Check' as step,
  (SELECT COUNT(*) FROM user_config) as user_config_count,
  (SELECT COUNT(*) FROM user_preferences) as user_preferences_count,
  (SELECT COUNT(*) FROM user_api_keys) as user_api_keys_count;

-- Show sample data comparison
SELECT 'Sample user_config data:' as info;
SELECT user_id, use_own_api_key, default_units, api_key_status 
FROM user_config 
LIMIT 3;

-- ============================================================================
-- STEP 2: Drop old triggers and functions
-- ============================================================================

-- Drop old triggers
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
DROP TRIGGER IF EXISTS update_user_api_keys_updated_at ON user_api_keys;

-- ============================================================================
-- STEP 3: Drop old tables
-- ============================================================================

-- Drop old tables (this will also cascade and remove related policies)
DROP TABLE IF EXISTS user_api_keys CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;

-- ============================================================================
-- STEP 4: Verification
-- ============================================================================

-- Verify tables are gone
SELECT 
  schemaname,
  tablename
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user_preferences', 'user_api_keys', 'user_config')
ORDER BY tablename;

-- Verify user_config is working
SELECT 'Final verification:' as info;
SELECT COUNT(*) as user_config_final_count FROM user_config;

SELECT 'Cleanup completed successfully!' as status; 