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
            function(
                $scope,
                $timeout,
                formActivationChannel,
                buildingSelectionChannel,
                system,
                Building
            ) {
        
        system.calculate({
            buildings: [ new Building() ],
            solarpanelproducers: [],
            geothermalwellproducers: []
        }, function(result) {
            console.log(result);
        });

        buildingSelectionChannel.onSelectBuilding($scope, function(building) {
            formActivationChannel.activate();
        });

        formActivationChannel.onStateChange($scope, function(active) {
            $scope.open = active;
        });
    }])