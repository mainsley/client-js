// Detect whether we have angular installed
var ioAngularAvailable = ({}).hasOwnProperty.call(window,"angular");

if (ioAngularAvailable) {
	// The angular module
	var io = angular.module("importio", []);
}