/*
 * Configuration for the bot.
 * 
 * Go to https://speedbot.bikesnbytes.net/ to get bbox, LI and PC
 */ 
const config = {
  bbox: '51.5683485976279,-0.098724820824368;51.553859777760984,-0.06477923298446531',
  units: 'imperial',
  concat: true,       // Recommended if you want comparable rows.

  sections: [
    { li: 'C07-13158', pc: 31199, name: 'Manor road and Lordship park - Eastbound'},
    { li: 'C07+13158', pc: 31198, name: 'Manor road and Lordship park - Westbound'},
    { li: 'C07-00563', pc: 6485 , name: 'Green Lanes - Southbound'},
    { li: 'C07+00563', pc: 6486 , name: 'Green Lanes - Northbound'}
  ],

  log: true,
  logFile: 'google-api-example/log-here.csv',     // Relative to the current directory or absolute
  logInterval: 900,                               // In seconds
  logFormat: 'here',                              // Other options: 'brief'

};

/* DO NOT EDIT BELOW THIS LINE */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { config };
}
