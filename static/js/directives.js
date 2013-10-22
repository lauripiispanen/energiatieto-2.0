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
    .directive('n3Graph', [function() {
        return {
            scope: {
                "model": "=ngModel",
                "layerClasses": "="
            },
            link: function($scope, iElement, iAttrs, controller) {
                var height = 200,
                    width  = 300,
                    svg = d3.select(iElement[0]).select("svg"),
                    identity = function(d) { return d; };

                $scope.$watch("model", function(newValue, oldValue) {
                    var xMax = d3.max(newValue, function(it) {
                            return d3.max(it, function(it) {
                                return it.x;
                            });
                        }),
                        xMin = d3.min(newValue, function(it) {
                            return d3.min(it, function(it) {
                                return it.x;
                            });
                        }),
                        stack = d3.layout.stack(),
                        layers = stack(newValue),
                        yStackMin = d3.min(layers, function(layer) {
                            return d3.min(layer, function(d) { return Math.min(d.y + d.y0, 0); });
                        }),
                        yStackMax = d3.max(layers, function(layer) {
                            return d3.max(layer, function(d) { return Math.max(d.y + d.y0, 0); });
                        }),
                        x = d3.scale.ordinal().domain(d3.range(xMax + 1)).rangeRoundBands([0, width], .3),
                        y = d3.scale.linear().domain([yStackMax, yStackMin]).range([0, height]),

                        layerSelection = svg.selectAll(".layer").data(layers);

                    if (newValue === oldValue) {
                        // initialize
                        layerSelection
                            .enter()
                            .append("g")                            
                            .attr("class", function(d, i) { if ($scope.layerClasses) {
                                    return "layer " + $scope.layerClasses[i];
                                } else {
                                    return "layer";
                                }
                            });

                        var rectSelection = layerSelection.selectAll("rect").data(identity);

                        rectSelection.enter()
                            .append("rect")
                            .attr("x", function(d) { return x(d.x); })
                            .attr("y", function(d) { return d.y < 0 ? y(0 + d.y0) : y(d.y + d.y0); })
                            .attr("height", function(d) { return Math.abs(y(d.y0) - y(d.y0 + d.y)); })
                            .attr("width", x.rangeBand());

                        rectSelection
                            .exit()
                            .remove()
                    } else {
                        // update graph
                        layerSelection
                            .selectAll("rect")
                            .data(identity)
                            .transition()
                            .duration(300)
                            .attr("x", function(d) { return x(d.x); })
                            .attr("y", function(d) { return d.y < 0 ? y(0 + d.y0) : y(d.y + d.y0); })
                            .attr("height", function(d) { return Math.abs(y(d.y0) - y(d.y0 + d.y)); })
                            .attr("width", x.rangeBand());
                    }
                    


                    console.log(yStackMax, yStackMin);

                });
            }
        }
    }])