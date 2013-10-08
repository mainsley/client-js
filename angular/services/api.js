if (ioAngularAvailable) {
	// The API service
	io.factory("ioapi", ['$rootScope', function($scope) {
		return {
			"bucket": importio.bucket,
			"getEndpoint": importio.getEndpoint
		}
	}]);
}