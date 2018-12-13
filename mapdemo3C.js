// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//	This is the main JS module
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

var waypoints_raw  = document.getElementById('waypoint_json').value;
//console.log("Initial waypoints_raw", waypoints_raw);
var celltowers_raw = document.getElementById('celltower_json').value;
var trips_raw  = document.getElementById('tripList_json').value;

var trips      = JSON.parse(trips_raw);

		  console.log("1) waypoints_raw.length: ", waypoints_raw.length)
		  waypoints     = JSON.parse(waypoints_raw);
		  console.log("1) waypoints.length: ", waypoints.length)
//console.log("Parsed waypoints_raw", waypoints);
var celltowers = JSON.parse(celltowers_raw);

var markers     = [];	// Store the Marker objects
var ptNames     = [];	// Store the Pathway objects
var ctNames     = [];	// Store the Cell Tower objects
var pathways    = [];
var aryInfoVars = [];
var ctAry       = [];
var map;

// Build the trip dropdown list
var selTrip = document.getElementById("selectTrip"); 
var num;
var nam;
var el;
var tr;

for(tr in trips) 
{
	num = trips[tr]["trp_num"];
	nam = trips[tr]["trp_nam"];
	el = document.createElement("option");
	el.textContent = num + ", " + nam;
	el.value       = num;
	selTrip.appendChild(el);
}

// Display Trip or Map specific Data
var output = document.querySelector('.output');
output.innerHTML = "Trip Number = ??, Trip Name: ??";

// DEBUGGING ~~~~~~~~~~~~~~~~~~~ DEBUGGING ~~~~~~~~~~~~~~~~~~~~ DEBUGGING
if(LOG_WP == true)
{
	console.log("Way Points")
	for (var key in waypoints)
	{
		console.log(waypoints[key]["gpslat"], waypoints[key]["gpslng"], waypoints[key]["gsmlat"], waypoints[key]["gsmlng"]);
		console.log("Alt:", waypoints[key]["alt"], "Spd: ", waypoints[key]["spd"], "Crs: ", waypoints[key]["crs"]);
	}
} 
if(LOG_CT == true)
{
	console.log("Cell Towers");
	for (var key in celltowers)
	{
		console.log(celltowers[key]["cel_lat"], celltowers[key]["cel_lng"])
	}	
} // DEBUGGING ~~~~~~~~~~~~~~~~~~~ DEBUGGING ~~~~~~~~~~~~~~~~~~~~ DEBUGGING

function initMap() 
{
	// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	// MAP POINTS
	map = new google.maps.Map(document.getElementById('map'), {zoom: 14,  
			  mapTypeControl: true, 
			  mapTypeControlOptions: {
			  style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
			  mapTypeIds: ['roadmap', 'terrain', 'satellite']
			  }});
	// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	genWayPoints();
}	


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Generate JavaScript Waypoints marker points 
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function genWayPoints()
{
	var ix = 0;

	var numWayPoints = waypoints.length
	var bounds       = new google.maps.LatLngBounds();
	var iw           = new google.maps.InfoWindow();
	var totDistance  = 0;		// Total distance for trip
	var aryPrevWpt;
	console.log("Starting new Waypoints:");
	
	for (var kx in waypoints)
	{ 
		if(++ix >= 26) ix = 0   // 26 letters in the alphabet
		var thisCode = String.fromCharCode(65 + ix) + ".png"	// Create the waypoint alphabetic label
		var thisPath = "icons/markers/";
	
		// Assume a normal marker
		var wptColor = thisPath + "green_Marker" + thisCode 
	
		// If there was a tag associated with this, make it BLUE, unless it was queued
		if(waypoints[kx]["tag"] != "0") wptColor = thisPath + "blue_Marker" + thisCode

		// If it was queued, we lose the BLUE tag - / Indicates queued/deferred item
		if(waypoints[kx]["flg"] == "1") wptColor = thisPath + "red_Marker" + thisCode

		 // Indicates first after queued/deferred items, use Yellow
		 if(waypoints[kx]["flg"] == "3") wptColor = thisPath + "yellow_Marker" + thisCode 
	 
		 // Generate the WayPoint
		 var latlng = {lat: Number(waypoints[kx]["gpslat"]), lng: Number(waypoints[kx]["gpslng"])};
		 bounds.extend(latlng)
	 
		 var latlngA = waypoints[kx]["gpslat"] + ", " + waypoints[kx]["gpslng"];

		 var wpt = new google.maps.Marker({icon: wptColor, 
										   position: latlng, 
										   title: latlngA}) 
		 wpt.setMap(map);		// Display the waypoint		 
		 markers.push(wpt);		// Save the Waypoint
		 // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		 // Now make sure we have the Cell Tower
		 genCellTower(waypoints[kx]["cid"], kx);
	 
		 // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
		 // Now generate the info for this point
		 // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

		// Get distance to cell tower and between waypoints
		var arycel = {lat: Number(waypoints[kx]["gsmlat"]) , lng: Number(waypoints[kx]["gsmlng"])}
		var distToCell = distCalc(latlng, arycel)
	
		var thisDist   = (aryPrevWpt == null ? 0 : distance(Number(waypoints[kx]["gpslat"]), Number(waypoints[kx]["gpslng"]), Number(aryPrevWpt["lat"]), Number(aryPrevWpt["lng"]), "M"))

		totDistance += thisDist
		aryPrevWpt = latlng
	
		if(LOG_DS == true)
		{
			console.log("thisDist ",thisDist);
			console.log("totDist ",totDistance);
		}
	
		// This is a function type called "closure" - no idea how it works, but it does
		(function(kx, wpt) {
			// Generate the VAR
			aryInfoVars["iv" + kx] =  
				"<div>" +
				"<h3>" + (waypoints[kx]["tag"] != '0' ?  waypoints[kx]["tag"]  : (waypoints[kx]["flg"] != '0' ? 'No Svc' : 'WPT ')) + " @ " + Number(waypoints[kx]["gpslat"]) + ", " + Number(waypoints[kx]["gpslng"]) + "</h3>" +
				"<p>"  +  waypoints[kx]["dat"] + " - " + waypoints[kx]["tim"] +  (waypoints[kx]["qct"] !=  0  ? ', Queued: ' + waypoints[kx]["qct"] : " ")  + "</p>" +
				"<p>cell tower (" + waypoints[kx]["cid"] + "): " + Math.round(distToCell,2) + " Miles, " + waypoints[kx]["css"] + " dBm</p>" +
				"<p>From Start: " + Math.round(totDistance,2) + " mi, From Last: " + Math.round(thisDist,2) + " mi</p>" +
				"<div>" +
				"<p><b> Alt: " + Math.round(waypoints[kx]["alt"]*3.28) + " ft, Speed: " + Math.round(waypoints[kx]["spd"]*.621371,2) + " mph, Course: " + waypoints[kx]["crs"] + "&deg</b></p>" +
				"</div></div>"

			// Generate the InfoWindow
			iw.setContent(aryInfoVars["iv" + kx]);

			// Generate the Listener
			wpt.addListener('click', function() {iw.open(map, wpt)})
		})(kx, wpt);
		//
		/*
			(function(kx, wpt) {
			// Generate the VAR
			google.maps.event.addListener(wpt, 'click',
				function() {
					var iw =  
					"<div>" +
					"<h3>" + (waypoints[kx]["tag"] != '0' ?  waypoints[kx]["tag"]  : (waypoints[kx]["flg"] != '0' ? 'No Svc' : 'WPT ')) + " @ " + Number(waypoints[kx]["gpslat"]) + ", " + Number(waypoints[kx]["gpslng"]) + "</h3>" +
					"<p>"  +  waypoints[kx]["dat"] + " - " + waypoints[kx]["tim"] +  (waypoints[kx]["qct"] !=  0  ? ', Queued: ' + waypoints[kx]["qct"] : " ")  + "</p>" +
					"<p>cell tower (" + waypoints[kx]["cid"] + "): " + Math.round(distToCell,2) + " Miles, " + waypoints[kx]["css"] + " dBm</p>" +
					"<p>From Start: " + Math.round(totDistance,2) + " mi, From Last: " + Math.round(thisDist,2) + " mi</p>" +
					"<div>" +
					"<p><b> Alt: " + Math.round(waypoints[kx]["alt"]*3.28) + " ft, Speed: " + Math.round(waypoints[kx]["spd"]*.621371,2) + " mph, Course: " + waypoints[kx]["crs"] + "&deg</b></p>" +
					"</div></div>"
				});
			// Generate the InfoWindow
			iw.open(map, wpt);
			bacs0 ----})(kx, wpt);
		*/
	}	// End of For Loop

	// Now adjust the map to fit our waypoints
	map.fitBounds(bounds);

	// Generate the pathways to the cell towers
	genPathways(waypoints);

}      

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Generate Cell Towers marker points 
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function genCellTower(cid, kx)
{
	var nx;
	var res = false;
	
	// See if we've already created this Cell Tower
	for(nx in ctAry)
	{
		if(ctAry[nx] == cid)
		{
			res = true;
			break;
		}
	}
	if(res == false)
	{
		ctAry.push(cid);	// Add to the list
		
		for (var kx in celltowers)
		{
			if((celltowers[kx]["cel_cid"] == cid) && (celltowers[kx]["cel_lat"] != 0 && celltowers[kx]["cel_lng"] != 0))
			{
				// Create latlng var
				var latlng = {lat: Number(celltowers[kx]["cel_lat"]), lng: Number(celltowers[kx]["cel_lng"])};
				// Create latlng label
				var latlngA = celltowers[kx]["cel_cid"] + ", " + celltowers[kx]["cel_lat"] + ", " + celltowers[kx]["cel_lng"];
		
				var ct = new google.maps.Marker({icon: "icons/cell-tower-lg.png", 
												 position: latlng,
												 title: latlngA,
												 map: map});
			ctNames.push(ct);
			}
		}
	}
}
//
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  Create Pathways from endpoints to GSM/Cell Towers
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~	
function JSbldPathways(wayPoints, pwArray)		// JS always pass by reference
{
	// If the GSM LAT = 0, skip the record entirely - Means No Signal
	//NOTE: If there is only one WP for a CID, then no ending LAT/LON 
	var prev_cid = "";
	var numItems = 0;
	var ix       = 0;
	var thisArray = [];
	var gpslat1;
	var gpslon1;
	var gpslat2;
	var gpslon2;
	var gsmlat;
	var gsmlon; 
	
	for(var wp in wayPoints)
	{
		if(prev_cid != "")	// First time through
		{
			// Set last endpoint
			
			// If the CID's have changed
			if(waypoints[wp]["cid"] != prev_cid)
			{ 
				if(numItems == 0)
				{
					thisArray = [{lat: Number(gpslat1), lng: Number(gpslon1)}, {lat: Number(gsmlat), lng: Number(gsmlon)}];
				} else {
					thisArray = [{lat: Number(gpslat1), lng: Number(gpslon1)}, {lat: Number(gsmlat), lng: Number(gsmlon)}, {lat: Number(gpslat2), lng: Number(gpslon2)}];
					numItems = 0;
				}
				
				if(LOG_PW == true)
				{
					console.log("thisArray: ",thisArray);
				}
				
				pwArray[ix++] = thisArray;

			} else {
				// Save the current lat/lon in case it's the last for this CID
				gpslat2  = waypoints[wp]["gpslat"];
				gpslon2  = waypoints[wp]["gpslng"];
				
				numItems++;
			}
		} 
		if(numItems == 0)
		{
			// Set up array with starting LAT/LON and GSM LAT/LON. 
			gpslat1  = waypoints[wp]["gpslat"];
			gpslon1  = waypoints[wp]["gpslng"];
			gsmlat   = waypoints[wp]["gsmlat"];
			gsmlon   = waypoints[wp]["gsmlng"];
			prev_cid = waypoints[wp]["cid"];	// Save CID as current CID
		}
		
	} // endFor

	thisArray = [{lat: Number(gpslat1), lng: Number(gpslon1)}, {lat: Number(gsmlat), lng: Number(gsmlon)}, {lat: Number(gpslat2), lng: Number(gpslon2)}];
	pwArray[ix++] = thisArray;
	
	if(LOG_PW == true)
	{
		console.log("thisArray: ",thisArray);
		console.log("PWArray: ",pwArray);
	}
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Generate the pathways from the wayPoints array 
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function genPathways(waypoints) 
{
	// Define a dashed line symbol using SVG path notation, with an opacity of 1.
	var lineSymbol = {path: "M 0,-1 0,1", strokeOpacity: 1, scale: 2}

	var pathColors = ["#ff6600", "#f40696", "#FF0000", "#d39898", "#00FF00", "#FFA500", "#0000FF"];
	var pcSize = pathColors.length 

	JSbldPathways(waypoints, pathways);

	var nx = 0;	// Index for path names in array
	var px = 0;	// Color index

	for (pw in pathways)
	{
		if(LOG_PW == true)
		{
			console.log(pathways[pw]);
		}
	
		newPath = new google.maps.Polyline({
			path: pathways[pw],
			geodesic: true,
			strokeColor: pathColors[px++],
			strokeOpacity: 0,
			icons: [{icon: lineSymbol,offset: '0',repeat: '10px'}],
			strokeWeight: 1});
		
		newPath.setMap(map);
		ptNames[nx++] = newPath;

		px = (px >= pcSize ? 0 : px);
	}
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//	Distance Calc Routines - Still need work
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function distance(lat1, lon1, lat2, lon2, unit) 
{
	var radlat1 = Math.PI * lat1/180
	var radlat2 = Math.PI * lat2/180
	var theta = lon1-lon2
	var radtheta = Math.PI * theta/180
	var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
	dist = Math.acos(dist)
	dist = dist * 180/Math.PI
	dist = dist * 60 * 1.1515
	if (unit=="K") { dist = dist * 1.609344 }
	if (unit=="N") { dist = dist * 0.8684 }
	return dist
}


function distCalc(source, dest)
{
	var Rad = 6371; // Radius of the earth in km
	var dLat = deg2rad(dest["lat"] - source["lat"]);  // deg2rad below
	var dLon = deg2rad(dest["lng"] - source["lng"]); 
	var a = Math.sin(dLat/2) * Math.sin(dLat/2)
	if(LOG_DS == true)
	{
		console.log("A1: ", a)
	}
	a += Math.cos(deg2rad(source["lat"])) * Math.cos(deg2rad(dest["lat"])) * 
		 Math.sin(dLon/2) * Math.sin(dLon/2)
	  
	if(LOG_DS == true)
	{
		console.log("A2: ", a)
	}
	
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) 
	var d = Rad * c; // Distance in km
	if(LOG_DS == true)
	{
		console.log("Dist calc: ", d * 0.8684)
	}
	return d * 0.8684;	// Distance in Miles
}
function deg2rad(deg)
{
	return deg * (Math.PI/180)
}
// ~~~~~~~~~~~~~~~~~~~~~~~~~~
//  Show/hide the Cell Towers
// ~~~~~~~~~~~~~~~~~~~~~~~~~~
function ct_Show(stat)
{
	for(ct in ctNames){ ctNames[ct].setMap((stat == true ? map : null));}
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~
//  Show the Pathways
// ~~~~~~~~~~~~~~~~~~~~~~~~~~
function pathLine(stat) 
{
	for(pn in ptNames){ ptNames[pn].setMap((stat == true ? map : null));}
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Show selected waypoints
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function showWP(num) 
{
	for(var kx in markers){ (kx % num == 0 ? markers[kx].setMap(map): markers[kx].setMap(null));}
} 
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function GetSelectedTextValue(selectTrip) 
{
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
        // Clear the pathways
        for(var pw in ptNames)
        {
        	ptNames[pw].setMap(null);
        	ptNames[pw] = null;
        }
        ptNames.length = 0;
        // Clear the Cell Towers
        for(var ct in ctNames)
        {
        	ctNames[ct].setMap(null);
        	ctNames[ct] = null
        }
        ctNames.length = 0;
        
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
}

function getNewTrip(tripNum, php_waypoints) 
{
  var xhttp;    
  if (tripNum == "") 
  {
    document.getElementById("waypoint_json").innerHTML = "";
    return;
  }
  xhttp = new XMLHttpRequest();
  
  xhttp.onreadystatechange = function() 
  {
		if (this.readyState == 4 && this.status == 200) 
		{
			console.log("New JSON for trip #: ", tripNum);
	  //  	console.log("AJAX Response: ", this.responseText);
	    //	php_waypoints = this.responseText;
		  document.getElementById("waypoint_json").innerHTML = this.responseText;
		  waypoints_raw = document.getElementById('waypoint_json').value;
		  console.log("waypoints_raw.length: ", waypoints_raw.length)
		  waypoints     = JSON.parse(waypoints_raw);
		  console.log("waypoints.length: ", waypoints.length)
		}
  };
  
  xhttp.open("GET", "mapdemo3C.php?ref=true&tripnum="+tripNum, true);
  xhttp.send();
}