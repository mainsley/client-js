if (ioAngularAvailable) {
	// The config service
	io.factory("ioconfig", ['$rootScope', function($scope) {
		return {
			"addConnectionCallback": importio.addConnectionCallback,
			"getConfiguration": importio.getConfiguration,
			"getDefaultConfiguration": importio.getDefaultConfiguration,
			"init": importio.init
		}
	}]);
}