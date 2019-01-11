<?php
error_reporting(E_ALL);
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//	Generate the JS Array Object
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function genAQIPoints()
{

	$aqiPoints;
	$conn = connectDB();

	if($conn) 
	{
		$ix = 0;
		$stmt = $conn->query('SELECT mac, dat, tim, alt, lat, lng, pm1_25_s, pm2_25_s FROM csdbtest WHERE (dat >= 181229 AND lat != 0) GROUP BY mac ORDER BY tim');
		while($row = $stmt->fetch())
		{
			$mac    = $row['mac'];
			$dat	= $row['dat'];
			$tim	= $row['tim'];
			$alt	= $row['alt'];
			$pm1_25 = $row['pm1_25_s'];
			$pm2_25 = $row['pm2_25_s'];
			$lat    = $row['lat'];
			$lng    = $row['lng'];
			//var_dump($row);
			$ary = array ($mac, $dat, $tim, $alt, $pm1_25, $pm2_25, $lat, $lng);
			//var_dump($ary);
			$aqiPoints[$ix++] = $ary;
			$ary = null; 
		}

		//var_dump($aqiPoints);
	
	// Close the DB connection
	$conn = null;
	}

	$ix = 0;
	$js = 1;

	echo('[');
	foreach($aqiPoints as $aq)
	{
		if($ix++ > 0) { echo(",");}
		
		if($js == 1)
		{
		echo('{"mac":"'     . $aq[0] . '",
			   "dat":"'     . $aq[1] . '",
			   "tim":"'     . $aq[2] . '",
			   "alt":"'     . $aq[3] . '",
			   "pm1_25":"'  . $aq[4] . '",
			   "pm2_25":"'  . $aq[5] . '",
			   "lat":"' 	. $aq[6] . '",
			   "lng":"' 	. $aq[7] . '"}');
 		}
 	}
 		echo(']');
}
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//	Open the DB Connection
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function connectDB()
{
	$servername = "localhost";
	$userName   = 'espacela_aqiuser';
	$passWord   = 'Capst0ne18';
	$dbname     = 'espacela_aqi';

	try {
		$conn = new PDO("mysql:host=$servername;dbname=$dbname", $userName, $passWord);
		// set the PDO error mode to exception
		$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		//echo "Connected successfully<br>"; 
		return $conn;
		}
	catch(PDOException $e)
		{
		echo "Connection failed: " . $e->getMessage();
		die();
		}
}

?>