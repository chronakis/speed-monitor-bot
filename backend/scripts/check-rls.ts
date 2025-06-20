import { supabasePublic } from '../src/config/supabase';

async function checkRLS() {
  console.log('🔒 Testing Row Level Security...\n');

  // Test with anon client (should be blocked)
  console.log('Testing with anonymous client...');
  try {
    const { data, error } = await supabasePublic
      .from('user_preferences')
      .select('*');
    
    if (error) {
      console.log('✅ RLS is working - anonymous access blocked:', error.message);
    } else {
      console.log('⚠️  RLS issue - got data without authentication:', data?.length || 0, 'records');
      console.log('This means RLS policies might not be properly enabled.');
    }
  } catch (err) {
    console.log('❌ Error testing RLS:', err);
  }

  // Check if RLS is enabled on tables
  console.log('\n📋 You can check RLS status in Supabase dashboard:');
  console.log('1. Go to Database → Tables');
  console.log('2. Click on each table');  
  console.log('3. Check if "Enable Row Level Security" is toggled ON');
  console.log('4. Ensure policies are created for each table');
}

checkRLS().catch(console.error); 