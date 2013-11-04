angular
    .module("energiatieto-energysystem", [])
    .factory("constants", [function() {
        var constants = new Constants();
        constants.borehole = {
            activeDepth : 200,
            powerDimensioning : 100,
            estimatedPowerPerMeter: 0.03
        }
        constants.systemCost = new SystemCost().constants;
        constants.building = new Building();
        return constants;
    }])
    .factory("profiles", [function() {
        return {
            BoreholeElectricityConsumptionProfile: BoreholeElectricityConsumptionProfile,            
            BoreholeHotWaterHeatingEnergyProductionProfile: BoreholeHotWaterHeatingEnergyProductionProfile,
            BoreholeSpaceHeatingEnergyProductionProfile: BoreholeSpaceHeatingEnergyProductionProfile,

            SolarElectricityProductionProfile: SolarElectricityProductionProfile,
            SolarHotWaterHeatingEnergyProductionProfile: SolarHeatingEnergyProductionProfile,
            
            SystemElectricityConsumption     : SystemElectricityConsumption,
            HotWaterHeatingEnergyProfile      : HotWaterHeatingEnergyProfile,
            SystemHotWaterHeatingEnergyConsumption
                                              : SystemHotWaterHeatingEnergyConsumption,
            SystemSpaceHeatingEnergyConsumption
                                              : SystemSpaceHeatingEnergyConsumption,
            SystemHotWaterHeatingEnergyProduction
                                              : SystemHotWaterHeatingEnergyProduction,
            SystemSpaceHeatingEnergyProduction
                                              : SystemSpaceHeatingEnergyProduction,
            SystemElectricityProduction       : SystemElectricityProduction,
            SystemElectricityBalance          : SystemElectricityBalance,
            SystemHotWaterHeatingEnergyBalance
                                              : SystemHotWaterHeatingEnergyBalance,
            SystemSpaceHeatingEnergyBalance
                                              : SystemSpaceHeatingEnergyBalance,
            SystemCost                        : new SystemCost()
        };
    }])
    .factory("heating-options", [function() {
        return {
            "1":"Kaukolämpö",
            "2":"Öljylämmitys",
            "3":"Sähkö",
            "4":"Muu"
        }
    }])
    .factory("building", [function() {
        return Building;
    }])
    .factory("energysystem", ["profiles", "constants", function(profiles, constants) {
        function EnergySystem() {
            var self = this;
            var arrayWith = function(val, num) {
                return _.map(_.range(num), function() { return val; });
            };
            var consumptionFromSystem = function(sys, type) {
                return _.map(_.range(12), function(num) {
                    return sys.getMonthlyConsumption(num, type);
                });
            };
            var findByType = function(arr, type) {
                return _.filter(arr, function(it) {
                    return it.type === type;
                });
            };

            var empty = {
                total: arrayWith(0, 12),
                averages: arrayWith(0, 30)
            };

            this.empty = {
                heatingConsumption: {
                    water: empty,
                    space: empty
                },
                electricityConsumption: empty,
                heatingProduction: {
                    water: empty,
                    space: empty
                },
                electricityProduction: empty,
                heatingBalance: {
                    water: empty,
                    space: empty
                },
                electricityBalance: empty,
                systemCost: {
                    totalSystemCost: [],
                    comparisonCost: [],
                    initialInvestment: 0,
                    paybackTime: 0
                }
            };

            this.randomizeData = function() {
                var max = 50;
                var points = 12;
                var newData = [];
                for (var i = 0; i < points; i++) {
                    newData.push(Math.random() * max);
                }
                return newData;
            };

            this.monthly = function(profile) {
                return _.map(_.range(12), function(num) {
                    var it = profile.month(num + 1);
                    return (isNaN(it) ? 0 : it);
                });
            };

            this.monthlyAverages = function(profile, constants) {
                return _.map(_.range(12), function(month) {
                    return _.map(_.range(24), function(hour) {
                        var it = profile.hourOfDayAvgValueInMonth(hour + 1, month + 1, constants);
                        return (isNaN(it) ? 0 : it);
                    });
                });
            };

            var valuesFor = function(calculatedProfile) {
                return {
                    total: self.monthly(calculatedProfile),
                    averages: self.monthlyAverages(calculatedProfile, constants)
                };
            };

            this.calculateHeatingConsumption = function(system) {
                return {
                    water: valuesFor(profiles.SystemHotWaterHeatingEnergyConsumption(system, constants)),
                    space: valuesFor(profiles.SystemSpaceHeatingEnergyConsumption(system, constants))
                }
            };

            this.calculate = function(options, callback, costsOnly) {
                function sum(prodSum, monthlyTotal){
                  return prodSum + monthlyTotal;
                }

                try {
                    if (options.buildings && options.buildings.length > 0) {
                        var system = {
                            building: options.buildings,
                            solarInstallation: options.solarpanelproducers,
                            borehole: options.geothermalwellproducers
                        };

                        var pivot = function(obj) {
                            var args = ["total", "averages"];
                            var ret = {};
                            _.each(args, function(value) {                            
                                _.map(obj, function(val, key) {
                                    if (!ret[value]) {
                                        ret[value] = {};
                                    }
                                    ret[value][key] = obj[key][value];
                                });
                            });
                            return obj;
                        };
                        var systemElectricityProduction = valuesFor(profiles.SystemElectricityProduction(system, constants));
                        var systemElectricityConsumption = valuesFor(profiles.SystemElectricityConsumption(system, constants));
                        
                        var systemHotWaterHeatingEnergyProduction = valuesFor(profiles.SystemHotWaterHeatingEnergyProduction(system, constants));
                        var systemSpaceHeatingEnergyProduction = valuesFor(profiles.SystemSpaceHeatingEnergyProduction(system, constants));

                        var systemHotWaterHeatingEnergyConsumption = valuesFor(profiles.SystemHotWaterHeatingEnergyConsumption(system, constants));
                        var systemSpaceHeatingEnergyConsumption = valuesFor(profiles.SystemSpaceHeatingEnergyConsumption(system, constants));

                        var annualElectricityProduction = _.reduce(systemElectricityProduction.total, sum);
                        var annualElectricityConsumption = _.reduce(systemElectricityConsumption.total, sum);

                        var annualHotWaterHeatingEnergyProduction = _.reduce(systemHotWaterHeatingEnergyProduction.total, sum);
                        var annualHotWaterHeatingEnergyConsumption = _.reduce(systemHotWaterHeatingEnergyConsumption.total, sum);

                        var annualSpaceHeatingEnergyProduction = _.reduce(systemSpaceHeatingEnergyProduction.total, sum);
                        var annualSpaceHeatingEnergyConsumption = _.reduce(systemSpaceHeatingEnergyConsumption.total, sum);
                        
                        var annualTotalProduction = annualElectricityProduction + annualHotWaterHeatingEnergyProduction + annualSpaceHeatingEnergyProduction;
                        profiles.SystemCost.constants = constants.systemCost;
                        var result = {
                            systemCost: profiles.SystemCost.getSystemCost({
                                system: system, 
                                
                                electricityProduction: annualElectricityProduction, 
                                electricityConsumption: annualElectricityConsumption,

                                hotWaterHeatingEnergyProduction: annualHotWaterHeatingEnergyProduction, 
                                hotWaterHeatingEnergyConsumption: annualHotWaterHeatingEnergyConsumption, 

                                spaceHeatingEnergyProduction: annualSpaceHeatingEnergyProduction,
                                spaceHeatingEnergyConsumption: annualSpaceHeatingEnergyConsumption,
                            })
                        };
                        if (costsOnly) {
                            callback(result);
                        } else {
                            _.extend(result, {
                                boreholes: {
                                    electricityConsumption: _.map(system.borehole, function(it) {
                                        return valuesFor(profiles.BoreholeElectricityConsumptionProfile(system, it, constants));
                                    }),
                                    waterHeating: _.map(system.borehole, function(it) {
                                        return valuesFor(profiles.BoreholeHotWaterHeatingEnergyProductionProfile(system, it, constants));
                                    }),
                                    spaceHeating: _.map(system.borehole, function(it) {
                                        return valuesFor(profiles.BoreholeSpaceHeatingEnergyProductionProfile(system, it, constants));
                                    })
                                },
                                solarpanels: {
                                    electricityProduction: _.map(system.solarInstallation, function(it) {
                                        return valuesFor(profiles.SolarElectricityProductionProfile(it, constants));
                                    }),
                                    waterHeating: _.map(system.solarInstallation, function(it) {
                                        return valuesFor(profiles.SolarHotWaterHeatingEnergyProductionProfile(it, constants));
                                    })
                                },
                                heatingConsumption: pivot(self.calculateHeatingConsumption(system)),
                                electricityConsumption: systemElectricityConsumption,
                                heatingProduction: pivot({
                                    water: systemHotWaterHeatingEnergyProduction,
                                    space: systemSpaceHeatingEnergyProduction
                                }),
                                electricityProduction: systemElectricityProduction,
                                averageMonthlyProduction: annualTotalProduction / 12
                            });
                            callback(result);
                        }
                        return;
                    } else {
                        callback(this.empty);
                        return;                
                    }
                } catch (e) {
                    if (typeof e.stack !== "undefined") {
                        console.warn(e.stack);
                    } else {
                        console.warn(e);
                    }
                    callback(this.empty);
                    return;                
                }
            };

            return this;
            
        }
        return new EnergySystem();
    }])