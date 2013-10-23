angular
    .module("energiatieto-energysystem", [])
    .factory("profiles", [function() {
        return {
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
            SystemCost                        : new SystemCost(),
            Constants                         : new Constants()
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
    .factory("energysystem", ["profiles", function(profiles) {
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
                try {
                    if (options.buildings && options.buildings.length > 0) {
                        var system = {
                            building: options.buildings,
                            solarInstallation: options.solarpanelproducers,
                            borehole: options.geothermalwellproducers
                        };
                        var self = this;
                        var valuesFor = function(profile) {
                            var constants   = profiles.Constants,
                                calculatedProfile = profile(system, constants);
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

                        var systemElectricityProduction = valuesFor(profiles.SystemElectricityProduction);
                        var systemElectricityConsumption = valuesFor(profiles.SystemElectricityConsumption);
                        var annualElectricityProduction = _.reduce(systemElectricityProduction.total, function(prodSum, monthlyTotal){
                          return prodSum + monthlyTotal;
                        });
                        var annualElectricityConsumption = _.reduce(systemElectricityConsumption.total, function(consSum, monthlyTotal){
                          return consSum + monthlyTotal;
                        });

                        callback({
                            heatingConsumption: pivot({
                                water: valuesFor(profiles.SystemHotWaterHeatingEnergyConsumption),
                                space: valuesFor(profiles.SystemSpaceHeatingEnergyConsumption)
                            }),
                            electricityConsumption: systemElectricityConsumption,
                            heatingProduction: pivot({
                                water: valuesFor(profiles.SystemHotWaterHeatingEnergyProduction),
                                space: valuesFor(profiles.SystemSpaceHeatingEnergyProduction)
                            }),
                            electricityProduction: systemElectricityProduction,
                            heatingBalance: pivot({
                                water: valuesFor(profiles.SystemHotWaterHeatingEnergyBalance),
                                space: valuesFor(profiles.SystemSpaceHeatingEnergyBalance)
                            }),
                            electricityBalance: valuesFor(profiles.SystemElectricityBalance),
                            systemCost: profiles.SystemCost.getSystemCost(system, 
                              annualElectricityProduction, annualElectricityConsumption)
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