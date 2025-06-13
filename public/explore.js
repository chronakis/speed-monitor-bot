var map;                  // The map
var roadData = {};       // The roads indexed by localid
var shpObjects = [];      // The currently displayed shape objects so that they can be deleted.
var highlightedRoad = null; // Currently highlighted road object
var paramCookieKey = 'speedbot-param-cookie';
// Note: all returned data is in SI units, e.g. metres and metres per second
//       dataUnits is only used for our conversions.
var dataUnits;
var resultsActiveTab;
var roadsTable;       // DataTables instance

// Default bbox for central London: west,south,east,north
const LONDON_BBOX = '-0.1552,51.5200,-0.1218,51.5298';

function toMiles(distance) {
  return distance * 0.000621371; // Convert meters to miles
}
function toKms(distance) {
  return distance * 0.001; // Convert meters to kilometers
}
function toMph(speed) {
  return speed * 2.23694; // Convert meters/second to miles/hour
}
function toKmh(speed) {
  return speed * 3.6; // Convert meters/second to kilometers/hour
}


// TODO Remove the map, the map is good to be global

/**
 * Populates the heatmap legend table with current color scheme
 */
function populateHeatmapLegend() {
  let legendHtml = '';
  let currentUnits = dataUnits || 'metric'; // Default to metric if not set
  
  // Sort by order and generate legend rows
  Object.keys(heatmapColours)
    .filter(key => key !== 'n/a') // Exclude error color from main legend
    .sort((a, b) => heatmapColours[a].order - heatmapColours[b].order)
    .forEach(key => {
      let range = currentUnits === 'metric' ? heatmapColours[key].metricRange : heatmapColours[key].imperialRange;
      legendHtml += `<tr><td style="font-family: monospace;">${range}</td><td style="background: ${heatmapColours[key].color}; width: 5em; height: 1.5em;"></td></tr>`;
    });
  
  // Add error color at the end
  let errorRange = currentUnits === 'metric' ? heatmapColours['n/a'].metricRange : heatmapColours['n/a'].imperialRange;
  legendHtml += `<tr><td style="font-family: monospace;">${errorRange}</td><td style="background: ${heatmapColours['n/a'].color}; width: 5em; height: 1.5em;"></td></tr>`;
  
  $('#heatmap-legend').html(legendHtml);
}

$( document ).ready(function() {
    // Populate the heatmap legend
    populateHeatmapLegend();
    
    // Set heatmap as the default active tab
    $('#tab-button-heatmap').click();
    
    // Ensure defaults are always set
    if (!$('input:radio[name="units"]:checked').length) {
      $('#imperial').prop('checked', true);
    }
    if (!$('input:radio[name="qd"]:checked').length) {
      $('#qd-plus').prop('checked', true);
    }
    
    let params = loadPramsCookie();
    if (params && params.apiKey && params.bbox) {
      setMapToBboxAndFetch();
    }
});

/**
 * Retrieves the flow data and then processes them
 */
function getFlowData(apiKey, bbox, units) {
  if (units != 'imperial') units = 'metric';

  $.ajax({
    url: 'https://data.traffic.hereapi.com/v7/flow',
    type: 'GET',
    dataType: 'json',
    data: {
      apiKey: apiKey,
      in: `bbox:${bbox.w},${bbox.s},${bbox.e},${bbox.n}`,
      responseattributes: 'sh',
      units: units,
      locationReferencing: 'tmc,shape'
    },
    success: function (data) {
      // All units are in SI, e.g. metres and metres per second
      dataUnits = units;
      console.log('AJAX Success. Response', data);

      $('#bbox').val(`${bbox.w},${bbox.s},${bbox.e},${bbox.n}`);
      
      // Clear any previous error messages (but preserve table structure)
      $('#results-manual .error-message').remove();
      
      try {
        updateWithFlowData(data);
        $('#tab-button-heatmap').click();
      } catch (error) {
        console.error('Error processing data:', error);
        $('#results-manual').append(`<p class="error-message" style="color: red;">Error processing data: ${error.message}</p>`);
      }
    },
    error: function(xhr, status, error) {
      console.error('AJAX Error details:', status, error, xhr.responseText, xhr.status);
      
      $('#results-manual .error-message').remove();
      $('#results-manual').append(`<p class="error-message" style="color: red;">Error fetching traffic data: ${error}<br>Status: ${status}<br>HTTP Code: ${xhr.status}</p>`);
      
      // Try to parse error response if it's JSON
      try {
        if (xhr.responseText) {
          let errorData = JSON.parse(xhr.responseText);
          console.error('Parsed error response:', errorData);
          if (errorData.error && errorData.error.description) {
            $('#results-manual').append(`<p class="error-message" style="color: red;">API Error: ${errorData.error.description}</p>`);
          }
        }
      } catch (parseError) {
        console.error('Could not parse error response as JSON');
      }
    }
  });
}


/**
 * Process API response results into roads associative array
 * @param {Array} results - Array of result objects from API response
 * @returns {Object} - Associative array of roads indexed by localid
 */
function updateRoadsData(results) {
  let roads = {};
  
  results.forEach((result, index) => {
    // Check if the expected properties exist
    if (!result.location || !result.location.tmc) {
      console.warn('Missing location or TMC data for result:', result);
      return;
    }
    
    // Create code in format: extendedCountryCode + queuingDirection + locationId
    let extendedCountryCode = result.location.tmc.extendedCountryCode || 'E1';
    let code = `${extendedCountryCode}${result.location.tmc.queuingDirection}${result.location.tmc.locationId}`;
    
    // Create localid as code + index to avoid collisions
    let localid = `${code}-${index}`;
    
    // Create road object - keep original API structure
    let road = {
      location: result.location,
      currentFlow: result.currentFlow,
      code: code,
      localid: localid
    };
    
    // Set description, use fallback if not available
    if (!road.location.description) {
      road.location.description = `Unknown-${code}`;
    }
        
    // Store in roads array
    roads[localid] = road;
  });
  
  return roads;
}

/**
 * Populate the roads and sections
 */
function updateWithFlowData(data) {
  // Clear stuff
  clearMap(shpObjects);   
  
  // Clear any highlighted road
  if (highlightedRoad) {
    map.removeObject(highlightedRoad);
    highlightedRoad = null;
  }

  // Add debugging to see the actual data structure
  console.log('Full API response:', data);
  console.log('Data keys:', Object.keys(data));
  
  // Check if we have the new format (data.results)
  if (data.results && data.results.length > 0) {
    console.log('Processing', data.results.length, 'results');
    console.log('First result sample:', data.results[0]);

    // Process results into roads
    roadData = updateRoadsData(data.results);
    let roads = Object.values(roadData);
    
    console.log('Processed', roads.length, 'roads');

    // Refresh the heatmap legend with current units
    populateHeatmapLegend();

    // Prepare data for DataTables
    let tableData = roads.map(road => {
      // Convert length to appropriate units
      let length = road.location.length;
      if (dataUnits === 'metric') {
        length = toKms(length);
      } else {
        length = toMiles(length);
      }
      
      // Convert speed uncapped to appropriate units (this will be shown as "Speed")
      let speedUncapped = road.currentFlow.speedUncapped;
      if (dataUnits === 'metric') {
        speedUncapped = toKmh(speedUncapped);
      } else {
        speedUncapped = toMph(speedUncapped);
      }
      
      return [
        road.code,
        road.location.description,
        speedUncapped.toFixed(1),
        length.toFixed(3),
        road.localid // Hidden column for row identification
      ];
    });

    console.log('Table data prepared:', tableData.length, 'rows');
    console.log('Sample row:', tableData[0]);

    // Initialize or update DataTable
    if (roadsTable) {
      // Clear existing data and add new data
      roadsTable.clear();
      roadsTable.rows.add(tableData);
      roadsTable.draw();
      
      // Update column headers if units changed
      $(roadsTable.column(2).header()).text(`Speed (${dataUnits === 'metric' ? 'km/h' : 'mph'})`);
      $(roadsTable.column(3).header()).text(`Length (${dataUnits === 'metric' ? 'km' : 'mi'})`);
    } else {
      // Initialize DataTable for the first time
      console.log('Initializing DataTable...');
      console.log('Table element exists:', $('#roadsTable').length > 0);
      console.log('Table element:', $('#roadsTable')[0]);
      
      roadsTable = $('#roadsTable').DataTable({
        data: tableData,
        columns: [
          { title: "Road ID", width: "15%" },
          { title: "Starting from", width: "50%" },
          { 
            title: `Speed (${dataUnits === 'metric' ? 'km/h' : 'mph'})`, 
            width: "15%",
            className: "dt-right"
          },
          { 
            title: `Length (${dataUnits === 'metric' ? 'km' : 'mi'})`, 
            width: "15%",
            className: "dt-right"
          },
          { 
            title: "LocalID", 
            visible: false // Hidden column for row identification
          }
        ],
        paging: false, // Show all rows without pagination
        searching: false, // Remove search box
        info: false, // Remove info text
        order: [[0, 'asc']], // Default sort by Code
        scrollY: '315px',
        scrollCollapse: true,
        language: {
          emptyTable: "No roads found in the API response."
        }
      });

      // Add click handler for row selection
      $('#roadsTable tbody').on('click', 'tr', function() {
        let data = roadsTable.row(this).data();
        if (data) {
          let localid = data[4]; // Hidden localid column (still index 4)
          selectRoad(localid);
        }
      });
      
      console.log('DataTable initialized successfully');
      console.log('DataTable instance:', roadsTable);

      drawHeatmap();    
    }
    
  } else {
    // No recognized data format
    console.error('Unrecognized data format. Keys available:', Object.keys(data));
    console.error('Data structure:', data);
    
    // Show error in DataTable if it exists, otherwise show in div
    if (roadsTable) {
      roadsTable.clear().draw();
    } else {
      $('#results-manual').append('<p style="color: red;">Error: Unable to process API response. Check console for details.</p>');
      
      // Try to show what's available in the response
      if (data && typeof data === 'object') {
        $('#results-manual').append('<p>Available data keys: ' + Object.keys(data).join(', ') + '</p>');
      }
    }
  }
}

/**
 * Selects a road and highlights it in the table
 */
function selectRoad(localid) {
  console.log('selectRoad called with localid:', localid);
  
  // Remove previous DataTable row selection
  $('#roadsTable tbody tr').removeClass('selected');
  
  // Find and highlight the selected row in DataTable
  roadsTable.rows().every(function() {
    let data = this.data();
    if (data && data[4] === localid) { // Check hidden localid column
      $(this.node()).addClass('selected');
    }
  });
  
  // Ensure heatmap is visible (in case we're on road list tab with no heatmap)
  if (shpObjects.length === 0) {
    console.log('No heatmap visible, drawing heatmap first');
    drawHeatmap();
  }
  
  // Draw the road highlight on the map
  drawRoad(localid);
}

/*
 * Color scale function that handles both metric (km/h) and imperial (mph) units
 * Uses externalized color definitions and thresholds from heatmap-styles.js
 */
function colorFromScale(spd, units) {
  let colour;
  
  // Get thresholds from externalized configuration
  let thresholds = speedThresholds[units] || speedThresholds.metric;
  
  if (spd <= 0) // error
    colour = heatmapColours['n/a'].color;
  else if (spd <= thresholds.t1)
    colour = heatmapColours[1].color;
  else if (spd <= thresholds.t2)
    colour = heatmapColours[2].color;
  else if (spd <= thresholds.t3)
    colour = heatmapColours[3].color;
  else if (spd <= thresholds.t4)
    colour = heatmapColours[4].color;
  else if (spd <= thresholds.t5)
    colour = heatmapColours[5].color;
  else if (spd <= thresholds.t6)
    colour = heatmapColours[6].color;
  else if (spd <= thresholds.t7)
    colour = heatmapColours[7].color;
  else
    colour = heatmapColours[7].color; // Use dark blue for speeds above the highest threshold

  return colour;
}

/**
 * Draws the heatmap on the map
 */
function drawHeatmap() {
  // Store current highlighted road info before clearing
  let currentHighlightedLocalid = null;
  if (highlightedRoad) {
    // Find which road is currently highlighted by checking table selection
    let selectedRow = $('#roadsTable tbody tr.selected');
    if (selectedRow.length > 0 && roadsTable) {
      let data = roadsTable.row(selectedRow[0]).data();
      if (data) {
        currentHighlightedLocalid = data[4]; // Hidden localid column
      }
    }
  }
  
  clearMap(shpObjects);
  let qd = $('input:radio[name="qd"]:checked').val();

  Object.values(roadData)
        .filter(road => road.location.tmc.queuingDirection.includes(qd))
        .forEach(road => {
          let shapeLinks = road.location.shape?.links;
          if (shapeLinks && shapeLinks.length > 0) {
            shapeLinks.forEach(link => {
              if (link.points && link.points.length > 0) {
                // Convert points to polyline string format for the map
                let polylineString = link.points.map(p => `${p.lat},${p.lng}`).join(' ');
                // Use speed uncapped from currentFlow for color coding (real speed, not capped)
                let speedUncapped = road.currentFlow.speedUncapped;
                // Convert to appropriate units for color scaling
                let displaySpeed = (dataUnits === 'metric') ? toKmh(speedUncapped) : toMph(speedUncapped);
                // Add shape with click handling - pass localid for road identification
                let so = addShapeToMap(map, polylineString, colorFromScale(displaySpeed, dataUnits), 4, road.localid);
                shpObjects.push(so);
              }
            });
          }
        });
  
  // Redraw highlight if there was one
  if (currentHighlightedLocalid) {
    drawRoad(currentHighlightedLocalid);
  }
}

/**
 * Draws the speeding sections on the map (speed > freeFlow or SU > SP)
 */
function drawSpeeding() {
  clearMap(shpObjects);

  let qd = $('input:radio[name="qd"]:checked').val();

  Object.values(roadData)
        .filter(road => road.location.tmc.queuingDirection.includes(qd))
        .filter(road => road.currentFlow.speedUncapped > road.currentFlow.freeFlow)
        .forEach(road => {
          let shapeLinks = road.location.shape?.links;
          if (shapeLinks && shapeLinks.length > 0) {
            shapeLinks.forEach(link => {
              if (link.points && link.points.length > 0) {
                // Convert points to polyline string format for the map
                let polylineString = link.points.map(p => `${p.lat},${p.lng}`).join(' ');
                let so = addShapeToMap(map, polylineString, '#F00', 6);
                shpObjects.push(so);
              }
            });
          }
        });
}


function drawRoad(localid) {
  // Clear any previous highlighted road
  if (highlightedRoad) {
    map.removeObject(highlightedRoad);
    highlightedRoad = null;
  }
  
  let road = roadData[localid];
  
  if (!road) {
    console.error('Road not found for localid:', localid);
    return;
  }

  console.log('Drawing road:', localid, road);
  
  let shapeLinks = road.location.shape?.links;
  if (shapeLinks && shapeLinks.length > 0) {
    // Combine all links into one continuous polyline
    let allPoints = [];
    shapeLinks.forEach((link, linkIndex) => {
      if (link.points && link.points.length > 0) {
        console.log(`Link ${linkIndex} has ${link.points.length} points`);
        // Add all points from this link to the master list
        allPoints = allPoints.concat(link.points);
      }
    });
    
    if (allPoints.length > 0) {
      // Create one continuous polyline from all points
      let polylineString = allPoints.map(p => `${p.lat},${p.lng}`).join(' ');
      console.log(`Combined polyline has ${allPoints.length} points:`, polylineString.substring(0, 100) + '...');
      
      // Create highlighted road with original color and inverse outline
      drawHighlightedRoad(road, polylineString);
    }
  } else {
    console.warn('No shape links found for location:', road.location.description);
  }

  previewRoadData(localid);
  saveParamsCookie();
}

/**
 * Draws a highlighted road with original color and inverse outline
 */
function drawHighlightedRoad(road, polylineString) {
  // Get the original heatmap color for this road
  let speedUncapped = road.currentFlow.speedUncapped;
  let displaySpeed = (dataUnits === 'metric') ? toKmh(speedUncapped) : toMph(speedUncapped);
  let originalColor = colorFromScale(displaySpeed, dataUnits);
  
  // Calculate inverse color for outline
  let inverseColor = getInverseColor(originalColor);
  
  // Create group to hold the highlight elements
  let group = new H.map.Group();
  
  let coords = shapes2cords(polylineString);
  let lineString = new H.geo.LineString();
  coords.forEach(c => lineString.pushPoint(c));
  
  // Draw outline (wider line with inverse color)
  let outline = new H.map.Polyline(lineString, {
    style: {
      lineWidth: 8, // 4px original + 2px outline on each side
      strokeColor: inverseColor,
      lineCap: 'round',
      lineJoin: 'round'
    }
  });
  group.addObject(outline);
  
  // Draw main road (same width as heatmap, original color)
  let mainRoad = new H.map.Polyline(lineString, {
    style: {
      lineWidth: 4, // Same as heatmap
      strokeColor: originalColor,
      lineCap: 'round',
      lineJoin: 'round'
    }
  });
  group.addObject(mainRoad);
  
  // Add the group to the map
  map.addObject(group);
  
  // Store reference for cleanup
  highlightedRoad = group;
}

/**
 * Calculate inverse color for outline
 */
function getInverseColor(hexColor) {
  // Remove # if present
  hexColor = hexColor.replace('#', '');
  
  // Convert to RGB
  let r = parseInt(hexColor.substr(0, 2), 16);
  let g = parseInt(hexColor.substr(2, 2), 16);
  let b = parseInt(hexColor.substr(4, 2), 16);
  
  // Calculate inverse
  r = 255 - r;
  g = 255 - g;
  b = 255 - b;
  
  // Convert back to hex
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function previewRoadData(localid) {
  let uSpd; let uLen;
  if (dataUnits == 'metric') {
    uSpd = 'Km/h';
    uLen = 'Km';
  }
  else {
    uSpd = 'mph';
    uLen = 'mi';
  }

  $('#flow-data-inner').html('');
  let road = roadData[localid];
  
  if (!road) {
    console.error('Road not found for localid:', localid);
    return;
  }

  console.log('road', road);

  // Calculate overall values for header
  let overallLength = road.location.length;
  let overallSpeed = road.currentFlow.speed;
  
  // Convert units if needed
  if (dataUnits !== 'metric') {
    overallLength = toMiles(overallLength);
    overallSpeed = toMph(overallSpeed);
  } else {
    overallLength = toKms(overallLength);
    overallSpeed = toKmh(overallSpeed);
  }

  // Create column headers first
  let columnHeaders = '<tr style="background-color: #f0f0f0;">'
                    + '<th style="padding: 8px; text-align: left;">Segment</th>'
                    + '<th style="padding: 8px; text-align: right;">Speed (' + uSpd + ')</th>'
                    + '<th style="padding: 8px; text-align: right;">Confidence</th>'
                    + '<th style="padding: 8px; text-align: right;">Length (' + uLen + ')</th></tr>';

  // Create header row with same column structure - lighter background, black text
  let headerRow = `<tr style="background-color: #b3b3d9; color: black; font-weight: bold; font-size: 16px;">
                     <td style="padding: 12px; text-align: left;">${road.code} <span style="font-weight: normal;">starting from</span> ${road.location.description}</td>
                     <td style="padding: 12px; text-align: right;">${overallSpeed.toFixed(2)}</td>
                     <td style="padding: 12px; text-align: right;">${road.currentFlow.confidence.toFixed(2)}</td>
                     <td style="padding: 12px; text-align: right;">${overallLength.toFixed(3)}</td>
                   </tr>`;
  
  let rows = '';
  
  // Add segment rows if they exist
  if (road.currentFlow.subSegments && road.currentFlow.subSegments.length > 0) {
    road.currentFlow.subSegments.forEach((segment, index) => {
      let segmentLength = segment.length;
      let segmentSpeedUncapped = segment.speedUncapped;
      
      // Convert units if needed
      if (dataUnits !== 'metric') {
        segmentLength = toMiles(segmentLength);
        segmentSpeedUncapped = toMph(segmentSpeedUncapped);
      } else {
        segmentLength = toKms(segmentLength);
        segmentSpeedUncapped = toKmh(segmentSpeedUncapped);
      }
      
      rows += `<tr>
                 <td style="padding: 6px;">Segment-${index + 1}</td>
                 <td style="padding: 6px; text-align: right;">${segmentSpeedUncapped.toFixed(2)}</td>
                 <td style="padding: 6px; text-align: right;">${segment.confidence.toFixed(2)}</td>
                 <td style="padding: 6px; text-align: right;">${segmentLength.toFixed(3)}</td>
               </tr>`;
    });
  }

  // Add total row with darker background
  rows += `<tr style="background-color: #e0e0e0; font-weight: bold;">
             <td style="padding: 6px;">Total</td>
             <td style="padding: 6px; text-align: right;">${overallSpeed.toFixed(2)}</td>
             <td style="padding: 6px; text-align: right;">${road.currentFlow.confidence.toFixed(2)}</td>
             <td style="padding: 6px; text-align: right;">${overallLength.toFixed(3)}</td>
           </tr>`;

  // Create footnote
  let footnote = `<tr>
                    <td colspan="4" style="padding: 8px; font-size: 11px; color: #666; background-color: transparent; text-align: center; border: none;">
                      Details on the metrics can be found at <a href="https://developer.here.com/documentation/traffic/dev_guide/topics/common-acronyms.html" target="_blank" style="color: #666;">HERE Maps documentation</a>
                    </td>
                  </tr>`;

  $('#flow-data-inner').html(`<table id="speedTable" style="width: 100%; border-collapse: collapse;">
                                ${columnHeaders}
                                ${headerRow}
                                ${rows}
                                ${footnote}
                              </table>`);
}

/**
 * Parses a bbox text string into a bbox object
 * @param {string} bboxText - Bbox string in format "South_lat, West_lon, North_lat, East_lon"
 * @returns {Object|null} - Bbox object with s,w,n,e properties or null if invalid
 */
function parseBboxText(bboxText) {
  if (!bboxText) return null;
  
  const bboxArr = bboxText.trim().split(',').map(Number);
  if (bboxArr.length !== 4 || bboxArr.some(isNaN)) {
    return null;
  }

  return {
    w: bboxArr[0],  // South latitude
    s: bboxArr[1],  // West longitude  
    e: bboxArr[2],  // North latitude
    n: bboxArr[3]   // East longitude
  };
}

/**
 * Updates th map bbox with the value form the input box
 */
function updateMap() {
  const bboxText = $('#bbox').val().trim();
  const apiKey = $('#apiKey').val().trim();
  dataUnits = $('input:radio[name="units"]:checked').val() || 'imperial';

  if (! apiKey || apiKey == '') {
    alert('API KEY is missing');
    return;
  }

  const bbox = parseBboxText(bboxText);
  
  if (!map) {
    // This just creates the default map
    // No positioning, nothing else
    map = createAndLoadMap(apiKey,'map');
  }
  else {
    clearMap(shpObjects);
    // Clear DataTable data instead of removing the entire table structure
    if (roadsTable) {
      roadsTable.clear().draw();
    }
  }

  console.log('bbox', bbox);
  setMapViewBounds(map, bbox);

  getFlowData(apiKey, bbox, dataUnits);  
  saveParamsCookie();
}

/**
 * Button 1: Set map to bbox and fetch flow data
 * Sets the map view to the bounding box defined in the text box, then fetches flow data
 */
function setMapToBboxAndFetch() {
  const bboxText = $('#bbox').val().trim();
  const apiKey = $('#apiKey').val().trim();
  dataUnits = $('input:radio[name="units"]:checked').val() || 'imperial';

  if (!apiKey || apiKey == '') {
    alert('API KEY is missing');
    return;
  }

  if (!bboxText) {
    alert('Bounding box is required');
    return;
  }

  const bbox = parseBboxText(bboxText);
  if (!bbox) {
    alert('Invalid bounding box format. Use: west,south,east,north');
    return;
  }
  
  if (!map) {
    // Create the map if it doesn't exist
    map = createAndLoadMap(apiKey, 'map');
  } else {
    clearMap(shpObjects);
    // Clear DataTable data instead of removing the entire table structure
    if (roadsTable) {
      roadsTable.clear().draw();
    }
  }

  console.log('Setting map to bbox:', bbox);
  setMapViewBounds(map, bbox);

  // Fetch flow data for this bbox
  getFlowData(apiKey, bbox, dataUnits);  
  saveParamsCookie();
}

/**
 * Button 2: Fetch flow data from current map view
 * Sets the bbox based on current map view, then fetches flow data
 */
function fetchFlowDataFromMap() {
  const apiKey = $('#apiKey').val().trim();
  dataUnits = $('input:radio[name="units"]:checked').val() || 'imperial';

  if (!apiKey || apiKey == '') {
    alert('API KEY is missing');
    return;
  }

  if (!map) {
    alert('Map not initialized. Please use "Set map to bbox" first.');
    return;
  }

  // Get current map bounds and update the bbox input
  const b = map.getViewModel().getLookAtData().bounds.getBoundingBox();
  const { W, ca, fa, ga } = b;
  const bboxText = `${W},${ga},${ca},${fa}`;
  
  $('#bbox').val(bboxText);
  
  const bbox = parseBboxText(bboxText);
  console.log('Fetching flow data for current map view:', bbox);

  clearMap(shpObjects);
  // Clear DataTable data instead of removing the entire table structure
  if (roadsTable) {
    roadsTable.clear().draw();
  }

  // Fetch flow data for current map view
  getFlowData(apiKey, bbox, dataUnits);
  saveParamsCookie();
}

function saveParamsCookie() {
  let params = {
    apiKey: $('#apiKey').val(),
    bbox: $('#bbox').val(),
    units: $('input:radio[name="units"]:checked').val() || 'imperial',
    qd: $('input:radio[name="qd"]:checked').val() || '+'
  };
  setCookie(paramCookieKey, encodeURIComponent(JSON.stringify(params)), 365);
}

function loadPramsCookie() {
  let val = getCookie(paramCookieKey);
  if (!val || val.trim().length == 0)
    return;

  let params = JSON.parse(decodeURIComponent(val));

  if (params.apiKey)    $('#apiKey').val(params.apiKey);
  if (params.bbox)      $('#bbox').val(params.bbox);
  
  // Set units with default to imperial
  if (params.units) {
    $('#' + params.units).prop('checked', true);
  } else {
    $('#imperial').prop('checked', true);
  }
  
  // Set queuing direction with default to +
  if (params.qd) {
    $('#qd-' + (params.qd === '+' ? 'plus' : 'minus')).prop('checked', true);
  } else {
    $('#qd-plus').prop('checked', true);
  }

  return params;
}

function eraseParamsCookie() {
  $('#apiKey').val('');
  $('#bbox').val(LONDON_BBOX); // Reset to London bbox
  
  // Reset to defaults
  $('#imperial').prop('checked', true);
  $('#qd-plus').prop('checked', true);
  
  setCookie(paramCookieKey, '', -1); // Delete the cookie
}

function resTab(tab, name) {
  $('span.res-tab').removeClass('active');
  $('div.results-tab-content').hide();

  $(tab).addClass('active');
  $('#results-' + name).show();
  resultsActiveTab = name;

  if (name == 'heatmap') {
    $('div#qd-div').show();
    drawHeatmap();
  }
  else if (name == 'speeding') {
    $('div#qd-div').show();
    drawSpeeding();
  }
  else {
    $('div#qd-div').hide();
    drawManual();
  }
}

function changeQD(qdInput) {
  let name = resultsActiveTab;
  if (name == 'heatmap')
    drawHeatmap();
  else if (name == 'speeding')
    drawSpeeding();
}

function drawManual() {
  // When switching to manual/road list tab, preserve the heatmap and any highlights
  // Users can see both the heatmap and browse the table simultaneously
  // No need to clear anything - the heatmap provides useful context
}


