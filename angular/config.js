// Detect whether we have angular installed
var ioAngularAvailable = window.hasOwnProperty("angular");

if (ioAngularAvailable) {
	// The angular module
	var io = angular.module("importio", []);
}