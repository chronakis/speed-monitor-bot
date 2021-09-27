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
  Promise.all (botConfig.journeys.map(
    journey => axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
        params: {
          key: authConfig.google.apiKey,
          origins: journey.origins,
          destinations: journey.destinations,
          departure_time: 'now'
        },
        custom: {
          name: journey.name
        }
    })))
  .then(responses => {
      console.log('Journey data retrieved at ', new Date());
      let journeyData = responses.map(res=> {
        res.data['journeyName'] = res.config.custom.name;
        return res.data;
      });
      logData(journeyData, botConfig.logFormat);
  })
  .catch(err => {
      console.log('Failed to retrieve traffic data', err);
  });
}


const logHeaders = {
  brief  : 'timestamtp,name,distance,journeyTime',
  here   : 'timestamp,road,section,humanName,li,pc,sectionLength,subsectionLength,confidence,speed,journeyTime',
  google : 'timestamtp,name,origin,destination,distance,journeyTime,timeInTraffic',
};

const logLines = {
  brief  : '${timestamp},${journeyName},${distance},${duration}',
  here   : '${timestamp},${road},${section},${journeyName},${li},${pc},${distance},${subsectionLength},${confidence},${speed},${duration}',
  google : '${timestamp},${journeyName},"${origin}","${destination}",${distance},${duration},${duration_in_traffic}',
};

/**
 * A function that logs the enriched journey times
 */
function logData(data, format) {
    let newFile = !fs.existsSync(botConfig.logFile);
    let log = fs.createWriteStream(botConfig.logFile, { flags: 'a' });

    if (newFile) {
      console.log(logHeaders[format]);
      log.write(logHeaders[format] + '\n');
    }
    let lines = generateLog(data, format);
    lines.forEach(l => {
      console.log(l);
      log.write(l+'\n');
    });
    //log.end();
}


function generateLog (data, format) {
  let dateObj = new Date();
  let timestamp = dateObj.toISOString();
  // let date = new Intl.DateTimeFormat('en-GB').format(dateObj);
  // let time = new Intl.DateTimeFormat('en-GB', {hour: 'numeric', minute: 'numeric', second: 'numeric'}).format(dateObj);
  let road = '';
  let section = '';
  let li = '';
  let pc = '';
  let subsectionLength = '';
  let confidence = '';
  let speed = '';

  return data.map(d => {
    let journeyName         = d.journeyName;
    let origin              = d.origin_addresses[0];
    let destination         = d.destination_addresses[0];
    let elm = d.rows[0].elements[0];
    let distance            = elm.distance.value/1000;
    let duration            = Math.round(elm.duration.value/6)/10;
    let duration_in_traffic = Math.round(elm.duration_in_traffic.value/6)/10;

    return eval('`' + logLines[format] + '`');
  });
}

