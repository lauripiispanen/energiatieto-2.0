angular
    .module("energiatieto-energysystem", [])
    .factory("constants", [function() {
        var constants = new Constants();
        constants.borehole = {
            activeDepth : 200,
            powerDimensioning : 75
        }
        return new Constants();
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

            this.calculate = function(options, callback) {
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
                        var self = this;
                        var valuesFor = function(calculatedProfile) {

                            return {
                                total: self.monthly(calculatedProfile),
                                averages: self.monthlyAverages(calculatedProfile, constants)
                            };
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

                        var annualElectricityProduction = _.reduce(systemElectricityProduction.total, sum);
                        var annualElectricityConsumption = _.reduce(systemElectricityConsumption.total, sum);

                        var annualHotWaterHeatingEnergyProduction = _.reduce(systemHotWaterHeatingEnergyProduction.total, sum);
                        var annualSpaceHeatingEnergyProduction = _.reduce(systemSpaceHeatingEnergyProduction.total, sum);
                        
                        var annualTotalProduction = annualElectricityProduction + annualHotWaterHeatingEnergyProduction + annualSpaceHeatingEnergyProduction;

                        callback({
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
                            heatingConsumption: pivot({
                                water: valuesFor(profiles.SystemHotWaterHeatingEnergyConsumption(system, constants)),
                                space: valuesFor(profiles.SystemSpaceHeatingEnergyConsumption(system, constants))
                            }),
                            electricityConsumption: systemElectricityConsumption,
                            heatingProduction: pivot({
                                water: systemHotWaterHeatingEnergyProduction,
                                space: systemSpaceHeatingEnergyProduction
                            }),
                            electricityProduction: systemElectricityProduction,
/*                            heatingBalance: pivot({
                                water: valuesFor(profiles.SystemHotWaterHeatingEnergyBalance(system, constants)),
                                space: valuesFor(profiles.SystemSpaceHeatingEnergyBalance(system, constants))
                            }),
                            electricityBalance: valuesFor(profiles.SystemElectricityBalance(system, constants)), */
                            systemCost: profiles.SystemCost.getSystemCost(system, annualElectricityProduction, annualElectricityConsumption),
                            averageMonthlyProduction: annualTotalProduction / 12
                        });
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