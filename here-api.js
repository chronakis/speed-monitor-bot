/**
 * Moves the map to display over Boston using viewBounds
 *
 * @param  {H.Map} map      A HERE Map instance within the application
 */
function setMapViewBounds(map, bbox){
  // Config bbox is 51.5730,-0.0934;51.56555,-0.06516
  // Need to be converted to 51.5730,-0.0934,51.56555,-0.06516
  let bba = bbox.replaceAll(';', ',').split(',');
  let bboxObj = new H.geo.Rect(bba[0], bba[1], bba[2], bba[3]);
  map.getViewModel().setLookAtData({
    bounds: bboxObj
  });
}

/**
 * Takes a shape string and draws a poly line on the map
 */
function addShapeToMap(shapeString) {
  addPolylineToMap(shapes2cords(shapeString));
}



/**
 * Accepts a coordinates array. The format of the array is:
 * [
 *    {lat: FLOAT, lng: FLOAT},
 *    {lat: FLOAT, lng: FLOAT},
 *     ...
 * ]
 */ 
function addPolylineToMap(map, coordsArray) {
  var lineString = new H.geo.LineString();
  coordsArray.forEach( c => lineString.pushPoint(c));

  map.addObject(new H.map.Polyline(
    lineString, { style: { lineWidth: 4 }}
  ));
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

function clearMap() {

}

/**
 * Creates the map and loads it, but it does not center it yet.
 * Retrns the map
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
