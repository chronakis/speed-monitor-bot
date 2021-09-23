# speed-monitor-bot #

A set of tools to help process HERE Maps data written in node js. The twitter bot was inspired by the original [speederbot](https://github.com/BerkshireCar/SpeederBot). It does not depend to any third party service and you can run it from your computer or your Rasberry PI or whatever device you can put node in.

There are three tools in this project:

1. The `monitoring-bot`: This is used to collect traffic flow data for a a set of road sections in a CSV file.
2. The `speeder-bot`: A javascript bot that reports on twitter when the flow data indicate average speeds above a given limit.
3. The `Flow data explorer`: A web tool for identifying the road sections and previewing live data. It is live at [speedbot.bikesnbytes.net](https://speedbot.bikesnbytes.net/), no need to build it. Use this to get your configuration parameters.

## Quick start ###

### I. Pre-requisites ###

You will need.

* A HERE Maps developer account an the API KEY
  * Go [here](https://developer.here.com/), get started for free and create a "Freemium" account and API key. This is instant.
* `node js` installed. You can do this either globally (with an installer) or inside the folder folder (with a zip). The installer will take care of everything. If you do the manual way, just don't for get to make sure the PATH is updated for node and npm. Node Js can be found [here](https://nodejs.org/en/download/).

**If you want to tweet (optional)**

You will need a twitter developer account. Go [here](https://developer.twitter.com/en/apply-for-access) and apply for a hobbyist account. It takes a few ours to get it approved, but you run the bot in "dry run" mode and print the twitter status, so don't wait for it.

**If you want to run the explorer on your own (not recommended)**

A simple http-server. I am suggesting the node module http-server to keep things tidy. To install it, type in the console `npm install http-server -g`. Again, you can choose to install this in your project folder in which case you probably know what you are doing.

### II. Configuration ###

1. **`auth-config.js`**:
   1. Copy the file `auth-config.js.template` into `auth-config.js`
   2. Edit `auth-config.js` and replace your api keys and secrets. You can leave twitter empty, if you don't use it.
2. **`bot-config.js`**:
  1. Copy the file `bot-config.js.template` into `bot-config.js`
  2. Go to [speedbot.bikesnbytes.net](https://speedbot.bikesnbytes.net/) to get your location data. You will need **`bbox`** (area to query), **`LI`** and **`PC`** (road section identifier).
  3. Set a `bbox` from the explorer (alternative way at [here maps](https://developer.here.com/documentation/examples/rest/traffic/traffic-flow-bounding-box))
  4. **`monitoring-bot`**:
     1. Set one or more road setions in the `sections` array. The bot will log data from all those.
   2. Set `logInterval` to the number of seconds between runs. `null` to use in run once mode.
  5. **`speeder-bot`**:
     1. Use `tweet: false` for a dry run to preview what the tweet will look like.
   2. Set `tweetInterval` to the number of seconds between runs. `null` to use in run once mode.
     2. Set the `LI_filter` and `PC_filter`
     3. Set your speed limits ( `limitKm` or `limitMi`)

Note: The bot supports multiple configurations. See run section below


### III. Run the bot(s) ###

For the monitoring bot:
```
node monitoring-bot.js
```
For the speeder bot:
```
node speeder-bot.js
```
If you set the interval, the bot will run forever until killed.

On a un\*x You can use somethign like nohup, daemon, daemonize, at etc. Ir you can just run it with screen. Or you can put it in init if you are crazy enough :)

On windows you can use the task scheduler to run it in the background (remember if you set an interval to run it once). Lots of options on how long to run etc.


### IV. Multiple configurations ###

Pass a configurtion directory from the command line

```
node monitoring-bot.js config-directory
```

- config-directory
   - auth-config.js
   - bot-config.js

If you want to use a single auth-config.js and multiple bot configurations, keep the auth-config.js in the same directory as the bot
and only add bot-config in the cirectories, e.g.:

- monitoring-bot.js
- auth-config.js
- config-dir-1
   - bot-config.js
- config-dir-2
   - bot-config.js

## The future ##

Unfortunatly, when I started this project I did not know that HERE Maps did not report data for Regent's Park, London that I was interested in. I found out after I wrote the first draft of the exlorer. I finished this project only because I got it started and it was interesting playing with map and traffic data, something I haven't done before. I don't have any personal use so I am not that motivated. I am however open to suggestions.

The next things I may implement are:

1. ~~Get the bounding box from the current map view. The HERE Maps page is herendous~~. DONe
2. ~~A speed-audit-bot that will monitor some given roads and create a database of recorded average speeds for analysis.~~. DON

## Thanks & Credits ##

Thanks to the original [speederbot](https://github.com/BerkshireCar/SpeederBot) - [@BerkshireCar](https://twitter.com/BerkshireCar) that kickstarted this work.


## Sources ##

* https://developer.here.com/documentation/traffic/dev_guide/topics/common-acronyms.html
* https://traffic.ls.hereapi.com/traffic/6.0/xsd/flow3.2.2.xsd?apiKey=YOUR_API_KEY_HERE
* https://stackoverflow.com/questions/51658171/traffic-api-flow-within-bounding-box-tag-meaning
* https://stackoverflow.com/questions/64432730/traffic-api-ff-definition-and-fastest-actual-travel-speed-attribute-ff-or-su

