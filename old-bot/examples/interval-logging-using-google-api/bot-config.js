/*
 * Interval logging useing google api.
 *
 * Look at bot-config.js.template for documentation
 */ 
const config = {
  log: true,
  logFile: 'google-api-example/log-google.csv',   // Relative to the current directory or absolute
  logInterval: 300,                               // In seconds
  logFormat: 'google',                            // Other options: 'brief', 'here'

  journeys: [
    { origins: '51.563950,-0.092276',   destinations: '51.565414,-0.073334', name: 'Manor road and Lordship park - Eastbound'},
    { origins: '51.563952,-0.092361',   destinations: '51.540953,-0.057492', name: 'Brownswood to London Fields'}
  ],
};

/* DO NOT EDIT BELOW THIS LINE */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { config };
}
