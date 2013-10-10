(function() {
	window.addEventListener('load', function() {
		var projection = new OpenLayers.Projection("EPSG:4326");
		var map = new OpenLayers.Map(
			'map',
			{
				projection: "EPSG:4326",
        		displayProjection: "EPSG:4326"
			}
		);
		var wms = new OpenLayers.Layer.WMS(
		  	"OpenLayers WMS",
		  	"http://kartat.espoo.fi/teklaogcweb/wms.ashx",
		  	{
		  		'layers':'Opaskartta',
		  		'format':'image/png'
			}
		);
		map.addLayer(wms);

		var bounds = new OpenLayers.Bounds();
		bounds.extend(new OpenLayers.LonLat(24.27,59.91));
		bounds.extend(new OpenLayers.LonLat(25.25,60.45));
		
		map.zoomToExtent(bounds);
	});
})();