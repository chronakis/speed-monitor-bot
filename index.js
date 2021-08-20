const axios = require('axios');
const OAuth = require('oauth');
const config = require('./config.js');


axios.get('https://traffic.ls.hereapi.com/traffic/6.1/flow.json', {
    params: config.here.params
  })
  .then(res => {
    console.log('TMC data retrieved');
    followUpFlowResponse(res.data);
  })
  .catch(err => {
    console.log(err);
  });


/**
 * A function that follows up the traffic data
 */
function followUpFlowResponse(data) {
    let fd = filterAndTransformData(data, config.here);
    let stats = extractStats(fd);
    let text = templateToText(config.twitter.statusTemplate, fd, stats);

    
    if (config.steps.log) {
      console.log("Logging placeholder");
    }

    if (config.steps.tweet) {
      tweet(text, (err, data => {
        if (err)
          console.error('tweet failed', err);
        else
          console.log('tweet succedded', ':', text);
      }));
    }
    else {
      console.log('text not tweeted:', text);
    }
}

/**
 * RThis 
 *  area: The name of the detailed area
 *  shapes: Shapes to draw
 *  traffic: The TMC object
 *  vehicles: Each SS or CF vehicle
 */
function filterAndTransformData(data, hereConfig) {
  return data.RWS[0].RW
    // Get the FIs
    .flatMap(e => e.FIS).flatMap(e => e.FI) 
    
    // Transform to the easier array flattening the SSS, if it exists and adding to it the CN
    .map(e => ({area: e.TMC.DE, vehicles: (e.CF.flatMap(ve => ve.SSS ? ve.SSS.SS.map(ve2 => {ve2['CN'] = ve.CN; return ve2}) : ve)), traffic: e.TMC}))

    // Apply the filters
    .filter(e => e.area.search(hereConfig.roadRegExp) >= 0);
}


/**
 * Get some aggregate stats from the data */
function extractStats (data) {
  let samples = data.flatMap(e => e.vehicles);
  let samplesAboveLimit = samples.filter(v => v.SU > config.here.limitMiles * config.misc.miles2km);
  let date = new Date();

  let stats = {
    date: date,
    dateStr: new Intl.DateTimeFormat('en-GB').format(date),
    timeStr: new Intl.DateTimeFormat('en-GB', {hour: 'numeric', minute: 'numeric', second: 'numeric'}).format(date),
    samples: samples,
    samplesLen: samples.length,
    samplesAboveLimit: samplesAboveLimit,
    samplesAboveLimitLen: samplesAboveLimit.length
  };

  return stats;
}


function templateToText(template, fd, stats) {
  // stDate
  // stTime
  // stSpeed
  // stSpeedMph
  // stLimit
  // stSegment
  let stDate = stats.dateStr;
  let stTime = stats.timeStr;
  let stSpeedMph = '30, 32, 35';
  let stSegment = 'my road';

  return eval('`' + template + '`');
}


function tweet(statusText) {
  var oauth = new OAuth.OAuth(
    'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
    twitter.appKey,
    twitter.appSecret,
    '1.0A',
    null,
    'HMAC-SHA1'
  );
  
  let body = ({'status': statusText + '(testing phase)'});
  //let body = ({'status':'Hello!'});

  oauth.post('https://api.twitter.com/1.1/statuses/update.json',
      twitter.accessToken,
      twitter.accessTokenSecret,
      body,
      "application/json",
      function(error, data, resp) {
          console.log('\nPOST status:\n');
          console.log(error || data);
  });
}
