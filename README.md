# Urban Heat Island (UHI) Analysis in Northern Greece

## Overview
This repository contains the data analysis and source code for studying the Urban Heat Island (UHI) phenomenon in two major cities in Northern Greece: Thessaloniki (the largest city in Macedonia) and Xanthi (in Thrace).

Urban structures such as buildings, roads, and other infrastructure absorb and re-emit solar heat to a greater extent than natural landscapes. As vegetation is replaced by asphalt and concrete, these areas become zones with higher temperatures than their surroundings. This project investigates these temperature variations by analyzing satellite Land Surface Temperature (LST) data, comparing highly concentrated urban areas against surrounding green, semi-urban, and rural zones.

## Data Sources
* **Satellite:** AQUA
* **Sensor:** MODIS (Moderate Resolution Imaging Spectroradiometer)
* **Product:** MYD11_L2 (L3 Global 1km SIN Grid V061) - Day & Night Land Surface Temperature
* **Spatial Resolution:** 1 km
* **Time Period:** 2008 – 2017
* **Seasons Analyzed:** Summer (July - August) & Winter (November - December)

## Methodology
1. **Data Acquisition (Google Earth Engine):**
   * Defined the Areas of Interest (AOI) using exact geographical coordinates.
   * Categorized the selected regions into `urban` and `rural/forest` to establish a comparative baseline for temperature measurements.
2. **Data Preprocessing & Cloud Masking:**
   * Filtered the historical MODIS data for the target timeframes.
   * Applied Quality Control (QC) bit masks to exclude cloud-contaminated pixels and thermal errors, retaining only high-quality, clear-sky observations. When multiple observations were available for a pixel, the mean value was calculated.
3. **Visualization & Mapping:**
   * Base maps of the study areas were generated using Google Earth Pro.
   * Processing and visualization of the final LST maps were executed programmatically.

## Technologies & Libraries
* **Google Earth Engine (GEE)** - Cloud-based geospatial analysis and data extraction
* **Google Earth Pro** - Area mapping
* **Python** - Data processing and visualization
  * `matplotlib` - Plotting and visual representation
  * `rasterio` - Geospatial raster data processing
  * `shapely` - Manipulation and analysis of planar geometric objects

## Results
The satellite data analysis revealed significant differences in the surface temperature distribution between the urban centers and their surrounding natural zones, clearly demonstrating the existence and spatial extent of the urban heat island effect in both Thessaloniki and Xanthi.

## Author
**Γεώργιος Χαλκιάς**
*Environmental Engineer - Integrated Masters, Democritus University Of Thrace*
