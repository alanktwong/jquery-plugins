describe("jquery.log4jq", function() {

	var testTarget = {
		name: "testTarget",
		version: "0.0.1",
		enabled: true,
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
			var $div = $(document);
			$div.data("logger-test",entry);
		},
		get: function() {
			var $div = $(document);
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
					enabled: false
				},
				{
					name: "console",
					enabled: true
				},
				{
					name: "divInsert",
					enabled: true,
					$dom : $("div#console-log")
				},
				testTarget
			]
		});
	};
	
	var logger;
	
	beforeEach(function() {
		logger = configure("debug");
	});

	describe("when logger is configured", function() {
		var activeSubscribers, alertTarget, consoleTarget, divTarget, customTarget;
		var level = "debug"
		
		beforeEach(function() {
			logger = configure(level);
			
			activeSubscribers = logger.subscribers();
			
			alertTarget   = logger.findTarget("alert");
			consoleTarget = logger.findTarget("console");
			divTarget     = logger.findTarget("divInsert");
			customTarget  = logger.findTarget("testTarget");
			
		});

		it("should enable the logger at DEBUG", function() {
			expect(logger).toBeLoggingAt(level);
		});
		it("should set up 3 active log targets", function() {
			expect(activeSubscribers.length).toBe(3);
		});
		it("should set up 3 active log targets in order", function() {
			expect(alertTarget.enabled).toBe(false);
			expect(consoleTarget.enabled).toBe(true);
			expect(divTarget.enabled).toBe(true);
			expect(customTarget.enabled).toBe(true);
			expect(activeSubscribers[0]).toBe(consoleTarget);
			expect(activeSubscribers[1]).toBe(divTarget);
			expect(activeSubscribers[2]).toBe(customTarget);
		});
	});

	describe("when logger is set to TRACE", function() {
		var logEntry, testTarget, plan, logEntry;
		var level = "trace";
		
		beforeEach(function() {
			plan = { planId : "alan", foo : function() { var bar }, baz : "quus" }; 
			logger = configure(level);
			testTarget = logger.findTarget("testTarget");
		});
		
		it("should enable the logger at TRACE", function() {
			expect(logger).toBeLoggingAt(level);
		});
		
		it("should trace a string message", function() {
			var hello = "hello";
			$.trace(hello);
			expect(logger).toLogString(hello, level);
		});
		
		it("should log an object with empty 'message' and full json", function() {
			$.trace(plan);
			logEntry = testTarget.get();
			expect(logger).toLogJSON(plan, level);
		});
		it("should log an object and a string with full 'message' and full json", function() {
			var hello = "hello";
			$.trace(hello, plan);
			expect(logger).toLogBoth(hello, plan, level);
		});
		it("should log with a context", function() {
			expect(logger).toLogContext(level, $.trace);
		});
	});

	describe("when logger is set to DEBUG", function() {
		var logEntry, testTarget, plan, logEntry;
		var level = "debug";
		
		beforeEach(function() {
			plan = { planId : "alan", foo : function() { var bar }, baz : "quus" }; 
			logger = configure(level);
			testTarget = logger.findTarget("testTarget");
		});
		
		it("should enable the logger at DEBUG", function() {
			expect(logger).toBeLoggingAt(level);
		});
		
		it("should trace a string message", function() {
			var hello = "hello";
			$.debug(hello);
			expect(logger).toLogString(hello, level);
		});
		
		it("should log an object with empty 'message' and full json", function() {
			$.debug(plan);
			expect(logger).toLogJSON(plan, level);
		});
		it("should log an object and a string with full 'message' and full json", function() {
			var hello = "hello";
			$.debug(hello, plan);
			expect(logger).toLogBoth(hello, plan, level);
		});
		it("should log with a context", function() {
			expect(logger).toLogContext(level, $.debug);
		});
	});
	
	describe("when logger is set to INFO", function() {
		var logEntry, testTarget, plan, logEntry;
		var level = "info";
		
		beforeEach(function() {
			plan = { planId : "alan", foo : function() { var bar }, baz : "quus" }; 
			logger = configure(level);
			testTarget = logger.findTarget("testTarget");
		});
		
		it("should enable the logger at INFO", function() {
			expect(logger).toBeLoggingAt(level);
		});
		
		it("should trace a string message", function() {
			var hello = "hello";
			$.info(hello);
			expect(logger).toLogString(hello, level);
		});
		
		it("should log an object with empty 'message' and full json", function() {
			$.info(plan);
			expect(logger).toLogJSON(plan, level);
		});
		it("should log an object and a string with full 'message' and full json", function() {
			var hello = "hello";
			$.info(hello, plan);
			expect(logger).toLogBoth(hello, plan, level);
		});
		it("should log with a context", function() {
			expect(logger).toLogContext(level, $.info);
		});
	});
	
	describe("when logger is set to WARN", function() {
		var logEntry, testTarget, plan, logEntry;
		var level = "warn";
		
		beforeEach(function() {
			plan = { planId : "alan", foo : function() { var bar }, baz : "quus" }; 
			logger = configure(level);
			testTarget = logger.findTarget("testTarget");
		});
		
		it("should enable the logger at WARN", function() {
			expect(logger).toBeLoggingAt(level);
		});
		
		it("should trace a string message", function() {
			var hello = "hello";
			$.warn(hello);
			expect(logger).toLogString(hello, level);
		});
		
		it("should log an object with empty 'message' and full json", function() {
			$.warn(plan);
			expect(logger).toLogJSON(plan, level);
		});
		it("should log an object and a string with full 'message' and full json", function() {
			var hello = "hello";
			$.warn(hello, plan);
			expect(logger).toLogBoth(hello, plan, level);
		});
		it("should log with a context", function() {
			expect(logger).toLogContext(level, $.warn);
		});
	});
	describe("when logger is set to ERROR", function() {
		var logEntry, testTarget, plan, logEntry;
		var level = "error";
		
		beforeEach(function() {
			plan = { planId : "alan", foo : function() { var bar }, baz : "quus" }; 
			logger = configure(level);
			testTarget = logger.findTarget("testTarget");
		});
		
		it("should enable the logger at ERROR", function() {
			expect(logger).toBeLoggingAt(level);
		});
		
		it("should trace a string message", function() {
			var hello = "hello";
			$.error(hello);
			expect(logger).toLogString(hello, level);
		});
		
		it("should log an object with empty 'message' and full json", function() {
			$.error(plan);
			expect(logger).toLogJSON(plan, level);
		});
		it("should log an object and a string with full 'message' and full json", function() {
			var hello = "hello";
			$.error(hello, plan);
			expect(logger).toLogBoth(hello, plan, level);
		});
		it("should log with a context", function() {
			expect(logger).toLogContext(level, $.error);
		});
	});
});