/*jshint supernew:true */
/**
 * Import.io Client library
 */
function importio(callback, endpoint) {

	// Initialise internal variables
	var _wasConnected = false;
	var connected = false;
	var _disconnecting = false;
	var _callback = callback ? callback : function(a,b) {};
	var cometdURL = "http://" + (endpoint ? endpoint : "query.import.io") + "/query/comet";

	// Track the currently running queries
	var queries = {};

	// Setup CometD
	$.cometd.websocketEnabled = false;
	$.cometd.configure({
			url: cometdURL,
			logLevel: 'warn'
	});
	$.cometd.handshake();

	/**
	 * Do a signed query
	 */
	this.query = function (signed_query, message_callback) {

		// Generate a request ID
			signed_query.requestId = "request-"+((new Date()).getTime());

			// Begin query initialisation
			$.cometd.publish('/service/signed_query', signed_query);

			// Setup the query object
			var query = new function() {

					var _query = this;

					// Trackers to measure progress on this query
					var pagesQueued = 0;
					var pagesStarted = 0;
					var pagesCompleted = 0;
					var messagesReceived = 0;

					// Add the listener to pick up messages
					this.receive = function (queryMessage) {

						// Whether we've finished yet
				var finished = false;

				// Track the number of total pages for this command, and the number of completed pages
				if (queryMessage.type == "START") {
						pagesStarted++;
				} else if (queryMessage.type == "SPAWN") {
						pagesQueued++;
				} else if (queryMessage.type == "STOP") {
						pagesCompleted++;
						finished = pagesQueued == pagesCompleted;
				} else if (queryMessage.type == "MESSAGE") {
					messagesReceived++;
				} else if (queryMessage.type == "UNAUTH") {
						finished = true;
				} else if (queryMessage.type == "ERROR") {
						finished = true;
				}

				// Remove the query if we're done
				if (finished) {
						delete queries[signed_query.requestId];
				}

				// Callback to the user's function
				message_callback(queryMessage, _query);

					};
			}();

			// Save the query object
			queries[signed_query.requestId] = query;
	};

	// Connection established callback
	var _connectionEstablished = function() {
		_callback({"channel": "/meta", "data": { "type": "CONNECTION_ESTABLISHED" } });
	};

	// Connection broken callback
	var _connectionBroken = function() {
		_callback({"channel": "/meta", "data": { "type": "CONNECTION_BROKEN" } });
	};

	// Connection closed callback
	var _connectionClosed = function() {
		_callback({"channel": "/meta", "data": { "type": "CONNECTION_CLOSED" } });
	};

	var _metaConnect = function(message) {
			if (_disconnecting) {
					connected = false;
					_connectionClosed();
			} else {
					_wasConnected = connected;
					connected = message.successful === true;
					if (!_wasConnected && connected) {
						_connectionEstablished();
					} else if (_wasConnected && !connected) {
						_connectionBroken();
					}
			}
	};

	var _metaHandshake = function(message) {
			if (message.successful) {
				$.cometd.subscribe('/messaging', function receive(message) {

										var query = queries[message.data.requestId];

										if ( !query ) {
												_callback({"channel": "/meta", "data": { "type": "NO_QUERY" } });
												return;
										}

								query.receive(message);
						});
				_callback({"channel": "/meta", "data": { "type": "SUBSCRIBED" } });
			}
	};

	// Comet listeners
	$.cometd.addListener('/meta/handshake', _metaHandshake);
	$.cometd.addListener('/meta/connect', _metaConnect);

	$(window)
			.unload(function () {
			if ($.cometd.reload) {
					$.cometd.reload();
			} else {
					$.cometd.disconnect();
			}
	});
}