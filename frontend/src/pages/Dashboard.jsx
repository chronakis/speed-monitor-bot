import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSearchParams } from 'react-router-dom'
import { useUserConfig } from '../hooks/useUserPreferences'
import UserProfile from '../components/UserProfile'
import VerificationModal from '../components/VerificationModal'
import FlowExplorer from './FlowExplorer'
import DataJobs from './DataJobs'
import Settings from './Settings'

const Dashboard = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('flow')
  const [searchParams, setSearchParams] = useSearchParams()
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  
  // Initialize user config (creates them if they don't exist)
  const { config, loading: configLoading, error: configError } = useUserConfig(user)

  // Check for verification success from URL
  useEffect(() => {
    if (searchParams.get('verified') === 'true' && user) {
      setShowVerificationModal(true)
      // Clean up URL parameter
      searchParams.delete('verified')
      setSearchParams(searchParams, { replace: true })
    }
  }, [user, searchParams, setSearchParams])

  const renderContent = () => {
    switch (activeTab) {
      case 'flow':
        return <FlowExplorer />
      case 'jobs':
        return <DataJobs />
      case 'settings':
        return <Settings />
      default:
        return <FlowExplorer />
    }
  }



  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Verification Success Modal */}
      {showVerificationModal && (
        <VerificationModal 
          user={user} 
          onClose={() => setShowVerificationModal(false)} 
        />
      )}

      {/* Header */}
      <header style={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #dee2e6', 
        padding: '0 20px',
        width: '100%'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          height: '60px',
          width: '100%'
        }}>
          {/* Title - Far Left */}
          <div style={{ flex: '0 0 auto' }}>
            <h1 style={{ margin: 0, color: '#333', fontSize: '18px', fontWeight: '600' }}>
              Traffic Flow Bot
            </h1>
          </div>

          {/* Navigation Tabs - Center */}
          <div className="nav-tabs" style={{ 
            margin: 0, 
            borderBottom: 'none',
            flex: '1',
            display: 'flex',
            justifyContent: 'center',
            gap: '0'
          }}>
            <button
              className={`nav-tab ${activeTab === 'flow' ? 'active' : ''}`}
              onClick={() => setActiveTab('flow')}
              style={{
                borderBottom: activeTab === 'flow' ? '3px solid #007bff' : '3px solid transparent',
                color: activeTab === 'flow' ? '#007bff' : '#666'
              }}
            >
              🗺️ Flow Explorer
            </button>
            <button
              className={`nav-tab ${activeTab === 'jobs' ? 'active' : ''}`}
              onClick={() => setActiveTab('jobs')}
              style={{
                borderBottom: activeTab === 'jobs' ? '3px solid #007bff' : '3px solid transparent',
                color: activeTab === 'jobs' ? '#007bff' : '#666'
              }}
            >
              ⏰ Data Jobs
            </button>
            <button
              className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
              style={{
                borderBottom: activeTab === 'settings' ? '3px solid #007bff' : '3px solid transparent',
                color: activeTab === 'settings' ? '#007bff' : '#666'
              }}
            >
              ⚙️ Settings
            </button>
          </div>

          {/* User Profile - Far Right */}
          <div style={{ flex: '0 0 auto' }}>
            <UserProfile />
          </div>
        </div>
      </header>

      {/* Content */}
      <div style={{ 
        width: '100%',
        maxWidth: 'none',
        margin: '0',
        padding: '0'
      }}>
        {renderContent()}
      </div>
    </div>
  )
}

export default Dashboard 