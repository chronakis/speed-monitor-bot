import { supabase, supabaseAdmin } from '../src/config/supabase';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testSupabaseSetup(): Promise<void> {
  console.log('🧪 Testing Supabase Setup...\n');

  // Test 1: Basic Connection
  console.log('1️⃣ Testing basic connection...');
  try {
    const { error } = await supabase
      .from('system_config')
      .select('config_key')
      .limit(1);
    
    if (error) {
      console.log('❌ Connection failed:', error.message);
      return;
    } else {
      console.log('✅ Basic connection successful');
    }
  } catch (err) {
    console.log('❌ Connection error:', err);
    return;
  }

  // Test 2: Check if all tables exist
  console.log('\n2️⃣ Checking database schema...');
  const expectedTables = [
    'user_preferences',
    'user_api_keys', 
    'api_usage',
    'daily_usage_summary',
    'system_config'
  ];

      for (const table of expectedTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table '${table}' not found or accessible:`, error.message);
      } else {
        console.log(`✅ Table '${table}' exists and accessible`);
      }
    } catch (err) {
      console.log(`❌ Error checking table '${table}':`, err);
    }
  }

  // Test 3: Check system configuration
  console.log('\n3️⃣ Checking system configuration...');
  try {
    const { data, error } = await supabase
      .from('system_config')
      .select('config_key, config_value, description');
    
    if (error) {
      console.log('❌ Failed to read system config:', error.message);
    } else {
      console.log('✅ System configuration found:');
      data?.forEach(config => {
        console.log(`   - ${config.config_key}: ${config.config_value}`);
      });
    }
  } catch (err) {
    console.log('❌ Error reading system config:', err);
  }

  // Test 4: Check views
  console.log('\n4️⃣ Checking database views...');
  const views = ['user_dashboard_stats', 'system_usage_stats'];
  
  for (const view of views) {
    try {
      const { error } = await supabase
        .from(view)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ View '${view}' not accessible:`, error.message);
      } else {
        console.log(`✅ View '${view}' exists and accessible`);
      }
    } catch (err) {
      console.log(`❌ Error checking view '${view}':`, err);
    }
  }

  // Test 5: Test RLS (Row Level Security)
  console.log('\n5️⃣ Testing Row Level Security...');
  try {
    // This should fail because we're not authenticated as a user
    const { error } = await supabase
      .from('user_preferences')
      .select('*');
    
    if (error && error.message.includes('RLS')) {
      console.log('✅ RLS is working (unauthenticated access blocked)');
    } else if (error) {
      console.log('⚠️  RLS test inconclusive:', error.message);
    } else {
      console.log('⚠️  RLS might not be working (got data without auth)');
    }
  } catch (err) {
    console.log('⚠️  RLS test error:', err);
  }

  // Test 6: Test admin access
  console.log('\n6️⃣ Testing admin/service access...');
  try {
    const { data, error } = await supabaseAdmin
      .from('user_preferences')
      .select('count', { count: 'exact' });
    
    if (error) {
      console.log('❌ Admin access failed:', error.message);
    } else {
      console.log('✅ Admin access working (can access user_preferences)');
      console.log(`   Current user_preferences count: ${data.length || 0}`);
    }
  } catch (err) {
    console.log('❌ Admin access error:', err);
  }

  // Test 7: Environment variables
  console.log('\n7️⃣ Checking environment variables...');
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_KEY', 
    'SUPABASE_ANON_KEY',
    'ENCRYPTION_KEY'
  ];

  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
    } else {
      console.log(`❌ ${varName}: Missing!`);
    }
  });

  console.log('\n🎯 Supabase setup test complete!');
}

// Run the test
testSupabaseSetup().catch(console.error); 