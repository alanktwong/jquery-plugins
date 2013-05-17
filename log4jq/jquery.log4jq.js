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
		version : "1.0.0.SNAPSHOT",
		key: "log4jq",
		/*
		 * Use the following topic to publish log entries to 
		 * the log targets using jquery.pubsub.
		 */
		topic : "/log4jq/logging",
		/*
		Generate date in Timestamp (YYYY-MM-DD HH:MM:SS.mmm) format
		*/
		formatTimestamp: function(timestamp) {
			var date    = timestamp.getDate();
			var month   = timestamp.getMonth()+1;
			var year    = timestamp.getFullYear();
			var hours   = timestamp.getHours();
			var minutes = timestamp.getMinutes();
			var seconds = timestamp.getSeconds();
			var msecs   = timestamp.getMilliseconds();

			if (date < 10){
				date = "0"+date;
			}
			if (month < 10){
				month = "0"+month;
			}
			if (hours<10){
				hours = "0"+hours;
			}
			if (minutes < 10){
				minutes = "0"+minutes;
			}
			if (seconds < 10){
				seconds = "0"+seconds;
			}
			return year+"-"+month+"-"+date+" "+hours+":"+minutes+":"+seconds+"."+msecs;
		},
		/*
		Default log entry structure.
		*/
		entryDefaults: {
			timestamp: null,
			message: "",
			format: function(args) {
				var _ctx = args && $.type(args) === "object" && !$.isWindow(args) ? args : null;
				var _json = this.json;
				var _message = this.message;
				var msg = "";
				
				var _level = this.level;
				var _levels = this.levels;
				
				if (_ctx !== null && _ctx.name && $.type(_ctx.name) === "string") {
					msg = "[" + ctx.name + "]";
				}
				
				var msg = msg + "[" + log4jq.formatTimestamp(this.timestamp) + "]";
				
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
			},
			getLevel : function() {
				var levelStr = null;
				var levels = this.levels;
				var levelInt = this.level;
				$.each(levels, function(key,value) {
					if (levelInt === value) {
						levelStr = key;
						return false;
					}
				});
				return levelStr;
			}
		},
		/*
		Default target structure.
		*/
		targetDefaults: {
			name: "",
			subscribed: false,
			log: function(entry) {
				$.noop();
			},
			configure : function(cfg, self) {
				$.noop();
			}
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
			var _log4jq = this;
			if (_log4jq.enabled()) {
				var t, target, _msg, _json;
				
				if (message && $.type(message) === "string") {
					_msg = message;
				} else if (message && $.type(message) === "object") {
					_json = message;
				}
				if (object && $.type(object) === "object") {
					_json = object
				} 
				var _context = null;
				if  (options.context) {
					_context = options.context;
				}
				 
				var entry = $.extend({}, this.entryDefaults, {
					timestamp: new Date(),
					message: _msg,
					json: _json
				}, options);
				if (!_log4jq.isExcluded(entry)) {
					// Log the entry with each of the registered targets.
					try {
						$.publish(_log4jq.topic, entry, {  context : _context } );
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
			info:  2,
			warn:  3,
			error: 4
		}
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
		message  -  The message string to be logged.
		object  -   The debug object to be logged.
		context -   The context for the log statement
	Usage: 
		$.debug("Debug");
	*/
	log4jq.debug = function(message /*string*/, object, context) { 
		var settings = $.extend({
			level: log4jq.levels.debug,
			levels: log4jq.levels,
			context : context
		}, {} );
		log4jq.log(message, object, settings);
	};
	/*
	Logs an information object with all registered log targets.

	Parameters:
		message  -  The message string to be logged.
		object  -   The debug object to be logged.
		context -   The context for the log statement
	Usage: 
		$.info("Information");
	*/
	log4jq.info = function(message /*string*/, object, context) { 
		var settings = $.extend({
			level: log4jq.levels.info,
			levels: log4jq.levels,
			context : context
		}, {} );
		log4jq.log(message, object, settings);
	};
	/*
	Logs a warning object with all registered log targets.
	
	Parameters:
		message  -  The message string to be logged.
		object  -   The debug object to be logged.

	Usage: 
		$.warn("Warning");
	*/
	log4jq.warn = function(message /*string*/, object, context) {
		var settings = $.extend({
			level: log4jq.levels.warn,
			levels: log4jq.levels,
			context : context
		}, {} );
		log4jq.log(message, object, settings);
	};
	/*
	Logs an error object with all registered log targets.

	Parameters:
		message  -  The message string to be logged.
		object  -   The debug object to be logged.
		context -   The context for the log statement

	Usage: 
		$.error("Error");
	*/
	log4jq.error = function(message /*string*/, object, context) {
		var settings = $.extend({
			level: log4jq.levels.error,
			levels: log4jq.levels,
			context : context
		}, {} );
		log4jq.log(message, object, settings);
	};
	
	// Extend the log entry defaults object to include a default log level.
	log4jq.entryDefaults.level = log4jq.levels.debug;

	
	log4jq.outOfBoxTargets = {};
	var _alertTarget = {
			name: "alert",
			version: log4jq.version,
			/*
			Logs a entry using the browser alert window.
			
			Parameters:
			   entry -   The entry to log.
			*/
			log: function(entry) {
				alert(entry.format(this));
			},
			configure : function(cfg, self) {
				var  _priority = cfg.priority;
				self.priority = _priority;
				if (cfg.subscribed !== 'undefined' && $.type(cfg.subscribed) === 'boolean') {
					self.subscribed = cfg.subscribed;
				} else {
					self.subscribed = false;
				}
				var _log4jq = log4jq;
				_log4jq.targets.alert = self;
				if (self.subscribed) {
					$.subscribe(_log4jq.topic, self.log, _priority);
				}
			}
	};
	log4jq.outOfBoxTargets.alert = $.extend({}, log4jq.targetDefaults, _alertTarget);
	var _consoleTarget = {
			name: "console",
			version: log4jq.version,
			/*
			 * Logs a entry to the console if available.
			 * 
			 * Parameters:
			 *		entry -   The entry to log.
			 */
			log: function(entry) {
				var msg = entry.format(this);
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
			},
			configure : function(cfg, self) {
				var  _priority = cfg.priority;
				self.priority = _priority;
				if (cfg.subscribed !== 'undefined' && $.type(cfg.subscribed) === 'boolean') {
					self.subscribed = cfg.subscribed;
				} else {
					self.subscribed = false;
				}
				var _log4jq = log4jq;
				_log4jq.targets.console = self;
				
				if (self.subscribed) {
					$.subscribe(_log4jq.topic, self.log, _priority);
				}
			}
	};
	log4jq.outOfBoxTargets.console = $.extend({}, log4jq.targetDefaults, _consoleTarget);
	var _domInsert = {
			name: "divInsert",
			version: log4jq.version,
			$dom: $("div#console"),
			/*
			 * Appends an entry as formatted string into DOM
			 * 
			 * Parameters:
			 *		entry -   The entry to log.
			 */
			log: function(entry) {
				var $rollingLog = $('p:last',_domInsert.$dom);
				var msg = entry.format(this);
				$rollingLog.after("<p>" + msg + "</p>");
			},
			configure : function(cfg, self) {
				var  _priority = cfg.priority;
				self.priority = _priority;
				if (cfg.subscribed !== 'undefined' && $.type(cfg.subscribed) === 'boolean') {
					self.subscribed = cfg.subscribed;
				} else {
					self.subscribed = false;
				}
				var _log4jq = log4jq;
				
				if (cfg.$dom !== 'undefined' && cfg.$dom instanceof jQuery) {
					self.$dom = cfg.$dom;
				}
				
				_log4jq.targets.domInsert = self;
				if (self.subscribed) {
					$.subscribe(_log4jq.topic, self.log, _priority);
				}
			}
	};
	log4jq.outOfBoxTargets.domInsert = $.extend({}, log4jq.targetDefaults, _domInsert);
	
	var _defaultConfiguration = {
		enabled : true,
		level : "debug",
		version : log4jq.version,
		targets : [
			{
				name : "console",
				subscribed: true
			},
			{
				name : "alert",
				subscribed: false
			},
			{
				name : "divInsert",
				subscribed: false
			}
		]
	}
	
	log4jq.help = {
		/*
		Gets or sets the level exclusion value..
		*/
		findLevel : function(string) {
			var _log4jq = log4jq;
			if (string !== undefined && string !== null) {
				// sets level as a string
				var levels = _log4jq.levels;
				var levelInt = _log4jq.levels.debug;
				$.each(levels, function(key,value) {
					if (key === string) {
						levelInt = value;
						return false;
					}
				});
				_log4jq._level = levelInt;
				_log4jq.entryDefaults.level = levelInt;
				return levelInt;
			} else {
				// gets level as a string
				var levelStr = null;
				var levels = _log4jq.levels;
				var levelInt = _log4jq._level;
				$.each(levels, function(key,value) {
					if (levelInt === value) {
						levelStr = key;
						return false;
					}
				});
				return levelStr;
			}
		},
		findTarget : function(name) {
			var target = null;
			var _log4jq = log4jq;
			$.each(_log4jq.targets, function(key,value) {
				if (key === name || name === value.name) {
					target = value;
					return false;
				}
			});
			return target;
		},
		findActiveTargets : function() {
			var active = [];
			var _log4jq = log4jq;
			$.each(_log4jq.targets, function(key,target) {
				if (target.subscribed) {
					active.push(target);
				}
			});
			return active;
		},
		reset : function() {
			var _log4jq = log4jq;
			log4jq.targets = log4jq.outOfBoxTargets;
			$.unsubscribe(_log4jq.topic);
			_log4jq._enabled = false;
			_log4jq._level = null;
		}
	};
	
	log4jq.level = log4jq.help.findLevel;
	
	log4jq.subscribers = log4jq.help.findActiveTargets;
	
	log4jq.configure = function(cfg) {
		var self = log4jq;
		cfg = $.extend({}, _defaultConfiguration, cfg);
		/*
		 * in order to make this idempotent
		 * (i.e. configure can be called twice s.t. 2nd configure call overrides 1st)
		 * we ought to clear out all the subscriptions to the logging topic.
		 */
		self.help.reset();
		
		if (cfg.enabled && $.type(cfg.enabled) === 'boolean') {
			self.enabled(cfg.enabled);
		} else {
			self.enabled(_defaultConfiguration.enabled);
		}
		
		if (cfg.level && $.type(cfg.level) === 'string' ) {
			self.help.findLevel(cfg.level);
		} else {
			self.help.findLevel(_defaultConfiguration.level);
		}
		
		
		$.each(cfg.targets, function(key,cfgTarget) {
			var target = self.help.findTarget(cfgTarget.name);
			cfgTarget.priority = 10 + key;
			if (target !== null) {
				// we're dealing with an out-of-box target;
				target.configure(cfgTarget, target);
			} else {
				// we're dealing with a custom target;
				target = $.extend({}, log4jq.targetDefaults, cfgTarget);
				
				if ($.type(target) === 'object' && target.log && $.type(target.log) === 'function') {
					target.configure = function(cfg, self) {
						var  _priority = cfg.priority;
						self.priority = _priority;
						if (cfg.subscribed !== 'undefined' && $.type(cfg.subscribed) === 'boolean') {
							self.subscribed = cfg.subscribed;
						} else {
							self.subscribed = false;
						}
						var _log4jq = log4jq;

						_log4jq.targets[self.name] = self;

						if (self.subscribed) {
							$.subscribe(_log4jq.topic, self.log, _priority);
						}
					};
					target.configure(cfgTarget, target);
				}
			}
		});

		// log4jq.subscribers = $.unsubscribe(log4jq.topic);
		return self;
	}

	/*
	 * Public API of log4jq
	 */
	$.configureLog4jq = log4jq.configure;
	$.debug = log4jq.debug;
	$.info  = log4jq.info;
	$.warn  = log4jq.warn;
	$.error = log4jq.error;
	
}( jQuery ) );