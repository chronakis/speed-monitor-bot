# speed-monitor-bot #

A pure node js twitter bot that reports average speeds based on HERE Maps data, inspired by the original [speederbot](https://github.com/BerkshireCar/SpeederBot). It does not depend to any third party service and you can run it from your computer or your Rasberry PI or whatever device you can put node in.


## Quick start ###

There are two tools in this project:

1. The `Flow data explorer`: A web tool used to find the correct road & section to filter the data.
2. The `speeder-bot`: A javascript bot that reports on twitter when the flow data indicate average speeds above a given limit.


### Pre-requisites ###

You will need.

* A HERE Maps developer account an the API KEY
  * Go [here](https://developer.here.com/), get started for free and create a "Freemium" account and API key. This is instant.
* A twitter developer account.
  * Go [here](https://developer.twitter.com/en/apply-for-access) and apply for a hobbyist account. It takes a few ours to get it approved, but you run the bot in "dry run" mode and print the twitter status, so don't wait for it.
* `node js` installed. You can do this either globally (with an installer) or inside the folder folder (with a zip). The installer will take care of everything. If you do the manual way, just don't for get to make sure the PATH is updated for node and npm. Node Js can be found [here](https://nodejs.org/en/download/).
* A simple http-server. I am suggesting the node module http-server to keep things tidy. To install it, type in the console `npm install http-server -g`. Again, you can choose to install this in your project folder in which case you probably know what you are doing.


### I. Configuration ###

#### Run the explorer to get the location filter ####

1. `auth-confi.js`: Copy the file `auth-config.js.template` into `auth-config.js`
2. Edit `auth-config.js` and replace your api keys and secrets. You can leave twitter for later.
3. `bot-confi.js`: Copy the file `bot-config.js.template` into `bot-config.js`
4. Set a `bbox`: This means bounding box and it is the rectangle on the map that we will be requesting data for.
   * Update: The latest explore commit allows you to set the current map as a bounding box.
   * If you need a different shape, go to [here maps](https://developer.here.com/documentation/examples/rest/traffic/traffic-flow-bounding-box) and draw a bouding box (click at the parameters section, bbox input to pop out the map). Copy the value from the text box and paste it to the bot-config.js, bbox (inside the quotes).
5. Start the server. From the command line, inside the project's folder run `http-server`. This will run the http-server in port 8080. If you need another port, use `http-server --port=8000` or whatever suits you.
6. Open your browser and type: `http://localhost:8080/explore.html`. This will load the explorer.

##### How to use the explorer #####

The explorer screen looks like this:

![the screenshot here](https://user-images.githubusercontent.com/493791/130260565-a6a25dd2-b054-4af4-be4c-cd91e3f9945f.png)

1. On the left, you will see a list of roads: sections.
2. Click on a section and this will
   1. Draw the segment on the map on the right.
   2. You may need to zoom out as the section may be well outside the bbox.
   3. Fill a table with sub-section and speeds per subsection. **All speeds are in metric**.
   4. Show at the top the LI and PC road and section identities.
3. When satisfied, note the LI and PC values down.

#### Finalise configuration ####

Edit the `bot-config.js` and add the filter and the speed limit

1. Set the LI_filter & PC_filter from the value of the explorer. Note: PC_filter is a number not a string.
2. Set your speed limit. `limitKm` or `limitMi`, whatever you want. Only speeds above the limite will be reported by the bot.
3. It is recommended to set `tweet: false` at this stage so that you can test your status messages.

### II. Run the bot ###

```
node speeder-bot.js

```

If the `bot-config.js` had `tweet: false`, the bot will do everything but will only print the status message.

### III. Configure the message and run with twitter ###

Once you get your twitter keys.

1. Edit `auth-config.js` and set your four twitter credentials
2. Change the `bot-config.js` to `tweet: true` to enable twittter
3. Edit the `bot-config.js` `statusTemplate`. The available values to use are in the comment, e.g. report.limitMi. To add a value, use e.g. ${report.limitMi}. Please not some values are arrays so they may not work well.
4. Run as usual. `node speeder-bot.js`. Every run will generate a tweet.

### IV. Scheduled runs ###

Use cron on a un\*x based system or the task scheduler on windows. I am not sure about any API limits but HERE Maps fastest refresh is 3 minutes anyway, so no point runnign ealiest.


## The future ##

Unfortunatly, when I started this project I did not know that HERE Maps did not report data for Regent's Park, London that I was interested in. I found out after I wrote the first draft of the exlorer. I finished this project only because I got it started and it was interesting playing with map and traffic data, something I haven't done before. I don't have any personal use so I am not that motivated. I am however open to suggestions.

The next things I may implement are:

1. Get the bounding box from the current map view. The HERE Maps page is herendous.
2. A speed-audit-bot that will monitor some given roads and create a database of recorded average speeds for analysis.


## Thanks & Credits ##

Thanks to the original [speederbot](https://github.com/BerkshireCar/SpeederBot) - [@BerkshireCar](https://twitter.com/BerkshireCar) that kickstarted this work.


## Sources ##

* https://developer.here.com/documentation/traffic/dev_guide/topics/common-acronyms.html
* https://traffic.ls.hereapi.com/traffic/6.0/xsd/flow3.2.2.xsd?apiKey=YOUR_API_KEY_HERE
* https://stackoverflow.com/questions/51658171/traffic-api-flow-within-bounding-box-tag-meaning
* https://stackoverflow.com/questions/64432730/traffic-api-ff-definition-and-fastest-actual-travel-speed-attribute-ff-or-su

