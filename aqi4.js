// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//	This is the main JS module
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
/*
// The Google Map functionality added on the web side can be found here:
// https://google-developers.appspot.com/maps/documentation/static-maps/intro#Markers

// Test URL: 
// https://maps.googleapis.com/maps/api/staticmap?center=44.104403,-121.769206&zoom=15&size=640x640&maptype=terrain&key=AIzaSyBvb94y3EdyJ880MtHtRtUGkX4KOSqBU14
//		   maptype=terrain or satellite, hybrid or roadmap

   Using Customer Markers: https://developers.google.com/maps/documentation/javascript/custom-markers
   Using CUSTOM Markers:   https://medium.com/@barvysta/google-marker-api-lets-play-level-1-dynamic-label-on-marker-f9b94f2e3585
*/
IMAGES_LOC = '/images/';
TYPE_SPOT	= 0;
TYPE_HR06   = 1;
TYPE_HR12   = 2;
TYPE_HR24   = 3;
dispType    = TYPE_SPOT;
dispWind    = false;

aqipoints      = [];
aqiValues_Spot = [];
aqiValues_06Hr = [];
aqiValues_12Hr = [];
allMarkers     = [];
windMarkers    = [];
/*
AQI Color Guide
Green	0-50		Good
Yellow	50-100		Moderate
Orange	101-150		Unhealthy (sensitive group)
Red		151-200		Unhealthy
Violet	201-300+	Very Unhealthy
*/
AQI_Markers = [{"lim":50,  "icon":"green_marker.png"},	// <= 50
			   {"lim":100, "icon":"yellow_marker.png"},
			   {"lim":150, "icon":"orange_marker.png"},
			   {"lim":200, "icon":"red_marker.png"},
			   {"lim":999, "icon":"violet_marker.png"}];

/*
339	0	N	23
24	45	NE	68
69	90	E	113
114	135	SE	158
159	180	S 	203
204	225	SW	248
249	270	W	293
294	315	NW	338
*/

windDir= [{"str":339, "fin": 23 ,"arw":"n_arrow.png"},	// >= 339 || <= 23
		  {"str":24 , "fin": 68 ,"arw":"ne_arrow.png"},	// >= 24  && <= 68
		  {"str":69 , "fin": 113,"arw":"e_arrow.png"},
		  {"str":114, "fin": 158,"arw":"se_arrow.png"},
		  {"str":159, "fin": 203,"arw":"s_arrow.png"},
		  {"str":204, "fin": 248,"arw":"sw_arrow.png"},
		  {"str":249, "fin": 293,"arw":"w_arrow.png"},
		  {"str":294, "fin": 338,"arw":"nw_arrow.png"}];

aryInfoVars = [];
markers     = [];	// Store the Marker objects
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//	This is run on page load
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function initFunction()
{
	//console.log("initFunction");
	var aqipoints_raw  = document.getElementById('aqipoints_json').value;
	//console.log("Initial aqipoints_raw", aqipoints_raw);
	aqipoints     = JSON.parse(aqipoints_raw);

	console.log("Parsed aqipoints_raw", aqipoints);

	/* DEBUGGING ~~~~~~~~~~~~~~~~~~~ DEBUGGING ~~~~~~~~~~~~~~~~~~~~ DEBUGGING
	LOG_WP = false;
	if(LOG_WP == true)
	{
		console.log("AQI Points")
		for (var key in aqipoints)
		{
			console.log("Mac: ",   aqipoints[key]["mac"],    "Lat: ", aqipoints[key]["lat"], "Lng: ", aqipoints[key]["lng"]);
			console.log("pm1_25:", aqipoints[key]["pm1_25"], "pm2_25: ", aqipoints[key]["pm2_25"]);
		}
	} 
	 // DEBUGGING ~~~~~~~~~~~~~~~~~~~ DEBUGGING ~~~~~~~~~~~~~~~~~~~~ DEBUGGING */
	initMap();
	allMarkers = [];		// Clear the array
	genAqiPoints();
}
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//	Initialize the Google Map
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function initMap() 
{
	// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	// MAP POINTS - Center on Bend, Oregon
	map = new google.maps.Map(document.getElementById('map'), 
				{center: {lat: 44.03236000, lng: -121.30470800}, zoom: 14,  
			  mapTypeControl: true, 
			  mapTypeControlOptions: {
			  style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
			  mapTypeIds: ['roadmap', 'terrain', 'satellite']
			  }});
	// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
}	

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Generate  AQI marker points 
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function genAqiPoints()
{
	var bounds       = new google.maps.LatLngBounds();
	var iw           = new google.maps.InfoWindow();

	//console.log("Starting new AQI Marker points:");
	var markerData = [];

	for (var kx in aqipoints)
	{ 
	//console.log("pm1: ", aqipoints[kx]["pm1_25"], ", pm2: ", aqipoints[kx]["pm2_25"])
		// Do the calculations to get the data associated with each of these types
		// For now, they are all the same with some math so we know the buttons are working
		var spotValue = Math.round(((Number(aqipoints[kx]["pm1_25"]) + Number(aqipoints[kx]["pm2_25"])) / 2)).toString();
		var hr06Value = Math.round(((Number(aqipoints[kx]["pm1_25"]) + Number(aqipoints[kx]["pm2_25"])) / 2)+5).toString();
		var hr12Value = Math.round(((Number(aqipoints[kx]["pm1_25"]) + Number(aqipoints[kx]["pm2_25"])) / 2)+10).toString();
		var hr24Value = Math.round(((Number(aqipoints[kx]["pm1_25"]) + Number(aqipoints[kx]["pm2_25"])) / 2)+15).toString();
		
		markerData = [{"value":spotValue,"icon":""}, 	// Create the waypoint  label
					 {"value":hr06Value,"icon":""}, 	    // Create the waypoint  label
					 {"value":hr12Value,"icon":""},
					 {"value":hr24Value,"icon":""}]; 	// Create the waypoint  label
	
		// Get the ICON for this Marker (Color based on AQI value)
		for(itm in markerData)
		{
			markerData[itm]["icon"] = getAQIMarkers(markerData[itm]["value"]);
	 	}
	 	
	 	// Now save the values and icon 
	 	allMarkers.push(markerData);
	 		
		 // Generate the AQI Point
		 var latLng = {lat: Number(aqipoints[kx]["lat"]), lng: Number(aqipoints[kx]["lng"])};
		 bounds.extend(latLng)
		
		 var markerIcon = {
			  url: 	IMAGES_LOC + markerData[dispType]["icon"],				
			  scaledSize: new google.maps.Size(40, 40),
			  origin: new google.maps.Point(00, 0),
			  anchor: new google.maps.Point(32,65),
			  labelOrigin: new google.maps.Point(20,15)
		};
		
		 var wpt = new google.maps.Marker({icon: markerIcon,  //wptColor,
										   position: latLng, //title: latlngA,
										   label: markerData[dispType]["value"]});
	
		 wpt.setMap(map);		// Display the waypoint		 
		 markers.push(wpt);		// Save the Waypoint
		 
		// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// Now do the wind

		// Create FAKE wind arrow from reporting station
		// Get the wind arrow ICON based on the wind direction (Need to also change color with intensity)
		var fakeDir = getWindDir(Math.floor(Math.random() * 360));
		//console.log(fakeDir);
		var windLatlng = {lat: Number(aqipoints[kx]["lat"]) + .055, lng: Number(aqipoints[kx]["lng"]) + .055};
		//console.log("WindLatLng: ", windLatlng);
		
		var windIcon = {
		  url: 	IMAGES_LOC + fakeDir,				
		  scaledSize: new google.maps.Size(40, 40),
		  origin: new google.maps.Point(00, 0),
		  anchor: new google.maps.Point(32,65),		// 32,65
		  labelOrigin: new google.maps.Point(20,15)
		};


		 var windpt = new google.maps.Marker({icon: windIcon,  //wptColor,
										   position: windLatlng, //title: latlngA,
										   label: Math.round(Number(markerData[dispType]["value"])/4).toString()});  // FAKE WIND SPEED
	
		if(dispWind)
		{
		 	windpt.setMap(map);		// Display the wind marker
		 }
		 windMarkers.push(windpt);
		
		 // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		 // Now generate the info for this AQI point
		 // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		// This is a function type called "closure" - no idea how it works, but it does
		(function(kx, wpt) {
			// Generate the VAR
			aryInfoVars["iv" + kx] =  
				"<div>" +
				"<p>" + aqipoints[kx]["mac"] + "</p>" +
				"<p>" + Number(aqipoints[kx]["lat"]) + ", " + Number(aqipoints[kx]["lng"]) + "</p>" +
				"<p>"  + aqipoints[kx]["dat"] + " - " + aqipoints[kx]["tim"] + "</p>" +
				"<div>" +
				"<p><b> Alt: " + Math.round(aqipoints[kx]["alt"]*3.28) + "</b></p>" +
				"</div></div>"

			// Generate the InfoWindow
			iw.setContent(aryInfoVars["iv" + kx]);

			// Generate the Listener
			wpt.addListener('click', function() {iw.open(map, wpt)})
		})(kx, wpt);
	}	// End of For Loop
	/* DEBUGGING ~~~~~~~~~~~~~~~~~~~ DEBUGGING ~~~~~~~~~~~~~~~~~~~~ DEBUGGING
	LOG_WP = false;
	if(LOG_WP == true)
	{
		for(ix in allMarkers)
		{
			console.log(allMarkers[ix]);
			markerData = allMarkers[ix];
			for(jx in markerData)
			{
			console.log("markerLabel: ", markerData[jx]["label"], ", icon: ", markerData[jx]["icon"])
			}
		}
	}
	// DEBUGGING ~~~~~~~~~~~~~~~~~~~ DEBUGGING ~~~~~~~~~~~~~~~~~~~~ DEBUGGING */
	// Now adjust the map to fit our waypoints
	map.fitBounds(bounds);

}   
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//	Look up the correct AQI ICON based on the AQI value
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function getAQIMarkers(aqi)
{
	for(itm in AQI_Markers)
	{
		if(aqi <= AQI_Markers[itm]["lim"]) return AQI_Markers[itm]["icon"];
	}
	// Very unlikely we will ever get here as the last table entry is 999
	return AQI_Markers[AQI_Markers.length - 1]["icon"];
}
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//	Get the wind direction ICON based on the wind direction
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function getWindDir(dir)
{
	//console.log("Wind Dir: ", dir);
	for(itm in windDir)
	{
		if(itm == 0)
		{
			if(dir >= windDir[itm]["str"] || dir <= windDir[itm]["fin"]) return windDir[itm]["arw"];
		}
		if(dir >= windDir[itm]["str"] && dir <= windDir[itm]["fin"]) return windDir[itm]["arw"];
	}

}
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Show selected waypoints
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function showType(num) 
{
	dispType = num;
	// Get the container element
	var btnContainer = document.getElementById("floating-panel");

	// Get all buttons with class="btn" inside the container
	var btns = btnContainer.getElementsByClassName("btn");

	// Loop through the buttons and add the active class to the current/clicked button
	for (var i = 0; i < btns.length; i++) {
	    btns[i].addEventListener("click", function() {
		var current = document.getElementsByClassName("active");
		current[0].className = current[0].className.replace(" active", "");
		this.className += " active";
	  });
	}
} 
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Show selected waypoints
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function showWind(button) 
{
	dispWind  = !dispWind;
	for(win in windMarkers)
	{
		if(dispWind)
		{
			windMarkers[win].setMap(map);		// Display the wind marker
		} else {
			windMarkers[win].setMap(null);		// Display the wind marker
		}
	}
} 
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function GetSelectedTextValue(selectTrip) 
{
 /*
 var selectedText = selectTrip.options[selectTrip.selectedIndex].innerHTML;
        var selectedValue = selectTrip.value;
        
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Clear all existing Map items
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Clear the map
        for(var wp in markers)
        {
        	markers[wp].setMap(null);		// Display the waypoint
        	markers[wp] = null;		 		// Release the object
        }
        markers.length = 0;						// Clear the markers array
        
        // Display Trip or Map specific Data
		var output = document.querySelector('.output');
		output.innerHTML = "Trip Number: " + selectedValue + ", Trip Name: " + selectedText;
		
		console.log("# Old WP: ", waypoints.length);
		waypoints = null;
		var php_waypoints = [];
        getNewTrip(selectedValue, php_waypoints);

        console.log("# New WP: ", waypoints.length);
        console.log("+++++++++++++++++++++++++++++++++");
        console.log("New Parsed WP: ", waypoints[0]);
        console.log("+++++++++++++++++++++++++++++++++");
        genWayPoints();
        */
}

function getNewTrip(tripNum, php_waypoints) 
{
/*
  var xhttp;    
  if (tripNum == "") 
  {
    document.getElementById("waypoint_json").value = "";
    return;
  }
  xhttp = new XMLHttpRequest();
  
  xhttp.onreadystatechange = function() 
  {
		if (this.readyState == 4 && this.status == 200) 
		{
			console.log("New JSON for trip #: ", tripNum);
	  //  	console.log("AJAX Response: ", this.responseText);
	    var	php_waypoints = this.responseText;
		  document.getElementById("waypoint_json").value = this.responseText;
		  waypoints_raw = document.getElementById('waypoint_json').value;
		  console.log("waypoints_raw.length: ", waypoints_raw.length)
		  waypoints     = JSON.parse(waypoints_raw);
		  console.log("waypoints.length: ", waypoints.length)
		}
  };
  
  xhttp.open("GET", "aqiSQL.php?ref=true&tripnum="+tripNum, true);
  xhttp.send();
  */
}