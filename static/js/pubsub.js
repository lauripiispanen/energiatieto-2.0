angular
    .module('pubsub', [])
    .factory('formActivationChannel', ['$rootScope', function($rootScope) {
        var _ACTIVATE_FORM_ = '_ACTIVATE_FORM_';
        var _EXTEND_FORM_ = '_EXTEND_FORM_';
        var _DEACTIVATE_FORM_ = '_DEACTIVATE_FORM_';

        function changeState(state) {
            $rootScope.$broadcast(state);
        }
        function onStateChange($scope, handler) {
            $scope.$on(_ACTIVATE_FORM_, function() {
                handler(_ACTIVATE_FORM_);
            });
            $scope.$on(_DEACTIVATE_FORM_, function() {
                handler(_DEACTIVATE_FORM_);
            });
            $scope.$on(_EXTEND_FORM_, function() {
                handler(_EXTEND_FORM_);
            });
        }

        return {
            changeState: changeState,
            onStateChange: onStateChange,
            messages: {
                activate: _ACTIVATE_FORM_,
                deactivate: _DEACTIVATE_FORM_,
                extend: _EXTEND_FORM_
            }
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