/**
 * Moves the map to display over Boston using viewBounds
 *
 * @param  {H.Map} map      A HERE Map instance within the application
 * @param  {Object} bbox     A bbox object with the following fields:
 *                          {
 *                            s: South_lat,
 *                            w: West_lon,
 *                            n: North_lat,
 *                            e: East_lon
 *                          }
 */
function setMapViewBounds(map, bbox){
  // Bbox from text input is: South_lat, West_lon, North_lat, East_lon

  // The expected geo.Rect has the following fields:
  // top 	  H.geo.Latitude 	  A value indicating the northern-most latitude
  // left 	H.geo.Longitude   A value indicating the left-most longitude
  // bottom H.geo.Latitude 	  A value indicating the southern-most latitude
  // right 	H.geo.Longitude 	A value indicating the right-most latitude

  // We need to convert it
  // let bba = bbox.replaceAll(';', ',').split(',');
  let bboxRect = new H.geo.Rect(bbox.n, bbox.w, bbox.s, bbox.e);
  map.getViewModel().setLookAtData({
    bounds: bboxRect
  });
}

/**
 * Takes a shape string and draws a poly line on the map
 * @param {H.Map} map - The HERE map instance
 * @param {string} shapeString - The shape coordinates string
 * @param {string} color - The color for the polyline
 * @param {number} width - The width of the polyline
 * @param {string} localid - Optional road identifier for click handling
 */
function addShapeToMap(map, shapeString, color, width, localid) {
  return addPolylineToMap(map, shapes2cords(shapeString), color, width, localid);
}

/**
 * Accepts a coordinates array. The format of the array is:
 * [
 *    {lat: FLOAT, lng: FLOAT},
 *    {lat: FLOAT, lng: FLOAT},
 *     ...
 * ]
 * @param {H.Map} map - The HERE map instance
 * @param {Array} coordsArray - Array of coordinate objects
 * @param {string} color - The color for the polyline
 * @param {number} width - The width of the polyline
 * @param {string} localid - Optional road identifier for click handling
 */ 
function addPolylineToMap(map, coordsArray, color, width, localid) {
  var lineString = new H.geo.LineString();
  coordsArray.forEach( c => lineString.pushPoint(c));

  if (!color)    color = '#D33';
  if (!width)    width = 5;

  let poly = new H.map.Polyline(
    lineString, { style: {
      lineWidth: width, strokeColor: color,
      lineHeadCap: 'arrow-head', lineTailCap: 'arrow-tail'  // The arrows are very small but visible
    }}
  );

  // Add click event handler if localid is provided
  if (localid) {
    // Store the localid as custom data on the polyline
    poly.setData({ localid: localid });
    
    // Add click event listener
    poly.addEventListener('tap', function(evt) {
      // Prevent event bubbling to map
      evt.stopPropagation();
      
      // Get the localid from the polyline data
      const clickedLocalid = evt.target.getData().localid;
      
      // Call the road selection function (defined in explore.js)
      if (typeof selectRoad === 'function') {
        selectRoad(clickedLocalid);
      }
    });

    // Add hover effect for better UX
    poly.addEventListener('pointerenter', function(evt) {
      // Change cursor to pointer
      map.getViewPort().getElement().style.cursor = 'pointer';
      
      // Slightly increase line width for hover effect
      const currentStyle = evt.target.getStyle();
      evt.target.setStyle({
        ...currentStyle,
        lineWidth: (currentStyle.lineWidth || width) + 1
      });
    });

    poly.addEventListener('pointerleave', function(evt) {
      // Reset cursor
      map.getViewPort().getElement().style.cursor = 'default';
      
      // Reset line width
      const currentStyle = evt.target.getStyle();
      evt.target.setStyle({
        ...currentStyle,
        lineWidth: width
      });
    });
  }

  map.addObject(poly);
  return poly;
}

/**
 * Accepts a flow data shapes (SHP string) and returns a coordsArray for feeding into addPolylineToMap 
 */ 
function shapes2cords(shapeString) {
  // SHP string: 51.57945,-0.08073 51.57941,-0.08062 51.57937,-0.0805
  let res = shapeString
    .trim()
    .split(' ')
    .map(p => p.split(','))
    .map(pp => ({lat: parseFloat(pp[0]), lng: parseFloat(pp[1])}));

    //console.log("coords array", res);
    
    return res;
}

/**
 * Removes all the objects from the map
 */
function clearMap(shapeObjects) {
  shapeObjects.forEach(so => so.invalidate(H.map.provider.Invalidations.Flag.REMOVE));
  shapeObjects = [];
}

/**
 * Creates the map and loads it, but it does not center it yet.
 * Returns the map
 */
function createAndLoadMap(apiKey, mapDomId) {
  //Step 1: initialize communication with the platform
  // In your own code, replace variable window.apikey with your own apikey
  var platform = new H.service.Platform({
    apikey: apiKey
  });
  var defaultLayers = platform.createDefaultLayers();

  //Step 2: initialize a map - this map is centered over Europe
  var map = new H.Map(document.getElementById(mapDomId),
    defaultLayers.vector.normal.map,{
    center: {lat:50, lng:5},
    zoom: 4,
    pixelRatio: window.devicePixelRatio || 1
  });
  // add a resize listener to make sure that the map occupies the whole container
  window.addEventListener('resize', () => map.getViewPort().resize());

  //Step 3: make the map interactive
  // MapEvents enables the event system
  // Behavior implements default interactions for pan/zoom (also on mobile touch environments)
  var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));

  // Create the default UI components
  var ui = H.ui.UI.createDefault(map, defaultLayers);

  return map;
}



/* Hack to work both in mode and in browser */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createAndLoadMap, setMapViewBounds, addShapeToMap, clearMap};
}
