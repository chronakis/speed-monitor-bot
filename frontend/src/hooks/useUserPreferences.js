import { useState, useEffect } from 'react'
import { supabase } from '../context/AuthContext'

export const useUserPreferences = (user) => {
  const [preferences, setPreferences] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Check and create user preferences if they don't exist
  useEffect(() => {
    if (!user || !user.email_confirmed_at) return

    const initializeUserPreferences = async () => {
      setLoading(true)
      setError(null)

      try {
        // First, check if preferences already exist
        const { data: existingPrefs, error: fetchError } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
          // PGRST116 means "no rows found" which is expected
          throw fetchError
        }

        if (existingPrefs) {
          // Preferences already exist
          setPreferences(existingPrefs)
        } else {
          // Create new preferences
          const newPreferences = {
            user_id: user.id,
            use_own_api_key: false,
            default_units: 'imperial',
            default_map_location: 'london',
            data_retention_days: 90,
            email_notifications: true
          }

          const { data: createdPrefs, error: createError } = await supabase
            .from('user_preferences')
            .insert(newPreferences)
            .select()
            .single()

          if (createError) {
            throw createError
          }

          setPreferences(createdPrefs)
        }
      } catch (err) {
        console.error('Error initializing user preferences:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    initializeUserPreferences()
  }, [user])

  const updatePreferences = async (updates) => {
    if (!user || !preferences) return { success: false, error: 'No user or preferences found' }

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      setPreferences(data)
      return { success: true, data }
    } catch (err) {
      console.error('Error updating preferences:', err)
      return { success: false, error: err.message }
    }
  }

  return {
    preferences,
    loading,
    error,
    updatePreferences
  }
} 