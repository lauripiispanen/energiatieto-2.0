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

        var projection = new OpenLayers.Projection("EPSG:3067");
        var bounds = new OpenLayers.Bounds(359769.38, 6663695.01, 382731.34, 6695207.25);

        var projection = new OpenLayers.Projection("EPSG:3857");
        var bounds = new OpenLayers.Bounds(24.48, 60.05, 24.87, 60.38);
*/      
        var projection = new OpenLayers.Projection("EPSG:900913");
        var bounds = new OpenLayers.Bounds(2725101.13462, 8410878.26177, 2768515.73603, 8481031.01885);

        var webmercator = new OpenLayers.Projection("EPSG:3857");

        var wgs84 = new OpenLayers.Projection("EPSG:4326");
        var wgs84bounds = new OpenLayers.Bounds(24.48,60.05,24.87,60.38);
        var displayProjection = webmercator;

        var wms = new OpenLayers.Layer.WMS(
            "Espoo WMS",
            "http://mapproxy.herokuapp.com/service",
            {
                'layers':'espoo_orto',
                'format':'image/jpeg',
            },
            {
                numZoomLevels:20, 
                isBaseLayer: true,
                singleTile: false,
                buffer: 0
            }
        );

        var solar = new OpenLayers.Layer.TMS(
            "Solar",
            "http://espoo-energiatieto-maps.s3.amazonaws.com/solarMapTiles/",
            {
                numZoomLevels:20, 
                maxResolution:156543.0339,
                units: 'm',
                type: 'png',
                srs: wgs84,
                exceptions: "application/vnd.ogc.se_inimage",
                getURL: function(bounds) {
                    var res = this.map.getResolution();
                    var x = Math.round ((bounds.left - this.maxExtent.left) / (res * this.tileSize.w));
                    var y = Math.round ((bounds.bottom - this.maxExtent.bottom) / (res * this.tileSize.h));
                    var z = this.map.getZoom();

                    var path = z + "/" + x + "/" + y + ".png"; 
                    var url = this.url;
                    if (url instanceof Array) {
                        url = this.selectUrl(path, url);
                    }
                    return url + path;
                },
                transparent: true,
                ratio: 1, 
                isBaseLayer: false
            }
        );

        var map = new OpenLayers.Map(
            'map',
            {

                projection: webmercator,
                displayProjection: webmercator,
                restrictedExtent: bounds
            }
        );
    
        map.addLayer(wms);
        map.addLayer(solar);
        map.zoomTo(13);
        map.setCenter(new OpenLayers.LonLat(2750850.887954, 8435182.950183));

    });
})();