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