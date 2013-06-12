/**
 * Import.io JavaScript Client Library
 * 
 * Copyright 2013 Import.io
 */
var importio = (function($) {
	
	//******************************
	//********** Private classes ***
	//******************************
	
	$(document).ajaxSend(function (event, xhr, settings) {
		settings.xhrFields = {
			withCredentials: true
		};
	});
	
	// Encapsulates a query
	var q = function($, config, query, deferred, sys_finished) {

		// Setup the ID
		var id = ((new Date()).getTime()) + (Math.random() * 1e17);
		
		// Whether or not finished
		var finished = false;
		
		// Count the messages
		var messages = 0;
		
		// Whether initialising
		var initialising = false;
		
		// Array of results returned
		var results = [];
		
		// Timeout function
		var timer = false;
		
		// Count the pages
		var pages = {
			"queued": 0,
			"started": 0,
			"completed": 0
		};
		
		// Return the ID to the user
		function getId() {
			return id;
		}
		
		// Start function to begin the query
		function start() {
			if (config.hasOwnProperty("auth")) {
				var auth = config.auth;
				if (auth instanceof Object && config.auth.hasOwnProperty("userGuid") && config.auth.hasOwnProperty("apiKey")) {
					// Internally signed query
					var extraTime = 300;
					if (config.auth.hasOwnProperty("validPeriod")) {
						extraTime = config.auth.hasOwnProperty("validPeriod");
					}
					
					var orgGuid = "00000000-0000-0000-0000-000000000000";
					if (config.auth.hasOwnProperty("orgGuid")) {
						orgGuid = config.auth.hasOwnProperty("orgGuid");
					}
					
					// Internally sign query
					doStart("signed_query", sign(query, config.auth.userGuid, orgGuid, config.auth.apiKey, extraTime));
					
					return;
					
				} else if (auth instanceof Function) {
					// Is a function so call that, with the callback
					return auth(query, function(newQuery) {
						doStart("signed_query", newQuery);
					});
				} else if (typeof auth === "string") {
					// Is a URL, so POST to it
					return $.post(auth, JSON.stringify(query), function(data) {
						doStart("signed_query", data);
					}, "json");
				}
			}
			// No other auth specified, do cookie
			doStart("query", query);
		}
		
		// The start callback
		function doStart(type, query) {
			query.requestId = id;
			$.cometd.publish("/service/" + type, query);
			//deferred.sendStart();
			timer = setTimeout(function() {
				if (!finished) {
					done();
				}
			}, config.timeout * 1000);
		}
		
		// Do local signing
		function sign(query, userGuid, orgGuid, apiKey, extraTime) {
		    
		    var signed_query = {
				queryJson: JSON.stringify(query),
				expiresAt: new Date().getTime() + (extraTime * 1000),
				userGuid: userGuid,
				orgGuid: orgGuid
			};
		    
		    var check = signed_query.queryJson
		    			+ ":" + signed_query.userGuid
		    			+ ((signed_query.orgGuid == "00000000-0000-0000-0000-000000000000") ? "" : (":" + signed_query.orgGuid))
		    			+ ":" + signed_query.expiresAt;
		    signed_query.digest = CryptoJS.HmacSHA1(check, CryptoJS.enc.Base64.parse(apiKey)).toString(CryptoJS.enc.Base64);
		    
		    return signed_query;
		}
		
		// Receive message callback
		function receive(msg) {
			var message = msg.data;

			finished = false;
			
			if (message.type == "INIT") {
				initialising = true;
			} else if (message.type == "START") {
				pages.started++;
			} else if (message.type == "SPAWN") {
				pages.queued++;
				progress();
			} else if (message.type == "STOP") {
				if (initialising) {
					initialising = false;
				} else {
					pages.completed++;
					progress();
				}
				finished = (pages.queued == pages.completed);
			} else if (message.type == "MESSAGE") {
				messages++;
				data(message);
			} else if (message.type == "UNAUTH") {
				error(message);
				finished = true;
			} else if (message.type == "ERROR") {
				error(message);
				finished = true;
			}
			
			//deferred.sendMessage(message);
			
			if (finished) {
				done();
			}
			
		}
		
		// Handles an error condition
		function error(message) {
			deferred.reject(message.data.errorType, message.data.data);
		}
		
		// Handles progress changes
		function progress() {
			var percent = 0;
			if (pages.queued > 0) {
				percent = Math.round((pages.completed / pages.queued) * 100);
			}
			deferred.notify(percent, pages.completed, pages.queued);
		}
		
		// Handles data events
		function data(message) {
			var res = message.data.results;
			for (var i in res) {
				res[i] = {
					"data" : res[i],
					"connectorGuid": message.connectorGuid,
					"connectorVersionGuid": message.connectorVersionGuid
				};
			}
			results = results.concat(res);
			//deferred.sendData(res);
		}
		
		// Handles done events
		function done() {
			if (timer) {
				clearTimeout(timer);
			}
			deferred.resolve(results);
			sys_finished(id);
		}
		
		// Return the public interface
		return {
			receive: receive,
			getId: getId,
			start: start
		};
		
	};
	
	//******************************
	//********** Private variables *
	//******************************

	// Whether or not the API has been initialised
	var initialised = false;
	var initialising = false;
	
	// Comet state
	var comet = {
		"started": false,
		"connected": false,
		"wasConnected": false,
		"disconnecting": false,
		"callbacks": {
			"established": function() {
				currentConfiguration.connectionCallback({"channel": "/meta", "data": { "type": "CONNECTION_ESTABLISHED" } });
			},
			"broken": function() {
				currentConfiguration.connectionCallback({"channel": "/meta", "data": { "type": "CONNECTION_BROKEN" } });
			},
			"closed": function(multipleClients) {
				var reason = multipleClients ? "MULTIPLE_CLIENTS" : "UNKNOWN";
				currentConfiguration.connectionCallback({"channel": "/meta", "data": { "type": "CONNECTION_CLOSED", "reason": reason } });
			},
			"connected": function() {
				currentConfiguration.connectionCallback({"channel": "/meta", "data": { "type": "CONNECTED" } });
			},
			"connect": cometConnectFunction,
			"handshake": function(message) {
				if (message.successful) {
					$.cometd.subscribe('/messaging', function receive(message) {
							var query = queries[message.data.requestId];
							if (!query) {
								currentConfiguration.connectionCallback({"channel": "/meta", "data": { "type": "NO_QUERY", "id": message.data.requestId } });
								return;
							}
							query.receive(message);
					});
					currentConfiguration.connectionCallback({"channel": "/meta", "data": { "type": "SUBSCRIBED" } });
				}
			}
		}
	};
	
	// Track of the current queries
	var queries = {};
	
	// Default configuration
	var defaultConfiguration = {
		"host": "import.io",
		"hostPrefix": "",
		"randomHost": true,
		"port": false,
		"logging": false,
		"https": true,
		"connectionCallback": log,
		"timeout": 60
	};
	
	// Store the current configuration
	var currentConfiguration = defaultConfiguration;
	
	// Queue of functions to be called after initialisation
	var initialisationQueue = [];
	
	// Cache of the endpoint to hit in this session
	var endpoint = false;
	
	//******************************
	//********** Private methods ***
	//******************************
	
	// Checks the class has been initialised
	function checkInit(fn) {
		if (!initialised) {
			if (fn) {
				initialisationQueue.push(fn);
			}
			if (!initialising) {
				// Not initialising and not initialised, so start
				init();
			}
		} else {
			// We are already initialised, so run it
			if (fn) {
				fn();
			}
		}
	}
	
	// Generates a random domain endpoint
	function randomDomain() {
	    var domain = "";
	    var options = "abcdefghijklmnopqrstuvwxyz0123456789";

	    for( var i=0; i < 30; i++ ) {
	    	domain += options.charAt(Math.floor(Math.random() * options.length));
	    }

	    return domain;
	}
	
	// Return the comet endpoint
	function getCometEndpoint() {
		if (endpoint) {
			return endpoint;
		}
		checkInit();
		
		// Max length of the prefix the user specifies = 20 (+1) characters
		var prefix = currentConfiguration.hostPrefix;
		prefix = prefix.length > 20 ? prefix.substring(0, 20) : prefix;
		prefix = prefix.length > 0 ? prefix + "-" : "";
		
		// Get the domain of the page, but only if it exists = 20 (+1) characters
		var domain = (window.location.hostname ? window.location.hostname.replace(/\./g, "") : "");
		domain = domain.length > 20 ? domain.substring(0, 20) : domain;
		domain = domain.length > 0 ? domain + "-" : "";
		
		// Generate the special subdomain, from the user's prefix + the domain + the random string = 21 + 21 + 20 = 62
		var specialHost = prefix + domain + randomDomain();
		
		// Generate the entire host, the special subdomain + the configured query server
		var host = currentConfiguration.randomHost ? specialHost + ".query." + currentConfiguration.host : "query." + currentConfiguration.host;
		
		var port = currentConfiguration.port;
		if (!currentConfiguration.port) {
			if (currentConfiguration.https) {
				port = 443;
			} else {
				port = 80;
			}
		}
		
		var protocol = "http" + (currentConfiguration.https ? "s": "");
		
		endpoint = protocol + "://" + host + ":" + port + "/query/comet";
		
		return log(endpoint);
	}
	
	// Log some output, if allowed; returns content irrespective of logging
	function log(content) {
		checkInit();
		if (currentConfiguration.logging && window.console && console.log) {
			console.log(content);
		}
		return content;
	}
	
	// Starts up CometD
	function startComet() {
		if (comet.started) {
			return;
		}
		
		// Setup Comet
		$.cometd.websocketEnabled = false;
		$.cometd.configure({
				url: getCometEndpoint(),
				logLevel: currentConfiguration.logging ? "debug" : "warn"
		});
		$.cometd.handshake();
	
		// Add callbacks
		$.cometd.addListener('/meta/handshake', comet.callbacks.handshake);
		$.cometd.addListener('/meta/connect', comet.callbacks.connect);
		
		// Add unload handler
		$(window).bind('beforeunload', function() {
			$.cometd.disconnect();
		}); 
		
		comet.started = true;
	}
	
	// Comet connect callback
	function cometConnectFunction(message) {
		if (comet.disconnecting) {
			comet.connected = false;
			comet.callbacks.closed(false);
		} else {
			comet.wasConnected = comet.connected;
			comet.connected = (message.successful === true);
			if (!comet.wasConnected && comet.connected) {
				comet.callbacks.connected();
				initCB();
			} else if (comet.wasConnected && comet.connected) {
				comet.callbacks.broken();
			} else if (!comet.connected) {
				comet.callbacks.closed(message.advice["multiple-clients"]);
			}
		}
	}
	
	// Takes user callbacks for a query and normalises them
	function augmentDeferred(deferred, callbacks) {
		if (typeof callbacks === "undefined" || !callbacks) {
			return deferred;
		}
		if (callbacks instanceof Function) {
			// If it is just a function
			deferred.done(callbacks);
		} else if (callbacks instanceof Array) {
			// It is an array, presumably of functions
			deferred.done(callbacks);
		} else {
			// It will be an object already, need to make sure the right ones are in
			var promise = deferred.promise();
			for (var name in callbacks) {
				if (promise.hasOwnProperty(name) && promise[name] instanceof Function) {
					promise[name](callbacks[name]);
				}
			}
		}
		return deferred;
	}
	
	// Callback for when initialisation is complete
	function initCB() {
		initialised = true;
		initialising = false;
		for (var i in initialisationQueue) {
			initialisationQueue[i]();
		}
	}
	
	//******************************
	//********** Public methods ****
	//******************************
	
	// Allows a user to initialise the library, returns the final configuration
	function init(c) {
		
		initialising = true;
		
		// If no configuration, use the default
		if (typeof c === "undefined") {
			c = defaultConfiguration;
		} else {
			// Provided configuration, check it has the defaults
			for (var def in defaultConfiguration) {
				if (defaultConfiguration.hasOwnProperty(def) && !c.hasOwnProperty(def)) {
					c[def] = defaultConfiguration[def];
				}
			}
		}
		
		// Save configuration
		currentConfiguration = c;		

		// Start up cometd
		startComet();
		
		return log(currentConfiguration);
	}
	
	// Allows a user to start off a query
	function query(query, callbacks) {
		var deferred = $.Deferred(false);
		deferred = augmentDeferred(deferred, callbacks);
		// Make the CBs go into the promise
		checkInit(function() {
			var qobj = new q($, currentConfiguration, query, deferred, function(id) {
				delete queries[id];
			});
			queries[qobj.getId()] = qobj;
			qobj.start();
		});
		return deferred.promise();
	}
	
	// Allows a user to ask about the default config options
	function getDefaultConfiguration() {
		return defaultConfiguration;
	}
	
	// API aliasing
	function bucket(b) {
		var bucketName = b;
		function getEndpoint(path) {
			var port = currentConfiguration.port;
			if (!currentConfiguration.port) {
				if (currentConfiguration.https) {
					port = 443;
				} else {
					port = 80;
				}
			}
			
			return "http" + (currentConfiguration.https ? "s": "") + "://api." + currentConfiguration.host + ":" + port + (path ? path : "");
		}
		function objToParams(params) {
			var p = "";
			if (params) {
				var append = [];
				for (var k in params) {
					if (params.hasOwnProperty(k)) { // Check param is valid
						if (params[k]) { // Skip if its undefined or falsey
							if (!(params[k] instanceof Array)) { // Convert to array in case there is only one
								params[k] = [params[k]]
							}
							params[k].map(function(p) {
								append.push(k + "=" + p); // Push each one on to the list
							})
						}
					}
				}
				p += append.join("&");
			}
			return p;
		}
		var iface = {
			"search": function(term, params) {
				var path = "/store/" + bucketName + "/_search?";
				params.q = term;
				path += objToParams(params);
				return $.get(getEndpoint(path));
			},
			"list": function(key, val, offset) {
				var params = {
					"index": key,
					"index_value": val
				}
				if (offset) {
					params["index_offset"] = [val, offset];
				}
				var path = "/store/" + bucketName + "?" + objToParams(params);
				return $.get(getEndpoint(path));
			},
			"object": function(g) {
				var guid = g;
				function doAjax(method, parameters) {
					return $.ajax(getEndpoint("/store/" + bucketName + (guid ? "/" + guid : "")), {
						"type": method,
						"contentType": parameters ? "json" : undefined,
						"data": parameters ? JSON.stringify(parameters) : undefined
					});
				}
				var iface = {
					"get": function() {
						return doAjax("GET");
					},
					"post": function(params) {
						return doAjax("POST", params);
					},
					"put": function(params) {
						return doAjax("PUT", params);
					},
					"patch": function(params) {
						return doAjax("PATCH", params)
					},
					"del": function() {
						return doAjax("DELETE");
					},
					"plugin": function(plugin, method, params) {
						var path = "/store/" + bucketName + (guid ? "/" + guid : "") + "/_" + plugin;
						var data;
						if (method.toLowerCase() == "get") {
							path += objToParams(params);
						} else {
							data = JSON.stringify(params);
						}
						return $.ajax(getEndpoint(path), {
							"type": method,
							"data": data
						});
					}
				};
				iface.read = iface.get;
				iface.create = iface.post;
				iface.update = iface.put;
				iface.tweak = iface.patch;
				iface.remove = iface.del;
				return iface;
			}
		}
		iface.create = iface.object().create;
		return iface;
	}
	
	//******************************
	//********** Return variables **
	//******************************
	
	return {
		init: init,
		query: query,
		getDefaultConfiguration: getDefaultConfiguration,
		bucket: bucket
	};
	
})(jQuery);