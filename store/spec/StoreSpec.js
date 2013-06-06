describe("jquery.store", function() {
	var TestUtil = {
			getStore : function() {
				var Store = $.store;
				return Store;
			},
			resetStore : function() {
				var Store = TestUtil.getStore();
				TestUtil.configureLogger();
				return Store;
			},
			configureLogger : function() {
				var log4jq = $.configureLog4jq({
					enabled: true,
					level : "debug",
					targets : [
						{
							name: "console",
							enabled: true
						}
					]
				});
				return log4jq;
			},
			spyOn : function(store) {
				// cannot spyOn $.store b/c it is used as both a function and object
				spyOn(store, 'error').andCallThrough();
				spyOn(store, 'memory').andCallThrough();
				spyOn(store, 'addType').andCallThrough();
				if (store.localStorage) {
					spyOn(store, 'localStorage').andCallThrough();
				}
				if (store.sessionStorage) {
					spyOn(store, 'sessionStorage').andCallThrough();
				}
				if (store.globalStorage) {
					spyOn(store, 'globalStorage').andCallThrough();
				}
				return store;
			},
			keys : {
				foo : "foo",
				bar : "bar",
				baz : "baz",
				qux : "qux",
				quux : "quux"
			}
	};
	
	describe("when initially testing", function() {
		var Store;
		
		beforeEach(function() {
			Store = TestUtil.resetStore();
		});
		
		it("should have expected API", function() {
			var self = Store;
			expect(self).toHaveAPI(true);
		});
		
		it("should have working $.store.addType", function() {
			var self = Store;
			expect(self).toHaveAPI(true);
			self = TestUtil.spyOn(self);
			
			var foo = "foo";
			var bar = "bar";
			var baz = "baz";
			var testStore;
			var custom = {
				store : function( key, value ) {
					return testStore.apply( this, arguments );
				}
			}
			spyOn(custom,'store').andCallThrough();
			
			$.store.addType( "custom", custom.store );
			expect(self.addType).toHaveBeenCalled();
			expect($.store.types.custom).toBe(custom.store);

			testStore = function( key, value ) {
				expect(key).toBe(foo);
				expect(value).not.toBeDefined();
				return bar;
			};
			expect($.store.custom(foo)).toBe(bar);
			expect(custom.store).toHaveBeenCalled();
			
			testStore = function( key, value ) {
				expect(key).toBe(foo);
				expect(value).toBe(baz);
				return value;
			};
			
			expect( $.store.custom( foo, baz ) ).toBe(baz);
			expect(custom.store).toHaveBeenCalled();
			
			expect( $.store( foo, baz, { type: "custom" } ) ).toBe(baz);
			expect(custom.store).toHaveBeenCalled();
			var storageTypes = _.keys($.store.types);
			expect(storageTypes.length).toBe(4);
		});
	});
	
	describe("when using basics of in-memory storage ($.store.memory)", function() {
		var Store, fixture;
		
		beforeEach(function() {
			Store = TestUtil.resetStore();
			fixture = {
				reset : function() {
					for( var key in $.store.memory() ) {
						$.store.memory( key, null );
					}
				},
				data : {
					foo : "bar",
					baz : {
						qux : "quux"
					}
				}
			};
			fixture = $.extend(fixture, TestUtil.keys);
			fixture.reset();
		});
		
		it("should start as empty", function() {
			var self = Store;
			expect(self).toHaveAPI(true);
			self = TestUtil.spyOn(self);
			expect($.store.memory()).toBeEmptyCache();
			expect(self.memory).toHaveBeenCalled();
		});
		it("should have a cache miss when empty", function() {
			var self = Store;
			self = TestUtil.spyOn(self);
			expect($.store.memory(fixture.foo)).toBeCacheMiss();
		});
		it("should have cache put a string to string", function() {
			var self = Store;
			self = TestUtil.spyOn(self);
			expect($.store.memory(fixture.foo, fixture.bar)).toBe(fixture.bar);
		});
		it("should have cache put a string to object", function() {
			var self = Store;
			self = TestUtil.spyOn(self);
			expect($.store.memory(fixture.foo, fixture.bar)).toBe(fixture.bar);
			expect($.store.memory(fixture.baz, { qux : fixture.quux })).toBeDeepEquals({ qux: "quux" });
			expect($.store.memory(fixture.baz)).toBeDeepEquals({ qux: "quux" });
		});
		it("should have retrieve all items in cache", function() {
			var self = Store;
			self = TestUtil.spyOn(self);
			expect($.store.memory(fixture.foo, fixture.bar)).toBe(fixture.bar);
			expect($.store.memory(fixture.baz, { qux : fixture.quux })).toBeDeepEquals({ qux: "quux" });
			expect($.store.memory()).toBeDeepEquals(fixture.data);
		});
		it("should have evict 1 cache entry", function() {
			var self = Store;
			self = TestUtil.spyOn(self);
			expect($.store.memory(fixture.foo, null)).toBeNull();
			expect($.store.memory(fixture.foo)).not.toBeDefined();
		});
	});
	describe("when using TTL of in-memory storage ($.store.memory)", function() {
		var async = new AsyncSpec(this);
		var Store, fixture;
		
		async.beforeEach(function(done){
			Store = TestUtil.resetStore();
			fixture = {
				ttlData : {
						forever: "and ever",
						expiring1: "i disappear",
						expiring2: "i disappear too"
				},
				firstPuts : function() {
					$.store.memory("forever", "not really", { expires : 100});
					$.store.memory("forever", fixture.ttlData.forever);
					$.store.memory("expiring1", fixture.ttlData.expiring1, { expires : 50});
					$.store.memory("expiring2", fixture.ttlData.expiring2, { expires : 100});
					
					expect($.store.memory()).toBeDeepEquals(fixture.ttlData);
				},
				assertions: {
					first : function() {
						delete fixture.ttlData.expiring1;
						expect($.store.memory()).toBeDeepEquals(fixture.ttlData);
						expect($.store.memory("expiring1")).toBeCacheMiss();
						expect($.store.memory("expiring2")).not.toBeCacheMiss();
					},
					second : function() {
						delete fixture.ttlData.expiring1;
						delete fixture.ttlData.expiring2;
						expect($.store.memory()).toBeDeepEquals(fixture.ttlData);
						expect($.store.memory("expiring1")).toBeCacheMiss();
						expect($.store.memory("expiring2")).toBeCacheMiss();
					}
				}
			};
			fixture.firstPuts();
			_.delay(function(){
				done();
			}, 50)
		});
		
		async.it("should expire 1 of 3 cache entries", function(done) {
			var self = Store;
			self = TestUtil.spyOn(self);
			_.delay(function() {
				fixture.assertions.first();
				done();
			}, 5)
		})
		async.it("should expire 2 of 3 cache entries", function(done) {
			var self = Store;
			self = TestUtil.spyOn(self);
			_.delay(function() {
				fixture.assertions.second();
				done();
			}, 55)
		})
	});
	
	if ( "localStorage" in $.store.types ) {
		describe("when testing localStorage", function() {
			var Store;
			
			beforeEach(function() {
				Store = TestUtil.resetStore();
			});
			
			it("should fail initially", function() {
				expect(this).toBeOk(false, "TBD");
			});
		});
	}
	if ( "sessionStorage" in $.store.types ) {
		describe("when testing sessionStorage", function() {
			var Store;
			
			beforeEach(function() {
				Store = TestUtil.resetStore();
			});
			
			it("should fail initially", function() {
				expect(this).toBeOk(false, "TBD");
			});
		});
	}
	if ( "globalStorage" in $.store.types ) {
		describe("when testing globalStorage", function() {
			var Store;
			
			beforeEach(function() {
				Store = TestUtil.resetStore();
			});
			
			it("should fail initially", function() {
				expect(this).toBeOk(false, "TBD");
			});
		});
	}
	
	if ( "userData" in $.store.types ) {
		describe("when testing userData", function() {
			var Store;
			
			beforeEach(function() {
				Store = TestUtil.resetStore();
			});
			
			it("should fail initially", function() {
				expect(this).toBeOk(false, "TBD");
			});
		});
	}
	
	
});

