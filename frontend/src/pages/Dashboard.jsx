import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSearchParams } from 'react-router-dom'
import { useUserPreferences } from '../hooks/useUserPreferences'
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
  
  // Initialize user preferences (creates them if they don't exist)
  const { preferences, loading: prefsLoading, error: prefsError } = useUserPreferences(user)

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
      <header style={{ backgroundColor: 'white', borderBottom: '1px solid #dee2e6', padding: '0 20px' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '60px' }}>
          <h1 style={{ margin: 0, color: '#333' }}>Traffic Flow Bot</h1>
          <UserProfile />
        </div>
      </header>

      <div className="container" style={{ paddingTop: '20px' }}>
        {/* Navigation Tabs */}
        <div className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'flow' ? 'active' : ''}`}
            onClick={() => setActiveTab('flow')}
          >
            🗺️ Flow Explorer
          </button>
          <button
            className={`nav-tab ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => setActiveTab('jobs')}
          >
            ⏰ Data Jobs
          </button>
          <button
            className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Settings
          </button>
        </div>

        {/* Content */}
        <div>
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default Dashboard 