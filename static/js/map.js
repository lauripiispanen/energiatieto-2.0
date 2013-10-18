angular
    .module("energiatieto", ["angular-openlayers"])
    .controller("mapController", ["$scope", function($scope) {
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
                opacity: 0.6, 
                isBaseLayer: false
            }
        );

        //$scope.layers = [wms, solar];
        $scope.layers = [wms];

        var webmercator = new OpenLayers.Projection("EPSG:3857");
        $scope.projection = webmercator;

        $scope.bounds = new OpenLayers.Bounds(2725101.13462, 8410878.26177, 2768515.73603, 8481031.01885);
        $scope.center = new OpenLayers.LonLat(2750850.887954, 8434182.950183);
        $scope.zoom = 13;

        $scope.zoomClick = function() {
            $scope.center = new OpenLayers.LonLat(2749180.6952344, 8436179.2011772);
            setTimeout(function() {
                $scope.$apply(function() {
                    $scope.zoom = 18;
                })
            }, 100);
        };
        $scope.$watch("zoom", function(newValue, oldValue) {
            if (newValue >= 17) {
                $scope.layers = [wms, solar];
            } else {
                $scope.layers = [wms];
            }
        })
    }]);