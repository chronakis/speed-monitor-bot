import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const AuthCallback = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('Completing authentication...')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, setupOAuthUser } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for error in URL params
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        if (error) {
          setError(errorDescription || error)
          setLoading(false)
          return
        }

        // If user is authenticated, set up OAuth user in backend
        if (user) {
          setMessage('Setting up your account...')
          
          const result = await setupOAuthUser()
          
          if (result.success) {
            setMessage('Account setup complete! Redirecting...')
            setTimeout(() => {
              navigate('/dashboard', { replace: true })
            }, 1000)
          } else {
            setError(result.message || 'Failed to complete account setup')
            setLoading(false)
          }
          return
        }

        // Wait a bit more for auth state to update
        const timeout = setTimeout(() => {
          if (user) {
            // User authenticated, let the effect run again
            return
          } else {
            setError('Authentication failed. Please try again.')
            setLoading(false)
          }
        }, 3000)

        return () => clearTimeout(timeout)

      } catch (err) {
        console.error('Auth callback error:', err)
        setError('Authentication failed. Please try again.')
        setLoading(false)
      }
    }

    handleCallback()
  }, [user, navigate, searchParams, setupOAuthUser])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h2 className="text-lg font-medium text-red-800 mb-2">Authentication Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuthCallback 