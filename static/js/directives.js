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
                popups: "=popups"
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
                $scope.$watch("layers", function(newLayers) {
                    _.each(_.difference(map.layers, newLayers), _.bind(map.removeLayer, map));
                    _.each(_.difference(newLayers, map.layers), _.bind(map.addLayer, map));
                });
                $scope.$watch("zoom", function(newValue, oldValue) {
                    if (newValue != map.getZoom()) {
                        map.zoomTo(newValue);
                    }
                });
                $scope.$watch("center", function(newValue, oldValue) {
                    if (!newValue.equals(oldValue)) {
                        map.panTo(newValue);
                    } else if (!map.getCenter()) {
                        map.setCenter(newValue);
                    }
                });
                $scope.$on("_RESIZE_", function() {
                    map.updateSize();
                });
                $scope.$watch("popups", function(newPopups) {
                    _.each(_.difference(map.popups, newPopups), _.bind(map.removePopup, map));
                    _.each(_.difference(newPopups, map.popups), _.bind(map.addPopup, map));
                    _.each(map.popups, function(it) {
                        it.updateSize();
                    });
                });
            }
        };
    }])