beforeEach(function() {
	this.addMatchers({
		toBeLoggingAt: function(level) {
			var result = false;
			var logger = this.actual;
			
			var alertTarget   = logger.findTarget("alert");
			var consoleTarget = logger.findTarget("console");
			var divTarget     = logger.findTarget("divInsert");
			var testTarget = logger.findTarget("testTarget");
			
			var isEnabled = logger.enabled();
			var actualLevel = logger.level();
			var targets = logger.subscribers();
			
			if (logger && isEnabled === true && targets.length === 3) {
				if (testTarget.enabled === true && alertTarget.enabled === false && consoleTarget.enabled === true && divTarget.enabled === true) {
					result = actualLevel === level;
				}
			};
			
			return result;
		},
		toLogString: function(string,level) {
			var result = false;
			var logger = this.actual;
			var testTarget = logger.findTarget("testTarget");
			var logEntry = testTarget.get();
			
			if (logger && testTarget && logEntry) {
				result = (logEntry.message === string && logEntry.timestamp instanceof Date && logEntry.getLevel() === level);
			}
			return result;
		},
		toLogJSON: function(json,level) {
			var result = false;
			var logger = this.actual;
			var testTarget = logger.findTarget("testTarget");
			var logEntry = testTarget.get();
			
			if (logger && testTarget && logEntry) {
				result = (logEntry.timestamp instanceof Date && logEntry.getLevel() === level && _.isEqual(logEntry.json, json));
			}
			return result;
		},
		toLogBoth: function(string,json,level) {
			var result = false;
			var logger = this.actual;
			var testTarget = logger.findTarget("testTarget");
			var logEntry = testTarget.get();
			
			if (logger && testTarget && logEntry) {
				var isString = logEntry.message === string && logEntry.timestamp instanceof Date && logEntry.getLevel() === level;
				var isJSON   = logEntry.timestamp instanceof Date && logEntry.getLevel() === level && _.isEqual(logEntry.json, json);
				result = (isString && isJSON);
			}
			return result;
		},
		toLogContext: function(level, logFunction) {
			var result = false;
			var logger = this.actual;

			var moduleSvc = {
					name : "moduleSvc",
					message : level.toUpperCase() + " message",
					execute : function() {
						logFunction(moduleSvc.message, {}, moduleSvc );
						var testTarget = logger.findTarget("testTarget");
						var logEntry   = testTarget.get();
						var logMessage = logEntry.format();
						
						var isLevel = logMessage.contains("[" + level.toUpperCase() +"]");
						var isName = logMessage.contains(moduleSvc.name);
						var isMessage = logMessage.contains(moduleSvc.message);
						return isLevel && isName && isMessage;
					}
			};
			if (logger && moduleSvc) {
				result = moduleSvc.execute();
			}
			return result;
		}
	});
});
