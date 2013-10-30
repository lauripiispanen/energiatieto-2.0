angular
    .module("energiatieto-map", ["angular-openlayers", "pubsub"])
    .controller("mapController", [
        "$scope", 
        "$timeout", 
        "formActivationChannel", 
        "buildingSelectionChannel", 
    function($scope, $timeout, formActivationChannel, buildingSelectionChannel) {
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

        var both = [wms, solar];
        var wmsOnly = [wms];
        $scope.layers = wmsOnly;

        var webmercator = new OpenLayers.Projection("EPSG:3857");
        $scope.projection = webmercator;

        $scope.bounds = new OpenLayers.Bounds(2725101.13462, 8410878.26177, 2768515.73603, 8481031.01885);
        $scope.center = new OpenLayers.LonLat(2750850.887954, 8434182.950183);
        $scope.zoom = 13;
        $scope.popups = [];

        formActivationChannel.onStateChange($scope, function(active) {
            $scope.reduced = active;            
        });

        buildingSelectionChannel.onSelectBuilding($scope, function(building) {
            var location = new OpenLayers.LonLat(building.coordinates.lon, building.coordinates.lat);
            $scope.center = location;
            $scope.popups = [
                new OpenLayers.Popup(
                    null,
                    location,
                    new OpenLayers.Size(150,30),
                    "<p class='popup-text'>" + building.address + "</p>"
                )
            ];

            $timeout(function() {
                $scope.zoom = 18;
            }, 100);
            $timeout(function() {
                $scope.$broadcast("_RESIZE_");
            }, 1000);
        });


        $scope.zoomClick = function() {
            if ($scope.reduced) {
                formActivationChannel.deactivate();
            } else {
                select();
            }
        };
        function select() {
            buildingSelectionChannel.selectBuilding({
                coordinates: {
                    lon: 2747542.9468056,
                    lat: 8435120.1215636
                },
                address: "Pihlajatie 3"
            });
        }
        /*
        setTimeout(function() {
            select();
        }, 1);*/


        $scope.$watch("zoom", function(newValue, oldValue) {
            if (newValue >= 17) {
                $scope.layers = both;
            } else {
                $scope.layers = wmsOnly;
            }
        })
    }]);