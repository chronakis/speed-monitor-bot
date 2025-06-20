import React from 'react'

const FlowExplorer = () => {
  return (
    <div>
      <div className="card">
        <h2 style={{ marginBottom: '16px' }}>Traffic Flow Explorer</h2>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          Interactive tool to explore traffic flow data similar to the legacy application.
          This will include HERE Maps integration, road selection, and traffic visualization.
        </p>
      </div>

      <div className="grid-2">
        {/* Map Container */}
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>HERE Maps</h3>
          <div 
            style={{ 
              height: '400px', 
              backgroundColor: '#f8f9fa', 
              border: '2px dashed #dee2e6', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              borderRadius: '4px'
            }}
          >
            <div style={{ textAlign: 'center', color: '#6c757d' }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>🗺️</div>
              <div>HERE Maps will be integrated here</div>
              <div style={{ fontSize: '14px', marginTop: '4px' }}>
                Interactive map with traffic flow visualization
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="card">
          <h3 style={{ marginBottom: '16px' }}>Controls</h3>
          
          <div className="form-group">
            <label className="form-label">HERE API Key</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Will use user's API key from settings"
              disabled
            />
          </div>

          <div className="form-group">
            <label className="form-label">Bounding Box</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="west,south,east,north"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Units</label>
            <select className="form-input">
              <option value="metric">Metric (km/h)</option>
              <option value="imperial">Imperial (mph)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Queuing Direction</label>
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input type="radio" name="direction" value="+" defaultChecked />
                Plus (+)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input type="radio" name="direction" value="-" />
                Minus (-)
              </label>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%' }}>
            Fetch Traffic Data
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>Traffic Data Results</h3>
        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
          <div>Traffic data table will appear here</div>
          <div style={{ fontSize: '14px', marginTop: '4px' }}>
            Similar to the current implementation with Road ID, Starting from, Speed, Length columns
          </div>
        </div>
      </div>

      {/* Features to implement */}
      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>Features to Implement</h3>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>HERE Maps JavaScript API integration</li>
          <li>Traffic flow data fetching from backend</li>
          <li>Road selection and highlighting</li>
          <li>Speed visualization with color coding</li>
          <li>Road segments table with detailed information</li>
          <li>Heatmap view for traffic visualization</li>
          <li>Interactive road clicking and selection</li>
        </ul>
      </div>
    </div>
  )
}

export default FlowExplorer 