/* 
ARSET Training: Satellite Remote Sensing for Measuring Urban Heat Islands and Constructing Heat Vulnerability Indices
August 2, 2022 - August 11, 2022

This code is free and open. 

The script is adapted from the following source code: 
NASA DEVELOP, 2020, URBAN HEAT EXPOSURE ASSESSMENT TEMPE (UHEAT) Analysis
Tempe Urban Development II
https://github.com/NASA-DEVELOP/UHEAT

Description: This script calculates mean daytime and nighttime land surface temperature (LST) across a given date range 
and year range using the MODIS sensor on the Aqua satellite. Daytime and nighttime LST is calculated from daily Aqua MODIS LST 
and emissivity (global, 1 km).
The example demonstrates how to derive LST for the area surrounding Xanthi, (Greece) to assess the Surface Urban Heat Island (SUHI).

Parameters:
  DATE_RANGE
  YEAR_RANGE
  STUDYBOUNDS
  DISPLAY
*/

// Filter day of year from July 1 to August 31.
var DATE_RANGE = ee.Filter.dayOfYear(182, 212);
// Filter years from 2010 – 2022.
var YEAR_RANGE = ee.Filter.calendarRange(2008, 2017,'year');
// Delineate your area of interest
var STUDYBOUNDS = aoi;
var DISPLAY = true;

 // Center the map on the image.
Map.centerObject(STUDYBOUNDS);

// Set the basemap to display as satellite.
Map.setOptions('SATELLITE');
/* Other basemap options are below
Map.setOptions('HYBRID');
Map.setOptions('ROADMAP');
Map.setOptions('TERRAIN');
*/

// QUALITY MASK
    // Compute the QC bits we need to extract. A Quality Control (QC) band is included in MODIS data products. 
    // Each pixel in the QC band contains a value that represents bit-packed combinations of surface, atmosphere, 
    // and sensor conditions that can affect the overall usefulness of a given pixel.
var getQCBits = function(image, start, end, newName) {
    var pattern = 0;
    for (var i = start; i <= end; i++) {
      pattern += Math.pow(2, i);
    }
    // Return a single band image of the extracted QC bits, giving the band a new name.
    return image.select([0], [newName])
                  .bitwiseAnd(pattern)
                  .rightShift(start);
};

// Mask out cloudy pixels & cloud state using the QC band.
var maskQC = function(image) {
  // Select the QC_Night and QC_Day bands from the MODIS data product
  var QC = image.select('QC_Night','QC_Day');
  // Get the internal_cloud_algorithm_flag bit.
  var cloud = getQCBits(QC, 0,1, 'QC_state')
              .expression("b(0) == 3 || b(0) == 2");
  var error = getQCBits(QC, 6, 7, 'T_err')
              .expression(" b(0) == 3");
  // Return an image masking out cloudy and low quality areas
  image = image.updateMask(error.not());
  return image.updateMask(cloud.not());
};

// RETRIEVING DATA
  // Filter MODIS image collection by year, date ranges, and geographical boundaries. Apply the cloud mask to collection.
  var collection = ee.ImageCollection('MODIS/061/MYD11A1')
 // Filter by the set variables above for day of year range and year range
 .filter(DATE_RANGE)
 .filter(YEAR_RANGE)
 // use above functions to filter cloudy pixels
  .map(maskQC); 
// Print the argument to the console tab.
print(collection);

// TRANSFORM DAYTIME & NIGHTTIME LST TO CELSIUS THROUGH RESCALING
// Derive nighttime LST in Celsius
var NightLST_C = collection.map(function(image)
                {
                  return image.addBands(
                    image.expression(
                '(A * 0.02) - 273.15',
                {
                  'A' : image.select('LST_Night_1km')
                // rename the band LST_Night_1km to LSTN_C  
                }).rename('LSTN_C'))});
                
// Derive daytime LST in Celsius
var DayLST_C = collection.map(function(image)
                {
                  return image.addBands(
                    image.expression(
                '(A * 0.02) - 273.15',
                {
                  'A' : image.select('LST_Day_1km')
                // rename the band LST_Day_1km to LSTD_C 
                }).rename('LSTD_C'))});

print("... Plotting histogram of number of pixels per location (night)");
// Provide a count of LST values per pixel in the image collection at night.          
var counts_LSTN = NightLST_C.select("LSTN_C").count();
// Display the count for our study area in a histogram.
var histogram_LSTN = ui.Chart.image.histogram(counts_LSTN, STUDYBOUNDS, 1000);
print(histogram_LSTN);

print("... Plotting histogram of number of pixels per location (day)");
// Provide the count of LST values per pixel in the image collection during the day.          
var counts_LSTD = DayLST_C.select("LSTD_C").count();
// Display the count for our study area in a histogram.
var histogram_LSTD = ui.Chart.image.histogram(counts_LSTD, STUDYBOUNDS, 1000);
print(histogram_LSTD);

print("... Computing mean across time (night)");
// Calculate mean nighttime LST for each pixel geography in the image collection
var mean_LSTN = NightLST_C.mean();
// return mean_LSTN
print(mean_LSTN);

print("... Computing mean across time (day)");
// Calculate mean daytime LST for each pixel geography in the image collection
var mean_LSTD = DayLST_C.mean();
// return mean_LSTD
print(mean_LSTD);

// Plot a histogram of LST values at night
 print("... Plotting histogram of LST values (night)");
 var cLSTN = mean_LSTN.clip(STUDYBOUNDS);
 var values_LSTN = cLSTN.select("LSTN_C"); 
 var histogram_LSTN_values = ui.Chart.image.histogram(values_LSTN, STUDYBOUNDS, 1000);
 print(histogram_LSTN_values);
 
 // Plot a histogram of LST values during the day
 print("... Plotting histogram of LST values (day)");
 var cLSTD = mean_LSTD.clip(STUDYBOUNDS);
 var values_LSTD = cLSTD.select("LSTD_C"); 
 var histogram_LSTD_values = ui.Chart.image.histogram(values_LSTD, STUDYBOUNDS, 1000);
 print(histogram_LSTD_values);

print('... Mean/Min/Max LST for urban Washington, DC (night)');
// Define a variable to compute the mean, min, and max for an urban polygon layer at night. 
// Polygon was created using the "Draw a shape" tool.
var statsNightUrban = cLSTN.reduceRegions({
  collection: Urban,
  reducer: ee.Reducer.mean().combine({
  reducer2: ee.Reducer.minMax(),
  sharedInputs: true
  }),
  scale: 1000});
  
  // Print the statistics to the console.
print (statsNightUrban);
  
// Define a variable to compute the mean, min, and max for a rural (multipart) polygon layer at night. 
// Multipart polygon was created using the "Draw a shape" tool.
print('... Mean/Min/Max LST for rural Washington, DC (night)');
var statsNightRural = cLSTN.reduceRegions({
  collection: Rural,
  reducer: ee.Reducer.mean().combine({
  reducer2: ee.Reducer.minMax(),
  sharedInputs: true
  }),
  scale: 1000
});

// print the statistics to the console.
print (statsNightRural);

print('... Mean/Min/Max LST for urban Washington, DC (day)');
// Define a variable to compute the mean, min, and max for an urban polygon layer during the day. 
// Polygon was created using the "Draw a shape" tool.
var statsDayUrban = cLSTD.reduceRegions({
  collection: Urban,
  reducer: ee.Reducer.mean().combine({
  reducer2: ee.Reducer.minMax(),
  sharedInputs: true
  }),
  scale: 1000
});

// print the statistics to the console.
print (statsDayUrban);

// Define a variable to compute the mean, min, and max for a rural (multipart) polygon layer during the day.
// Multipart polygon was created using the "Draw a shape" tool.
print('... Mean/Min/Max LST for rural Washington, DC (day)');
var statsDayRural = cLSTD.reduceRegions({
  collection: Rural,
  reducer: ee.Reducer.mean().combine({
  reducer2: ee.Reducer.minMax(),
  sharedInputs: true
  }),
  scale: 1000
});

// Print the statistics to the console.
print (statsDayRural);

// Add the nighttime LST to the map window specifying parameters for visualization.
Map.addLayer(cLSTN, {
  bands: "LSTN_C", 
  min: 18, max: 23, 
  palette: ['blue','white','red']}, "Night LST", DISPLAY);
  
// Add the daytime LST to the map window specifying parameters for visualization.
Map.addLayer(cLSTD, {
  bands: "LSTD_C", 
  min: 28, max: 40, 
  palette: ['blue','white','red']}, "Day LST", DISPLAY);

//*********************** CALCULATE SUHI **********************//
// Function to extract statistics and print them
// Function to print statistics for a given feature
// Function to print statistics for a given feature
// Function to print statistics for a given feature
function printStats(feature, prefix, isNighttime) {
  if (!feature) {
    print('No data available for ' + prefix);
    return;
  }

  var featureInfo = feature.getInfo();
  var properties = featureInfo.properties;
  if (!properties) {
    print('No properties available for ' + prefix);
    return;
  }

  var maxKey = isNighttime ? 'LSTN_C_max' : 'LSTD_C_max';
  var meanKey = isNighttime ? 'LSTN_C_mean' : 'LSTD_C_mean';
  var minKey = isNighttime ? 'LSTN_C_min' : 'LSTD_C_min';

  var maxLST = properties[maxKey];
  var meanLST = properties[meanKey];
  var minLST = properties[minKey];

  if (maxLST !== undefined && meanLST !== undefined && minLST !== undefined) {
    print(prefix + ' Maximum LST: ' + maxLST);
    print(prefix + ' Mean LST: ' + meanLST);
    print(prefix + ' Minimum LST: ' + minLST);
  } else {
    print('Incomplete data for ' + prefix + ' (Missing: ' + (maxLST === undefined ? maxKey + ', ' : '') + (meanLST === undefined ? meanKey + ', ' : '') + (minLST === undefined ? minKey : '') + ')');
  }
}
// Print nighttime statistics for urban Washington, DC
print('... Mean/Min/Max LST for urban Washington, DC (night)');
printStats(statsNightUrban.first(), 'Nighttime', true);

// Print nighttime statistics for rural Washington, DC
print('... Mean/Min/Max LST for rural Washington, DC (night)');
printStats(statsNightRural.first(), 'Nighttime', true);

// Print daytime statistics for urban Washington, DC
print('... Mean/Min/Max LST for urban Washington, DC (day)');
printStats(statsDayUrban.first(), 'Daytime', false);

// Print daytime statistics for rural Washington, DC
print('... Mean/Min/Max LST for rural Washington, DC (day)');
printStats(statsDayRural.first(), 'Daytime', false);


/* To calculate the surface urban heat island (SUHI) for your aoi, find the Mean/Min/Max ST
under the Console tab --> FeatureCollection --> features --> 0: --> properties --> (e.g., LSTN_C_mean)

Subtract the mean urban temperature from the mean rural temperature for day and night (separately).
(LSTN_C_mean [Urban/night]) - (LSTN_C_mean [Rural/night]) = SUHI nighttime intensity
(LSTD_C_mean [Urban/day]) - (LSTD_C_mean [Rural/day]) = SUHI daytime intensity

The intensity of the heat island is the simplest quantitative indicator of the 
thermal modification imposed by a city upon the geography in which it is situated, and 
of its relative warming in relation to the surrounding rural environment. */
var visualizationDay = mean_LSTD.select('LSTD_C').visualize({
  min: 26.76833333,
  max: 41.08769784,
  palette: ['blue', 'white', 'red']
});

// Export the Day LST layer as a GeoTIFF image to Google Drive
Export.image.toDrive({
  image: visualizationDay,
  description: 'Day_LST_Export',
  folder: 'GEE_exports',
  fileNamePrefix: 'Day_LST',
  scale: 1000,
  region: STUDYBOUNDS,
  crs: 'EPSG:4326',
  fileFormat: 'GeoTIFF',
  formatOptions: {
    cloudOptimized: true
  }
});

// Visualize the Night LST layer
var visualizationNight = mean_LSTN.select('LSTN_C').visualize({
  min: 15.34052632,
  max: 20.95691358,
  palette: ['blue', 'white', 'red']
});

// Export the Night LST layer as a GeoTIFF image to Google Drive
Export.image.toDrive({
  image: visualizationNight,
  description: 'Night_LST_Export',
  folder: 'GEE_exports',
  fileNamePrefix: 'Night_LST',
  scale: 1000,
  region: STUDYBOUNDS,
  crs: 'EPSG:4326',
  fileFormat: 'GeoTIFF',
  formatOptions: {
    cloudOptimized: true
  }
});
