=== Acronyms ===

**CN** = A value greater than 0.7 and less than or equal to 1.0 indicates real time speeds
**PC** = Point TMC Location Code

Source: https://developer.here.com/documentation/traffic/dev_guide/topics/common-acronyms.html
Source: https://traffic.ls.hereapi.com/traffic/6.0/xsd/flow3.2.2.xsd?apiKey=YOUR_API_KEY_HERE


=== Speed explaations 1 ===

Looks like this is not the vehicle speed but the average speed for the section of the road.

* **FF** = This indicates the speed on the segment at which vehicles should be considered to be able to travel without impediment. This speed is calculated as a percentile of observed speeds during non-rush hour.
* **SP** = The average speed, capped by the speed limit, that current traffic is travelling.
* **SU** = The average speed, uncapped by the speed limit, that current traffic is travelling
* **LE** = The length of the segment that the average speed is measured

According to the second source, the SU is the actual speed measured by the devices

Source 1: https://stackoverflow.com/questions/51658171/traffic-api-flow-within-bounding-box-tag-meaning
Source 2: https://stackoverflow.com/questions/64432730/traffic-api-ff-definition-and-fastest-actual-travel-speed-attribute-ff-or-su


