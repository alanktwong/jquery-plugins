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
			// self should be $.store function/object
			var result = bool && _.isFunction(self);
			result = result && _.isObject(self.types);
			result = result && _.isString(self.key);
			
			result = result && _.isString(self.type);
			$.info("storageType is: " + self.type);
			
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
			if (self.userData) {
				result = result && _.isFunction(self.userData);
				$.info("has user data");
			} else {
				$.warn("lacks user data");
			}
			return result;
		},
		toBeEmptyCache : function() {
			var self = this.actual;
			return _.isEqual(self,{})
		},
		toBeCacheMiss : function() {
			var self = this.actual;
			return self === undefined;
		},
		toBeDeepEquals : function(expected) {
			var self = this.actual;
			return _.isEqual(self,expected)
		}
		
	});
});
