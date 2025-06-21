import React, { useState, useEffect, useCallback } from 'react'
import { useUserConfig } from '../hooks/useUserPreferences'
import { useAuth } from '../context/AuthContext'
import useHereMap from '../hooks/useHereMap'
import useTrafficFlow from '../hooks/useTrafficFlow'
import RoadSegmentsTable from '../components/RoadSegmentsTable'

const FlowExplorer = () => {
  const { user } = useAuth()
  const { config } = useUserConfig(user)
  const [bboxInput, setBboxInput] = useState('-0.1915401096720512,51.500385727190164,-0.07390591663719842,51.53216941246397')
  const [direction, setDirection] = useState('+')
  const [units, setUnits] = useState('imperial')
  const [backendApiReady, setBackendApiReady] = useState(false)

  // HERE Maps integration (no API key needed for map display)
  const {
    mapReady,
    loading: mapLoading,
    error: mapError,
    setMapViewBounds,
    addTrackedShape,
    clearShapes,
    highlightRoad,
    clearHighlightedRoad
  } = useHereMap('here-map-container', 'dummy-key') // Maps don't need real key for display

  // Traffic flow data integration
  const {
    loading: flowLoading,
    error: flowError,
    selectedRoad,
    fetchFlowData,
    getRoadList,
    getRoadShapes,
    selectRoad,
    clearSelection,
    getSelectedRoadPolyline,
    getSelectedRoadSegments
  } = useTrafficFlow()

  // Check if backend API is ready
  useEffect(() => {
    const checkBackendApi = async () => {
      try {
        const response = await fetch('/api/here/config')
        if (response.ok) {
          const data = await response.json()
          setBackendApiReady(data.hasApiKey)
          if (!data.hasApiKey) {
            console.warn('Backend HERE API key not configured')
          }
        }
      } catch (error) {
        console.error('Failed to check backend API status:', error)
        setBackendApiReady(false)
      }
    }

    checkBackendApi()
  }, [])

  // Parse bbox string into object
  const parseBbox = useCallback((bboxString) => {
    const parts = bboxString.split(',').map(s => parseFloat(s.trim()))
    if (parts.length !== 4 || parts.some(isNaN)) {
      return null
    }
    return {
      w: parts[0], // west
      s: parts[1], // south
      e: parts[2], // east
      n: parts[3]  // north
    }
  }, [])

  // Handle road selection from map or list
  const handleRoadSelect = useCallback((localid) => {
    selectRoad(localid)
  }, [selectRoad])

  // Draw heatmap on map
  const drawHeatmap = useCallback(() => {
    if (!mapReady) return

    clearShapes()
    clearHighlightedRoad()

    const roadShapes = getRoadShapes(direction)
    
    roadShapes.forEach(({ shapes, localid }) => {
      shapes.forEach(({ polylineString, color }) => {
        addTrackedShape(polylineString, color, 4, localid, handleRoadSelect)
      })
    })
  }, [mapReady, getRoadShapes, direction, clearShapes, clearHighlightedRoad, addTrackedShape, handleRoadSelect])

  // Highlight selected road
  useEffect(() => {
    if (!selectedRoad || !mapReady) return

    const roadPolyline = getSelectedRoadPolyline()
    if (roadPolyline) {
      highlightRoad(roadPolyline.road, roadPolyline.polylineString, roadPolyline.color)
    }
  }, [selectedRoad, mapReady, getSelectedRoadPolyline, highlightRoad])

  // Redraw heatmap when direction changes
  useEffect(() => {
    drawHeatmap()
  }, [drawHeatmap])

  const handleFetchData = async () => {
    if (!backendApiReady) {
      alert('Backend API is not ready. Please ensure HERE API key is configured on the server.')
      return
    }

    const bbox = parseBbox(bboxInput)
    if (!bbox) {
      alert('Invalid bounding box format. Use: west,south,east,north')
      return
    }

    try {
      // Set map view to bbox
      if (mapReady) {
        setMapViewBounds(bbox)
      }

      // Fetch traffic data (API key handled securely by backend)
      await fetchFlowData(bbox, units)
      
      // Draw heatmap will be triggered by useEffect when roadShapes change
    } catch (error) {
      console.error('Error fetching traffic data:', error)
      alert(`Error fetching traffic data: ${error.message}`)
    }
  }

  const roadList = getRoadList(direction)
  const segmentData = getSelectedRoadSegments()

  return (
    <div style={{ 
      display: 'flex', 
      height: 'calc(100vh - 120px)',
      width: '100%',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Left Panel - Controls and Road List (25%) */}
      <div style={{ 
        width: '25%', 
        backgroundColor: 'white',
        borderRight: '1px solid #dee2e6',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Controls Section */}
        <div style={{ 
          padding: '20px',
          borderBottom: '1px solid #eee',
          flexShrink: 0
        }}>
          <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
            Traffic Flow Controls
          </h3>

          {/* API Status */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              padding: '8px 12px',
              backgroundColor: backendApiReady ? '#d4edda' : '#f8d7da',
              color: backendApiReady ? '#155724' : '#721c24',
              border: `1px solid ${backendApiReady ? '#c3e6cb' : '#f5c6cb'}`,
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              {backendApiReady ? (
                <>✅ Backend API Ready</>
              ) : (
                <>❌ Backend API key not configured</>
              )}
            </div>
          </div>
          
          {/* Bounding Box Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px', 
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              Bounding Box
            </label>
            <input 
              type="text" 
              value={bboxInput}
              onChange={(e) => setBboxInput(e.target.value)}
              placeholder="west,south,east,north"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              London area coordinates
            </div>
          </div>

          {/* Direction of Travel */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              Direction of Travel
            </label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="direction" 
                  value="+" 
                  checked={direction === '+'}
                  onChange={(e) => setDirection(e.target.value)}
                />
                <span style={{ fontSize: '14px' }}>Plus (+)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="direction" 
                  value="-" 
                  checked={direction === '-'}
                  onChange={(e) => setDirection(e.target.value)}
                />
                <span style={{ fontSize: '14px' }}>Minus (-)</span>
              </label>
            </div>
          </div>

          {/* Units */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px', 
              fontSize: '14px',
              fontWeight: '500',
              color: '#333'
            }}>
              Units
            </label>
            <select 
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: 'white'
              }}
            >
              <option value="metric">Metric (km/h)</option>
              <option value="imperial">Imperial (mph)</option>
            </select>
          </div>

          {/* Fetch Data Button */}
          <button 
            onClick={handleFetchData}
            disabled={flowLoading || mapLoading || !backendApiReady}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: (flowLoading || mapLoading || !backendApiReady) ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: (flowLoading || mapLoading || !backendApiReady) ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {flowLoading ? 'Fetching...' : mapLoading ? 'Loading Map...' : 'Fetch Traffic Data'}
          </button>

          {/* Error Display */}
          {(mapError || flowError) && (
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              backgroundColor: '#f8d7da',
              color: '#721c24',
              border: '1px solid #f5c6cb',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              {mapError || flowError}
            </div>
          )}
        </div>

        {/* Road List Section */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto',
          padding: '20px'
        }}>
          <h4 style={{ 
            marginBottom: '16px', 
            fontSize: '16px', 
            fontWeight: '600',
            color: '#333'
          }}>
            Road Segments ({roadList.length})
          </h4>
          
          {roadList.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px', 
              color: '#6c757d' 
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛣️</div>
              <div style={{ fontSize: '14px' }}>
                No traffic data loaded.<br />
                {backendApiReady ? 'Click "Fetch Traffic Data" to start.' : 'Backend API key needs to be configured.'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {roadList.map((road) => (
                <div 
                  key={road.localid}
                  onClick={() => handleRoadSelect(road.localid)}
                  style={{
                    padding: '12px',
                    backgroundColor: selectedRoad?.localid === road.localid ? '#e3f2fd' : '#f8f9fa',
                    border: selectedRoad?.localid === road.localid ? '2px solid #007bff' : '1px solid #e9ecef',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    borderLeft: `4px solid ${road.color}`
                  }}
                  onMouseEnter={(e) => {
                    if (selectedRoad?.localid !== road.localid) {
                      e.target.style.backgroundColor = '#e9ecef'
                      e.target.style.borderColor = '#007bff'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedRoad?.localid !== road.localid) {
                      e.target.style.backgroundColor = '#f8f9fa'
                      e.target.style.borderColor = '#e9ecef'
                    }
                  }}
                >
                  <div style={{ 
                    fontWeight: '500', 
                    fontSize: '14px',
                    marginBottom: '4px'
                  }}>
                    {road.code}
                  </div>
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#666',
                    marginBottom: '4px'
                  }}>
                    {road.description}
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    <span>Speed: {road.speed.toFixed(1)} {units === 'metric' ? 'km/h' : 'mph'}</span>
                    <span>Length: {road.length.toFixed(2)} {units === 'metric' ? 'km' : 'mi'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Map (75%) */}
      <div style={{ 
        width: '75%', 
        backgroundColor: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Map Container */}
        <div 
          id="here-map-container"
          style={{ 
            width: '100%',
            height: '100%',
            backgroundColor: '#f8f9fa'
          }}
        >
          {/* Loading overlay */}
          {(mapLoading || flowLoading) && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(248, 249, 250, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', marginBottom: '8px' }}>
                  {mapLoading ? '🗺️' : '📊'}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {mapLoading ? 'Loading HERE Maps...' : 'Fetching traffic data...'}
                </div>
              </div>
            </div>
          )}

          {/* Map placeholder when not ready */}
          {!mapReady && !mapLoading && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ textAlign: 'center', color: '#6c757d' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🗺️</div>
                <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
                  HERE Maps Integration
                </div>
                <div style={{ fontSize: '14px', maxWidth: '300px' }}>
                  {backendApiReady ? 'Click "Fetch Traffic Data" to start.' : 'Backend API key needs to be configured.'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status overlays */}
        {flowLoading && mapReady && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            padding: '8px 16px',
            backgroundColor: 'rgba(0, 123, 255, 0.9)',
            color: 'white',
            borderRadius: '4px',
            fontSize: '14px',
            zIndex: 2
          }}>
            Loading traffic data...
          </div>
        )}

        {roadList.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            padding: '8px 16px',
            backgroundColor: 'rgba(40, 167, 69, 0.9)',
            color: 'white',
            borderRadius: '4px',
            fontSize: '14px',
            zIndex: 2
          }}>
            {roadList.length} roads loaded
          </div>
        )}
      </div>

      {/* Floating Road Segments Table */}
      {segmentData && (
        <RoadSegmentsTable 
          segmentData={segmentData}
          onClose={clearSelection}
        />
      )}
    </div>
  )
}

export default FlowExplorer 