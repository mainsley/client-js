if (ioAngularAvailable) {
	// The query service
	io.factory("ioquery", ['$rootScope', function($scope) {
		return {
			"query": importio.query
		}
	}]);
}