angular
    .module("energiatieto-addressform", ["ui.select2", "pubsub"])
    .controller("addressFormController", [
        "$scope",
        "buildingSelectionChannel",
        "buildingChoiceChannel",
        "formActivationChannel",
    function($scope, buildingSelectionChannel, buildingChoiceChannel, formActivationChannel) {
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
            $scope.hidden = state;
        });



        $scope.select2Options = {
            placeholder: "Search for a movie",
            minimumInputLength: 3,
            query: function(query) {
                $.get("/autocomplete", { address: query.term }).done(function(data) {
                    query.callback({
                        results: convertData(data)
                    });
                });
            }
        }

        $scope.$watch("address", function(newValue) {
            if (newValue) {
                $.get("/building", { address: newValue.text }).done(function(data) {
                    
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
                    }
                });
            }
        });
    }]);