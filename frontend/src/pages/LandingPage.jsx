import React, { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const LandingPage = () => {
  const { user, loading, signInWithEmail, signInWithGoogle, signUpWithEmail } = useAuth()
  const navigate = useNavigate()
  
  // Auth form state
  const [activeTab, setActiveTab] = useState('login') // 'login' or 'signup'
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [signupSuccess, setSignupSuccess] = useState(false)
  const [authLoading, setAuthLoading] = useState(false) // Local loading state for auth operations

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setError('')
    setMessage('')
    setSignupSuccess(false) // Reset signup success state
    setAuthLoading(true)

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      setAuthLoading(false)
      return
    }

    const result = await signInWithEmail(formData.email, formData.password)
    
    if (result.success) {
      setMessage('Login successful! Redirecting...')
      // Delay navigation to show success message
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)
    } else {
      setError(result.message)
    }
    setAuthLoading(false)
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setError('')
    setMessage('')
    setAuthLoading(true)

    const { fullName, email, password, confirmPassword } = formData

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields')
      setAuthLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setAuthLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setAuthLoading(false)
      return
    }

    const result = await signUpWithEmail(email, password, fullName)
    
    if (result.success) {
      setMessage(result.message)
      setSignupSuccess(true)
      // Clear the form
      setFormData({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
      })
    } else {
      setError(result.message)
    }
    setAuthLoading(false)
  }

  const handleGoogleAuth = async () => {
    setError('')
    setMessage('')
    
    const result = await signInWithGoogle()
    
    if (result.success) {
      setMessage(result.message)
    } else {
      setError(result.message)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="container" style={{ paddingTop: '30px' }}>
        {/* Header */}
        <div className="text-center mb-20">
          <h1 style={{ color: 'white', fontSize: '48px', marginBottom: '16px' }}>
            Traffic Flow Bot
          </h1>
        </div>

        <div className="grid-2" style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Features */}
          <div className="card">
            <p style={{ color: '#666', fontSize: '18px', lineHeight: '1.6', margin: '0 0 20px 0' }}>
              Monitor and analyze traffic flow data using HERE Maps API. 
              Set up automated data collection and gain insights into traffic patterns.
            </p>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                🗺️ Interactive traffic flow explorer
              </li>
              <li style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                ⏰ Automated data collection jobs
              </li>
              <li style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                📊 Traffic pattern analysis
              </li>
              <li style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                🔑 Use your own HERE API key or ours
              </li>
              <li style={{ padding: '8px 0' }}>
                📈 Historical traffic data insights
              </li>
            </ul>
          </div>

          {/* Auth Form */}
          <div className="card">
            
            {/* Tab Navigation */}
            <div style={{ display: 'flex', marginBottom: '30px', borderBottom: '1px solid #eee' }}>
              <button
                onClick={() => {
                  setActiveTab('login')
                  setSignupSuccess(false)
                  setError('')
                  setMessage('')
                }}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'login' ? '2px solid #007bff' : '2px solid transparent',
                  color: activeTab === 'login' ? '#007bff' : '#666',
                  fontWeight: activeTab === 'login' ? 'bold' : 'normal'
                }}
              >
                Log in
              </button>
              <button
                onClick={() => {
                  setActiveTab('signup')
                  setSignupSuccess(false)
                  setError('')
                  setMessage('')
                }}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'signup' ? '2px solid #007bff' : '2px solid transparent',
                  color: activeTab === 'signup' ? '#007bff' : '#666',
                  fontWeight: activeTab === 'signup' ? 'bold' : 'normal'
                }}
              >
                Create Account
              </button>
            </div>

            {/* Google Auth Button */}
            <button
              onClick={handleGoogleAuth}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                background: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                opacity: loading ? 0.5 : 1
              }}
            >
              <svg style={{ width: '20px', height: '20px', marginRight: '8px' }} viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            <div style={{ textAlign: 'center', margin: '20px 0', color: '#666' }}>
              Or continue with email
            </div>

            {/* Auth Form */}
            {signupSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>📧</div>
                <h3 style={{ color: '#333', marginBottom: '12px' }}>Check Your Email!</h3>
                <p style={{ color: '#666', marginBottom: '20px', lineHeight: '1.5' }}>
                  We've sent a verification link to your email address. Click the link to activate your account and start using Traffic Flow Bot.
                </p>
                <button 
                  onClick={() => {
                    setSignupSuccess(false)
                    setMessage('')
                    setActiveTab('login')
                  }}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #007bff',
                    background: 'white',
                    color: '#007bff',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeTab === 'signup' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', color: '#333', fontSize: '14px' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    required
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '4px', color: '#333', fontSize: '14px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (activeTab === 'login') {
                        handleLogin(e)
                      } else {
                        handleSignup(e)
                      }
                    }
                  }}
                  placeholder="Enter your email"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', color: '#333', fontSize: '14px' }}>
                  Password
                </label>
                                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (activeTab === 'login') {
                          handleLogin(e)
                        } else {
                          handleSignup(e)
                        }
                      }
                    }}
                    placeholder={activeTab === 'signup' ? 'Create a password (min. 6 characters)' : 'Enter your password'}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    required
                  />
              </div>

              {activeTab === 'signup' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', color: '#333', fontSize: '14px' }}>
                    Confirm Password
                  </label>
                                      <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleSignup(e)
                        }
                      }}
                      placeholder="Confirm your password"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                      required
                    />
                </div>
              )}

              {activeTab === 'login' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#666' }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ marginRight: '8px' }}
                    />
                    Remember me
                  </label>
                  <a href="#" style={{ fontSize: '14px', color: '#007bff', textDecoration: 'none' }}>
                    Forgot password?
                  </a>
                </div>
              )}

              {error && (
                <div style={{
                  padding: '12px',
                  background: '#fee',
                  border: '1px solid #fcc',
                  borderRadius: '4px',
                  color: '#c33',
                  fontSize: '14px'
                }}>
                  {error}
                </div>
              )}

              {message && (
                <div style={{
                  padding: signupSuccess ? '20px' : '12px',
                  background: signupSuccess ? '#f0f9ff' : '#efe',
                  border: signupSuccess ? '2px solid #0ea5e9' : '1px solid #cfc',
                  borderRadius: '8px',
                  color: signupSuccess ? '#0369a1' : '#3c3',
                  fontSize: '14px',
                  textAlign: 'center',
                  position: 'relative'
                }}>
                  {signupSuccess && (
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                      ✅
                    </div>
                  )}
                  <strong>{signupSuccess ? 'Success!' : ''}</strong>
                  <div>{message}</div>
                  {signupSuccess && (
                    <div style={{ 
                      marginTop: '12px', 
                      fontSize: '13px', 
                      color: '#0369a1',
                      fontWeight: 'normal'
                    }}>
                      Check your email and click the verification link to complete your registration.
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                disabled={authLoading}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  
                  if (authLoading) return
                  
                  if (activeTab === 'login') {
                    handleLogin(e)
                  } else {
                    handleSignup(e)
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: authLoading ? '#ccc' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: authLoading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  opacity: authLoading ? 0.5 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                {authLoading ? 
                  (activeTab === 'login' ? 'Signing in...' : 'Creating Account...') :
                  (activeTab === 'login' ? 'Log in' : 'Create Account')
                }
              </button>
            </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-20" style={{ paddingBottom: '40px' }}>
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>
            Built with React, Express, and Supabase. Powered by HERE Maps API.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LandingPage 