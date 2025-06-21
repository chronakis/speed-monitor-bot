import { configService } from '../src/services/configService'

async function testConfigService(): Promise<void> {
  console.log('🧪 Testing Configuration Service...\n')

  try {
    // Test 1: Initialize configuration
    console.log('1️⃣ Testing configuration initialization...')
    await configService.initializeSystemConfig()
    console.log('✅ Configuration initialized successfully\n')

    // Test 2: Get all configurations
    console.log('2️⃣ Testing get all configurations...')
    const allConfigs = await configService.getAllConfigs()
    console.log('✅ Retrieved all configurations:')
    Object.entries(allConfigs).forEach(([key, value]) => {
      // Mask sensitive values
      const displayValue = key.includes('api_key') ? '***MASKED***' : value
      console.log(`   - ${key}: ${displayValue}`)
    })
    console.log('')

    // Test 3: Get specific configuration values
    console.log('3️⃣ Testing get specific configuration values...')
    
    const hereApiKey = await configService.getConfig('here_api_key')
    console.log(`✅ HERE API Key: ${hereApiKey ? '***CONFIGURED***' : 'NOT SET'}`)
    
    const dailyLimit = await configService.getConfigNumber('here_api_daily_limit')
    console.log(`✅ Daily Limit: ${dailyLimit}`)
    
    const maintenanceMode = await configService.getConfigBoolean('maintenance_mode')
    console.log(`✅ Maintenance Mode: ${maintenanceMode}`)
    console.log('')

    // Test 4: Get HERE API configuration
    console.log('4️⃣ Testing HERE API configuration...')
    const hereConfig = await configService.getHereApiConfig()
    console.log('✅ HERE API Configuration:')
    console.log(`   - API Key: ${hereConfig.apiKey ? '***CONFIGURED***' : 'NOT SET'}`)
    console.log(`   - Daily Limit: ${hereConfig.dailyLimit}`)
    console.log(`   - Hourly Limit: ${hereConfig.hourlyLimit}`)
    console.log(`   - Per User Daily Limit: ${hereConfig.perUserDailyLimit}`)
    console.log(`   - Initial BBox: ${hereConfig.initialBbox}`)
    console.log('')

    // Test 5: Test maintenance mode check
    console.log('5️⃣ Testing maintenance mode check...')
    const isMaintenanceMode = await configService.isMaintenanceMode()
    console.log(`✅ System maintenance mode: ${isMaintenanceMode}`)
    console.log('')

    // Test 6: Test configuration update (if not in production)
    if (process.env.NODE_ENV !== 'production') {
      console.log('6️⃣ Testing configuration update...')
      
      // Update a test config
      await configService.updateConfig('test_config', 'test_value')
      const testValue = await configService.getConfig('test_config')
      console.log(`✅ Updated test config: ${testValue}`)
      
      // Clean up test config
      await configService.updateConfig('test_config', '')
      console.log('✅ Cleaned up test configuration')
      console.log('')
    }

    // Test 7: Test cache refresh
    console.log('7️⃣ Testing cache refresh...')
    await configService.refreshCache()
    console.log('✅ Configuration cache refreshed successfully')
    console.log('')

    console.log('🎉 All configuration tests passed!')

  } catch (error) {
    console.error('❌ Configuration test failed:', error)
    process.exit(1)
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testConfigService()
    .then(() => {
      console.log('\n✅ Configuration service test completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Configuration service test failed:', error)
      process.exit(1)
    })
}

export { testConfigService } 