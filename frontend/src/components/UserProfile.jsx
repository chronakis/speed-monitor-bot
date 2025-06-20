import React, { useState } from 'react'
import { supabase } from '../context/AuthContext'

const UserProfile = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)

  // Get user from Supabase on component mount
  React.useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setIsOpen(false)
    }
    setLoading(false)
  }

  if (!user) return null

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          transition: 'all 0.2s ease',
          ':hover': {
            color: '#111827',
            backgroundColor: '#f3f4f6'
          }
        }}
        onMouseEnter={(e) => {
          e.target.style.color = '#111827'
          e.target.style.backgroundColor = '#f3f4f6'
        }}
        onMouseLeave={(e) => {
          e.target.style.color = '#374151'
          e.target.style.backgroundColor = 'transparent'
        }}
      >
        {/* User Avatar */}
        <div style={{
          width: '32px',
          height: '32px',
          backgroundColor: '#2563eb',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: '600',
          fontSize: '14px'
        }}>
          {user.email?.charAt(0).toUpperCase()}
        </div>

        {/* User Email (hidden on mobile) */}
        <span style={{
          display: window.innerWidth > 768 ? 'block' : 'none',
          maxWidth: '150px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {user.email}
        </span>

        {/* Dropdown Arrow */}
        <svg
          style={{
            width: '16px',
            height: '16px',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          right: '0',
          top: '100%',
          marginTop: '8px',
          width: '280px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e5e7eb',
          zIndex: 50,
          overflow: 'hidden'
        }}>
          {/* User Info Section */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <p style={{
              margin: '0 0 4px 0',
              fontSize: '14px',
              fontWeight: '500',
              color: '#111827'
            }}>
              {user.user_metadata?.full_name || 'User'}
            </p>
            <p style={{
              margin: '0 0 8px 0',
              fontSize: '13px',
              color: '#6b7280'
            }}>
              {user.email}
            </p>
            
            {/* Verification Status Badge */}
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500',
              backgroundColor: user.email_confirmed_at ? '#dcfce7' : '#fef3c7',
              color: user.email_confirmed_at ? '#166534' : '#92400e'
            }}>
              {user.email_confirmed_at ? '✓ Verified' : '⚠ Unverified'}
            </span>
          </div>

          {/* Account Details */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e5e7eb',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            <div style={{ marginBottom: '4px' }}>
              Provider: {user.app_metadata?.provider || 'email'}
            </div>
            <div style={{ marginBottom: '4px' }}>
              Joined: {new Date(user.created_at).toLocaleDateString()}
            </div>
            {user.last_sign_in_at && (
              <div>
                Last login: {new Date(user.last_sign_in_at).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ padding: '8px' }}>
            <button
              onClick={handleLogout}
              disabled={loading}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                border: 'none',
                background: 'none',
                fontSize: '14px',
                color: '#374151',
                cursor: loading ? 'not-allowed' : 'pointer',
                borderRadius: '4px',
                opacity: loading ? 0.5 : 1,
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!loading) e.target.style.backgroundColor = '#f3f4f6'
              }}
              onMouseLeave={(e) => {
                if (!loading) e.target.style.backgroundColor = 'transparent'
              }}
            >
              {loading ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown when clicking outside */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 40
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

export default UserProfile 