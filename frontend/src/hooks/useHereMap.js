import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Custom hook for HERE Maps integration
 * Handles map initialization, polyline rendering, and road highlighting
 */
const useHereMap = (containerId) => {
  const mapRef = useRef(null)
  const platformRef = useRef(null)
  const groupRef = useRef(null)
  const highlightGroupRef = useRef(null)
  const shapeTrackingRef = useRef(new Map()) // Track shapes by localid for click handling
  
  const [mapReady, setMapReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initialize HERE Maps
  useEffect(() => {
    const initializeMap = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check if HERE Maps API is already loaded
        if (window.H && window.H.service && window.H.ui && window.H.mapevents) {
          console.log('HERE Maps API already loaded')
          createMap()
          return
        }

        // Load HERE Maps API dynamically
        console.log('Loading HERE Maps API...')
        
        // Load core HERE Maps API
        await loadScript('https://js.api.here.com/v3/3.1/mapsjs-core.js')
        
        // Load HERE Maps UI components
        await loadScript('https://js.api.here.com/v3/3.1/mapsjs-ui.js')
        
        // Load HERE Maps behaviors (pan, zoom, etc.)
        await loadScript('https://js.api.here.com/v3/3.1/mapsjs-mapevents.js')
        
        // Load HERE Maps service (for geocoding, routing, etc.)
        await loadScript('https://js.api.here.com/v3/3.1/mapsjs-service.js')

        console.log('HERE Maps API loaded successfully')
        createMap()
        
      } catch (err) {
        console.error('Failed to initialize HERE Maps:', err)
        setError(`Failed to load HERE Maps: ${err.message}`)
        setLoading(false)
      }
    }

    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = src
        script.onload = resolve
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
        document.head.appendChild(script)
      })
    }

    const createMap = () => {
      try {
        console.log('Creating HERE Map...')
        
        // Initialize platform with dummy API key (not needed for basic map display)
        platformRef.current = new window.H.service.Platform({
          'apikey': 'dummy-key-for-display-only'
        })

        // Get default map types from the platform
        const defaultLayers = platformRef.current.createDefaultLayers()

        // Get the container element
        const mapContainer = document.getElementById(containerId)
        if (!mapContainer) {
          throw new Error(`Map container with id '${containerId}' not found`)
        }

        // Initialize the map
        mapRef.current = new window.H.Map(
          mapContainer,
          defaultLayers.vector.normal.map,
          {
            zoom: 12,
            center: { lat: 51.5074, lng: -0.1278 } // London center
          }
        )

        // Enable map interaction (pan, zoom)
        const behavior = new window.H.mapevents.Behavior()
        const ui = new window.H.ui.UI.createDefault(mapRef.current)

        // Create groups for organizing shapes
        groupRef.current = new window.H.map.Group()
        highlightGroupRef.current = new window.H.map.Group()
        
        mapRef.current.getViewModel().setLookAtData({
          zoom: 12,
          center: { lat: 51.5074, lng: -0.1278 }
        })

        mapRef.current.getViewPort().addBehavior(behavior)
        mapRef.current.getViewPort().addChild(ui)
        mapRef.current.addObject(groupRef.current)
        mapRef.current.addObject(highlightGroupRef.current)

        console.log('HERE Map created successfully')
        setMapReady(true)
        setLoading(false)
        
      } catch (err) {
        console.error('Error creating map:', err)
        setError(`Failed to create map: ${err.message}`)
        setLoading(false)
      }
    }

    initializeMap()

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.dispose()
        mapRef.current = null
      }
      platformRef.current = null
      groupRef.current = null
      highlightGroupRef.current = null
      shapeTrackingRef.current.clear()
      setMapReady(false)
    }
  }, [containerId])

  // Set map view bounds
  const setMapViewBounds = useCallback((bbox) => {
    if (!mapRef.current || !mapReady) return

    try {
      const boundingBox = new window.H.geo.Rect(
        bbox.n, // top
        bbox.w, // left  
        bbox.s, // bottom
        bbox.e  // right
      )
      
      mapRef.current.getViewPort().setViewBounds(boundingBox, true)
      console.log('Map view bounds updated:', bbox)
    } catch (error) {
      console.error('Error setting map bounds:', error)
    }
  }, [mapReady])

  // Add tracked polyline shape to map
  const addTrackedShape = useCallback((polylineString, color, width = 4, localid, onShapeClick) => {
    if (!mapRef.current || !groupRef.current || !mapReady) return

    try {
      // Decode polyline
      const lineString = window.H.geo.LineString.fromFlexiblePolyline(polylineString)
      
      // Create polyline object
      const polyline = new window.H.map.Polyline(lineString, {
        style: {
          strokeColor: color,
          lineWidth: width,
          lineCap: 'round',
          lineJoin: 'round'
        }
      })

      // Add click event handler if provided
      if (onShapeClick && localid) {
        polyline.addEventListener('tap', () => {
          onShapeClick(localid)
        })
        
        // Store shape reference for tracking
        if (!shapeTrackingRef.current.has(localid)) {
          shapeTrackingRef.current.set(localid, [])
        }
        shapeTrackingRef.current.get(localid).push(polyline)
      }

      // Add to map
      groupRef.current.addObject(polyline)
      
    } catch (error) {
      console.error('Error adding tracked shape:', error)
    }
  }, [mapReady])

  // Clear all shapes from map
  const clearShapes = useCallback(() => {
    if (!groupRef.current || !mapReady) return

    try {
      groupRef.current.removeAll()
      shapeTrackingRef.current.clear()
      console.log('All shapes cleared from map')
    } catch (error) {
      console.error('Error clearing shapes:', error)
    }
  }, [mapReady])

  // Highlight specific road
  const highlightRoad = useCallback((road, polylineString, baseColor) => {
    if (!mapRef.current || !highlightGroupRef.current || !mapReady) return

    try {
      // Clear existing highlights
      highlightGroupRef.current.removeAll()

      // Create highlight with thicker outline
      const lineString = window.H.geo.LineString.fromFlexiblePolyline(polylineString)
      
      // Create outline (wider, darker)
      const outline = new window.H.map.Polyline(lineString, {
        style: {
          strokeColor: '#000000',
          lineWidth: 8,
          lineCap: 'round',
          lineJoin: 'round'
        }
      })

      // Create main line (original color, slightly thicker)
      const mainLine = new window.H.map.Polyline(lineString, {
        style: {
          strokeColor: baseColor,
          lineWidth: 6,
          lineCap: 'round',
          lineJoin: 'round'
        }
      })

      highlightGroupRef.current.addObject(outline)
      highlightGroupRef.current.addObject(mainLine)
      
      console.log(`Road highlighted: ${road.code}`)
    } catch (error) {
      console.error('Error highlighting road:', error)
    }
  }, [mapReady])

  // Clear road highlighting
  const clearHighlightedRoad = useCallback(() => {
    if (!highlightGroupRef.current || !mapReady) return

    try {
      highlightGroupRef.current.removeAll()
      console.log('Road highlighting cleared')
    } catch (error) {
      console.error('Error clearing road highlight:', error)
    }
  }, [mapReady])

  return {
    mapReady,
    loading,
    error,
    setMapViewBounds,
    addTrackedShape,
    clearShapes,
    highlightRoad,
    clearHighlightedRoad
  }
}

export default useHereMap 