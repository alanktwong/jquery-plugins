module( "jquery.logger testing" );

var testTarget = {
		name: "testTarget",
		version: "0.0.1",
		priority: 1,
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
			$("div#console-log").data("logger-test",entry);
			var _bar = $("body");
		},
		get: function() {
			//var _r = $.store.memory("logger-test");
			var _r = $("div#console-log").data("logger-test");
			
			return _r;
		}
	};



var configure = function() {
	return $.configureLog4jq({
		enabled: true,
		level : $.log4jqLevels.debug,
		isEnableCookies : false,
		target : {
			alert : false,
			console: {
				priority: 42
			},
			domInsert: {
				$dom : $("div#console-log"),
				priority : 10
			},
			custom : [ testTarget ]
		}
	});
}


var logger = configure();

test( "configuring the logger", function() {
	expect( 4 );

	equal( true, logger.enabled(), "logger should be enabled" );
	var targets = logger.targets;
	equal( 3, logger.subscribers.length, "only 3 log targets should be set up" );
	
	equal( 42, targets.console.priority, "priority of console target should be low");
	equal( 10, targets.domInsert.priority, "priority of domInsert target should be standard");

});

test( "logging debug messages", function() {
	expect( 8 );

	equal( true, logger.enabled(), "logger should be enabled" );
	
	//var $dom = $("div#console-log");
	$.debug("hello");
	var logEntry = testTarget.get();
	// msg : [DEBUG] {date time} hello
	equal( "hello", logEntry.message, "echo log message" );
	equal( true, logEntry.timestamp instanceof Date, "timestamp should be current" );
	equal( $.log4jqLevels.debug , logEntry.level, "log entry level should be at debug");

	var plan = { planId : "alan", foo : function() { var bar }, baz : "quus" }; 
	$.debug(plan);
	logEntry = testTarget.get();
	equal( "", logEntry.message, "logEntry message should be empty");
	equal( plan, logEntry.json, "logEntry.json should not be empty");
	
	$.debug("plan", plan);
	logEntry = testTarget.get();
	equal( "plan", logEntry.message, "logEntry.message should not be empty" );
	equal( plan, logEntry.json, "logEntry.json should not be empty" );
});


test( "logging information messages", function() {
	expect( 8 );

	equal( true, logger.enabled(), "logger should be enabled" );
	
	$.info("hello");
	var logEntry = testTarget.get();
	// msg : [DEBUG] {date time} hello
	equal( "hello", logEntry.message, "echo log message" );
	equal( true, logEntry.timestamp instanceof Date, "timestamp should be current" );
	equal( $.log4jqLevels.info , logEntry.level, "log entry level should be at debug");

	var plan = { planId : "alan", foo : function() { var bar }, baz : "quus" }; 
	$.info(plan);
	logEntry = testTarget.get();
	equal( "", logEntry.message, "logEntry message should be empty");
	equal( plan, logEntry.json, "logEntry.json should not be empty");
	
	$.info("plan", plan);
	logEntry = testTarget.get();
	equal( "plan", logEntry.message, "logEntry.message should not be empty" );
	equal( plan, logEntry.json, "logEntry.json should not be empty" );
});


test( "logging warning messages", function() {
	expect( 8 );

	equal( true, logger.enabled(), "logger should be enabled" );

	var $dom = $("div#console-log");
	$.warn("hello");
	var logEntry =testTarget.get();
	// msg : [DEBUG] {date time} hello
	equal( "hello", logEntry.message, "echo log message" );
	equal( true, logEntry.timestamp instanceof Date, "timestamp should be current" );
	equal( $.log4jqLevels.warn , logEntry.level, "log entry level should be at debug");

	var plan = { planId : "alan", foo : function() { var bar }, baz : "quus" }; 
	$.warn(plan);
	logEntry = testTarget.get();
	equal( "", logEntry.message, "logEntry message should be empty");
	equal( plan, logEntry.json, "logEntry.json should not be empty");
	
	$.warn("plan", plan);
	logEntry = testTarget.get();
	equal( "plan", logEntry.message, "logEntry.message should not be empty" );
	equal( plan, logEntry.json, "logEntry.json should not be empty" );
});

test( "logging error messages", function() {
	expect( 8 );

	equal( true, logger.enabled(), "logger should be enabled" );

	$.error("hello");
	var logEntry = testTarget.get();
	// msg : [DEBUG] {date time} hello
	equal( "hello", logEntry.message, "echo log message" );
	equal( true, logEntry.timestamp instanceof Date, "timestamp should be current" );
	equal( $.log4jqLevels.error , logEntry.level, "log entry level should be at debug");

	var plan = { planId : "alan", foo : function() { var bar }, baz : "quus" }; 
	$.error(plan);
	logEntry = testTarget.get();
	equal( "", logEntry.message, "logEntry message should be empty");
	equal( plan, logEntry.json, "logEntry.json should not be empty");
	
	$.error("plan", plan);
	logEntry = testTarget.get();
	equal( "plan", logEntry.message, "logEntry.message should not be empty" );
	equal( plan, logEntry.json, "logEntry.json should not be empty" );
});