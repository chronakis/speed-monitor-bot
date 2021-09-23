const fs = require('fs');

/**
 * Returns the configuration directory
 * args is the array with the command line arguments ommitting node and the name of the script
 */
function getConfigDir() {
  let args = process.argv.slice(2);
  let configDir;
  if (args.length > 0) {
    configDir = './' + args[0];
    if (!fs.existsSync(configDir)) {
      console.error("Configuiration directory does not exist: " + configDir);
      process.exit(1);
    }
  }
  else 
    configDir = ".";

  return configDir;
}


function getConfigFile(file) {
  let dir = getConfigDir();
  return fs.existsSync(dir + '/' + file) ? dir + '/' + file : './' + file;
}


if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getConfigDir, getConfigFile };
}
