# User Config Migration Guide

This guide covers the migration from separate `user_preferences` and `user_api_keys` tables to a single `user_config` table.

## Overview

**Before:** Two separate tables
- `user_preferences` - User settings, units, notifications, etc.
- `user_api_keys` - HERE API key storage with name, validation status, etc.

**After:** Single merged table
- `user_config` - All user configuration in one place, simplified API key storage (one key per user, no name field)

## Migration Steps

### 1. Run the Migration Script

Execute the migration script in your Supabase SQL Editor:

```sql
-- Run: shared/database-migration-user-config.sql
```

This script will:
- Create the new `user_config` table
- Migrate all existing data from both old tables
- Set up RLS policies
- Update the user creation trigger
- Update the `user_dashboard_stats` view

### 2. Verify Migration

After running the migration, verify it worked:

```sql
-- Check record counts
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

-- Sample migrated data
SELECT 
  user_id,
  use_own_api_key,
  default_units,
  api_key_status,
  here_api_key_encrypted IS NOT NULL as has_api_key
FROM user_config
LIMIT 5;
```

### 3. Update Application Code

The following files have been updated to use the new schema:

**Frontend:**
- `frontend/src/hooks/useUserPreferences.js` → Now exports `useUserConfig`
- `frontend/src/pages/Dashboard.jsx` → Uses new hook
- `frontend/src/pages/Settings.jsx` → Integrated API key management
- `shared/supabase-types.ts` → Updated TypeScript types

**Backend:**
- `backend/src/routes/auth.ts` → Uses `user_config` table
- All user creation flows updated

### 4. Test the Application

1. **Test user registration** - New users should get `user_config` records
2. **Test settings page** - Should load existing config and save changes
3. **Test API key management** - Should update the single API key field
4. **Test preferences** - Units, notifications, etc. should work

### 5. Clean Up Old Tables (Optional)

⚠️ **WARNING:** Only do this after thoroughly testing the migration!

```sql
-- Run: shared/cleanup-old-tables.sql
```

This will permanently delete the old `user_preferences` and `user_api_keys` tables.

## Schema Changes

### New user_config Table Structure

```sql
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
```

### Key Changes

1. **Simplified API Key Storage:**
   - Removed `key_name` field (was always "HERE Maps API Key")
   - Removed `is_active` field (now derived from `use_own_api_key`)
   - Renamed `validation_status` to `api_key_status` with 'none' option

2. **Merged Configuration:**
   - All user settings in one table
   - Single query to get all user configuration
   - Easier to maintain and extend

3. **Updated Status Values:**
   - `api_key_status` can be: 'none', 'pending', 'valid', 'invalid', 'expired'
   - 'none' means user has no API key configured

## API Changes

### Frontend Hook Changes

**Before:**
```javascript
const { preferences, updatePreferences } = useUserPreferences(user)
```

**After:**
```javascript
const { config, updateConfig, updateApiKey } = useUserConfig(user)
// Legacy aliases still work:
const { preferences, updatePreferences } = useUserConfig(user)
```

### New API Key Management

```javascript
// Update API key
await updateApiKey('your-api-key', true) // key, isActive

// Remove API key
await updateApiKey(null, false)

// Update preferences
await updateConfig({
  default_units: 'metric',
  email_notifications: false
})
```

## Rollback Plan

If you need to rollback the migration:

1. **Stop the application** to prevent new data
2. **Restore from backup** or recreate old tables
3. **Migrate data back** from `user_config` to the separate tables
4. **Revert code changes** to use old schema

## Benefits of New Schema

1. **Simplified Development:** One table instead of two
2. **Better Performance:** Single query for all user config
3. **Easier Maintenance:** Fewer tables to manage
4. **Cleaner API:** Integrated API key management
5. **Future-Proof:** Easier to add new configuration fields

## Troubleshooting

### Migration Issues

- **Data not migrated:** Check the JOIN conditions in the migration script
- **Missing records:** Verify RLS policies allow access
- **Trigger failures:** Check the new `create_user_config()` function

### Application Issues

- **Settings not loading:** Check hook import and usage
- **API key not saving:** Verify `updateApiKey` function calls
- **TypeScript errors:** Update imports to use new types from `supabase-types.ts` 