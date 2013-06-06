beforeEach(function() {
	this.addMatchers({
		toBeOk : function(bool, message) {
			if (bool === true) {
				$.debug(message);
				return bool;
			} else if (bool === false) {
				$.error(message);
				return !bool;
			} else {
				$.info(message);
				return true;
			}
		},
		toHaveAPI : function(bool) {
			var self = this.actual;
			var result = bool && _.isFunction(self);
			result = result && _.isObject(self.types);
			result = result && _.isString(self.key);
			result = result && _.isString(self.type);
			
			result = result && _.isFunction(self.error);
			result = result && _.isFunction(self.memory);
			result = result && _.isFunction(self.addType);
			
			if (self.localStorage) {
				result = result && _.isFunction(self.localStorage);
				$.info("has local storage");
			} else {
				$.warn("lacks local storage");
			}
			if (self.sessionStorage) {
				result = result && _.isFunction(self.sessionStorage);
				$.info("has session storage");
			} else {
				$.warn("lacks session storage");
			}
			if (self.globalStorage) {
				result = result && _.isFunction(self.globalStorage);
				$.info("has global storage");
			} else {
				$.warn("lacks global storage");
			}
			return result;
		}
	});
});
