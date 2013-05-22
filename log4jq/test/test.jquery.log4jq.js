module( "jquery.logger testing w/o cookies" );

var testTarget = {
		name: "testTarget",
		version: "0.0.1",
		subscribed: true,
		/*
		 * Publishes an entry as formatted string onto a topic
		 * 
		 * Parameters:
		 *		entry -   The entry to log.
		 */
		log: function (entry) {
			var _self = testTarget;
			testTarget.set(entry);
		},
		set: function(entry) {
			var $div = $("div#console-log")
			$div.data("logger-test",entry);
		},
		get: function() {
			var $div = $("div#console-log");
			var _r = $div.data("logger-test");
			return _r;
		}
	};



var configure = function(level) {
	return $.configureLog4jq({
		enabled: true,
		level : level,
		targets : [
			{
				name: "alert",
				subscribed: false
			},
			{
				name: "console",
				subscribed: true
			},
			{
				name: "divInsert",
				subscribed: true,
				$dom : $("div#console-log")
			},
			testTarget
		]
	});
}

test( "configuring the logger", function() {
	expect( 10 );
	var logger = configure("debug");

	equal( logger.enabled(), true, "logger should be enabled" );
	var activeTargets = logger.subscribers();
	equal( 3, activeTargets.length, "only 3 log targets should be set up" );
	
	equal( "debug", logger.level(), "logging level set to debug" );
	
	var alertTarget   = logger.findTarget("alert");
	var consoleTarget = logger.findTarget("console");
	var divTarget     = logger.findTarget("divInsert");
	var customTarget  = logger.findTarget("testTarget");
	
	equal( false, alertTarget.subscribed, "alert target should be disabled");
	equal( true, consoleTarget.subscribed, "alert target should be enabled");
	equal( true, divTarget.subscribed, "div target should be enabled");
	equal( true, customTarget.subscribed, "custom target should be enabled");
	
	equal( true, consoleTarget.priority < divTarget.priority, "priority of console target should be 1st");
	equal( true, divTarget.priority < customTarget.priority, "priority of div target should be 2nd");
	equal( true, consoleTarget.priority < customTarget.priority, "priority of custom target should be last");

});

test( "logging TRACE messages", function() {
	expect( 13 );
	var logger = configure("trace");

	equal( logger.enabled(), true , "logger should be enabled" );
	equal( "trace", logger.level(), "logger should be at trace level" );
	equal( 3, logger.subscribers().length, "only 3 log targets should be set up" );
	var testTarget  = logger.findTarget("testTarget");
	
	$.trace("hello");
	var logEntry = testTarget.get();
	// msg : [TRACE] {date time} hello
	equal( "hello", logEntry.message, "echo log message" );
	equal( true, logEntry.timestamp instanceof Date, "timestamp should be current" );
	equal( "trace" , logEntry.getLevel(), "log entry level should be at trace");

	var plan = { planId : "alan", foo : function() { var bar }, baz : "quus" }; 
	$.trace(plan);
	logEntry = testTarget.get();
	equal( "", logEntry.message, "logEntry message should be empty");
	equal( plan, logEntry.json, "logEntry.json should not be empty");
	
	$.trace("plan", plan);
	logEntry = testTarget.get();
	equal( "plan", logEntry.message, "logEntry.message should not be empty" );
	equal( plan, logEntry.json, "logEntry.json should not be empty" );
	
	var moduleSvc = {
		name : "moduleSvc",
		execute : function() {
			$.trace("trace message", {}, moduleSvc );
			logEntry = testTarget.get();
			var logMessage = logEntry.format();
			equal(logMessage.contains("[TRACE]"),true, "should contain TRACE");
			equal(logMessage.contains(moduleSvc.name),true, "should contain 'moduleSvc'");
			equal(logMessage.contains("trace message"),true, "should contain 'trace message'");
		}
	};
	moduleSvc.execute();
});


test( "logging DEBUG messages", function() {
	expect( 13 );
	var logger = configure("debug");

	equal( logger.enabled(), true, "logger should be enabled" );
	equal( "debug", logger.level(), "logger should be at debug level" );
	equal( 3, logger.subscribers().length, "only 3 log targets should be set up" );
	var testTarget  = logger.findTarget("testTarget");
	
	//var $dom = $("div#console-log");
	$.debug("hello");
	var logEntry = testTarget.get();
	// msg : [DEBUG] {date time} hello
	equal( "hello", logEntry.message, "echo log message" );
	equal( true, logEntry.timestamp instanceof Date, "timestamp should be current" );
	equal( "debug" , logEntry.getLevel(), "log entry level should be at debug");

	var plan = { planId : "alan", foo : function() { var bar }, baz : "quus" }; 
	$.debug(plan);
	logEntry = testTarget.get();
	equal( "", logEntry.message, "logEntry message should be empty");
	equal( plan, logEntry.json, "logEntry.json should not be empty");
	
	$.debug("plan", plan);
	logEntry = testTarget.get();
	equal( "plan", logEntry.message, "logEntry.message should not be empty" );
	equal( plan, logEntry.json, "logEntry.json should not be empty" );
	
	var moduleSvc = {
		name : "moduleSvc",
		execute : function() {
			$.debug("debug message", {}, moduleSvc );
			logEntry = testTarget.get();
			var logMessage = logEntry.format();
			equal(logMessage.contains("[DEBUG]"),true, "should contain DEBUG");
			equal(logMessage.contains(moduleSvc.name),true, "should contain 'moduleSvc'");
			equal(logMessage.contains("debug message"),true, "should contain 'debug message'");
		}
	};
	moduleSvc.execute();
});


test( "logging INFO messages", function() {
	expect( 13 );
	var logger = configure("info");

	equal( true, logger.enabled(), "logger should be enabled" );
	equal( "info", logger.level(), "logger should be at info level" );
	equal( 3, logger.subscribers().length, "only 3 log targets should be set up" );
	var testTarget  = logger.findTarget("testTarget");
	
	$.info("hello");
	var testTarget  = logger.findTarget("testTarget");
	var logEntry = testTarget.get();
	// msg : [DEBUG] {date time} hello
	equal( "hello", logEntry.message, "echo log message" );
	equal( true, logEntry.timestamp instanceof Date, "timestamp should be current" );
	equal( "info" , logEntry.getLevel(), "log entry level should be at info");

	var plan = { planId : "alan", foo : function() { var bar }, baz : "quus" }; 
	$.info(plan);
	logEntry = testTarget.get();
	equal( "", logEntry.message, "logEntry message should be empty");
	equal( plan, logEntry.json, "logEntry.json should not be empty");
	
	$.info("plan", plan);
	logEntry = testTarget.get();
	equal( "plan", logEntry.message, "logEntry.message should not be empty" );
	equal( plan, logEntry.json, "logEntry.json should not be empty" );
	
	var moduleSvc = {
		name : "moduleSvc",
		execute : function() {
			$.info("info message", {}, moduleSvc );
			logEntry = testTarget.get();
			var logMessage = logEntry.format();
			equal(logMessage.contains("[INFO]"),true, "should contain INFO");
			equal(logMessage.contains(moduleSvc.name),true, "should contain 'moduleSvc'");
			equal(logMessage.contains("info message"),true, "should contain 'info message'");
		}
	};
	moduleSvc.execute();
});


test( "logging WARN messages", function() {
	expect( 13 );
	var logger = configure("warn");

	equal( true, logger.enabled(), "logger should be enabled" );
	equal( "warn", logger.level(), "logger should be at warning level" );
	equal( 3, logger.subscribers().length, "only 3 log targets should be set up" );
	var testTarget  = logger.findTarget("testTarget");

	var $dom = $("div#console-log");
	$.warn("hello");

	var logEntry = testTarget.get();
	// msg : [DEBUG] {date time} hello
	equal( "hello", logEntry.message, "echo log message" );
	equal( true, logEntry.timestamp instanceof Date, "timestamp should be current" );
	equal( "warn" , logEntry.getLevel(), "log entry level should be at warn");

	var plan = { planId : "alan", foo : function() { var bar }, baz : "quus" }; 
	$.warn(plan);
	logEntry = testTarget.get();
	equal( "", logEntry.message, "logEntry message should be empty");
	equal( plan, logEntry.json, "logEntry.json should not be empty");
	
	$.warn("plan", plan);
	logEntry = testTarget.get();
	equal( "plan", logEntry.message, "logEntry.message should not be empty" );
	equal( plan, logEntry.json, "logEntry.json should not be empty" );
	
	var moduleSvc = {
		name : "moduleSvc",
		execute : function() {
			$.warn("warning message", {}, moduleSvc );
			logEntry = testTarget.get();
			var logMessage = logEntry.format();
			equal(logMessage.contains("[WARN]"),true, "should contain WARN");
			equal(logMessage.contains(moduleSvc.name),true, "should contain 'moduleSvc'");
			equal(logMessage.contains("warning message"),true, "should contain 'warning message'");
		}
	};
	moduleSvc.execute();
});

test( "logging ERROR messages", function() {
	expect( 13 );
	var logger = configure("error");

	equal( true, logger.enabled(), "logger should be enabled" );
	equal( "error", logger.level(), "logger should be at error level" );
	equal( 3, logger.subscribers().length, "only 3 log targets should be set up" );
	var testTarget  = logger.findTarget("testTarget");

	$.error("hello");

	var logEntry = testTarget.get();
	// msg : [DEBUG] {date time} hello
	equal( "hello", logEntry.message, "echo log message" );
	equal( true, logEntry.timestamp instanceof Date, "timestamp should be current" );
	equal( "error" , logEntry.getLevel(), "log entry level should be at error");

	var plan = { planId : "alan", foo : function() { var bar }, baz : "quus" }; 
	$.error(plan);
	logEntry = testTarget.get();
	equal( "", logEntry.message, "logEntry message should be empty");
	equal( plan, logEntry.json, "logEntry.json should not be empty");
	
	$.error("plan", plan);
	logEntry = testTarget.get();
	equal( "plan", logEntry.message, "logEntry.message should not be empty" );
	equal( plan, logEntry.json, "logEntry.json should not be empty" );
	
	var moduleSvc = {
		name : "moduleSvc",
		execute : function() {
			$.error("failure message", {}, moduleSvc );
			logEntry = testTarget.get();
			var logMessage = logEntry.format();
			equal(logMessage.contains("[ERROR]"),true, "should contain ERROR");
			equal(logMessage.contains(moduleSvc.name),true, "should contain 'moduleSvc'");
			equal(logMessage.contains("failure message"),true, "should contain 'failure message'");
		}
	};
	moduleSvc.execute();
});