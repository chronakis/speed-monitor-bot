/**
 * Heatmap Color Scheme and Speed Ranges Configuration
 * 
 * This file defines the color scheme and speed ranges used for the traffic heatmap visualization.
 * Colors progress from cool (slow speeds) to warm (fast speeds).
 */

const heatmapColours = {
  1: {
    color: '#A2D8FF', 
    metricRange: '0-20 km/h', 
    imperialRange: '0-15 mph', 
    order: 1, 
    label: 'Light Blue'
  },
  2: {
    color: '#3C9CF0', 
    metricRange: '21-30 km/h', 
    imperialRange: '16-20 mph', 
    order: 2, 
    label: 'Medium Blue'
  },
  3: {
    color: '#FFF33C', 
    metricRange: '31-40 km/h', 
    imperialRange: '21-25 mph', 
    order: 3, 
    label: 'Yellow'
  },
  4: {
    color: '#FF872F', 
    metricRange: '41-50 km/h', 
    imperialRange: '26-30 mph', 
    order: 4, 
    label: 'Orange'
  },
  5: {
    color: '#f060da', 
    metricRange: '51-60 km/h', 
    imperialRange: '31-40 mph', 
    order: 5, 
    label: 'Red'
  },
  6: {
    color: '#C80BCE', 
    metricRange: '61-70 km/h', 
    imperialRange: '41-50 mph', 
    order: 6, 
    label: 'Purple'
  },
  7: {
    color: '#910bce', 
    metricRange: '71-80+ km/h', 
    imperialRange: '51-60+ mph', 
    order: 7, 
    label: 'Dark Blue'
  },
  'n/a': {
    color: '#555555', 
    metricRange: 'no data/error', 
    imperialRange: 'no data/error', 
    order: 8, 
    label: 'Black'
  }
};

/**
 * Speed thresholds for color classification
 * These define the breakpoints between different color categories
 */
const speedThresholds = {
  metric: {
    // Thresholds in km/h
    t1: 20,
    t2: 30,
    t3: 40,
    t4: 50,
    t5: 60,
    t6: 70,
    t7: 80
  },
  imperial: {
    // Thresholds in mph
    t1: 15,
    t2: 20,
    t3: 25,
    t4: 30,
    t5: 40,
    t6: 50,
    t7: 60
  }
}; 