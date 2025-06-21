import { useState, useCallback, useRef } from 'react'

// Conversion utilities
const toMiles = (distance) => distance * 0.000621371
const toKms = (distance) => distance * 0.001
const toMph = (speed) => speed * 2.23694
const toKmh = (speed) => speed * 3.6

// Color scheme and speed thresholds (ported from heatmap-styles.js)
const heatmapColours = {
  1: { color: '#A2D8FF', metricRange: '0-20 km/h', imperialRange: '0-15 mph', order: 1 },
  2: { color: '#3C9CF0', metricRange: '21-30 km/h', imperialRange: '16-20 mph', order: 2 },
  3: { color: '#FFF33C', metricRange: '31-40 km/h', imperialRange: '21-25 mph', order: 3 },
  4: { color: '#FF872F', metricRange: '41-50 km/h', imperialRange: '26-30 mph', order: 4 },
  5: { color: '#f060da', metricRange: '51-60 km/h', imperialRange: '31-40 mph', order: 5 },
  6: { color: '#C80BCE', metricRange: '61-70 km/h', imperialRange: '41-50 mph', order: 6 },
  7: { color: '#910bce', metricRange: '71-80+ km/h', imperialRange: '51-60+ mph', order: 7 },
  'n/a': { color: '#555555', metricRange: 'no data/error', imperialRange: 'no data/error', order: 8 }
}

const speedThresholds = {
  metric: { t1: 20, t2: 30, t3: 40, t4: 50, t5: 60, t6: 70, t7: 80 },
  imperial: { t1: 15, t2: 20, t3: 25, t4: 30, t5: 40, t6: 50, t7: 60 }
}

const useTrafficFlow = () => {
  const [roadData, setRoadData] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedRoad, setSelectedRoad] = useState(null)
  const [units, setUnits] = useState('imperial')
  const abortControllerRef = useRef(null)

  // Get color for speed value
  const getColorFromSpeed = useCallback((speed, units) => {
    const thresholds = speedThresholds[units] || speedThresholds.metric
    
    if (speed <= 0) return heatmapColours['n/a'].color
    if (speed <= thresholds.t1) return heatmapColours[1].color
    if (speed <= thresholds.t2) return heatmapColours[2].color
    if (speed <= thresholds.t3) return heatmapColours[3].color
    if (speed <= thresholds.t4) return heatmapColours[4].color
    if (speed <= thresholds.t5) return heatmapColours[5].color
    if (speed <= thresholds.t6) return heatmapColours[6].color
    if (speed <= thresholds.t7) return heatmapColours[7].color
    return heatmapColours[7].color
  }, [])

  // Process API response into road data
  const processRoadData = useCallback((results) => {
    const roads = {}
    
    results.forEach((result, index) => {
      if (!result.location || !result.location.tmc) {
        console.warn('Missing location or TMC data for result:', result)
        return
      }
      
      const extendedCountryCode = result.location.tmc.extendedCountryCode || 'E1'
      const code = `${extendedCountryCode}${result.location.tmc.queuingDirection}${result.location.tmc.locationId}`
      const localid = `${code}-${index}`
      
      const road = {
        location: result.location,
        currentFlow: result.currentFlow,
        code: code,
        localid: localid
      }
      
      if (!road.location.description) {
        road.location.description = `Unknown-${code}`
      }
      
      roads[localid] = road
    })
    
    return roads
  }, [])

  // Fetch traffic flow data
  const fetchFlowData = useCallback(async (bbox, requestUnits = 'imperial') => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        in: `bbox:${bbox.w},${bbox.s},${bbox.e},${bbox.n}`,
        units: requestUnits,
        responseattributes: 'sh',
        locationReferencing: 'tmc,shape'
      })

      // Use our secure backend API instead of calling HERE directly
      const response = await fetch(`/api/here/flow?${params}`, {
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      if (!data.results || !Array.isArray(data.results)) {
        throw new Error('Invalid response format: missing results array')
      }

      const processedRoads = processRoadData(data.results)
      setRoadData(processedRoads)
      setUnits(requestUnits)
      
      return processedRoads
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Request was cancelled')
        return null
      }
      
      console.error('Error fetching traffic data:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }, [processRoadData])

  // Get roads filtered by queuing direction
  const getRoadsByDirection = useCallback((direction = '+') => {
    return Object.values(roadData).filter(road => 
      road.location.tmc.queuingDirection.includes(direction)
    )
  }, [roadData])

  // Get road list for display
  const getRoadList = useCallback((direction = '+') => {
    return getRoadsByDirection(direction).map(road => {
      const length = units === 'metric' ? toKms(road.location.length) : toMiles(road.location.length)
      const speed = units === 'metric' ? toKmh(road.currentFlow.speed) : toMph(road.currentFlow.speed)
      const speedUncapped = units === 'metric' ? toKmh(road.currentFlow.speedUncapped) : toMph(road.currentFlow.speedUncapped)
      
      return {
        localid: road.localid,
        code: road.code,
        description: road.location.description,
        length: length,
        speed: speed,
        speedUncapped: speedUncapped,
        confidence: road.currentFlow.confidence,
        color: getColorFromSpeed(speedUncapped, units),
        rawRoad: road
      }
    })
  }, [roadData, units, getRoadsByDirection, getColorFromSpeed])

  // Select a road
  const selectRoad = useCallback((localid) => {
    const road = roadData[localid]
    if (road) {
      setSelectedRoad(road)
    }
  }, [roadData])

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedRoad(null)
  }, [])

  // Get road shapes for mapping
  const getRoadShapes = useCallback((direction = '+') => {
    return getRoadsByDirection(direction).map(road => {
      const speedUncapped = road.currentFlow.speedUncapped
      const displaySpeed = units === 'metric' ? toKmh(speedUncapped) : toMph(speedUncapped)
      const color = getColorFromSpeed(displaySpeed, units)
      
      const shapes = []
      const shapeLinks = road.location.shape?.links
      
      if (shapeLinks && shapeLinks.length > 0) {
        shapeLinks.forEach(link => {
          if (link.points && link.points.length > 0) {
            const polylineString = link.points.map(p => `${p.lat},${p.lng}`).join(' ')
            shapes.push({
              polylineString,
              color,
              localid: road.localid
            })
          }
        })
      }
      
      return {
        localid: road.localid,
        shapes,
        road
      }
    }).filter(item => item.shapes.length > 0)
  }, [getRoadsByDirection, units, getColorFromSpeed])

  // Get selected road polyline for highlighting
  const getSelectedRoadPolyline = useCallback(() => {
    if (!selectedRoad) return null
    
    const shapeLinks = selectedRoad.location.shape?.links
    if (!shapeLinks || shapeLinks.length === 0) return null
    
    let allPoints = []
    shapeLinks.forEach(link => {
      if (link.points && link.points.length > 0) {
        allPoints = allPoints.concat(link.points)
      }
    })
    
    if (allPoints.length === 0) return null
    
    const polylineString = allPoints.map(p => `${p.lat},${p.lng}`).join(' ')
    const speedUncapped = selectedRoad.currentFlow.speedUncapped
    const displaySpeed = units === 'metric' ? toKmh(speedUncapped) : toMph(speedUncapped)
    const color = getColorFromSpeed(displaySpeed, units)
    
    return {
      polylineString,
      color,
      road: selectedRoad
    }
  }, [selectedRoad, units, getColorFromSpeed])

  // Get selected road segments for detail view
  const getSelectedRoadSegments = useCallback(() => {
    if (!selectedRoad) return null
    
    const road = selectedRoad
    const overallLength = units === 'metric' ? toKms(road.location.length) : toMiles(road.location.length)
    const overallSpeed = units === 'metric' ? toKmh(road.currentFlow.speed) : toMph(road.currentFlow.speed)
    
    const segments = []
    if (road.currentFlow.subSegments && road.currentFlow.subSegments.length > 0) {
      road.currentFlow.subSegments.forEach((segment, index) => {
        const segmentLength = units === 'metric' ? toKms(segment.length) : toMiles(segment.length)
        const segmentSpeed = units === 'metric' ? toKmh(segment.speedUncapped) : toMph(segment.speedUncapped)
        
        segments.push({
          index: index + 1,
          length: segmentLength,
          speed: segmentSpeed,
          confidence: segment.confidence
        })
      })
    }
    
    return {
      code: road.code,
      description: road.location.description,
      overallLength,
      overallSpeed,
      confidence: road.currentFlow.confidence,
      segments,
      units: units === 'metric' ? { speed: 'km/h', length: 'km' } : { speed: 'mph', length: 'mi' }
    }
  }, [selectedRoad, units])

  return {
    roadData,
    loading,
    error,
    selectedRoad,
    units,
    fetchFlowData,
    getRoadList,
    getRoadShapes,
    selectRoad,
    clearSelection,
    getSelectedRoadPolyline,
    getSelectedRoadSegments,
    heatmapColours,
    speedThresholds
  }
}

export default useTrafficFlow 