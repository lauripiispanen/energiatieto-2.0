angular
    .module("angular-openlayers", [])
    .directive('openlayers', [function() {
        return {
            scope: {
                layers: "=layers",
                projection: "=projection",
                zoom: "=zoom",
                center: "=center",
                restrictedExtent: "=restrictedExtent"
            },
            link: function($scope, iElement, iAttrs, controller) {
                var map = new OpenLayers.Map(
                    iElement[0],
                    {
                        projection: $scope.projection,
                        displayProjection: $scope.displayProjection,
                        restrictedExtent: $scope.restrictedExtent
                    }
                );
                map.addLayers($scope.layers);
                map.zoomTo($scope.zoom);
                $scope.$watch("center", function(newValue, oldValue) {
                    map.setCenter(newValue);
                });
            }
        };
    }])