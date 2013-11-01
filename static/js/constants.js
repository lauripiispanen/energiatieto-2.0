angular
    .module("energiatieto-constants", ["pubsub"])
    .controller("constantsController", [
        "$scope",
        "formActivationChannel",
    function($scope, formActivationChannel) {
        formActivationChannel.onStateChange($scope, function(message) {
            $scope.open = (message === formActivationChannel.messages.extend);
        });

        $scope.close = function() {
            formActivationChannel.changeState(formActivationChannel.messages.activate);
        }
    }])