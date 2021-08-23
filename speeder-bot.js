const axios = require('axios');
const OAuth = require('oauth');
const authConfig = require('./auth-config.js');
const rawConfig = require('./bot-config.js');
const botConfig = rawConfig.config;


axios.get('https://traffic.ls.hereapi.com/traffic/6.1/flow.json', {
    params: {
      apiKey: authConfig.here.apiKey,
      bbox: botConfig.bbox,
      responseattributes: 'sh'      
    }
  })
  .then(res => {
    console.log('Traffic data retrieved');
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


/**
 * A function that follows up the traffic data.
 */
function doSpeederBot(data) {
    let flowItems = dataToFlowItems(data);
    let flowItemsLocFiltered = filterFlowItemsByLocation(flowItems, botConfig);
    let report = generateReport(flowItemsLocFiltered, botConfig);
    let statusText = createTweetStatus(report, botConfig.statusTemplate);
    
    if (botConfig.log) {
      console.log("Logging placeholder");
    }

    if (report.speedsCount > 0) {
      if (botConfig.tweet) {
        tweet(statusText, (err, data) => {
          if (err)
            console.error('Tweet failed', err);
          else
            console.log('Tweet succedded', ':', statusText);
        });
      }
      else {
        console.log('Text not tweeted:', statusText);
      }
    }
    else {
      console.log('No speeding cars found', report);
    }
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
 * RThis 
 *  area: The name of the detailed area
 *  shapes: Shapes to draw
 *  traffic: The TMC object
 *  vehicles: Each SS or CF vehicle
 */
function filterFlowItemsByLocation(flowItems, filter) {
  return flowItems.filter(fi => fi.rw.LI == filter.LI_filter && fi.tmc.PC == filter.PC_filter);
}


/**
 * Returns an object to be used for reporting
 * If you leave limits empty, it will return all speeds.
 * limits is an object
 * {
 *    limitKm: limit_in_Km,  
 *    limitMi: limit_in_Miles  
 * }
 * Use one of the two but if you give bot km and miles, it will ignore the miles. examples:
 *  generateReportData (flowItems)                  No limits used
 *  generateReportData (flowItems, {limitKm: 30})                Limit is 30 Km/h
 *  generateReportData (flowItems, {limitMi: 20})                Limit is 20 mph
 *  generateReportData (flowItems, {limitKm: 30, limitMi: 20})   Limit is 30 Km/h
 * 
 */
function generateReport (flowItems, limits) {
  // If no speeding
  //   Date time: Reported live average speed of SU mph on the road, section. All well.
  // if one subsegment:
  //   Date time: Reported live average speed of SU mph on the road, section.
  // if more segments
  //   Date time: Reported live average speeds of SU1 & SU2 mph on various parts of the road, section.
  // 
  // report.date, time, speedsKm, speedsMi, limitKm, limitMi, road, section, 
  // 
  let date = new Date();
  let report = {
    dateObj: date,
    date: new Intl.DateTimeFormat('en-GB').format(date),
    time: new Intl.DateTimeFormat('en-GB', {hour: 'numeric', minute: 'numeric', second: 'numeric'}).format(date)
  };

  // Location LI & PC filters failed
  if (flowItems.length == 0) {
    report['status'] = false;
    report['error'] = 'No flow items returned from road (LI) and section (PC) filters';
    console.log('Error: No flow items', report);    
    return report;
  }


  let limitKm = null;
  if (limits && limits.limitKm)
    limitKm = limits.limitKm;
  else if (limits && limits.limitMi)
    limitKm =  limits.limitMi * convertions.miles2km;

  let spdPredicate = limitKm ? (spd) => spd > limitKm : (spd) => true ;


  report['limitKm'] = limitKm ? Math.round(limitKm) : 'none';
  report['limitMi'] = limitKm ? Math.round(limitKm * convertions.km2miles) : 'none';

  // For now we will only process one road/section
  let flowItem = flowItems[0];
  report['road']    = flowItem.rw.DE;
  report['li']      = flowItem.rw.LI;
  report['section'] = flowItem.tmc.DE;
  report['pc']      = flowItem.tmc.PC;
  report['le']      = flowItem.tmc.LE;

  // Now get the speeds that match the filter
  let speedsKm = flowItem.samples
                  .filter(smp => limits.CN_predicate(smp.CN) && spdPredicate(smp.SU))
                  .map(smp => Math.round(smp.SU));
  let speedsMi = speedsKm.map(spd => Math.round(spd * convertions.km2miles));
  let speedsCount = speedsKm.length;

  report['status']      = true;
  report['error']       = '';
  report['speedsCount'] = speedsCount;
  report['speedsKm']      = speedsKm;
  report['speedsMi']      = speedsMi;

  if (speedsCount == 0) {
    console.log('No speed samples matching criteria', report);    
    return report;
  }
  else if (speedsCount == 1) {
    report['speedsKmText'] = speedsKm[0] + ' Km/h';
    report['speedsMiText'] = speedsMi[0] + ' mph';
    report['locationText'] = `on ${report.road}, ${report.section} section`;
  }
  else {
    report['speedsKmText'] = speedsKm.map(spd => spd + 'Km/h').join(', ');
    report['speedsMiText'] = speedsMi.map(spd => spd + 'mph').join(', ');
    report['locationText'] = `on multiple parts of ${report.road}, ${report.section} section`;
  }

  console.log('report', report);
  return report;
}


/**
 * Substitution variables available
 * 
 * report.status          True (successful) or False (failed)
 * report.error           If status if false, this is the error messsage
 * report.road            The road name
 * report.li              The roald unique identifier, including direction
 * report.section         The name of the section of the road
 * report.pc              The unique identifier of the section of the road
 * report.locationText    A convienient text represenation of road and section, suggested to use
 * report.speedCoiunt     The numbrer of speeds the fiter produced
 * report.speedsKm        An array of the speeds in Km/h
 * report.speedsMi        An array of the speeds in MPH
 * report.speedsKmText    A text summary of the speeds in Km/h, e.g. '30km/h, 35Km/h'(suggested)
 * report.speedsMiText    A text summary of the speeds in mph, e.gg. '30mph, 35mph' (suggested)
 */
function createTweetStatus(report, template) {
  return eval('`' + template + '`');
}


function tweet(statusText) {
  var oauth = new OAuth.OAuth(
    'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
    authConfig.twitter.appKey,
    authConfig.twitter.appSecret,
    '1.0A',
    null,
    'HMAC-SHA1'
  );
  
  let body = ({'status': statusText});
  //let body = ({'status':'Hello!'});

  oauth.post('https://api.twitter.com/1.1/statuses/update.json',
      authConfig.twitter.accessToken,
      authConfig.twitter.accessTokenSecret,
      body,
      "application/json",
      function(error, data, resp) {
          // console.log('\nPOST status:\n');
          // console.log(error || data);
          console.log('Tweet succedded:', statusText);
  });
}
