if (ioAngularAvailable) {
	// The auth service
	io.factory("ioauth", ['$rootScope', function($scope) {
		return {
			"auth": importio.auth
		}
	}]);
}