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
                popups: "=popups",
                controls: "=controls"
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
                $scope.$watch("controls", function(newControls) {
                    _.each(_.difference(map.controls, newControls), function(control) {
                        map.removeControl(control);
                        control.deactivate();
                    });
                    _.each(_.difference(newControls, map.controls), function(control) {
                        map.addControl(control);
                        control.activate();
                    });
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
    .directive('d3PaybackGraph',[function() {
        return {
            scope: {
                "model": "=ngModel",
                "layerClasses": "="
            },
            link: function($scope, iElement, iAttrs, controller) {
                var height = 240,
                    width  = 200,
                    left   = 10,
                    top    = 10,
                    svg = d3.select(iElement[0]).select("svg"),
                    identity = function(d) { return d; };

                $scope.$watch("model", function(newValue, oldValue) {
                    if (newValue.length < 1) {
                        return;
                    }
                    var xMax = d3.max(newValue, function(it) { return it.length; }),
                        xMin = 0,
                        yMin = 0,
                        yMax = d3.max(newValue, function(it) { return d3.max(it, identity); }),
                        layerSelection = svg.selectAll("path").data(newValue),
                        x = d3.scale.linear().domain([0, xMax]).range([left, width]),
                        y = d3.scale.linear().domain([yMax, 0]).range([top, height]),
                        line = d3.svg.line()
                                    .interpolate("basis")
                                    .x(function(d, i) { return x(i); })
                                    .y(y);

                    layerSelection
                        .enter()
                        .append("path")
                        .attr("class", function(d, i) { if ($scope.layerClasses) {
                                return $scope.layerClasses[i];
                            } else {
                                return "";
                            }
                        });

                    layerSelection
                        .attr("d", line);

                    layerSelection
                        .exit()
                        .remove();

                }, true);
            }
        }
    }])
    .directive('d3Graph', [function() {
        return {
            scope: {
                "model": "=ngModel",
                "layerClasses": "="
            },
            link: function($scope, iElement, iAttrs, controller) {
                var height = 120,
                    width  = 290,
                    svg = d3.select(iElement[0]).select("svg"),
                    identity = function(d) { return d; };

                $scope.$watch("model", function(newValue, oldValue) {
                    if (newValue.length < 1) {
                        return;
                    }
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
                        stack = d3.layout.stack().out(function(d, y0, y) {
                            // note, this stacking output only works if series containing negative values are LAST in the stack!
                            if (y0 > 0 && y < 0) {
                                d.y0 = 0;
                                d.y = y;
                            } else {
                                d.y0 = y0;
                                d.y = y;                                
                            }
                        }),
                        layers = stack(newValue),
                        yStackMin = d3.min(layers, function(layer) {
                            return d3.min(layer, function(d) { return Math.min(d.y + d.y0, 0); });
                        }),
                        yStackMax = d3.max(layers, function(layer) {
                            return d3.max(layer, function(d) { return Math.max(d.y + d.y0, 0); });
                        }),
                        yMin = (function() {
                            if (Math.abs(yStackMin) > Math.abs(yStackMax)) {
                                return -Math.abs(yStackMin);
                            } else {
                                return -Math.abs(yStackMax)
                            }
                        })(),
                        yMax = (function() {
                            return - yMin;
                        })(),
                        x = d3.scale.ordinal().domain(d3.range(xMax + 1)).rangeRoundBands([0, width], .75),
                        y = d3.scale.linear().domain([yMax, yMin]).range([0, height]),

                        layerSelection = svg.selectAll(".layer").data(layers),
                        updateAttributes = function(rectSelection) {
                            rectSelection
                                .attr("x", function(d) { return x(d.x); })
                                .attr("y", function(d) {
                                    if (d == 0) {
                                        return y(0);
                                    } else {
                                        return d.y < 0 ? y(0 + d.y0) : y(d.y + d.y0);
                                    }
                                })
                                .attr("height", function(d) { 
                                    return Math.abs(y(d.y0) - y(d.y0 + d.y)); 
                                })
                                .attr("width", x.rangeBand());
                        };

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
                        .call(updateAttributes)
                    
                    if (newValue !== oldValue) {
                        // update graph
                        layerSelection
                            .selectAll("rect")
                            .data(identity)
                            .transition()
                            .duration(300)
                            .call(updateAttributes);
                    }

                    layerSelection
                        .exit()
                        .remove();

                    rectSelection
                        .exit()
                        .remove();

                }, true);
            }
        }
    }])