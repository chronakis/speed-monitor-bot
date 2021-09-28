/*
 * Configuration for the bot.
 * 
 * Go to https://speedbot.bikesnbytes.net/ to get bbox, LI and PC
 */ 
const config = {
  bbox: '51.5683485976279,-0.098724820824368;51.553859777760984,-0.06477923298446531',
  units: 'imperial',
  tweet: false,
  tweetInterval: 900,
  LI_filter: 'C07-13780',
  PC_filter: 33846,
  limitKm: null,
  limitMi: 20,
  CN_predicate: (cn) => cn > 0.7 && cn <=1,
  statusTemplate:   '${report.date} ${report.time}: '
                  + 'Reported live average speed(s) of ${report.speedsMiText} ${report.locationText} '
                  + 'where the limit is ${report.limitMi} mph #SpeederBot'
                  + ' (just testing, please ignore).'

  /* Available variables for your tweet:
   * report.status          True (successful) or False (failed)
   * report.error           If status if false, this is the error messsage
   * report.road            The road name
   * report.li              The roald unique identifier, including direction
   * report.section         The name of the section of the road
   * report.pc              The unique identifier of the section of the road
   * report.locationText    A convienient text represenation of road and section, suggested to use
   * report.speedCount      The numbrer of speeds the fiter produced
   * report.speedsKm        An array of the speeds in Km/h
   * report.speedsMi        An array of the speeds in MPH
   * report.limitKm         The speed limit in km/h
   * report.limitMi         The speed limit in mph
   * report.speedsKmText    A text summary of the speeds in Km/h, e.g. '30km/h, 35Km/h'(suggested)
   * report.speedsMiText    A text summary of the speeds in mph, e.gg. '30mph, 35mph' (suggested)
   *
   * e.g: Date time: Reported live average speed of SU mph on the road, section.
   *      Date time: Reported live average speeds of SU1 & SU2 mph on various parts of the road, section.
   */

};

/* DO NOT EDIT AFTER THIS LINE */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { config };
}
