import React, { useState } from 'react'

const Settings = () => {
  const [useOwnApiKey, setUseOwnApiKey] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [defaultUnits, setDefaultUnits] = useState('imperial')
  const [notifications, setNotifications] = useState(true)

  const handleSaveSettings = () => {
    console.log('Saving settings:', {
      useOwnApiKey,
      apiKey,
      defaultUnits,
      notifications
    })
    // TODO: Implement settings save to Supabase
  }

  return (
    <div>
      <div className="card">
        <h2 style={{ marginBottom: '16px' }}>Settings</h2>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          Configure your API keys, preferences, and account settings.
        </p>
      </div>

      <div className="grid-2">
        {/* API Configuration */}
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>HERE Maps API</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <input 
                type="radio" 
                name="apiSource" 
                checked={!useOwnApiKey}
                onChange={() => setUseOwnApiKey(false)}
              />
              Use built-in API key (recommended)
            </label>
            <p style={{ fontSize: '14px', color: '#666', marginLeft: '28px' }}>
              Use our shared HERE Maps API key. No setup required, but may have usage limits.
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <input 
                type="radio" 
                name="apiSource" 
                checked={useOwnApiKey}
                onChange={() => setUseOwnApiKey(true)}
              />
              Use my own API key
            </label>
            <p style={{ fontSize: '14px', color: '#666', marginLeft: '28px' }}>
              Use your personal HERE Maps API key for higher limits and dedicated access.
            </p>
          </div>

          {useOwnApiKey && (
            <div className="form-group">
              <label className="form-label">Your HERE API Key</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Enter your HERE Maps API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Get your API key from{' '}
                <a href="https://developer.here.com/" target="_blank" rel="noopener noreferrer">
                  HERE Developer Portal
                </a>
              </div>
            </div>
          )}

          <div style={{ padding: '12px', backgroundColor: '#e3f2fd', borderRadius: '4px', fontSize: '14px' }}>
            <strong>API Usage:</strong> Your API key is stored securely and only used for traffic data requests.
            We never share or store HERE Maps responses permanently.
          </div>
        </div>

        {/* User Preferences */}
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Preferences</h3>
          
          <div className="form-group">
            <label className="form-label">Default Units</label>
            <select 
              className="form-input"
              value={defaultUnits}
              onChange={(e) => setDefaultUnits(e.target.value)}
            >
              <option value="metric">Metric (km/h, km)</option>
              <option value="imperial">Imperial (mph, miles)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Default Map View</label>
            <select className="form-input">
              <option value="london">London (default)</option>
              <option value="custom">Custom location</option>
              <option value="last">Remember last location</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Data Retention</label>
            <select className="form-input">
              <option value="30d">30 days</option>
              <option value="90d">90 days</option>
              <option value="1y">1 year</option>
              <option value="forever">Forever</option>
            </select>
          </div>

          <div style={{ marginTop: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="checkbox" 
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
              />
              Enable email notifications for job failures
            </label>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>Account Information</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '14px', color: '#666' }}>Account Created</div>
            <div style={{ fontWeight: '500' }}>Just now</div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#666' }}>Data Points Collected</div>
            <div style={{ fontWeight: '500' }}>0</div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#666' }}>Active Jobs</div>
            <div style={{ fontWeight: '500' }}>0</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleSaveSettings}>
            Save Settings
          </button>
          <button className="btn btn-secondary">
            Export Data
          </button>
          <button className="btn" style={{ backgroundColor: '#dc3545', color: 'white' }}>
            Delete Account
          </button>
        </div>
      </div>

      {/* Features to implement */}
      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>Features to Implement</h3>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Supabase user preferences storage</li>
          <li>Secure API key encryption</li>
          <li>Account usage statistics</li>
          <li>Data export functionality</li>
          <li>Email notification setup</li>
          <li>Account deletion with data cleanup</li>
          <li>API key validation and testing</li>
          <li>Billing/usage tracking (if needed)</li>
        </ul>
      </div>
    </div>
  )
}

export default Settings 