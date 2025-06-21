import { useState, useEffect } from 'react'
import { supabase } from '../context/AuthContext'

export const useUserConfig = (user) => {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Check and create user config if it doesn't exist
  useEffect(() => {
    if (!user || !user.email_confirmed_at) return

    const initializeUserConfig = async () => {
      setLoading(true)
      setError(null)

      try {
        // First, check if config already exists
        const { data: existingConfig, error: fetchError } = await supabase
          .from('user_config')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
          // PGRST116 means "no rows found" which is expected
          throw fetchError
        }

        if (existingConfig) {
          // Config already exists
          setConfig(existingConfig)
        } else {
          // Create new config
          const newConfig = {
            user_id: user.id,
            use_own_api_key: false,
            default_units: 'imperial',
            default_map_location: 'london',
            data_retention_days: 90,
            email_notifications: true,
            here_api_key_encrypted: null,
            api_key_status: 'none'
          }

          const { data: createdConfig, error: createError } = await supabase
            .from('user_config')
            .insert(newConfig)
            .select()
            .single()

          if (createError) {
            throw createError
          }

          setConfig(createdConfig)
        }
      } catch (err) {
        console.error('Error initializing user config:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    initializeUserConfig()
  }, [user])

  const updateConfig = async (updates) => {
    if (!user || !config) return { success: false, error: 'No user or config found' }

    try {
      const { data, error } = await supabase
        .from('user_config')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      setConfig(data)
      return { success: true, data }
    } catch (err) {
      console.error('Error updating config:', err)
      return { success: false, error: err.message }
    }
  }

  const updateApiKey = async (apiKey, isActive = true) => {
    if (!user || !config) return { success: false, error: 'No user or config found' }

    try {
      const updates = {
        here_api_key_encrypted: apiKey, // In production, this should be encrypted
        api_key_status: apiKey ? 'pending' : 'none',
        use_own_api_key: isActive && !!apiKey,
        last_validated_at: apiKey ? new Date().toISOString() : null
      }

      const { data, error } = await supabase
        .from('user_config')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      setConfig(data)
      return { success: true, data }
    } catch (err) {
      console.error('Error updating API key:', err)
      return { success: false, error: err.message }
    }
  }

  return {
    config,
    loading,
    error,
    updateConfig,
    updateApiKey,
    // Legacy aliases for backward compatibility
    preferences: config,
    updatePreferences: updateConfig
  }
} 