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

        $scope.electricityLayerClasses = ['solar-electricity','bought'];
        $scope.heatingLayerClasses = ['residue','geothermal','solar-heating','bought'];

        var building = new Building();

        building.photoVoltaic = new SolarInstallation();
        building.photoVoltaic.photovoltaicArea = 10;
        building.photoVoltaic.active = true;

        building.thermalPanel = new SolarInstallation();
        building.thermalPanel.thermalArea = 10;
        building.thermalPanel.active = true;

        $scope.building = building;
        $scope.heatingOptions = heatingOptions;

        system.calculate({}, function(result) {
            $scope.calculationResult = result;
        });


        $scope.$watch("building", function(building) {
            var panels = [];

            if (building.photoVoltaic.active) {
                panels.push(building.photoVoltaic);
            }
            if (building.thermalPanel.active) {
                panels.push(building.thermalPanel);
            }

            system.calculate({
                buildings: [ building ],
                solarpanelproducers: panels,
                geothermalwellproducers: []
            }, function(result) {
                $scope.calculationResult = result;
                $scope.electricitySeries = graphGenerator.generateElectricityGraph(result);
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
        function calculate(calc) {
            return _.chain(months).map(calc).map(wrap).value()
        }
        var months = _.range(0, 12);
        
        this.generateElectricityGraph = function(profiles) {
            var elecCons = profiles.electricityConsumption,
                elecProd = profiles.electricityProduction;

            return [
                calculate(function(it) { return elecProd.total[it]; }),
                calculate(function(it) { return elecCons.total[it]; })
            ];
        };

        this.generateHeatingGraph = function(profiles) {
            var heatCons = profiles.heatingConsumption,
                heatProd = profiles.heatingProduction,
                zero = calculate(function() { return 0; });
            return [
                zero,
                zero,
                calculate(function(it) {
                    return heatProd.water.total[it] + heatProd.space.total[it];
                }),
                calculate(function(it) {
                    return Math.min(0, 0 - heatCons.water.total[it] - heatCons.space.total[it]);
                })
                    
            ];
        }
    }])
    .filter('currencyFormat', function() {
        return function(input) {
            return _
                .chain(input.toString().split(''))
                .reverse()
                .reduce(function(memo, value) {
                    if (_.last(memo).length >= 3) {
                        memo.push([]);
                    }
                    _.last(memo).push(value);
                    return memo;
                }, [[]])
                .map(function(it) {
                    return it.join("");
                })
                .reverse()
                .join(" ")
                .value()
        }
    })