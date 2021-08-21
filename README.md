# speed-monitor-bot #

This work is the result of attempting to create a node.js clone of the speederbot (TODO: INSERT LINK), a twitter bot that uses here maps traffic flow data to detect speeding in a given road.

Writing the clone was trivial and the code is still here but I had no confidence that the data interpreation was correct. There were two very nagging questions:

1. What is the exact location that I am getting speed data for?
2. Are those data really vehicle speeds?

This project is the result of my attempt to answer those questions and it is still a twitter bot, if you are looking for one (TODO: The road/segment filter needs an update).


## 1. What do the traffic flow data mean? ##

Here maps split roads into segments and further, segments may be split in smaller segments. For example, *A1* has a segment *A503/Seven Sisters Road/Parkhurst Road* with a North direction. It is *1.56276* Km long and the flow data are reported for two subsections, one *0.21* and one *1.35* Km long.

For each of those sections/subsections they report a set of numbers. The most important for speed monitoring are the two following:

* **SU**: Speed uncut, or the average speed of the traffic without taking into account the speed limit. We don't know how many vehicles have been sampled. Could be one, could be many.
* **CN**: The confidence value. The important thing is "**A value greater than 0.7 and less than or equal to 1.0 indicates real time speeds**" (source: https://developer.here.com/documentation/traffic/dev_guide/topics/common-acronyms.html)


So we can more or less assume that the average speed for a subsection of a given distance is the value provided by SU, when `0.7 < CN <= 1.0`

## 2. How do I know what section of the road I am looking at? ##

This is what bothered me most in my quest to find data for Regent's park. So I ended up writing this large (not realted to the bot) piece of code that let's you explore an area of the map, click on roads and segments, see exactly where they are and get a sample of the speed data.

You will need to clone/download the project and run it behind a web server. If you have python, you can switch to the directory of the project and then run `python -m SimpleHTTPServer 8000` to run a web server in port 8000. Then go in your browser to `http://localhost:8000/test.html`

The results will look like ![the screenshot here](https://user-images.githubusercontent.com/493791/130260565-a6a25dd2-b054-4af4-be4c-cd91e3f9945f.png).

## Configuration ##

1. Copy the file named `config.js.template` as `config.js` and edit it.
2. Add your twitter keys, if you want to use the bot
3. Set the `apiKey` and `bbox` in the `here.params`. Get a starting bbox here https://developer.here.com/documentation/examples/rest/traffic/traffic-flow-bounding-box
4. TODO: I am rewriting the filter that identifies the road and segment to tweet about. Please bear with me for a day or two. Thank you.

## Run the road finder and sampler ##

Just load the `test.html` on your browser. But you will need to serve the page through some simple server, such as a python one.


## Run the node.js bot ##
```
node index.js

```

Please note that the bod has an identity crisis at the moment. I am fixing two things:

1. The filter so that it can identify the road to tweet about
2. A logger to log the data collected into the disk.

#### Sources ####

* https://developer.here.com/documentation/traffic/dev_guide/topics/common-acronyms.html
* https://traffic.ls.hereapi.com/traffic/6.0/xsd/flow3.2.2.xsd?apiKey=YOUR_API_KEY_HERE
* https://stackoverflow.com/questions/51658171/traffic-api-flow-within-bounding-box-tag-meaning
* https://stackoverflow.com/questions/64432730/traffic-api-ff-definition-and-fastest-actual-travel-speed-attribute-ff-or-su

