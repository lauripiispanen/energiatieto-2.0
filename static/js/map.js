(function() {
	window.addEventListener('load', function() {
		proj4.defs("EPSG:2391", "+proj=tmerc +lat_0=0 +lon_0=21 +k=1 +x_0=1500000 +y_0=0 +ellps=intl +towgs84=-96.062,-82.428,-121.753,4.801,0.345,-1.376,1.496 +units=m +no_defs")
		proj4.defs("EPSG:3126", "+proj=tmerc +lat_0=0 +lon_0=19 +k=1 +x_0=500000 +y_0=0 +ellps=GRS80 +units=m +no_defs")
		proj4.defs("EPSG:3067", "+proj=utm +zone=35 +ellps=GRS80 +units=m +no_defs")
/*
		var projection = new OpenLayers.Projection("EPSG:2391");
		var bounds = new OpenLayers.Bounds(1693568.24, 6668937.75, 1713589.18, 6702429.78);

		var projection = new OpenLayers.Projection("EPSG:3126");
		var bounds = new OpenLayers.Bounds(804693.73, 6676327.55, 823701.43, 6710434.14);
*/		
		var projection = new OpenLayers.Projection("EPSG:3067");
		var bounds = new OpenLayers.Bounds(359769.38, 6663695.01, 382731.34, 6695207.25);
		var wms = new OpenLayers.Layer.WMS(
		  	"Espoo WMS",
		  	"http://kartat.espoo.fi/teklaogcweb/wms.ashx",
		  	{
		  		'layers':'Opaskartta',
		  		'format':'image/png',
		  		units: 'm'
			}
		);

		var map = new OpenLayers.Map(
			'map',
			{
				maxExtent: bounds,
        		restrictedExtent: bounds,
				projection: projection

			}
		);

		map.addLayer(wms);
		
		map.zoomTo(2);
	});
})();