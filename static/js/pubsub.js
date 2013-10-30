angular
    .module('pubsub', [])
    .factory('formActivationChannel', ['$rootScope', function($rootScope) {
        var _ACTIVATE_FORM_ = '_ACTIVATE_FORM_';
        var _DEACTIVATE_FORM_ = '_DEACTIVATE_FORM_';
        
        function onActivate($scope, handler) {
            $scope.$on(_ACTIVATE_FORM_, handler);
        }
        function onDeactivate($scope, handler) {
            $scope.$on(_DEACTIVATE_FORM_, handler);
        }
        function onStateChange($scope, handler) {
            $scope.$on(_ACTIVATE_FORM_, function() {
                handler(true);
            });
            $scope.$on(_DEACTIVATE_FORM_, function() {
                handler(false);
            });
        }
        function activate() {
            $rootScope.$broadcast(_ACTIVATE_FORM_);
        };
        function deactivate() {
            $rootScope.$broadcast(_DEACTIVATE_FORM_);
        };

        return {
            onActivate: onActivate,
            activate: activate,
            onDeactivate: onDeactivate,
            deactivate: deactivate,
            onStateChange: onStateChange

        }
    }])
    .factory('buildingSelectionChannel', ['$rootScope', function($rootScope) {
        var _SELECT_BUILDING = '_SELECT_BUILDING';

        function onSelectBuilding($scope, handler) {
            $scope.$on(_SELECT_BUILDING, function(event, building) {
                handler(building);
            });
        }

        function selectBuilding(building) {
            $rootScope.$broadcast(_SELECT_BUILDING, building);
        }

        return {
            selectBuilding: selectBuilding,
            onSelectBuilding: onSelectBuilding
        }
    }])
    .factory('buildingChoiceChannel', ['$rootScope', function($rootScope) {
        var _BUILDING_CHOICE_ = '_BUILDING_CHOICE_';

        function onChoices($scope, handler) {
            $scope.$on(_BUILDING_CHOICE_, function(event, buildings) {
                handler(buildings);
            });
        }

        function setChoices(buildings) {
            $rootScope.$broadcast(_BUILDING_CHOICE_, buildings);
        }

        return {
            setChoices: setChoices,
            onChoices: onChoices
        }
    }]);