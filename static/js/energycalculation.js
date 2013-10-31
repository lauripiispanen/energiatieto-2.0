angular
    .module("energiatieto-sidepanel", [
        "uiSlider",
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
            "constants",
            function(
                $scope,
                $timeout,
                formActivationChannel,
                buildingSelectionChannel,
                system,
                Building,
                heatingOptions,
                graphGenerator,
                constants
            ) {

        $scope.electricityLayerClasses = ['solar-electricity','bought'];
        $scope.heatingLayerClasses = ['solar-heating','geothermal','residue','bought'];

        $scope.electricitySeries = [];
        $scope.heatingSeries = [];

        $scope.heatingOptions = heatingOptions;

        system.calculate({}, function(result) {
            $scope.calculationResult = result;
        });


        $scope.$watch("building", function(building) {
            if (!building) {
                return;
            }
            var panel = new SolarInstallation(),
                boreholes = [];

            if (building.solar) {
                panel.roofArea = building.solar.RoofArea;
                panel.roofAreaAvgIrradiance = building.solar.RoofAreaAvgIrradiance;
                panel.roofGoodArea = building.solar.RoofGoodArea;
                panel.roofGoodAreaAvgIrradiance = building.solar.RoofGoodAreaAvgIrradiance;
                panel.roofRemainingArea = building.solar.RoofRemainingArea;
                panel.roofRemainingAreaAvgIrradiance = building.solar.RoofRemainingAreaAvgIrradiation;
            }


            if (building.photoVoltaic && building.photoVoltaic.active) {
                panel.photovoltaicArea = parseInt(building.photoVoltaic.size, 10);
            }
            if (building.thermalPanel && building.thermalPanel.active) {
                panel.thermalArea = parseInt(building.thermalPanel.size, 10);
            }

            if (building.borehole && building.borehole.active) {
                boreholes.push(building.borehole);
            }

            system.calculate({
                buildings: [ building ],
                solarpanelproducers: [ panel ],
                geothermalwellproducers: boreholes
            }, function(result) {
                $scope.calculationResult = result;
                $scope.electricitySeries = graphGenerator.generateElectricityGraph(result, building);
                $scope.heatingSeries = graphGenerator.generateHeatingGraph(result);

                if (building.solar) {
                    $scope.freePhotoVoltaicRoofSize = parseInt(building.solar.RoofArea) - panel.thermalArea;
                    $scope.freeThermalRoofSize = parseInt(building.solar.RoofArea) - panel.photovoltaicArea;
                }
            });
        }, true);

        buildingSelectionChannel.onSelectBuilding($scope, function(building) {
            building.borehole = new Borehole();
            _.extend(building.borehole, constants.borehole);
            
            building.thermalPanel = {
                active: true,
                size: Math.round(building.numberOfInhabitants * 2)
            }

            building.photoVoltaic = {
                active: true,
                size: Math.round(building.solar ? building.solar.RoofGoodArea - building.thermalPanel.size : 0)
            }

            formActivationChannel.activate();
            $scope.$apply(function() {
                $scope.building = building;
            });
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
        
        this.generateElectricityGraph = function(profiles, building) {
            var elecCons = profiles.electricityConsumption,
                elecProd = profiles.electricityProduction,
                heatCons = profiles.heatingConsumption,
                heatProd = profiles.heatingProduction;

            return [
                calculate(function(it) { 
                    return elecProd.total[it];
                }),
                calculate(function(it) {
                    // if electric heating, add all negative heating energy balance to electricity consumption
                    var residueHeatConsumption = Math.min(0, 0 - elecCons.total[it] + elecProd.total[it]);
                    if (building.heatingSystem === "3") {
                        return residueHeatConsumption
                            - Math.max(0, heatCons.water.total[it]- heatProd.water.total[it])
                            - Math.max(0, heatCons.space.total[it] - heatProd.space.total[it]);
                    } else {
                        return residueHeatConsumption;
                    }

                })
            ];
        };

        this.generateHeatingGraph = function(profiles) {
            function reduceTotals(profile) {
                return _.reduce(profile, function(memo, value) {
                    return _.map(value.total, function(it, index) {
                        return it + (memo[index] || 0);
                    });
                }, [])
            };

            var zero = calculate(function() { return 0; }),
                heatCons = profiles.heatingConsumption,
                heatProd = profiles.heatingProduction,
                geoProd  = {
                    water: {
                        total: reduceTotals(profiles.boreholes.waterHeating)
                    },
                    space: {
                        total: reduceTotals(profiles.boreholes.spaceHeating)
                    }
                },
                solar = {
                    water: {
                        total: reduceTotals(profiles.solarpanels.waterHeating)
                    }
                };

            return [
                // solar
                calculate(function(it) {
                    return solar.water.total[it] || 0;
                }),
                // geothermal
                calculate(function(it) {
                    return (geoProd.water.total[it] || 0) + (geoProd.space.total[it] || 0);
                }),
                // residue
                calculate(function(it) {
                    return Math.max(0, 0 - heatCons.water.total[it] + heatProd.water.total[it]);
                }),
                calculate(function(it) {
                    return Math.min(0, 0 - heatCons.water.total[it] - heatCons.space.total[it] + heatProd.water.total[it] + heatProd.space.total[it]);
                })
                    
            ];
        }
    }])
    .filter('currencyFormat', function() {
        return function(input) {
            return _
                .chain(Math.round(input).toString().split(''))
                .reverse()
                .reduce(function(memo, value) {
                    if (_.last(memo).length >= 3) {
                        memo.push([]);
                    }
                    _.last(memo).push(value);
                    return memo;
                }, [[]])
                .map(function(it) {
                    return it.reverse().join("");
                })
                .reverse()
                .join(" ")
                .value()
        }
    })