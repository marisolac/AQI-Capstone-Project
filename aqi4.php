<!DOCTYPE html>
<!--
	Marker for AQI Data: 
	https://www.flaticon.com/free-icon/map-marker-or-gross-speech-bubble-of-rectangular-rounded-shape_33515#term=map%20marker&page=1&position=80
	Google Maps API key=AIzaSyBvb94y3EdyJ880MtHtRtUGkX4KOSqBU14
	Open Weather Map Key=429f9019cb62ad3552db1e836d2d2cff

-->
<html>
  <head>
  	<title>Capstone AQI Project</title>
  	<!--<link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />-->
  	<?php include_once 'aqiSQL.php'; 
  	      error_reporting(E_ALL);?>
    <link   type="text/css" href="aqi_style.css" rel="stylesheet" media="all" />
    <script type="text/javascript" src="aqi4.js"></script>
    <input  type="hidden" id="aqipoints_json"  value='<?PHP genAQIPoints() ?>' > 
  </head>
  <body onload='initFunction()'>
    <h3>Capstone AQI Project</h3>
		<div class="output"></div>

    	<div id="map"></div>

        <div id="floating-panel">
			<input class = "btn active" onclick="showType(0);" 	  type=button value="Spot AQI">
			<input class = "btn "       onclick="showType(1);" 	  type=button value="6 Hour Avg">
			<input class = "btn "       onclick="showType(2);" 	  type=button value="12 Hour AQI">
			<input class = "btn "       onclick="showType(3);" 	  type=button value="24 Hour AQI">
			<input onclick="showWind();" 	  type=button value="Show Wind">
<!--
        	<select id="selectDate" onchange="GetSelectedTextValue(this)">
				<option>Choose a Trip</option>
		    </select>
		    -->
    	</div> 
    <script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBvb94y3EdyJ880MtHtRtUGkX4KOSqBU14&callback=initMap"></script> 

  </body>
</html>