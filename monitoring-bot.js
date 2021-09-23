const axios = require('axios');
const fs = require('fs');
const OAuth = require('oauth');
const authConfig = require('./auth-config.js');
const rawConfig = require('./bot-config.js');
const botConfig = rawConfig.config;


if (botConfig.logInterval) {
  let milliseconds = botConfig.logInterval * 1000;
  run();
  setInterval(run, milliseconds);
}
else {
  run();  
}

function run() {
  axios.get('https://traffic.ls.hereapi.com/traffic/6.1/flow.json', {
      params: {
        apiKey: authConfig.here.apiKey,
        bbox: botConfig.bbox,
        responseattributes: 'sh'      
      }
    })
    .then(res => {
      console.log('Traffic data retrieved at ', new Date());
      doSpeederBot(res.data);
    })
    .catch(err => {
      console.log('Failed to retrieve traffic data', err);
    });

  /**
   * Some convertion constants
   */
  const convertions = {
    km2miles: 0.6213712,
    miles2km: 1.609344
  };
}

/**
 * A function that follows up the traffic data.
 */
function doSpeederBot(data) {
    let flowItems = dataToFlowItems(data);
    let flowItemsLocFiltered = filterFlowItemsByLocationArray(flowItems, botConfig.sections);
    let lines = generateLog(flowItemsLocFiltered, botConfig);
    let log = fs.createWriteStream(botConfig.logFile, { flags: 'a' });
    lines.forEach(l => {
      //console.log(l);
      log.write(l+'\n');
    });
    log.end();
}


/**
 * Processes the raw data into easier flow items
 */
function dataToFlowItems(data) {
  return data.RWS[0].RW.flatMap(rw => 
    rw.FIS
      .flatMap(fis => fis.FI)
      .map(e => ({
        rw: {LI: rw.LI, DE: rw.DE},
        tmc: e.TMC,
        samples: (e.CF.flatMap(ve => ve.SSS ? ve.SSS.SS.map(ve2 => {ve2['CN'] = ve.CN; return ve2}) : ve)),
        shapes: e.SHP
      }))
  );  
}


/**
 *  area: The name of the detailed area
 *  shapes: Shapes to draw
 *  traffic: The TMC object
 *  vehicles: Each SS or CF vehicle
 */
function filterFlowItemsByLocation(flowItems, filter) {
  return flowItems.filter(fi => fi.rw.LI == filter.LI_filter && fi.tmc.PC == filter.PC_filter);
}

/**
 * Will return multiple flow items, one per filter match
 */
function filterFlowItemsByLocationArray(flowItems, sections) {
  //flowItems.forEach(fi => sections.forEach(sec => console.log(`${sec.li} == ${fi.rw.LI} && ${sec.pc} == ${fi.tmc.PC}`)));
  return flowItems.filter(fi => sections.filter(sec => sec.li == fi.rw.LI && sec.pc == fi.tmc.PC).length > 0);
}


 // Timestamp, LI/PC, Road, Section, Section Length, Subsection Length, confidence, speed
function generateLog (flowItems, limits) {
  let dateObj = new Date();
  let timestamp = dateObj.toISOString();
  let date = new Intl.DateTimeFormat('en-GB').format(dateObj);
  let time = new Intl.DateTimeFormat('en-GB', {hour: 'numeric', minute: 'numeric', second: 'numeric'}).format(dateObj);

  let lines = [];
  flowItems.forEach(flowItem => {
    let road          = flowItem.rw.DE;
    let li            = flowItem.rw.LI;
    let pc            = flowItem.tmc.PC;
    let section       = flowItem.tmc.DE;
    let sectionLength = flowItem.tmc.LE;
    flowItem.samples.forEach(smp => {
      let confidence        = smp.CN;
      let subsectionLength  = smp.LE ? smp.LE : '';
      let speed             = smp.SU;

      lines.push(`${timestamp},${road},${li},${pc},${section},${sectionLength},${subsectionLength},${confidence},${speed}`);
    });
  });
  return lines;
}

