angular
    .module("energiatieto-addressform", ["pubsub"])
    .controller("addressFormController", [
        "$scope",
        "buildingSelectionChannel",
        "buildingChoiceChannel",
        "formActivationChannel",
        "$timeout",
    function($scope, buildingSelectionChannel, buildingChoiceChannel, formActivationChannel, $timeout) {
        var src = new proj4.Proj("EPSG:4326");
        var dst = new proj4.Proj("EPSG:3857");

        function convertData(data) {
            return _.map(JSON.parse(data), function(it) {
                return {
                    id: it,
                    text: it
                }
            });
        }

        buildingChoiceChannel.onChoices($scope, function() {
            $scope.hidden = true;
        });
        formActivationChannel.onStateChange($scope, function(state) {
            $scope.hidden = (state != formActivationChannel.messages.deactivate);
            if (state === formActivationChannel.messages.deactivate) {
                $scope.addressInput = "";
                $timeout(function() {
                    $(".addressInput").focus();
                }, 100);

            }
        });

        $(".addressInput").focus();

        $scope.selectItem = function(item) {
            // attempt to get buildings for address, move to next phase if successful, otherwise keep autocompleting
            $.get("/building", { address: item }).done(function(data) {
                
                var d = JSON.parse(data),
                    buildings =  _.map(d, function(it) {

                        var x = parseFloat(it.pos.x),
                            y = parseFloat(it.pos.y),
                            point = new proj4.Point(x, y),
                            exteriorPolygon = _.map(it.polygon || [], function(polygonPoint) {
                                proj4.transform(src, dst, polygonPoint);
                                return {
                                    lon: polygonPoint.x,
                                    lat: polygonPoint.y
                                };
                            });

                        proj4.transform(src, dst, point);

                        var building = new Building();
                        building.floorArea = it.floorArea;
                        building.floorCount = it.floorCount;
                        building.address = it.address;
                        building.buildingYear = it.constructionYear;
                        building.coordinates = {
                                lon: point.x,
                                lat: point.y
                            };
                        switch(it.fuel) {
                            case "Kauko- tai aluelämpö":
                                building.heatingSystem = "1";
                                break;
                            case "Kevyt polttoöljy":
                                building.heatingSystem = "2";
                                break;
                            case "Sähkö":
                                building.heatingSystem = "3";
                                break;
                            default:
                                building.heatingSystem = "4";
                                break;
                        }

                        // 33.5 is the average living space per person in Espoo
                        building.numberOfInhabitants = Math.round(building.floorArea / 33.5);

                        if (it.solar) {
                            building.solar = {
                                ActualArea: parseFloat(it.solar.ActualArea),
                                AvActKWHm2: parseFloat(it.solar.AvActKWHm2),
                                RoofArea: parseFloat(it.solar.RoofArea),
                                RoofAreaAvgIrradiance: parseFloat(it.solar.RoofAreaAvgIrradiance),
                                RoofGoodArea: parseFloat(it.solar.RoofGoodArea),
                                RoofGoodAreaAvgIrradiance: parseFloat(it.solar.RoofGoodAreaAvgIrradiance),
                                RoofRemainingArea: parseFloat(it.solar.RoofRemainingArea),
                                RoofRemainingAreaAvgIrradiation: parseFloat(it.solar.RoofRemainingAreaAvgIrradiation),
                                TotalKWh: parseFloat(it.solar.TotalKWh)
                            }
                        }
                        building.exteriorPolygon = exteriorPolygon;

                        return building;
                });

                if (buildings.length === 1) {
                    buildingSelectionChannel.selectBuilding(buildings[0]);
                } else if (buildings.length > 1) {
                    buildingChoiceChannel.setChoices(buildings);
                } else {
                    $scope.$apply(function() {
                        $scope.addressInput = item + " ";
                        $(".addressInput").focus();
                    });
                }
            });
        };

        $scope.focusedItem = null;

        $scope.hasFocus = function(item) {
            return $scope.focusedItem === item;
        };
        $scope.keyDown = function(event) {
            var focusIndex = $scope.addressChoices.indexOf($scope.focusedItem),
                allowBubble = true;
            switch(event.keyCode) {
                case 38:
                    // up
                    if (focusIndex > 0) {
                        $scope.focusedItem = $scope.addressChoices[focusIndex - 1];
                    }
                    allowBubble = false;
                    break;
                case 40:
                    // down
                    if (focusIndex < ($scope.addressChoices.length - 1)) {
                        $scope.focusedItem = $scope.addressChoices[focusIndex + 1];
                    }
                    allowBubble = false;
                    break;
                case 13:
                    // enter
                    if (focusIndex >= 0 && focusIndex < $scope.addressChoices.length) {
                        $scope.selectItem($scope.addressChoices[focusIndex]);
                    }
                    allowBubble = false;
                    break;
            }
            $scope.$digest();
            return allowBubble;
        };

        function autocomplete(address) {
            $.get("/autocomplete", { address: address }).done(function(data) {
                $scope.$apply(function() {
                    $scope.addressChoices = JSON.parse(data).sort();
                    if ($scope.addressChoices.length > 0) {
                        $scope.focusedItem = $scope.addressChoices[0];
                    }
                });
            });
        }

        $scope.$watch("addressInput", function(newValue) {
            if (newValue && newValue.length >= 3) {
                autocomplete(newValue);
            } else {
                $scope.addressChoices = [];
            }
        })
        $scope.$watch("address", function(newValue) {
            if (newValue) {

            }
        });
    }])
    .directive("addressMatch", [
        function() {
            return {
                restrict: 'A',
                replace: false,
                link: function($scope, iElement, attr) {
                    attr.$observe("input", function(input) {
                        var html = $scope.$eval(attr.addressMatch).replace(new RegExp("(" + attr.input + ")", "gi"), "<span class='match-text'>$1</span>");
                        $(iElement).html(html);
                    });
                }
            }
        }
    ])
    .directive("ngKeydown", [
        function() {
            return {
                restrict: 'A',
                replace: false,
                link: function($scope, iElement, attr) {
                    $(iElement).keydown($scope.$eval(attr.ngKeydown));
                }
            }
        }
    ]);