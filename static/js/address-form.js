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

        formActivationChannel.onStateChange($scope, function(state) {
            $scope.$apply(function() {
                $scope.hidden = state;                
            });
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
                                point = new proj4.Point(x, y);

                            proj4.transform(src, dst, point);

                            var building = new Building();
                            building.floorArea = it.floorArea;
                            building.address = it.address;
                            building.buildingYear = it.constructionYear;
                            building.coordinates = {
                                    lon: point.x,
                                    lat: point.y
                                };

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