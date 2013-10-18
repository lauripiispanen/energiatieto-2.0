angular
    .module("energiatieto-sidepanel", ["pubsub"])
    .controller("energyCalculationController", ["$scope", "$timeout", "formActivationChannel", function($scope, $timeout, formActivationChannel) {
        formActivationChannel.onStateChange($scope, function(active) {
            $scope.open = active;
        });
    }])