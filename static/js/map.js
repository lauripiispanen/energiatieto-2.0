angular
    .module("energiatieto-map", ["angular-openlayers", "pubsub"])
    .controller("mapController", [
        "$scope", 
        "$timeout", 
        "formActivationChannel", 
        "buildingSelectionChannel", 
        "buildingChoiceChannel", 
    function($scope, $timeout, formActivationChannel, buildingSelectionChannel, buildingChoiceChannel) {
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
                zIndex: 10,
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

        var vectorFeatureLayer = new OpenLayers.Layer.Vector(
            "Building Choice",
            {
                zIndex: 100,
                style: {
                  'strokeWidth': 0,
                  'fillColor': '#1a96ff',
                  'fillOpacity': 0.65
                }
            }
        );

        vectorFeatureLayer.events.on({
            'featureselected': function(event) {
                buildingSelectionChannel.selectBuilding(event.feature.data);
            }
        });

        var both = [wms, solar];
        var wmsOnly = [wms];
        var buildingChoice = [wms, solar, vectorFeatureLayer];
        $scope.layers = wmsOnly;

        var webmercator = new OpenLayers.Projection("EPSG:3857");
        $scope.projection = webmercator;

        $scope.bounds = new OpenLayers.Bounds(2725101.13462, 8410878.26177, 2768515.73603, 8481031.01885);
        $scope.center = new OpenLayers.LonLat(2750850.887954, 8434182.950183);
        $scope.zoom = 13;
        $scope.popups = [];
        $scope.controls = [new OpenLayers.Control.Navigation(), new OpenLayers.Control.SelectFeature(vectorFeatureLayer)];

        formActivationChannel.onStateChange($scope, function(message) {
            $scope.reduced = (message != formActivationChannel.messages.deactivate);
            $scope.small = (message === formActivationChannel.messages.extend);
            $timeout(function() {
                $scope.$broadcast("_RESIZE_");
            }, 300);
        });

        buildingSelectionChannel.onSelectBuilding($scope, function(building) {
            var location = new OpenLayers.LonLat(building.coordinates.lon, building.coordinates.lat);
            $scope.popups = [
                new OpenLayers.Popup(
                    null,
                    location,
                    new OpenLayers.Size(150,30),
                    "<p class='popup-text'>" + building.address + "</p>"
                )
            ];
            $timeout(function() {
                $scope.layers = both;
                $scope.center = location;
                $timeout(function() {
                    $scope.zoom = 18;
                }, 100);
            }, 500);
        });

        buildingChoiceChannel.onChoices($scope, function(choices) {
            if (choices.length > 0) {
                var bounds = new OpenLayers.Bounds();

                vectorFeatureLayer.addFeatures(_.map(choices, function(building) {
                    var linearRing = new OpenLayers.Geometry.LinearRing(
                            _.map(building.exteriorPolygon, function(it) {
                                return new OpenLayers.Geometry.Point(it.lon, it.lat);
                            })
                        ),
                        polygon = new OpenLayers.Geometry.Polygon([linearRing]);

                    bounds.extend(new OpenLayers.LonLat(building.coordinates.lon, building.coordinates.lat));
                    return new OpenLayers.Feature.Vector(polygon, building);
                }));

                vectorFeatureLayer.refresh();

                $scope.$apply(function() {
                    $scope.center = bounds.getCenterLonLat();
                    $timeout(function() {
                        $scope.zoom = 18;
                        $timeout(function() {
                            $scope.layers = buildingChoice;
                        }, 100);
                    }, 100);
                });
            }
        });

        $scope.$watch("zoom", function(newValue, oldValue) {
            if (newValue >= 17) {
                $scope.layers = both;
            } else {
                $scope.layers = wmsOnly;
            }
        })
    }]);