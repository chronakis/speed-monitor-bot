import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client for frontend
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)

  // Set up auth state listener (exactly like the docs)
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Simple sign up with email/password (direct Supabase)
  const signUpWithEmail = async (email, password, fullName = '') => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        throw error
      }

      return {
        success: true,
        message: 'Check your email for the confirmation link!',
        user: data.user
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Signup failed'
      }
    } finally {
      setLoading(false)
    }
  }

  // Simple sign in with email/password (direct Supabase)
  const signInWithEmail = async (email, password) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        throw error
      }

      return {
        success: true,
        message: 'Login successful',
        user: data.user,
        session: data.session
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Login failed'
      }
    } finally {
      setLoading(false)
    }
  }

  // Simple Google OAuth (direct Supabase)
  const signInWithGoogle = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (error) {
        throw error
      }

      return {
        success: true,
        message: 'Redirecting to Google...'
      }
    } catch (error) {
      setLoading(false)
      return {
        success: false,
        message: error.message || 'Google authentication failed'
      }
    }
  }

  // Simple sign out (direct Supabase)
  const signOut = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      return {
        success: true,
        message: 'Logged out successfully'
      }
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Logout failed'
      }
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    session,
    loading,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    supabase // Export supabase client for direct usage
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export { supabase } 