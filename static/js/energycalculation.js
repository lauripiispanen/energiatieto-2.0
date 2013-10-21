angular
    .module("energiatieto-sidepanel", ["pubsub", "energiatieto-energysystem"])
    .controller(
        "energyCalculationController", 
        [
            "$scope",
            "$timeout",
            "formActivationChannel",
            "buildingSelectionChannel",
            "energysystem",
            "building",
            "heating-options",
            function(
                $scope,
                $timeout,
                formActivationChannel,
                buildingSelectionChannel,
                system,
                Building,
                heatingOptions
            ) {

        $scope.building = new Building();
        $scope.heatingOptions = heatingOptions;

        /*
        system.calculate({
            buildings: [ building ],
            solarpanelproducers: [],
            geothermalwellproducers: []
        }, function(result) {
            console.log(result);
        });*/

        buildingSelectionChannel.onSelectBuilding($scope, function(building) {
            formActivationChannel.activate();
        });

        formActivationChannel.onStateChange($scope, function(active) {
            $scope.open = active;
        });
    }])