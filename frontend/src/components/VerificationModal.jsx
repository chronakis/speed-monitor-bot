import React, { useState, useEffect } from 'react'

const VerificationModal = ({ user, onClose }) => {
  const [showAnimation, setShowAnimation] = useState(false)

  useEffect(() => {
    // Show animation after a brief delay
    const timer = setTimeout(() => {
      setShowAnimation(true)
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  if (!user) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        padding: '32px',
        maxWidth: '448px',
        width: '100%',
        transform: showAnimation ? 'scale(1)' : 'scale(0.9)',
        opacity: showAnimation ? 1 : 0,
        transition: 'all 0.3s ease'
      }}>
        {/* Success Icon */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '64px',
            width: '64px',
            borderRadius: '50%',
            backgroundColor: '#dcfce7',
            marginBottom: '16px'
          }}>
            <svg style={{ height: '32px', width: '32px', color: '#16a34a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '8px'
          }}>
            🎉 Welcome to Traffic Flow Bot!
          </h2>
          
          <p style={{
            color: '#6b7280',
            marginBottom: '16px',
            lineHeight: '1.5'
          }}>
            Your email has been verified successfully. Your account is now active and ready to use.
          </p>

          {/* User Info */}
          <div style={{
            backgroundColor: '#f9fafb',
            borderRadius: '6px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#2563eb',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '600',
                marginRight: '12px'
              }}>
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#111827',
                  margin: 0
                }}>
                  {user.user_metadata?.full_name || 'Welcome!'}
                </p>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: 0
                }}>
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div style={{
            backgroundColor: '#eff6ff',
            borderRadius: '6px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#1e3a8a',
              marginBottom: '8px',
              margin: '0 0 8px 0'
            }}>
              What's next?
            </h3>
            <ul style={{
              fontSize: '14px',
              color: '#1e40af',
              listStyle: 'none',
              padding: 0,
              margin: 0,
              textAlign: 'left'
            }}>
              <li style={{ marginBottom: '4px' }}>• Explore interactive traffic flow maps</li>
              <li style={{ marginBottom: '4px' }}>• Set up automated data collection</li>
              <li style={{ marginBottom: '4px' }}>• Configure your HERE API key (optional)</li>
              <li>• Start analyzing traffic patterns</li>
            </ul>
          </div>

          {/* Action Button */}
          <button
            onClick={onClose}
            style={{
              width: '100%',
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px',
              transition: 'background-color 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
          >
            Start Exploring →
          </button>
        </div>
      </div>
    </div>
  )
}

export default VerificationModal 