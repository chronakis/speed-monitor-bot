const axios = require('axios');
const fs = require('fs');
const botLib = require('./bot-library.js');
const args = process.argv.slice(2);
const authConfig = require(botLib.getConfigFile('auth-config.js'));
const rawConfig = require(botLib.getConfigFile('bot-config.js'));
const botConfig = rawConfig.config;

console.log(`Using ${botLib.getConfigFile('auth-config.js')} and ${botLib.getConfigFile('bot-config.js')}`);


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
    let flowItemsLocFiltered = filterFlowItemsByLocationArray(flowItems, botConfig.sections, botConfig.concat);
    let lines = generateLog(flowItemsLocFiltered, botConfig);
    let log = fs.createWriteStream(botConfig.logFile, { flags: 'a' });
    lines.forEach(l => {
      console.log(l);
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
 * Will return multiple flow items, one per filter match and also enrich them with extra info
 */
function filterFlowItemsByLocationArray(flowItems, sections, concat) {
  let filtered = flowItems.filter(fi => {
    let match = sections.find(sec => sec.li == fi.rw.LI && sec.pc == fi.tmc.PC);
    if (match) {
      fi['humanName'] = match.name ? match.name : fi.rw.DE + '-' + fi.tmc.DE;
      if (match.hasOwnProperty('concat'))
        fi['concat']  = match.concat ? true : false;
      else
        fi['concat']  = concat;
      return true;
    }
    return false;
    });

  // console.log(filtered);
  return filtered;
}


 // TODO:
 // 1. Accumulate the subsections 
 // 2. Calculate journey time
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
    let humanName     = flowItem.humanName;
    let sectionLength = flowItem.tmc.LE;

    let missingData   = false;
    let confidence;
    let speed;
    let subsectionLength = '';

    // Concatenate the subsections to the original section
    if (flowItem.concat) {
      if (flowItem.samples.length == 1) {
          speed = flowItem.samples[0].SU;
          confidence = flowItem.samples[0].CN;
      }
      else {
        let S = 0.0;
        let T = 0.0;
        confidence = flowItem.samples[0].CN;
        flowItem.samples.forEach(smp => {
          // defend for missing data (once in a while)
          if (smp.LE && smp.SU) {
            S  += smp.LE;
            T  += smp.LE / smp.SU;
          }
        });
        if (S > 0 && T > 0)
          speed = S/T;
        else
          missingData = true;
      }

      if (!missingData)
        lines.push(`${timestamp},${road},${section},${humanName},${li},${pc},${sectionLength},${subsectionLength},${confidence},${speed}`);
    }
    // Use one line per subsections. Warning: subsections vary by the minute
    else {
      flowItem.samples.forEach(smp => {
        confidence        = smp.CN;
        subsectionLength  = smp.LE ? smp.LE : '';
        speed             = smp.SU;

        lines.push(`${timestamp},${road},${section},${humanName},${li},${pc},${sectionLength},${subsectionLength},${confidence},${speed}`);
      });
    }
  });
  return lines;
}

