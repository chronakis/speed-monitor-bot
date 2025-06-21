import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useUserConfig } from '../hooks/useUserPreferences'

const Settings = () => {
  const { user } = useAuth()
  const { config, loading, error, updateConfig, updateApiKey } = useUserConfig(user)
  
  // Local state for form inputs
  const [useOwnApiKey, setUseOwnApiKey] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [defaultUnits, setDefaultUnits] = useState('imperial')
  const [defaultMapLocation, setDefaultMapLocation] = useState('london')
  const [dataRetentionDays, setDataRetentionDays] = useState(90)
  const [notifications, setNotifications] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  // Update local state when config loads
  useEffect(() => {
    if (config) {
      setUseOwnApiKey(config.use_own_api_key)
      setApiKey('') // Don't show the encrypted key
      setDefaultUnits(config.default_units)
      setDefaultMapLocation(config.default_map_location)
      setDataRetentionDays(config.data_retention_days)
      setNotifications(config.email_notifications)
    }
  }, [config])

  const handleSaveSettings = async () => {
    if (!config) return

    setSaving(true)
    setSaveMessage('')

    try {
      // Update general preferences
      const prefUpdates = {
        default_units: defaultUnits,
        default_map_location: defaultMapLocation,
        data_retention_days: dataRetentionDays,
        email_notifications: notifications
      }

      const result = await updateConfig(prefUpdates)
      
      if (!result.success) {
        throw new Error(result.error)
      }

      // Update API key if changed
      if (apiKey.trim()) {
        const apiResult = await updateApiKey(apiKey.trim(), useOwnApiKey)
        if (!apiResult.success) {
          throw new Error(apiResult.error)
        }
      } else if (!useOwnApiKey && config.here_api_key_encrypted) {
        // User disabled their own API key
        const apiResult = await updateApiKey(null, false)
        if (!apiResult.success) {
          throw new Error(apiResult.error)
        }
      }

      setSaveMessage('Settings saved successfully!')
      setApiKey('') // Clear the API key input after saving
    } catch (err) {
      setSaveMessage(`Error saving settings: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        height: 'calc(100vh - 120px)',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ 
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ textAlign: 'center' }}>Loading settings...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        height: 'calc(100vh - 120px)',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ 
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          color: '#dc3545',
          textAlign: 'center'
        }}>
          <div>Error loading settings: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      display: 'flex', 
      height: 'calc(100vh - 120px)', // Account for header and nav
      width: '100%',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Left Panel - API Configuration (40%) */}
      <div style={{ 
        width: '40%', 
        backgroundColor: 'white',
        borderRight: '1px solid #dee2e6',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto'
      }}>
        <div style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
            API Configuration
          </h3>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              <input 
                type="checkbox" 
                checked={useOwnApiKey}
                onChange={(e) => setUseOwnApiKey(e.target.checked)}
              />
              <span style={{ fontWeight: '500' }}>Use my own HERE Maps API key</span>
            </label>
            <div style={{ 
              fontSize: '12px', 
              color: '#666', 
              marginTop: '6px',
              marginLeft: '24px'
            }}>
              {useOwnApiKey 
                ? 'You will use your own API key for all requests'
                : 'You will use our shared API key (limited usage)'
              }
            </div>
          </div>

          {useOwnApiKey && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '14px',
                fontWeight: '500',
                color: '#333'
              }}>
                Your HERE API Key
              </label>
              <input 
                type="password" 
                placeholder={config?.here_api_key_encrypted ? "Enter new key to update" : "Enter your HERE Maps API key"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              <div style={{ fontSize: '12px', color: '#666', marginTop: '6px' }}>
                Get your API key from{' '}
                <a 
                  href="https://developer.here.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#007bff', textDecoration: 'none' }}
                >
                  HERE Developer Portal
                </a>
                {config?.api_key_status && config.api_key_status !== 'none' && (
                  <div style={{ marginTop: '4px' }}>
                    Status: <span style={{ 
                      color: config.api_key_status === 'valid' ? '#28a745' : 
                            config.api_key_status === 'invalid' ? '#dc3545' : '#ffc107',
                      fontWeight: '500'
                    }}>
                      {config.api_key_status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ 
            padding: '16px', 
            backgroundColor: '#e3f2fd', 
            borderRadius: '6px', 
            fontSize: '14px',
            border: '1px solid #bbdefb'
          }}>
            <div style={{ fontWeight: '500', marginBottom: '4px' }}>🔒 Security Notice</div>
            <div style={{ color: '#1565c0' }}>
              Your API key is stored securely and only used for traffic data requests.
              We never share or store HERE Maps responses permanently.
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - User Preferences and Account (60%) */}
      <div style={{ 
        width: '60%', 
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto'
      }}>
        <div style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
            User Preferences
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '14px',
                fontWeight: '500',
                color: '#333'
              }}>
                Default Units
              </label>
              <select 
                value={defaultUnits}
                onChange={(e) => setDefaultUnits(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                <option value="metric">Metric (km/h, km)</option>
                <option value="imperial">Imperial (mph, miles)</option>
              </select>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '14px',
                fontWeight: '500',
                color: '#333'
              }}>
                Default Map View
              </label>
              <select 
                value={defaultMapLocation}
                onChange={(e) => setDefaultMapLocation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                <option value="london">London (default)</option>
                <option value="custom">Custom location</option>
                <option value="last">Remember last location</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '14px',
                fontWeight: '500',
                color: '#333'
              }}>
                Data Retention
              </label>
              <select 
                value={dataRetentionDays}
                onChange={(e) => setDataRetentionDays(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={365}>1 year</option>
                <option value={-1}>Forever</option>
              </select>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '6px', 
                fontSize: '14px',
                fontWeight: '500',
                color: '#333'
              }}>
                Email Notifications
              </label>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                height: '36px',
                paddingLeft: '12px'
              }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}>
                  <input 
                    type="checkbox" 
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                  />
                  Enable notifications
                </label>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '6px',
            border: '1px solid #e9ecef',
            marginBottom: '24px'
          }}>
            <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
              Account Information
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
              <div>
                <strong>Email:</strong> {user?.email}
              </div>
              <div>
                <strong>User ID:</strong> {user?.id?.substring(0, 8)}...
              </div>
              <div>
                <strong>Created:</strong> {new Date(user?.created_at).toLocaleDateString()}
              </div>
              <div>
                <strong>Last Sign In:</strong> {new Date(user?.last_sign_in_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Save Button and Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              onClick={handleSaveSettings}
              disabled={saving}
              style={{
                padding: '12px 24px',
                backgroundColor: saving ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>

            {saveMessage && (
              <div style={{ 
                padding: '8px 12px',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: saveMessage.includes('Error') ? '#f8d7da' : '#d4edda',
                color: saveMessage.includes('Error') ? '#721c24' : '#155724',
                border: `1px solid ${saveMessage.includes('Error') ? '#f5c6cb' : '#c3e6cb'}`
              }}>
                {saveMessage}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
            <h4 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
              Quick Actions
            </h4>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button style={{
                padding: '8px 16px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
              }}>
                📊 Export My Data
              </button>
              <button style={{
                padding: '8px 16px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
              }}>
                🔄 Reset Preferences
              </button>
              <button style={{
                padding: '8px 16px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
              }}>
                📧 Test Notifications
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings 