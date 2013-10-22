angular
    .module("energiatieto-sidepanel", [
        "pubsub", 
        "energiatieto-energysystem"
    ])
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
            "graph-generator",
            function(
                $scope,
                $timeout,
                formActivationChannel,
                buildingSelectionChannel,
                system,
                Building,
                heatingOptions,
                graphGenerator
            ) {

        $scope.electricityLayerClasses = ['bought','solar-electricity'];
        $scope.heatingLayerClasses = ['bought','solar-heating','geothermal','residue'];

        $scope.building = new Building();
        $scope.heatingOptions = heatingOptions;

        system.calculate({}, function(result) {
            $scope.calculationResult = result;
        });


        $scope.$watch("building", function(newValue) {
            system.calculate({
                buildings: [ newValue ],
                solarpanelproducers: [],
                geothermalwellproducers: []
            }, function(result) {
                $scope.calculationResult = result;
                $scope.heatingSeries = graphGenerator.generateHeatingGraph(result);
            });
        }, true);

        buildingSelectionChannel.onSelectBuilding($scope, function(building) {
            formActivationChannel.activate();
        });

        formActivationChannel.onStateChange($scope, function(active) {
            $scope.open = active;
        });
    }])
    .service("graph-generator", [function() {
        function wrap(it, index) {
            return { x: index, y: it };
        }

        this.generateHeatingGraph = function(profiles) {
            var months = _.range(0, 12),
                c = profiles.heatingConsumption;
                calculate = function(calc) {
                    return _.chain(months).map(calc).map(wrap).value()
                };
            return [
                    calculate(function(it) {
                        return 0 - c.water.total[it] - c.space.total[it];
                    })
            ];
        }
    }])