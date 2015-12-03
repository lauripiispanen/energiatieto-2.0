angular
    .module("energiatieto-sidepanel", [
        "ui.slider",
        "pubsub",
        "energiatieto-energysystem",
        "angular-openlayers"
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
            "profiles",
            function(
                $scope,
                $timeout,
                formActivationChannel,
                buildingSelectionChannel,
                system,
                Building,
                heatingOptions,
                graphGenerator,
                constants,
                profiles
            ) {

        $scope.electricityLayerClasses = ['solar-electricity','bought'];
        $scope.heatingLayerClasses = ['solar-heating','geothermal','residue','bought'];
        $scope.systemCostClasses = ['future', 'current'];
        $scope.showConstants = function() {
            formActivationChannel.changeState(formActivationChannel.messages.extend);
        }

        $scope.electricitySeries = [];
        $scope.heatingSeries = [];
        $scope.systemCostSeries = [];

        $scope.heatingOptions = heatingOptions;
        $scope.constants = constants;

        function resetBuildingConsumption(building) {
            building.electricityConsumption = new Building().nominalElectricityConsumption * building.floorArea; // kWh
            building.energyConsumptionIncludesWaterHeating = false;
            building.electricityConsumptionEstimated = false;
            building.spaceHeatingEnergyEstimated = false;
            building.spaceHeatingEnergyRequired = NominalSpaceHeatingDemandEstimate(building);

            if (building.heatingSystem === "3") {
                building.electricityConsumption += building.spaceHeatingEnergyRequired;
            }

            building.oilConsumption = Math.round(building.spaceHeatingEnergyRequired / (constants.energyContentOfOil * building.oilEfficiency));
            building.districtHeatingConsumption = building.spaceHeatingEnergyRequired;
        }

        $scope.$watch("building.heatingSystem", function(heatingSystem) {
            resetBuildingConsumption($scope.building);
        });

        system.calculate({}, function(result) {
            $scope.calculationResult = result;
        });

        function calculateAlternateScenarios(building, panel, boreholes) {
            system.calculate({
                buildings: [ building ],
                solarpanelproducers: [],
                geothermalwellproducers: boreholes
            }, function(result) {
                $scope.boreHoleOnlyResult = result;
            }, true);

            var thermalPanel = _.extend(new SolarInstallation(), panel);
            thermalPanel.photovoltaicArea = 0;

            system.calculate({
                buildings: [ building ],
                solarpanelproducers: [ thermalPanel ],
                geothermalwellproducers: []
            }, function(result) {
                $scope.thermalPanelOnlyResult = result;
            }, true);

            var electricPanel = _.extend(new SolarInstallation(), panel);
            electricPanel.thermalArea = 0;

            system.calculate({
                buildings: [ building ],
                solarpanelproducers: [ electricPanel ],
                geothermalwellproducers: []
            }, function(result) {
                $scope.photovoltaicPanelOnlyResult = result;
            }, true);
        }

        function sum(a, b) {
            return a + b;
        }

        function averages(producers) {
            return _.reduce(_.map(producers, function(producer) {
                var totalSums = _.chain(producer).pluck("total").flatten().map(parseFloat).reduce(sum, 0).value();
                return totalSums;
            }), sum, 0) / 12;
        }

        function recalculate(building) {
            if (!building || !building.floorArea) {
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
                panel.roofRemainingAreaAvgIrradiance = building.solar.RoofRemainingAreaAvgIrradiance;
                _.extend(panel, building.solar);
            }


            if (building.photoVoltaic && building.photoVoltaic.active) {
                panel.photovoltaicArea = parseInt(building.photoVoltaic.size, 10);
            }
            if (building.thermalPanel && building.thermalPanel.active) {
                panel.thermalArea = parseInt(building.thermalPanel.size, 10);
            }

            if (building.borehole && building.borehole.active) {
                var maxRequiredBoreholeDepth = calculateMaxRequiredBoreholeDepth(building);
                building.borehole.activeDepth = (parseInt(building.borehole.depthPercentage, 10) / 100) * maxRequiredBoreholeDepth;
                boreholes.push(building.borehole);
            }

            building.nominalElectricityConsumption = building.electricityConsumption / building.floorArea; // kWh

            system.calculate({
                buildings: [ building ],
                solarpanelproducers: [ panel ],
                geothermalwellproducers: boreholes
            }, function(result) {
                $scope.calculationResult = result;
                $scope.electricitySeries = graphGenerator.generateElectricityGraph(result, building);
                $scope.heatingSeries = graphGenerator.generateHeatingGraph(result);
                $scope.systemCostSeries = graphGenerator.generateSystemCostGraph(result.systemCost);

                $scope.boreHoleAverage = averages([result.boreholes.spaceHeating, result.boreholes.waterHeating]);
                $scope.solarElectricityAverage = averages([result.solarpanels.electricityProduction]);
                $scope.solarHeatAverage = averages([result.solarpanels.waterHeating]);

                if (building.solar) {
                    $scope.freePhotoVoltaicRoofSize = parseInt(building.solar.RoofArea) - panel.thermalArea;
                    $scope.freeThermalRoofSize = parseInt(building.solar.RoofArea) - panel.photovoltaicArea;

                    updateRecommendedPanelPercentages($scope);
                }

                // calculate alternate scenarios for only certain producers
                calculateAlternateScenarios(building, panel, boreholes);
            });
        }


        $scope.$watch("building", recalculate, true);
        $scope.$watch("constants", function() {
            recalculate($scope.building);
        }, true);

        buildingSelectionChannel.onSelectBuilding($scope, buildingSelected);

        formActivationChannel.onStateChange($scope, function(message) {
            $scope.open = (message != formActivationChannel.messages.deactivate);
            $scope.extended = (message === formActivationChannel.messages.extend);
        });

        function calculateMaxRequiredBoreholeDepth(building) {
            var heatingConsumption = system.calculateHeatingConsumption({
                building: [ building ]
            });
            var maxRequiredHeatingInKilowatts =
                _
                .chain(heatingConsumption.space.averages)
                .flatten()
                .zip(_.flatten(heatingConsumption.water.averages))
                .map(function(it) { return it[0] + it[1]; })
                .max()
                .value();
            return maxRequiredHeatingInKilowatts / constants.borehole.estimatedPowerPerMeter;
        }

        function buildingSelected(building) {
            if (typeof ga !== "undefined") {
                ga('send','pageview', {
                    'page': '/details',
                    'title': 'Details view'
                });
            }
            building.borehole = new Borehole();
            building.borehole.active = true;
            _.extend(building.borehole, constants.borehole);

            $scope.recommendedThermalPanelSize = Math.round(building.numberOfInhabitants * 2);

            building.thermalPanel = {
                active: true,
                size: $scope.recommendedThermalPanelSize
            }

            $scope.recommendedPhotoVoltaicPanelSize = Math.round(building.solar ? building.solar.RoofGoodArea - building.thermalPanel.size : 0);

            building.photoVoltaic = {
                active: true,
                size: $scope.recommendedPhotoVoltaicPanelSize
            }
            building.borehole.depthPercentage = 75;

            resetBuildingConsumption(building);

            updateRecommendedPanelPercentages($scope);

            formActivationChannel.changeState(formActivationChannel.messages.activate);
            $scope.$apply(function() {
                $scope.building = building;
            });
        }

        function updateRecommendedPanelPercentages($scope) {
            $scope.recommendedPhotoVoltaicPanelPercentage = ($scope.recommendedPhotoVoltaicPanelSize / $scope.freePhotoVoltaicRoofSize);
            if ($scope.recommendedPhotoVoltaicPanelPercentage > 1) {
                $scope.recommendedPhotoVoltaicPanelPercentage = 1;
            }
            $scope.recommendedThermalPanelPercentage = ($scope.recommendedThermalPanelSize / $scope.freeThermalRoofSize);
            if ($scope.recommendedThermalPanelPercentage > 1) {
                $scope.recommendedThermalPanelPercentage = 1;
            }
        }

        $scope.reset = function() {
            formActivationChannel.changeState(formActivationChannel.messages.deactivate);
        }
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

        this.generateSystemCostGraph = function(systemCost) {
            return [
                _.pluck(systemCost.totalSystemCost, "cost"),
                _.pluck(systemCost.comparisonCost, "cost")
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
