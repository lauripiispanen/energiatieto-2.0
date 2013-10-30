angular
    .module("energiatieto-addressform", ["ui.select2", "pubsub"])
    .controller("addressFormController", [
        "$scope",
        "buildingSelectionChannel",
    function($scope, buildingSelectionChannel) {
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
                    console.log(d);
                    if (d.length === 1) {
                        buildingSelectionChannel.selectBuilding({
                            coordinates: {
                                lon: parseFloat(d[0].pos.x),
                                lat: parseFloat(d[0].pos.y)
                            },
                            address: d[0].address
                        });
                    }
                });
            }
        });
    }]);