angular
    .module("angular-openlayers", [])
    .directive('openlayers', [function() {
        return {
            scope: {
                layers: "=layers",
                projection: "=projection",
                zoom: "=zoom",
                center: "=center",
                restrictedExtent: "=restrictedExtent",
                moveMode: "=moveMode"
            },
            link: function($scope, iElement, iAttrs, controller) {
                function $apply(fn) {
                    ($scope.$$phase || $scope.$root.$$phase) ? fn() : $scope.$apply(fn);
                };
                function $fnapply(fn) {
                    return function() {
                        $apply(fn)
                    }
                };

                var map = new OpenLayers.Map(
                    iElement[0],
                    {
                        projection: $scope.projection,
                        displayProjection: $scope.displayProjection,
                        restrictedExtent: $scope.restrictedExtent
                    }
                );
                map.events.register("moveend", map, $fnapply(function() {
                    if (map.getCenter() != $scope.center) {
                        $scope.center = map.getCenter();
                    }
                }));
                map.events.register("zoomend", map, $fnapply(function() {
                    if (map.getZoom() != $scope.zoom) {
                        $scope.zoom = map.getZoom();
                    }
                }));
                $scope.$watch("layers", function(newLayers, oldValue) {
                    var removable = _.filter(map.layers, function(it) {
                        return !_.contains(newLayers, it);
                    });
                    var addable = _.filter(newLayers, function(it) {
                        return !_.contains(map.layers, it);
                    });
                    _.each(removable, function(it) {
                        map.removeLayer(it);
                    });
                    _.each(addable, function(it) {
                        console.log("add");
                        map.addLayer(it);
                    });
                    console.log(newLayers);
                });
                $scope.$watch("zoom", function(newValue, oldValue) {
                    map.zoomTo(newValue);
                });
                $scope.$watch("center", function(newValue, oldValue) {
                    if (newValue != oldValue) {
                        map.panTo(newValue);
                    } else {
                        map.setCenter(newValue);
                    }
                });

            }
        };
    }])