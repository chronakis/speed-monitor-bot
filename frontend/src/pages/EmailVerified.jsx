import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const EmailVerified = () => {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(5)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    // Show success message after a brief delay
    const timer = setTimeout(() => {
      setShowSuccess(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Auto redirect to dashboard after 5 seconds
    if (user && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (user && countdown === 0) {
      navigate('/dashboard')
    }
  }, [countdown, user, navigate])

  const handleGoToDashboard = () => {
    navigate('/dashboard')
  }

  const handleGoToHome = () => {
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying your account...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Success Animation */}
          <div className={`transition-all duration-500 ${showSuccess ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              🎉 Email Verified Successfully!
            </h1>

            <p className="text-gray-600 mb-6">
              Your account has been verified and is now active. You can start using Traffic Flow Bot to monitor and analyze traffic data.
            </p>

            {user && (
              <div className="bg-gray-50 rounded-md p-4 mb-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="ml-3 text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {user.user_metadata?.full_name || 'Welcome!'}
                    </p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {user ? (
                <>
                  <button
                    onClick={handleGoToDashboard}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    Go to Dashboard
                  </button>
                  
                  <p className="text-sm text-gray-500">
                    Redirecting automatically in {countdown} seconds...
                  </p>
                </>
              ) : (
                <>
                  <button
                    onClick={handleGoToHome}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    Sign In to Your Account
                  </button>
                  
                  <p className="text-sm text-gray-500">
                    Your email has been verified. Please sign in to continue.
                  </p>
                </>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">What's next?</h3>
              <ul className="text-sm text-gray-600 space-y-1 text-left">
                <li>• Explore traffic flow data with interactive maps</li>
                <li>• Set up automated data collection jobs</li>
                <li>• Configure your HERE API key (optional)</li>
                <li>• Analyze traffic patterns and trends</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailVerified 