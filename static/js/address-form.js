angular
    .module("energiatieto-addressform", ["ui.select2", "pubsub"])
    .controller("addressFormController", [
        "$scope",
        "buildingSelectionChannel",
    function($scope, buildingSelectionChannel) {
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
                    var d = JSON.parse(data);
                    if (d.length === 1) {
                        var x = parseFloat(d[0].pos.x),
                            y = parseFloat(d[0].pos.y),
                            point = new proj4.Point(x, y);

                        proj4.transform(src, dst, point);

                        buildingSelectionChannel.selectBuilding({
                            coordinates: {
                                lon: point.x,
                                lat: point.y
                            },
                            address: d[0].address
                        });
                    }
                });
            }
        });
    }]);