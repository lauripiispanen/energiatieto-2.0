angular
    .module("energiatieto-constants", ["pubsub", "energiatieto-energysystem"])
    .controller("constantsController", [
        "$scope",
        "formActivationChannel",
        "buildingSelectionChannel",
        "constants",
    function($scope, formActivationChannel, buildingSelectionChannel, constants) {
        $scope.constants = constants;

        formActivationChannel.onStateChange($scope, function(message) {
            $scope.open = (message === formActivationChannel.messages.extend);
            if ($scope.open && typeof ga !== "undefined") {
                ga('send','pageview', {
                    'page': '/constants',
                    'title': 'Constants editor'
                });
            }
        });

        buildingSelectionChannel.onSelectBuilding($scope, function(building) {
            $scope.$apply(function() {
                $scope.building = building;
            })
        });

        $scope.close = function() {
            formActivationChannel.changeState(formActivationChannel.messages.activate);
        }
    }])