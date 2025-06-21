import React, { useState } from 'react'

const DataJobs = () => {
  const [activeJobs, setActiveJobs] = useState([])
  const [jobStats, setJobStats] = useState({ active: 0, dataPoints: 0 })

  return (
    <div style={{ 
      display: 'flex', 
      height: 'calc(100vh - 120px)', // Account for header and nav
      width: '100%',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Left Panel - Job Creation and Stats (30%) */}
      <div style={{ 
        width: '30%', 
        backgroundColor: 'white',
        borderRight: '1px solid #dee2e6',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Create New Job Section */}
        <div style={{ 
          padding: '20px',
          borderBottom: '1px solid #eee',
          flexShrink: 0
        }}>
          <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
            Create New Job
          </h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px', 
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              Job Name
            </label>
            <input 
              type="text" 
              placeholder="e.g., London M25 Morning Rush"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px', 
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              Roads to Monitor
            </label>
            <textarea 
              rows="3"
              placeholder="Select roads from Flow Explorer or enter road codes"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px', 
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              Collection Frequency
            </label>
            <select style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}>
              <option value="5min">Every 5 minutes</option>
              <option value="15min">Every 15 minutes</option>
              <option value="30min">Every 30 minutes</option>
              <option value="1hour">Every hour</option>
              <option value="custom">Custom schedule</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px', 
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              Active Hours
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                type="time" 
                defaultValue="06:00"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              <span style={{ fontSize: '14px', color: '#666' }}>to</span>
              <input 
                type="time" 
                defaultValue="22:00"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <button style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}>
            Create Job
          </button>
        </div>

        {/* Statistics Section */}
        <div style={{ 
          padding: '20px',
          borderBottom: '1px solid #eee',
          flexShrink: 0
        }}>
          <h4 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
            Statistics
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div style={{ 
              textAlign: 'center', 
              padding: '16px 12px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '6px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#007bff' }}>
                {jobStats.active}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Active Jobs</div>
            </div>
            <div style={{ 
              textAlign: 'center', 
              padding: '16px 12px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '6px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>
                {jobStats.dataPoints}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Data Points</div>
            </div>
          </div>

          {jobStats.active === 0 && (
            <div style={{ textAlign: 'center', color: '#6c757d', padding: '20px 0' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📈</div>
              <div style={{ fontSize: '14px' }}>
                No active jobs yet.<br />
                Create your first job to start monitoring.
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ 
          padding: '20px',
          flexShrink: 0
        }}>
          <h4 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
            Quick Actions
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button style={{
              padding: '8px 12px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer',
              textAlign: 'left'
            }}>
              📊 View All Data
            </button>
            <button style={{
              padding: '8px 12px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer',
              textAlign: 'left'
            }}>
              📁 Export Data
            </button>
            <button style={{
              padding: '8px 12px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer',
              textAlign: 'left'
            }}>
              ⚙️ Job Templates
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Active Jobs and Management (70%) */}
      <div style={{ 
        width: '70%', 
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '20px',
          borderBottom: '1px solid #eee',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Active Jobs ({activeJobs.length})
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{
                padding: '6px 12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}>
                ▶️ Start All
              </button>
              <button style={{
                padding: '6px 12px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}>
                ⏸️ Pause All
              </button>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto',
          padding: '20px'
        }}>
          {activeJobs.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px', 
              color: '#6c757d' 
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏰</div>
              <div style={{ fontSize: '18px', marginBottom: '8px', fontWeight: '500' }}>
                No active data collection jobs
              </div>
              <div style={{ fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
                Jobs will appear here once created. Each job will show its status, 
                next run time, collected data count, and management controls.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeJobs.map((job, index) => (
                <div 
                  key={index}
                  style={{
                    padding: '16px',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500', fontSize: '16px', marginBottom: '4px' }}>
                      {job.name}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                      {job.roads} • {job.frequency}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Next run: {job.nextRun} • Collected: {job.dataPoints} points
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{
                      padding: '4px 8px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}>
                      Edit
                    </button>
                    <button style={{
                      padding: '4px 8px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}>
                      Pause
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with upcoming features */}
        <div style={{ 
          padding: '20px',
          borderTop: '1px solid #eee',
          backgroundColor: '#f8f9fa',
          flexShrink: 0
        }}>
          <div style={{ fontSize: '14px', color: '#666' }}>
            <strong>Coming Soon:</strong> Job templates, advanced scheduling, data export, 
            email notifications, and integration with Flow Explorer for road selection.
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataJobs 