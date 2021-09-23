var map;                  // The map
var trdata;               // The trafic data for exploring through the console
var flowItemIndex = {};   // The flow items indexd by he LI+'-'+PC string
var shpObjects = [];      // The currently displayed shape objects so that the can be deleted.
var botConfig = config;   // Just copy from the bot-config.js

// TODO Remove the map, the map is good to be global

$( document ).ready(function() {
    map = createAndLoadMap(here.apiKey,'map');
    setMapViewBounds(map, botConfig.bbox);
    getFlowData(here.apiKey, botConfig.bbox);
});

/**
 * Retrieves the flow data and then processes them
 */
function getFlowData(apiKey, bbox) {
  $.ajax({
    url: 'https://traffic.ls.hereapi.com/traffic/6.1/flow.json',
    type: 'GET',
    dataType: 'jsonp',
    jsonp: 'jsoncallback',
    data: {
      apiKey: apiKey,
      bbox: bbox,
      responseattributes: 'sh'
    },
    success: function (data) {
      trdata = data;
      console.log('The traffic data can be found in the global variable "trdata"');

      $('#bbox').val(bbox);
      previewResults(data);
    }
  });
}

/**
 * Preview the results (roads and sectioins)
 */
function previewResults(data) {
  // need to draw a tree of:
  //   RW.DE -> TMC.DE + draw(SHPs)
  // then offer a couple of filters as input boxes to be able to get to the one you want

  let div = $('#results');
  let roadways = data.RWS[0].RW;
  roadways.forEach(rw => {
    div.append(`<b>${rw.DE}</b>: `);
    let flowItems = rw.FIS
      .flatMap(fis => fis.FI)
      .map(e => ({
        rw: {LI: rw.LI, DE: rw.DE},
        tmc: e.TMC,
        samples: (e.CF.flatMap(ve => ve.SSS ? ve.SSS.SS.map(ve2 => {ve2['CN'] = ve.CN; return ve2}) : ve)),
        shapes: e.SHP
      }));

    let text = flowItems.map( fi => {
      let key = rw.LI + '-' + fi.tmc.PC;
      flowItemIndex[key] = fi;
      return `<a href="#" title="${key}" onclick="drawFlowItem('${key}'); return false;">${fi.tmc.DE}</a>`
    }).join(', ');
    div.append(text +'\n');
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
}

function previewSpeedData(key) {
  $('#flow-data').html('');
  let flowItem = flowItemIndex[key];
  console.log('flowItem', flowItem);

  let headers = "<tr><th>Road</th><th>Segment</th><th>Seg Length (LE)</th><th>Sub length (LE)</th><th>Confidence (CN)</th><th>Speed (SU)</th></tr>";
  let text = flowItem.samples.reduce((acc, val) => 
    acc + `<tr><td>${flowItem.rw.DE}</td><td>${flowItem.tmc.DE}</td><td>${flowItem.tmc.LE}</td><td>${val.LE ? val.LE : ''}</td><td>${val.CN}</td><td>${val.SU}</td></tr>`,
    '');
  $('#flow-data').html(`<table>${headers}${text}</table`);
}

/**
 * Updates teh map bbox with the value form the input box
 */
function updateBbox() {
  let bbox = $('#bbox').val();
  clearMap(shpObjects);
  $('#results').html('');
  $('#li').val('');
  $('#pc').val('');
  setMapViewBounds(map, bbox);
  getFlowData(here.apiKey, bbox);  
}

/**
 * Updates the bbox from the map view
 */
function mapToBBox () {
  let b = map.getViewModel().getLookAtData().bounds.getBoundingBox();
  let bbox = `${b.la},${b.ca};${b.ma},${b.ia}`;
  $('#bbox').val(bbox);

  clearMap(shpObjects);
  $('#results').html('');
  $('#li').val('');
  $('#pc').val('');
  getFlowData(here.apiKey, bbox);  
}

