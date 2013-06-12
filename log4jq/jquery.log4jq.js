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
		version : "1.0.0.M1",
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
			if (hours< 10){
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
		isBoolean : function(input) {
			var _log4jq = this;
			return !_log4jq.isUndefined(input) && $.type(input) === 'boolean';
		},
		isString : function(input) {
			var _log4jq = this;
			return !_log4jq.isUndefined(input)  && $.type(input) === 'string';
		},
		isFunction : function(input) {
			var _log4jq = this;
			return !_log4jq.isUndefined(input)  && $.type(input) === 'function';
		},
		isObject : function(input) {
			var _log4jq = this;
			return !_log4jq.isUndefined(input)  && $.type(input) === 'object';
		},
		isUndefined : function(input) {
			return (input === undefined);
		},
		isNotNull : function(input) {
			return (input !== undefined && input !== null);
		},
		/*
		Default log entry structure.
		*/
		entryDefaults: {
			timestamp: null,
			message: "",
			format: function(args) {
				var _log4jq = log4jq;
				var _ctx = _log4jq.isObject(this.context)&& !$.isWindow(this.context) ? this.context : null;
				var _json = this.json;
				var _message = this.message;
				var msg = [];
				
				var _level = this.level;
				var _levels = this.levels;
				
				if (_level && _levels) {
					if (_level == _levels.trace) {
						msg.push("[TRACE]");
					} else if (_level == _levels.debug) {
						msg.push("[DEBUG]");
					} else if (_level == _levels.info) {
						msg.push("[INFO]");
					} else if (_level == _levels.warn) {
						msg.push("[WARN]");
					} else if (_level == _levels.error) {
						msg.push("[ERROR]");
					}
				}
				
				if (_log4jq.isNotNull(_ctx) && _log4jq.isString(_ctx.name)) {
					msg.push("[" + _ctx.name + "]");
				}
				
				msg.push("[" + log4jq.formatTimestamp(this.timestamp) + "]");
				
				if (_log4jq.isString(_message) && $.trim(_message).length > 0) {
					msg.push("[" + $.trim(_message) + "]");
				}
				if (_log4jq.isObject(_json)) {
					msg.push("\n" + JSON.stringify(_json));
				}
				return msg.join("");
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
			enabled: false,
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
				
				if (_log4jq.isString(message)) {
					_msg = message;
				} else if (_log4jq.isObject(message)) {
					_json = message;
				}
				if (object) {
					if (_log4jq.isString(object)) {
						_msg = object
					} else if (_log4jq.isObject(object)) {
						_json = object
					}
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
						_log4jq.publish(entry, _context);
					} catch (err) {
						// Ignore any errors and carry on logging!
					}
				}
			}
		},
		publish : function(logEntry, context) {
			var _log4jq = this;
			var publishTargets = _log4jq.findActiveTargets();
			$.each(publishTargets, function(i,target) {
				if (_log4jq.isObject(target) && target.log && _log4jq.isFunction(target.log)) {
					target.log.apply(context,[logEntry]);
				};
			});
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
			trace : 1,
			debug:  2,
			info:   3,
			warn:   4,
			error:  5
		}
	};
	
	log4jq = $.extend(log4jq, {
		/*
		Determines if a log entry will be excluded from being logged.

		Parameters:
		   entry  -   The object to be logged.
			Usage: 
		   $.log4jq.isExcluded(entry);
		*/
		isExcluded : function(entry) {
			var excluded = false;
			
			if(log4jq._level && !log4jq.isUndefined(entry.level)) {
				excluded = log4jq._level > entry.level;
			}
			return excluded;
		},
		/*
		Logs a trace object with all registered log targets.

		Parameters:
			message  -  The message string to be logged.
			object  -   The debug object to be logged.
			context -   The context for the log statement
		Usage: 
			$.trace("trace");
		*/
		trace : function(message /*string*/, object, context) { 
			var settings = $.extend({
				level: log4jq.levels.trace,
				levels: log4jq.levels,
				context : context
			}, {} );
			log4jq.log(message, object, settings);
		},
		/*
		Logs a debug object with all registered log targets.

		Parameters:
			message  -  The message string to be logged.
			object  -   The debug object to be logged.
			context -   The context for the log statement
		Usage: 
			$.debug("Debug");
		*/
		debug : function(message /*string*/, object, context) { 
			var settings = $.extend({
				level: log4jq.levels.debug,
				levels: log4jq.levels,
				context : context
			}, {} );
			log4jq.log(message, object, settings);
		},
		/*
		Logs an information object with all registered log targets.

		Parameters:
			message  -  The message string to be logged.
			object  -   The debug object to be logged.
			context -   The context for the log statement
		Usage: 
			$.info("Information");
		*/
		info : function(message /*string*/, object, context) { 
			var settings = $.extend({
				level: log4jq.levels.info,
				levels: log4jq.levels,
				context : context
			}, {} );
			log4jq.log(message, object, settings);
		},
		/*
		Logs a warning object with all registered log targets.
		
		Parameters:
			message  -  The message string to be logged.
			object  -   The debug object to be logged.

		Usage: 
			$.warn("Warning");
		*/
		warn : function(message /*string*/, object, context) {
			var settings = $.extend({
				level: log4jq.levels.warn,
				levels: log4jq.levels,
				context : context
			}, {} );
			log4jq.log(message, object, settings);
		},
		/*
		Logs an error object with all registered log targets.

		Parameters:
			message  -  The message string to be logged.
			object  -   The debug object to be logged.
			context -   The context for the log statement

		Usage: 
			$.error("Error");
		*/
		error : function(message /*string*/, object, context) {
			var settings = $.extend({
				level: log4jq.levels.error,
				levels: log4jq.levels,
				context : context
			}, {} );
			log4jq.log(message, object, settings);
		}
	});
	
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
				
				if (log4jq.isBoolean(cfg.enabled)) {
					self.enabled = cfg.enabled;
				} else {
					self.enabled = false;
				}
				var _log4jq = log4jq;
				_log4jq.targets.alert = self;
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
						case log4jq.levels.trace:
							if (console.log) {
								console.log(msg);
							}
							break;
						case log4jq.levels.info:
							if (console.info) {
								console.info(msg);
							}
							break;
						case log4jq.levels.warn:
							if (console.warn) {
								console.warn(msg);
							}
							break;
						case log4jq.levels.error:
							if (console.error) {
								console.error(msg);
								if (console.trace) {
									console.trace(msg);
								}
							}
							break;
						default:
							if (console.log) {
								console.log(msg);
							}
					}
				} // Check for firebug lite...
				else if (window.firebug && window.firebug.d && window.firebug.d.console) {
					var firebugConsole = window.firebug.d.console;
					switch(entry.level) {
						case log4jq.levels.trace:
							if (firebugConsole.log) {
								firebugConsole.log(msg);
							}
							break;
						case log4jq.levels.info:
							if (firebugConsole.info) {
								firebugConsole.info(msg);
							}
							break;
						case log4jq.levels.warn:
							if (firebugConsole.warn) {
								firebugConsole.warn(msg);
							}
							break;
						case log4jq.levels.error:
							if (firebugConsole.error) {
								firebugConsole.error(msg);
								if (firebugConsole.trace) {
									firebugConsole.trace(msg);
								}
							}
							break;
						default:
							if (firebugConsole.log) {
								firebugConsole.log(msg);
							}
					}
				}
			},
			configure : function(cfg, self) {
				var  _priority = cfg.priority;
				self.priority = _priority;
				if (log4jq.isBoolean(cfg.enabled)) {
					self.enabled = cfg.enabled;
				} else {
					self.enabled = false;
				}
				var _log4jq = log4jq;
				_log4jq.targets.console = self;
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
				if (log4jq.isBoolean(cfg.enabled)) {
					self.enabled = cfg.enabled;
				} else {
					self.enabled = false;
				}
				var _log4jq = log4jq;
				
				if (cfg.$dom !== 'undefined' && cfg.$dom instanceof jQuery) {
					self.$dom = cfg.$dom;
				}
				_log4jq.targets.domInsert = self;
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
				enabled: true
			},
			{
				name : "alert",
				enabled: false
			},
			{
				name : "divInsert",
				enabled: false
			}
		]
	};
	var _sortBy = function(array, callback) {
		var clone = array;
		if (callback) {
			clone.sort(callback);
		} else {
			clone.sort();
		}
		return clone;
	};
	
	log4jq = $.extend(log4jq, {
		/*
		Gets or sets the level exclusion value..
		*/
		findLevel : function(string) {
			var _log4jq = log4jq;
			
			if (_log4jq.isNotNull(string) && _log4jq.isString(string)) {
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
				if (target && target.enabled === true) {
					active.push(target);
				}
			});
			active = _sortBy(active, function(thiz,that) {
				var delta = thiz.priority - that.priority;
				return delta;
			});
			return active;
		},
		reset : function() {
			var _log4jq = log4jq;
			log4jq.targets = log4jq.outOfBoxTargets;
			_log4jq._enabled = false;
			_log4jq._level = null;
		}
	});
	
	log4jq.level = log4jq.findLevel;
	
	log4jq.subscribers = log4jq.findActiveTargets;
	
	log4jq.configure = function(cfg) {
		var self = log4jq;
		cfg = $.extend({}, _defaultConfiguration, cfg);
		/*
		 * in order to make this idempotent
		 * (i.e. configure can be called twice s.t. 2nd configure call overrides 1st)
		 * we ought to clear out all the subscriptions to the logging topic.
		 */
		self.reset();
		
		if (self.isBoolean(cfg.enabled)) {
			self.enabled(cfg.enabled);
		} else {
			self.enabled(_defaultConfiguration.enabled);
		}
		
		if (self.isString(cfg.level)) {
			self.findLevel(cfg.level);
		} else {
			self.findLevel(_defaultConfiguration.level);
		}
		
		$.each(cfg.targets, function(key,cfgTarget) {
			var target = self.findTarget(cfgTarget.name);
			cfgTarget.priority = 10 + key;
			if (target !== null) {
				// we're dealing with an out-of-box target;
				target.configure(cfgTarget, target);
			} else {
				// we're dealing with a custom target;
				target = $.extend({}, log4jq.targetDefaults, cfgTarget);
				
				if (log4jq.isObject(target) && target.log && log4jq.isFunction(target.log)) {
					target.configure = function(cfg, self) {
						var  _priority = cfg.priority;
						self.priority = _priority;
						if (log4jq.isBoolean(cfg.enabled)) {
							self.enabled = cfg.enabled;
						} else {
							self.enabled = false;
						}
						var _log4jq = log4jq;

						_log4jq.targets[self.name] = self;
					};
					target.configure(cfgTarget, target);
				}
			}
		});

		// log4jq.subscribers = $.unsubscribe(log4jq.topic);
		return self;
	}
	// store log4jq object for unit testing
	if (window && window.document) {
		var $document = $(document);
		$document.data(log4jq.key, log4jq);
	}

	/*
	 * Public API of log4jq
	 */
	$.configureLog4jq = log4jq.configure;
	$.trace = log4jq.trace;
	$.debug = log4jq.debug;
	$.info  = log4jq.info;
	$.warn  = log4jq.warn;
	$.error = log4jq.error;
	
}( jQuery ) );