/**
 * An adaptation of jQuery.jqlog (http://code.google.com/p/jqlog/):
 * a logging framework plugin for jQuery.
 *
 * The plugin has been refactored to pull together all the JS files
 * inside one object, jqlog, and has been made configurable.
 *  
 * It also depends on jquery.pubsub & jquery.cookie.
 * 
 * @author awong
 */ 
;(function( $, undefined ) {
	var log4jq = {
		// Private enabled flag.
		_enabled: false,
		version : "0.0.1",
		key: "log4jq",
		/*
		 * Use the following topic to publish log entries to 
		 * the log targets using jquery.pubsub.
		 */
		topic : "/log4jq/logging",
		/*
		Default log entry structure.
		*/
		entryDefaults: {
			timestamp: null,
			message: "",
			format: function() {
				var _json = this.json;
				var _message = this.message;
				var msg = _message;
				
				var _level = this.level;
				var _levels = this.levels;
				
				var _timestamp = this.timestamp;
				var _date = _timestamp.getFullYear() + "-" + (_timestamp.getMonth() + 1) + "-" + _timestamp.getDate();
				var _time = _timestamp.getHours() + ":" + _timestamp.getMinutes() + ":" + _timestamp.getSeconds() + "." + _timestamp.getMilliseconds();
				
				var msg = "[" + _date  + " " + _time + "]";
				
				if ($.type(_message) === 'string' && $.trim(_message).length > 0) {
					msg = msg + "[" + $.trim(_message) + "]";
				} 
				if (_json && $.type(_json) === 'object') {
					msg = msg + "\n" + JSON.stringify(_json);
				}
				if (_level && _levels) {
					if (_level == _levels.debug) {
						msg = "[DEBUG]" + msg;
					} else if (_level == _levels.info) {
						msg = "[INFO]" + msg;
					} else if (_level == _levels.warn) {
						msg = "[WARN]" + msg;
					} else if (_level == _levels.error) {
						msg = "[ERROR]" + msg;
					}
				}
				return msg;
			}
		},
		/*
		Default target structure.
		*/
		targetDefaults: {
			name: "",
			priority: 10,
			subscribed: false,
			log: function(entry) {}
		},
		/*
		Indicates whether or not logging is enabled.  Default is false.
		*/
		enabled: function(enable) {
			if (enable !== undefined) {
				this._enabled = enable;
			}
			return this._enabled;
		},
		/*
		Logs an object with all registered log targets.
		
		Parameters:
		   object  -   The object to be logged.
		   options -   Logging options passed to log targets
		
		Options:
		   level   -   Logging level.  Default value is "debug".
		
		Usage: 
		   log4jq.log("Message");
		*/
		log: function(message, object, options) {
			if (this.enabled()) {
				var t, target, _msg, _json;
				
				if (message && $.type(message) === "string") {
					_msg = message;
				} else if (message && $.type(message) === "object") {
					_json = message;
				}
				if (object && $.type(object) === "object") {
					_json = object
				} 
				
				var entry = $.extend({}, this.entryDefaults, {
					timestamp: new Date(),
					message: _msg,
					json: _json
				}, options);
				if (!log4jq.isExcluded(entry)) {
					// Log the entry with each of the registered targets.
					try {
						$.publish(log4jq.topic, entry);
					} catch (err) {
						// Ignore any errors and carry on logging!
					}
				}
			}
		},
		/*
		Determines if a log entry will be excluded from being logged.
		
		Parameters:
		   entry  -   The object to be logged.
		
		Usage: 
		   $.log4jq.isExcluded(entry);
		*/
		isExcluded: function(entry) {
			return false;
		},
		// Private level exclusion value.
		_level: null,
		/*
		Defines the logging levels available.
		*/
		levels: {
			debug: 1,
			info: 2,
			warn: 3,
			error: 4
		}
	};
	
	/*
	Gets or sets the level exclusion value.  Default is null (no exclusion is applied).
	*/
	log4jq.level = function(level) {
		if (level !== undefined) {
			log4jq._level = level;
		}
		return log4jq._level;
	};
	/*
	Determines if a log entry will be excluded from being logged.

	Parameters:
	   entry  -   The object to be logged.
		Usage: 
	   $.log4jq.isExcluded(entry);
	*/
	log4jq.isExcluded = function(entry) {
		var excluded = false;
		if(log4jq._level && entry.level !== undefined) {
			excluded = log4jq._level > entry.level;
		}
		return excluded;
	};
	// message /*string*/, object, options
	/*
	Logs a debug object with all registered log targets.

	Parameters:
		object  -   The debug object to be logged.
		options -   Logging options passed to log targets
	Options:
		level   -   Logging level.  Default value is 1 (debug).
	Usage: 
		$.debug("Debug");
	*/
	log4jq.debug = function(message /*string*/, object, options) { 
		var settings = $.extend({
			level: log4jq.levels.debug,
			levels: log4jq.levels
		}, options);
		log4jq.log(message, object, settings);
	};
	/*
	Logs an information object with all registered log targets.

	Parameters:
		object  -   The information object to be logged.
		options -   Logging options passed to log targets
	Options:
		level   -   Logging level.  Default value is 2 (info).
	Usage: 
		$.info("Information");
	*/
	log4jq.info = function(message /*string*/, object, options) { 
		var settings = $.extend({
			level: log4jq.levels.info,
			levels: log4jq.levels
		}, options);
		log4jq.log(message, object, settings);
	};
	/*
	Logs a warning object with all registered log targets.
	
	Parameters:
		object  -   The warning object to be logged.
		options -   Logging options passed to log targets
	Options:
		level   -   Logging level.  Default value is 3 (warning).

	Usage: 
		$.warn("Warning");
	*/
	log4jq.warn = function(message /*string*/, object, options) {
		var settings = $.extend({
			level: log4jq.levels.warn,
			levels: log4jq.levels
		}, options);
		log4jq.log(message, object, settings);
	};
	/*
	Logs an error object with all registered log targets.

	Parameters:
		object  -   The error object to be logged.
		options -   Logging options passed to log targets

	Options:
		level   -   Logging level.  Default value is 4 (error).

	Usage: 
		$.error("Error");
	*/
	log4jq.error = function(message /*string*/, object, options) {
		var settings = $.extend({
			level: log4jq.levels.error,
			levels: log4jq.levels
		}, options);
		log4jq.log(message, object, settings);
	};
	
	// Extend the log entry defaults object to include a default log level.
	log4jq.entryDefaults.level = log4jq.levels.debug;
	/*
	 * Overrides the default log4jq.enabled behavior and persists the 
	 * enabled flag to a cookie.  This means that logging can be left disabled on 
	 * document ready to minimize the performance impact for users, and then turned 
	 * on when required.  Using a cookie means that the flag can be set before 
	 * viewing a page so that page load events can be logged.
	 *
	 */ 
	var _cookie = {
		enabled: function(enable) {
			var enabled = enable;
			
			if ($.cookie) {
				if (enabled !== undefined) {
					// Save the new value in the cookie.
					$.cookie(log4jq.key, enabled, { expires: 50 });
					this._enabled = enabled;
				} else {
					enabled = this._enabled;
					if (enabled === undefined) {
						// Get the value from the cookie.
						enabled = Boolean($.cookie(log4jq.key));
						this._enabled = enabled;
					}
				}
			}
			return enabled;
		}
	};
	
	log4jq.targets = {};
	var _alertTarget = {
			name: "alert",
			version: "0.0.1",
			priority: 20,
			/*
			Logs a entry using the browser alert window.
			
			Parameters:
			   entry -   The entry to log.
			*/
			log: function(entry) {
				alert(entry.format());
			}
	};
	log4jq.targets.alert = $.extend({}, log4jq.targetDefaults, _alertTarget);
	var _consoleTarget = {
			name: "console",
			version: "0.0.1",
			priority: 10,
			/*
			 * Logs a entry to the console if available.
			 * 
			 * Parameters:
			 *		entry -   The entry to log.
			 */
			log: function(entry) {
				var msg = entry.format();
				// Check for the browser console object...
				if (window.console) {
					switch(entry.level) {
						case log4jq.levels.info:
							console.info(msg);
							break;
						case log4jq.levels.warn:
							console.warn(msg);
							break;
						case log4jq.levels.error:
							console.error(msg);
							break;
						default:
							console.log(msg);
					}
				} // Check for firebug lite...
				else if (window.firebug) {
					switch(entry.level) {
						case log4jq.levels.info:
							firebug.d.console.info(msg);
							break;
						case log4jq.levels.warn:
							firebug.d.console.warn(msg);
							break;
						case log4jq.levels.error:
							firebug.d.console.error(msg);
							break;
						default:
							firebug.d.console.log(msg);
					}
				}
			}
	};
	log4jq.targets.console = $.extend({}, log4jq.targetDefaults, _consoleTarget);
	var _domInsert = {
			name: "divInsert",
			version: "0.0.1",
			priority: 1,
			$dom: $("div#console"),
			/*
			 * Appends an entry as formatted string into DOM
			 * 
			 * Parameters:
			 *		entry -   The entry to log.
			 */
			log: function(entry) {
				var $rollingLog = $('p:last',_domInsert.$dom);
				var msg = entry.format();
				$rollingLog.after("<p>" + msg + "</p>");
			}
	};
	log4jq.targets.domInsert = $.extend({}, log4jq.targetDefaults, _domInsert);
	log4jq.targets.custom = [];
	log4jq.configure = function(cfg) {
		if (cfg) {
			if (cfg.isEnableCookies && $.cookie) {
				// Copy cookie plugin onto log4jq
				$.extend(log4jq, _cookie);
				// Reset the enabled flag so we can tell if it has been set or not.
				log4jq._enabled = undefined;
			}
			if (cfg.enabled) {
				log4jq.enabled(true);
			}
			if (cfg.level) {
				log4jq.entryDefaults.level = cfg.level;
			}
			
			var isConfigured = function(obj) {
				return ( obj && ( $.type(obj) === 'boolean' || $.type(obj) === 'object' ) );
			};
			/*
			 * TBD: If log4jq.configure() called twice, it is possible to register
			 * the same target twice!  
			 */
			var _cfgTarget = cfg.target;
			if (_cfgTarget) {
				var _target;
				var _priority;
				
				if (isConfigured(_cfgTarget.alert)) {
					_priority = _cfgTarget.alert.priority ? _cfgTarget.alert.priority : _alertTarget.priority;
					_alertTarget.priority = _priority;
					
					_alertTarget.subscribed = true;
					log4jq.targets.alert = $.extend({}, log4jq.targetDefaults, _alertTarget);
					$.subscribe(log4jq.topic, _alertTarget.log, _priority);
				}
				if (isConfigured(_cfgTarget.console)) {
					_priority = _cfgTarget.console.priority ? _cfgTarget.console.priority : _consoleTarget.priority;
					_consoleTarget.priority = _priority;
					
					_consoleTarget.subscribed = true;
					log4jq.targets.console = $.extend({}, log4jq.targetDefaults, _consoleTarget);
					$.subscribe(log4jq.topic, _consoleTarget.log, _priority);
				}
				if (isConfigured(_cfgTarget.domInsert)) {
					_priority = _cfgTarget.domInsert.priority ? _cfgTarget.domInsert.priority : _domInsert.priority;
					
					_domInsert.priority = _priority;
					if (_cfgTarget.domInsert.$dom && _cfgTarget.domInsert.$dom instanceof jQuery) {
						_domInsert.$dom = _cfgTarget.domInsert.$dom;
					}
					
					_domInsert.subscribed = true;
					log4jq.targets.domInsert = $.extend({}, log4jq.targetDefaults, _domInsert);
					$.subscribe(log4jq.topic, _domInsert.log, _priority);
				}
				var _customTarget = _cfgTarget.custom;
				if (_customTarget && $.isArray(_customTarget)) {
					for (var i = 0; i < _customTarget.length; i++ ){
						var _eachCustomTarget = _customTarget[i];
						if ($.type(_eachCustomTarget) === 'object'
							&& _eachCustomTarget.log
							&& $.type(_eachCustomTarget.log) === 'function')
						{
							_eachCustomTarget.subscribed = true;
							_eachCustomTarget = $.extend({}, log4jq.targetDefaults, _eachCustomTarget);
							log4jq.targets.custom.push(_eachCustomTarget);
							
							if (_eachCustomTarget.priority) {
								$.subscribe(log4jq.topic, _eachCustomTarget.log, _eachCustomTarget.priority);
							} else {
								$.subscribe(log4jq.topic, _eachCustomTarget.log);
							}
						}
					}
				}
			}
		}
		log4jq.subscribers = $.unsubscribe(log4jq.topic);
		return log4jq;
	}

	/* ===== Compatibility Functions =====
	 * Fallback for older browsers (such as IE) that don't implement JSON.stringify
	 *
	 * @param obj The JSON object to turn into a string.
	 * @return A string representation of the JSON object.
	 */
	var JSON;
	if (!JSON) {
		JSON = {};
	}
	JSON.stringify = JSON.stringify || function(obj) {
		var t = $.type(obj);
		if (t != "object" || obj === null) {
			// simple data type
			if (t == "string") {
				obj = '"'+obj+'"';
			}
			return String(obj);
		} else {
			// recurse array or object
			var n, v, json = [], arr = (obj && obj.constructor == Array);
			for (n in obj) {
				v = obj[n];
				t = $.type(v);
				if (t == "string") {
					v = '"'+v+'"';
				} else if (t == "object" && v !== null) {
					v = JSON.stringify(v);
				}
				json.push((arr ? "" : '"' + n + '":') + String(v));
			}
			return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
		}
	};
	/*
	 * Public API of log4jq
	 */
	$.configureLog4jq = log4jq.configure;
	$.log4jqLevels = log4jq.levels;
	$.debug = log4jq.debug;
	$.info  = log4jq.info;
	$.warn  = log4jq.warn;
	$.error = log4jq.error;
	
}( jQuery ) );