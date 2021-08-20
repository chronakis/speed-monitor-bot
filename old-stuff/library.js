require()

/**
 * RThis 
 *  area: The name of the detailed area
 *  shapes: Shapes to draw
 *  traffic: The TMC object
 *  vehicles: Each SS or CF vehicle
 */
function filterAndTransformData(data) {
  return data.RWS[0].RW
          // Get the FIs
          .flatMap(e => e.FIS).flatMap(e => e.FI) 
          // Transform to the easier array flattening the SSS, if it exists and adding to it the CN
          .map(e => ({area: e.TMC.DE, vehicles: (e.CF.flatMap(ve => ve.SSS ? ve.SSS.SS.map(ve2 => {ve2['CN'] = ve.CN; return ve2}) : ve)), traffic: e.TMC}))

          // Apply the filters
          .filter(e => e.area.search(regxFilter) >= 0);
}

/**
 * Generates a text/tweet report of the speeding vehicles
 */
function generateReport(filteredData) {
    // Findspeeding vehicles:
    let allVehicles = filteredData.flatMap(e => e.vehicles);
    let allCount = allVehicles.length;
    let speedingVehicles = allVehicles.filter(v => v.SU > limit20);
    let speedingCount = speedingVehicles.length;
    
    let date = new Date();
    let dateStr = new Intl.DateTimeFormat('en-GB').format(date);
    let timeStr = new Intl.DateTimeFormat('en-GB', {hour: 'numeric', minute: 'numeric', second: 'numeric'}).format(date);

    let text = dateStr + ' ' + timeStr + ': '
             + speedingCount + ' out of ' + allCount + ' vehicles sampled are moving above the 20 mph limit. '
             + 'Vehicle speed(s) in mph: ' + speedingVehicles.map(v => Math.round(v.SU * km2miles)).join(', ')
             + ' #SpeederBot #RegentsPark';

    return text;
}

/* Hack to work both in mode and in browser */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { bbSmall, bblLarge, regxFilter, km2miles, limit20, filterAndTransformData, generateReport };
}

