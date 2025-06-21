import fs from 'fs/promises'
import path from 'path'
import { supabaseAdmin } from '../config/supabase'

interface ConfigEntry {
  key: string
  value: string
  description: string
}

export class ConfigService {
  private static instance: ConfigService
  private configCache: Map<string, string> = new Map()
  private initialized = false

  private constructor() {}

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService()
    }
    return ConfigService.instance
  }

  /**
   * Initialize system configuration from default.config file
   * This should be called when the backend starts
   */
  async initializeSystemConfig(): Promise<void> {
    if (this.initialized) {
      console.log('⚙️ System config already initialized')
      return
    }

    console.log('⚙️ Initializing system configuration...')

    try {
      // Read and parse default.config file
      const defaultConfigs = await this.parseDefaultConfig()
      
      if (defaultConfigs.length === 0) {
        console.log('⚠️ No configuration found in default.config file')
        return
      }

      // Initialize database with default configs
      await this.ensureConfigsInDatabase(defaultConfigs)
      
      // Load all configs into cache
      await this.loadConfigCache()
      
      this.initialized = true
      console.log(`✅ System configuration initialized with ${defaultConfigs.length} entries`)
      
    } catch (error) {
      console.error('❌ Failed to initialize system configuration:', error)
      throw error
    }
  }

  /**
   * Parse the default.config file and extract configuration entries
   */
  private async parseDefaultConfig(): Promise<ConfigEntry[]> {
    const configPath = path.join(process.cwd(), 'default.config')
    
    try {
      const content = await fs.readFile(configPath, 'utf-8')
      const configs: ConfigEntry[] = []
      
      const lines = content.split('\n')
      
      for (const line of lines) {
        const trimmedLine = line.trim()
        
        // Skip empty lines and comments
        if (!trimmedLine || trimmedLine.startsWith('#')) {
          continue
        }
        
        // Parse key=value pairs
        const equalIndex = trimmedLine.indexOf('=')
        if (equalIndex === -1) {
          continue
        }
        
        const key = trimmedLine.substring(0, equalIndex).trim()
        const value = trimmedLine.substring(equalIndex + 1).trim()
        
        if (key && value) {
          configs.push({
            key: key.toLowerCase(), // Normalize to lowercase
            value,
            description: this.getConfigDescription(key)
          })
        }
      }
      
      console.log(`📄 Parsed ${configs.length} configuration entries from default.config`)
      return configs
      
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log('⚠️ default.config file not found')
        return []
      }
      throw error
    }
  }

  /**
   * Get human-readable description for configuration keys
   */
  private getConfigDescription(key: string): string {
    const descriptions: Record<string, string> = {
      'here_api_key': 'Built-in HERE Maps API key for shared usage',
      'here_api_daily_limit': 'Daily API call limit for built-in HERE API key',
      'here_api_hourly_limit': 'Hourly API call limit for built-in HERE API key', 
      'here_api_per_user_daily_limit': 'Daily API call limit per user for built-in key',
      'here_initial_bbox': 'Default bounding box for initial map view (London area)',
      'max_data_retention_days': 'Maximum data retention period in days',
      'maintenance_mode': 'Enable/disable maintenance mode',
      'builtin_api_daily_limit': 'Daily API call limit for built-in HERE API key',
      'builtin_api_hourly_limit': 'Hourly API call limit for built-in HERE API key',
      'builtin_api_per_user_daily_limit': 'Daily API call limit per user for built-in key'
    }
    
    return descriptions[key.toLowerCase()] || `Configuration value for ${key}`
  }

  /**
   * Ensure all default configs exist in the database (without overwriting existing ones)
   */
  private async ensureConfigsInDatabase(configs: ConfigEntry[]): Promise<void> {
    for (const config of configs) {
      try {
        // Check if config already exists
        const { data: existing, error: checkError } = await supabaseAdmin
          .from('system_config')
          .select('config_key')
          .eq('config_key', config.key)
          .single()

        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116 means "no rows found" which is expected for new configs
          console.error(`Error checking config ${config.key}:`, checkError)
          continue
        }

        if (existing) {
          console.log(`⏭️ Config '${config.key}' already exists, skipping`)
          continue
        }

        // Insert new config
        const { error: insertError } = await supabaseAdmin
          .from('system_config')
          .insert({
            config_key: config.key,
            config_value: config.value,
            description: config.description
          })

        if (insertError) {
          console.error(`Error inserting config ${config.key}:`, insertError)
        } else {
          console.log(`✅ Added new config: ${config.key} = ${config.value}`)
        }

      } catch (error) {
        console.error(`Error processing config ${config.key}:`, error)
      }
    }
  }

  /**
   * Load all system configurations into memory cache
   */
  private async loadConfigCache(): Promise<void> {
    try {
      const { data: configs, error } = await supabaseAdmin
        .from('system_config')
        .select('config_key, config_value')

      if (error) {
        throw error
      }

      this.configCache.clear()
      configs?.forEach(config => {
        this.configCache.set(config.config_key, config.config_value)
      })

      console.log(`📦 Loaded ${this.configCache.size} configurations into cache`)

    } catch (error) {
      console.error('Error loading config cache:', error)
      throw error
    }
  }

  /**
   * Get a configuration value by key
   */
  async getConfig(key: string): Promise<string | null> {
    if (!this.initialized) {
      await this.initializeSystemConfig()
    }

    return this.configCache.get(key.toLowerCase()) || null
  }

  /**
   * Get a configuration value as a number
   */
  async getConfigNumber(key: string): Promise<number | null> {
    const value = await this.getConfig(key)
    if (value === null) return null
    
    const num = parseInt(value, 10)
    return isNaN(num) ? null : num
  }

  /**
   * Get a configuration value as a boolean
   */
  async getConfigBoolean(key: string): Promise<boolean | null> {
    const value = await this.getConfig(key)
    if (value === null) return null
    
    return value.toLowerCase() === 'true'
  }

  /**
   * Update a configuration value in both database and cache
   */
  async updateConfig(key: string, value: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('system_config')
        .update({ 
          config_value: value,
          updated_at: new Date().toISOString()
        })
        .eq('config_key', key.toLowerCase())

      if (error) {
        throw error
      }

      // Update cache
      this.configCache.set(key.toLowerCase(), value)
      console.log(`✅ Updated config: ${key} = ${value}`)

    } catch (error) {
      console.error(`Error updating config ${key}:`, error)
      throw error
    }
  }

  /**
   * Get all configuration values
   */
  async getAllConfigs(): Promise<Record<string, string>> {
    if (!this.initialized) {
      await this.initializeSystemConfig()
    }

    return Object.fromEntries(this.configCache)
  }

  /**
   * Refresh cache from database
   */
  async refreshCache(): Promise<void> {
    await this.loadConfigCache()
  }

  /**
   * Get HERE API configuration specifically
   */
  async getHereApiConfig() {
    return {
      apiKey: await this.getConfig('here_api_key'),
      dailyLimit: await this.getConfigNumber('here_api_daily_limit'),
      hourlyLimit: await this.getConfigNumber('here_api_hourly_limit'),
      perUserDailyLimit: await this.getConfigNumber('here_api_per_user_daily_limit'),
      initialBbox: await this.getConfig('here_initial_bbox')
    }
  }

  /**
   * Check if system is in maintenance mode
   */
  async isMaintenanceMode(): Promise<boolean> {
    return (await this.getConfigBoolean('maintenance_mode')) || false
  }
}

// Export singleton instance
export const configService = ConfigService.getInstance() 