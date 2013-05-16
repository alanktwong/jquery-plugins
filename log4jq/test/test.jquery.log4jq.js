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

	equal( true, logger.enabled(), "logger should be enabled" );
	var activeTargets = logger.subscribers();
	equal( 3, activeTargets.length, "only 3 log targets should be set up" );
	
	equal( "debug", logger.level(), "logging level set to debug" );
	
	var alertTarget   = logger.help.findTarget("alert");
	var consoleTarget = logger.help.findTarget("console");
	var divTarget     = logger.help.findTarget("divInsert");
	var customTarget  = logger.help.findTarget("testTarget");
	
	equal( false, alertTarget.subscribed, "alert target should be disabled");
	equal( true, consoleTarget.subscribed, "alert target should be enabled");
	equal( true, divTarget.subscribed, "div target should be enabled");
	equal( true, customTarget.subscribed, "custom target should be enabled");
	
	equal( true, consoleTarget.priority < divTarget.priority, "priority of console target should be 1st");
	equal( true, divTarget.priority < customTarget.priority, "priority of div target should be 2nd");
	equal( true, consoleTarget.priority < customTarget.priority, "priority of custom target should be last");

});

test( "logging debug messages", function() {
	expect( 10 );
	var logger = configure("debug");

	equal( true, logger.enabled(), "logger should be enabled" );
	equal( "debug", logger.level(), "logger should be at debug level" );
	equal( 3, logger.subscribers().length, "only 3 log targets should be set up" );
	var testTarget  = logger.help.findTarget("testTarget");
	
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
			$.debug("moduleSvc", { msg : "debug in moduleSvc" }, moduleSvc );
		}
	}
	moduleSvc.execute();
	logEntry = testTarget.get();
});


test( "logging information messages", function() {
	expect( 10 );
	var logger = configure("info");

	equal( true, logger.enabled(), "logger should be enabled" );
	equal( "info", logger.level(), "logger should be at info level" );
	equal( 3, logger.subscribers().length, "only 3 log targets should be set up" );
	var testTarget  = logger.help.findTarget("testTarget");
	
	$.info("hello");
	var testTarget  = logger.help.findTarget("testTarget");
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
			$.info("moduleSvc", { msg : "info in moduleSvc" }, moduleSvc );
		}
	}
	moduleSvc.execute();
	logEntry = testTarget.get();
});


test( "logging warning messages", function() {
	expect( 10 );
	var logger = configure("warn");

	equal( true, logger.enabled(), "logger should be enabled" );
	equal( "warn", logger.level(), "logger should be at warning level" );
	equal( 3, logger.subscribers().length, "only 3 log targets should be set up" );
	var testTarget  = logger.help.findTarget("testTarget");

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
			$.warn("moduleSvc", { msg : "warning in moduleSvc" }, moduleSvc );
		}
	}
	moduleSvc.execute();
	logEntry = testTarget.get();
	
});

test( "logging error messages", function() {
	expect( 11 );
	var logger = configure("error");

	equal( true, logger.enabled(), "logger should be enabled" );
	equal( "error", logger.level(), "logger should be at error level" );
	equal( 3, logger.subscribers().length, "only 3 log targets should be set up" );
	var testTarget  = logger.help.findTarget("testTarget");

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
			$.error("moduleSvc", { msg : "error in moduleSvc" }, moduleSvc );
		}
	}
	moduleSvc.execute();
	logEntry = testTarget.get();
	equal("", logEntry.format(), "should contain moduleSvc");
	
});