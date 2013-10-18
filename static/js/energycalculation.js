angular
    .module("energiatieto-sidepanel", ["pubsub"])
    .controller("energyCalculationController", ["$scope", "$timeout", "formActivationChannel", "buildingSelectionChannel", function($scope, $timeout, formActivationChannel, buildingSelectionChannel) {
        
        buildingSelectionChannel.onSelectBuilding($scope, function(building) {
            formActivationChannel.activate();
        });

        formActivationChannel.onStateChange($scope, function(active) {
            $scope.open = active;
        });
    }])