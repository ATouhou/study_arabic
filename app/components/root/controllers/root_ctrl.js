var app = angular.module('arabicSite');

app.controller('rootCtrl', function($scope) {
    $scope._ = _;

    console.log('helloo');
})

String.prototype.capitalize = function() {
    return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};

