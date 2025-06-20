import React from 'react'

const DataJobs = () => {
  return (
    <div>
      <div className="card">
        <h2 style={{ marginBottom: '16px' }}>Data Collection Jobs</h2>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          Configure and monitor automated traffic data collection jobs.
          Set up scheduled collection for specific roads and analyze historical trends.
        </p>
      </div>

      <div className="grid-2">
        {/* Create New Job */}
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Create New Job</h3>
          
          <div className="form-group">
            <label className="form-label">Job Name</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g., London M25 Morning Rush"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Roads to Monitor</label>
            <textarea 
              className="form-input" 
              rows="3"
              placeholder="Select roads from Flow Explorer or enter road codes"
            ></textarea>
          </div>

          <div className="form-group">
            <label className="form-label">Collection Frequency</label>
            <select className="form-input">
              <option value="5min">Every 5 minutes</option>
              <option value="15min">Every 15 minutes</option>
              <option value="30min">Every 30 minutes</option>
              <option value="1hour">Every hour</option>
              <option value="custom">Custom schedule</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Active Hours</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="time" className="form-input" defaultValue="06:00" />
              <span style={{ display: 'flex', alignItems: 'center' }}>to</span>
              <input type="time" className="form-input" defaultValue="22:00" />
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%' }}>
            Create Job
          </button>
        </div>

        {/* Job Stats */}
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Statistics</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>0</div>
              <div style={{ fontSize: '14px', color: '#666' }}>Active Jobs</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>0</div>
              <div style={{ fontSize: '14px', color: '#666' }}>Data Points</div>
            </div>
          </div>

          <div style={{ textAlign: 'center', color: '#6c757d' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📈</div>
            <div>No data collection jobs yet</div>
            <div style={{ fontSize: '14px', marginTop: '4px' }}>
              Create your first job to start monitoring traffic patterns
            </div>
          </div>
        </div>
      </div>

      {/* Active Jobs List */}
      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>Active Jobs</h3>
        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏰</div>
          <div>No active data collection jobs</div>
          <div style={{ fontSize: '14px', marginTop: '4px' }}>
            Jobs will appear here once created with status, next run time, and controls
          </div>
        </div>
      </div>

      {/* Features to implement */}
      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>Features to Implement</h3>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Job creation and management interface</li>
          <li>Road selection integration with Flow Explorer</li>
          <li>Flexible scheduling (cron-like expressions)</li>
          <li>Job status monitoring and logs</li>
          <li>Data collection history and statistics</li>
          <li>Export collected data (CSV, JSON)</li>
          <li>Email/notification alerts for job failures</li>
          <li>Data retention policies</li>
          <li>Job templates for common scenarios</li>
        </ul>
      </div>
    </div>
  )
}

export default DataJobs 