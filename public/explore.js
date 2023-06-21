var map;                  // The map
var trdata;               // The trafic data for exploring through the console
var flowItemIndex = {};   // The flow items indexd by he LI+'-'+PC string
var shpObjects = [];      // The currently displayed shape objects so that the can be deleted.
var paramCookieKey = 'speedbot-param-cookie';
var dataUnits;            // Will hold the units of the returned data
var resultsActiveTab;

const conv = {
  km2miles: 0.6213712,
  miles2km: 1.609344
};


// TODO Remove the map, the map is good to be global

$( document ).ready(function() {
    // setMapViewBounds(map, botConfig.bbox);
    // getFlowData(here.apiKey, botConfig.bbox);
    let params = loadPramsCookie();
    if (params && params.apiKey && params.bbox) {
      updateMap();
      // if (params.li && params.pc) {
      //   drawFlowItem(params.li + '-' + params.pc);
      // }
    }
});

/**
 * Retrieves the flow data and then processes them
 */
function getFlowData(apiKey, bbox, units) {
  if (units != 'imperial') units = 'metric';

  $.ajax({
    url: 'https://traffic.ls.hereapi.com/traffic/6.1/flow.json',
    type: 'GET',
    dataType: 'jsonp',
    jsonp: 'jsoncallback',
    data: {
      apiKey: apiKey,
      bbox: bbox,
      responseattributes: 'sh',
      units: units
    },
    success: function (data) {
      trdata = data;
      if (data.UNITS != units) {
        alert('Requested and returned units mismatch');
      }
      dataUnits = data.UNITS;
      console.log('The traffic data can be found in the global variable "trdata"');

      $('#bbox').val(bbox);
      populateRoadsTable(data);

      $('#tab-button-manual').click();      
    }
  });
}


/**
 * Clears the table of the speed data
 */
function clearSpeedTable() {
  $('#flow-data-inner').html('');
}

/**
 * Populate the roads and sections
 */
function populateRoadsTable(data) {
  // need to draw a tree of:
  //   RW.DE -> TMC.DE + draw(SHPs)
  // then offer a couple of filters as input boxes to be able to get to the one you want

  let div = $('#results-manual');
  div.append('<div class="roadHeader">Click a road section to plot it on the map and see the speed data. Pan or zoom out, if you can\'t see it. The roads extend beyond the bounding box.</div>');

  let roadways = data.RWS[0].RW;
  roadways
    .sort((rw1, rw2) => {
      let r1 = rw1.DE.localeCompare(rw2.DE);
      if (r1 != 0)
        return r1;
      return (rw1.LI.localeCompare(rw2.LI)); // Directional compare
    })
    .forEach(rw => {
      div.append(`<b>${rw.DE}</b>: `);
      let flowItems = rw.FIS
        .flatMap(fis => fis.FI)
        .map(e => ({
          rw: {LI: rw.LI, DE: rw.DE},
          // Add thE average section SU and SP
          tmc: extObj(e.TMC, {SU: e.CF[0].SU, SP: e.CF[0].SP}),
          samples: (e.CF.flatMap(ve => ve.SSS ? ve.SSS.SS.map(ve2 => {ve2['CN'] = ve.CN; return ve2}) : ve)),
          // Add speed data to the shapes. Ignore sub sections for now
          shapes: e.SHP.map(so => {so['SU'] = e.CF[0].SU; return so})
        }))
        ;

      let text = flowItems.map( fi => {
        let key = rw.LI + '-' + fi.tmc.PC;
        flowItemIndex[key] = fi;
        return `<a href="#" title="${key}" onclick="drawFlowItem('${key}'); return false;">${fi.tmc.DE}</a>`
      }).join(', ');
      div.append(text +'\n');
  });
}

function drawManual() {
  clearMap(shpObjects);  
}

const heatmapColours = {
  20:  {color: '#55eefc', range: '0-20', order: 1},
  30:  {color: '#55b7fc', range: '21-30', order: 2},
  40:  {color: '#3d5ce5', range: '31-40', order: 3},
  50:  {color: '#0010fc', range: '41-50', order: 4},
  60:  {color: '#8758dd', range: '51-60', order: 5},
  70:  {color: '#d147e0', range: '61-70', order: 6},
  200: {color: '#f42c61', range: '71-200', order: 7},
  'n/a': {color: '#000000', range: 'no data/error', order: 8}
};
/*
 * FIXME: Need a metric version
 */
function colorFromScale(spd, units) {
  let colour;
  if (spd <= 0) // error
    colour = heatmapColours['n/a'].color;
  else if ( spd <= 20)
    colour = heatmapColours[20].color;
  else if (spd <= 30)
    colour = heatmapColours[30].color;
  else if (spd <= 40)
    colour = heatmapColours[40].color;
  else if (spd <= 50)
    colour = heatmapColours[50].color;
  else if (spd <= 60)
    colour = heatmapColours[60].color;
  else if (spd <= 70)
    colour = heatmapColours[70].color;
  else if (spd <= 200)
    colour = heatmapColours[200].color;
  else
    colour = heatmapColours['n/a'].color;


  return colour;
}

/**
 * Draws the heatma on the map
 */
function drawHeatmap() {
  clearMap(shpObjects);
  let qd = $('input:radio[name="qd"]:checked').val();

  Object.values(flowItemIndex)
        .filter(fi => fi.rw.LI.includes(qd))
        .forEach(flowItem => {
          // let shapes = flowItem.shapes.map(so => so.value[0]);
          // shapes.forEach( shp => {
          //   let so = addShapeToMap(map, shp);
          //   shpObjects.push(so);
          // });
          flowItem.shapes.forEach( shp => {
            let so = addShapeToMap(map, shp.value[0], colorFromScale(shp.SU), 4);
            shpObjects.push(so);
          });
        });
}

/**
 * Draws the speeding sections on the map (SU > SP)
 */
function drawSpeeding() {
  clearMap(shpObjects);

  let qd = $('input:radio[name="qd"]:checked').val();

  Object.values(flowItemIndex)
        .filter(fi => fi.rw.LI.includes(qd))
        .filter(fi => fi.tmc.SU > fi.tmc.SU)
        .forEach(flowItem => {
          flowItem.shapes.forEach( shp => {
            let so = addShapeToMap(map, shp.value[0], '#F00', 6);
            shpObjects.push(so);
          });
        });
}


function drawFlowItem(key) {
  clearMap(shpObjects);
  let flowItem = flowItemIndex[key];
  let shapes = flowItem.shapes.map(so => so.value[0]); // flow strings array
  //console.log(flowItem.tmc.DE, shapes);

  // Update the filter
  $('#li').val(flowItem.rw.LI);
  $('#pc').val(flowItem.tmc.PC);

  shapes.forEach( shp => {
    let so = addShapeToMap(map, shp);
    shpObjects.push(so);
  });

  previewSpeedData(key);
  saveParamsCookie();
}

function previewSpeedData(key) {
  let uSpd; let uLen; let uConv;
  if (dataUnits == 'metric') {
    uSpd = 'Km/h';
    uLen = 'Km';
    uConv = 1;
  }
  else {
    uSpd = 'mph';
    uLen = 'mi';
    uConv = conv.km2miles;
  }

  $('#flow-data-inner').html('');
  let flowItem = flowItemIndex[key];
  console.log('flowItem', flowItem);

  let headers = '<tr><th>Road</th>'
              + '<th>Section</th>'
              + '<th>Section<br/>length (' + uLen + ')</th>'
              + '<th>Subsection<br/>length (' + uLen + ')</th>'
              + '<th>Confidence (CN)</th>'
              + '<th>Speed - SU (' + uSpd + ')</th></tr>';
  let text = flowItem.samples.reduce((acc, val) => 
    acc + `<tr><td>${flowItem.rw.DE}</td>`
        + `<td>${flowItem.tmc.DE}</td>`
        + `<td class="number">${flowItem.tmc.LE}</td>`
        + `<td class="number">${val.LE ? val.LE : ''}</td>`
        + `<td class="number">${val.CN}</td>`
        + `<td class="number">${val.SU}</td></tr>`,
    '');

  $('#flow-data-inner').html(`<table id="speedTable">${headers}${text}</table`);
}

/**
 * Updates th map bbox with the value form the input box
 */
function updateMap() {
  let bbox = $('#bbox').val();
  let apiKey = $('#apiKey').val();
  let units = $('input:radio[name="units"]:checked').val();

  if (! apiKey || apiKey == '') {
    alert('API KEY is missing');
    return;
  }

  if (!map) {
    map = createAndLoadMap(apiKey,'map');
  }
  else {
    clearMap(shpObjects);
    $('#results-manual').html('');
    $('#li').val('');
    $('#pc').val('');
  }
  setMapViewBounds(map, bbox);
  getFlowData(apiKey, bbox, units);  

  saveParamsCookie();
}

/**
 * Updates the bbox from the map view
 */
function mapToBBox () {
  let b = map.getViewModel().getLookAtData().bounds.getBoundingBox();
  let bbox = `${b.c},${b.a};${b.f},${b.b}`;
  let units = $('input:radio[name="units"]:checked').val();
  let apiKey = $('#apiKey').val();

  $('#bbox').val(bbox);

  clearMap(shpObjects);
  $('#results-manual').html('');
  $('#li').val('');
  $('#pc').val('');
  getFlowData(apiKey, bbox, units);
  saveParamsCookie();
}


function saveParamsCookie() {
  let params = {
    apiKey: $('#apiKey').val(),
    bbox: $('#bbox').val(),
    units: $('input:radio[name="units"]:checked').val(),
    li: $('#li').val(),
    pc: $('#pc').val()
  };
  //console.log('saving cookie', params, JSON.stringify(params),);
  setCookie(paramCookieKey, encodeURIComponent(JSON.stringify(params)), 365);
}

function loadPramsCookie() {
  let val = getCookie(paramCookieKey);
  if (!val || val.trim().length == 0)
    return;

  let params = JSON.parse(decodeURIComponent(val));
  //console.log('loaded cookie', val, params);

  if (params.apiKey)    $('#apiKey').val(params.apiKey);
  if (params.bbox)      $('#bbox').val(params.bbox);
  if (params.li)        $('#li').val(params.li);
  if (params.pc)        $('#pc').val(params.pc);
  if (params.units)     $('#' + params.units).prop('checked', true);

  return params;
}

function eraseParamsCookie() {
  $('#apiKey').val('');
  setCookie(paramCookieKey)
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

function extObj(obj, props) {
  Object.keys(props).forEach(key => obj[key] = props[key]);
  return obj;
}
