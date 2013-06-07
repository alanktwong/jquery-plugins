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
				if (store.userData) {
					spyOn(store, 'userData').andCallThrough();
				}
				return store;
			},
			keys : {
				foo : "foo",
				bar : "bar",
				baz : "baz",
				qux : "qux",
				quux : "quux"
			},
			clear : {
				memory : function() {
					for( var key in $.store.memory() ) {
						$.store.memory( key, null );
					}
				},
				local : function() {
					localStorage.clear();
				},
				session : function() {
					try {
						sessionStorage.clear();
					} catch ( error ) {
						var key;
						try {
							while ( key = sessionStorage.key( 0 ) ) {
								sessionStorage.removeItem( key );
							}
						} catch( error ) {}
					}
				},
				global : function() {
					var key;
					var store = window.globalStorage[ location.hostname ];
					try {
						while ( key = store.key( 0 ) ) {
							store.removeItem( key );
						}
					} catch( error ) {}
				},
				userData : function() {
					var attr;
					var div = document.createElement( "div" );
					document.body.appendChild( div );
					div.addBehavior( "#default#userdata" );
					div.load( "amplify" );
					while ( attr = div.XMLDocument.documentElement.attributes[ 0 ] ) {
						div.removeAttribute( attr.name );
					}
					div.save( "amplify" );
				}
			},
			createBasicFixture : function(clear,store) {
				var fixture = {
						reset : clear,
						store : store,
						data : {
							foo : "bar",
							baz : {
								qux : "quux"
							}
						}
				};
				fixture = $.extend(fixture, TestUtil.keys);
				fixture.reset();
				return fixture;
			},
			createMultiPageFixture : function(clear,store) {
				var fixture = {
						reset : clear,
						store : store,
						data : {
							foo: "bar",
							baz: "qux"
						},
						getOtherPageStore : function() {
							var iframe = $( "#other-page" )[0];
							var contentWindow = iframe.contentWindow;
							var contentDocument = iframe.contentDocument;
							
							var $getOtherPageStore = (contentWindow.$ || contentDocument.defaultView.$);
							return $getOtherPageStore;
						}
				};
				fixture = $.extend(fixture, TestUtil.keys);
				fixture.reset();
				return fixture;
			},
			createTTLFixture : function(store) {
				var fixture = {
						store : store,
						ttlData : {
								forever: "and ever",
								expiring1: "i disappear",
								expiring2: "i disappear too"
						},
						firstPuts : function() {
							fixture.store("forever", "not really", { expires : 100});
							fixture.store("forever", fixture.ttlData.forever);
							fixture.store("expiring1", fixture.ttlData.expiring1, { expires : 100});
							fixture.store("expiring2", fixture.ttlData.expiring2, { expires : 200});
							
							expect(fixture.store()).toBeDeepEquals(fixture.ttlData);
						},
						assertions: {
							first : function() {
								delete fixture.ttlData.expiring1;
								expect(fixture.store()).toBeDeepEquals(fixture.ttlData);
								expect(fixture.store("expiring1")).toBeCacheMiss();
								expect(fixture.store("expiring2")).not.toBeCacheMiss();
							},
							second : function() {
								delete fixture.ttlData.expiring1;
								delete fixture.ttlData.expiring2;
								expect(fixture.store()).toBeDeepEquals(fixture.ttlData);
								expect(fixture.store("expiring1")).toBeCacheMiss();
								expect(fixture.store("expiring2")).toBeCacheMiss();
							}
						}
				};
				return fixture;
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
			};
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
			fixture = TestUtil.createBasicFixture(TestUtil.clear.memory, $.store.memory);
		});
		it("should start as empty", function() {
			expect(Store).toHaveAPI(true);
			expect(fixture.store()).toBeEmptyCache();
		});
		it("should have a cache miss when empty", function() {
			expect(fixture.store(fixture.foo)).toBeCacheMiss();
		});
		it("should have cache put a string to string", function() {
			expect(fixture.store(fixture.foo, fixture.bar)).toBe(fixture.bar);
		});
		it("should have cache put a string to object", function() {
			expect(fixture.store(fixture.foo, fixture.bar)).toBe(fixture.bar);
			expect(fixture.store(fixture.baz, { qux : fixture.quux })).toBeDeepEquals({ qux: "quux" });
			expect(fixture.store(fixture.baz)).toBeDeepEquals({ qux: "quux" });
		});
		it("should have retrieve all items in cache", function() {
			expect(fixture.store(fixture.foo, fixture.bar)).toBe(fixture.bar);
			expect(fixture.store(fixture.baz, { qux : fixture.quux })).toBeDeepEquals({ qux: "quux" });
			expect(fixture.store()).toBeDeepEquals(fixture.data);
		});
		it("should have evicted 1 cache entry", function() {
			expect(fixture.store(fixture.foo, null)).toBeNull();
			expect(fixture.store(fixture.foo)).not.toBeDefined();
		});
	});
	describe("when using TTL of in-memory storage ($.store.memory)", function() {
		var async = new AsyncSpec(this);
		var Store, fixture;
		
		async.beforeEach(function(done){
			Store = TestUtil.resetStore();
			fixture = TestUtil.createTTLFixture($.store.memory);
			fixture.firstPuts();
			_.delay(function(){
				done();
			}, 100);
		});
		
		async.it("should expire 1 of 3 cache entries", function(done) {
			_.delay(function() {
				fixture.assertions.first();
				done();
			}, 10);
		})
		async.it("should expire 2 of 3 cache entries", function(done) {
			_.delay(function() {
				fixture.assertions.second();
				done();
			}, 110);
		})
	});
	
	if ( "localStorage" in $.store.types ) {
		describe("when using basics of local storage ($.store.localStorage)", function() {
			var Store, fixture;
			
			beforeEach(function() {
				Store = TestUtil.resetStore();
				fixture = TestUtil.createBasicFixture(TestUtil.clear.local, $.store.localStorage);
			});
			it("should start as empty", function() {
				expect(Store).toHaveAPI(true);
				expect(fixture.store()).toBeEmptyCache();
			});
			it("should have a cache miss when empty", function() {
				expect(fixture.store(fixture.foo)).toBeCacheMiss();
			});
			it("should have cache put a string to string", function() {
				expect(fixture.store(fixture.foo, fixture.bar)).toBe(fixture.bar);
			});
			it("should have cache put a string to object", function() {
				expect(fixture.store(fixture.foo, fixture.bar)).toBe(fixture.bar);
				expect(fixture.store(fixture.baz, { qux : fixture.quux })).toBeDeepEquals({ qux: "quux" });
				expect(fixture.store(fixture.baz)).toBeDeepEquals({ qux: "quux" });
			});
			it("should have retrieve all items in cache", function() {
				expect(fixture.store(fixture.foo, fixture.bar)).toBe(fixture.bar);
				expect(fixture.store(fixture.baz, { qux : fixture.quux })).toBeDeepEquals({ qux: "quux" });
				expect(fixture.store()).toBeDeepEquals(fixture.data);
			});
			it("should have evicted 1 cache entry", function() {
				expect(fixture.store(fixture.foo, null)).toBeNull();
				expect(fixture.store(fixture.foo)).not.toBeDefined();
			});
		});
		
		describe("when using TTL of local storage ($.store.localStorage)", function() {
			var async = new AsyncSpec(this);
			var Store, fixture;
			
			async.beforeEach(function(done){
				Store = TestUtil.resetStore();
				fixture = TestUtil.createTTLFixture($.store.localStorage);
				fixture.firstPuts();
				_.delay(function(){
					done();
				}, 100);
			});
			
			async.it("should expire 1 of 3 cache entries", function(done) {
				_.delay(function() {
					fixture.assertions.first();
					done();
				}, 10);
			});
			async.it("should expire 2 of 3 cache entries", function(done) {
				_.delay(function() {
					fixture.assertions.second();
					done();
				}, 110);
			});
		});
		describe("when using multiple pages for local storage ($.store.localStorage)", function() {
			var Store, fixture;
			
			beforeEach(function() {
				Store = TestUtil.resetStore();
				fixture = TestUtil.createMultiPageFixture(TestUtil.clear.local, $.store.localStorage);
			});
			
			it("should access store from other page", function() {
				var $otherPageStore = fixture.getOtherPageStore();
				if (!_.isUndefined($otherPageStore) && !_.isNull($otherPageStore)) {
					fixture.store(fixture.foo, fixture.bar);
					$otherPageStore.store.localStorage(fixture.baz, fixture.qux);
					
					expect(fixture.store()).toBe(fixture.data);
				} else {
					$.error("ifroam cannot be accessed");
					expect(1).toBe(0);
				}
			});
			
		});
	}
	
	if ( "sessionStorage" in $.store.types ) {
		describe("when using basics of session storage ($.store.sessionStorage)", function() {
			var Store, fixture;
			
			beforeEach(function() {
				Store = TestUtil.resetStore();
				fixture = TestUtil.createBasicFixture(TestUtil.clear.session, $.store.sessionStorage);
			});
			it("should start as empty", function() {
				expect(Store).toHaveAPI(true);
				expect(fixture.store()).toBeEmptyCache();
			});
			it("should have a cache miss when empty", function() {
				expect(fixture.store(fixture.foo)).toBeCacheMiss();
			});
			it("should have cache put a string to string", function() {
				expect(fixture.store(fixture.foo, fixture.bar)).toBe(fixture.bar);
			});
			it("should have cache put a string to object", function() {
				expect(fixture.store(fixture.foo, fixture.bar)).toBe(fixture.bar);
				expect(fixture.store(fixture.baz, { qux : fixture.quux })).toBeDeepEquals({ qux: "quux" });
				expect(fixture.store(fixture.baz)).toBeDeepEquals({ qux: "quux" });
			});
			it("should have retrieve all items in cache", function() {
				expect(fixture.store(fixture.foo, fixture.bar)).toBe(fixture.bar);
				expect(fixture.store(fixture.baz, { qux : fixture.quux })).toBeDeepEquals({ qux: "quux" });
				expect(fixture.store()).toBeDeepEquals(fixture.data);
			});
			it("should have evicted 1 cache entry", function() {
				expect(fixture.store(fixture.foo, null)).toBeNull();
				expect(fixture.store(fixture.foo)).not.toBeDefined();
			});
		});
		
		describe("when using TTL of session storage ($.store.sessionStorage)", function() {
			var async = new AsyncSpec(this);
			var Store, fixture;
			
			async.beforeEach(function(done){
				Store = TestUtil.resetStore();
				fixture = TestUtil.createTTLFixture($.store.sessionStorage);
				fixture.firstPuts();
				_.delay(function(){
					done();
				}, 100);
			});
			
			async.it("should expire 1 of 3 cache entries", function(done) {
				_.delay(function() {
					fixture.assertions.first();
					done();
				}, 10);
			});
			async.it("should expire 2 of 3 cache entries", function(done) {
				_.delay(function() {
					fixture.assertions.second();
					done();
				}, 110);
			});
		});
	}
	
	if ( "globalStorage" in $.store.types ) {
		describe("when using basics of global storage ($.store.globalStorage)", function() {
			var Store, fixture;
			
			beforeEach(function() {
				Store = TestUtil.resetStore();
				fixture = TestUtil.createBasicFixture(TestUtil.clear.global, $.store.globalStorage);
			});
			it("should start as empty", function() {
				expect(Store).toHaveAPI(true);
				expect(fixture.store()).toBeEmptyCache();
			});
			it("should have a cache miss when empty", function() {
				expect(fixture.store(fixture.foo)).toBeCacheMiss();
			});
			it("should have cache put a string to string", function() {
				expect(fixture.store(fixture.foo, fixture.bar)).toBe(fixture.bar);
			});
			it("should have cache put a string to object", function() {
				expect(fixture.store(fixture.foo, fixture.bar)).toBe(fixture.bar);
				expect(fixture.store(fixture.baz, { qux : fixture.quux })).toBeDeepEquals({ qux: "quux" });
				expect(fixture.store(fixture.baz)).toBeDeepEquals({ qux: "quux" });
			});
			it("should have retrieve all items in cache", function() {
				expect(fixture.store(fixture.foo, fixture.bar)).toBe(fixture.bar);
				expect(fixture.store(fixture.baz, { qux : fixture.quux })).toBeDeepEquals({ qux: "quux" });
				expect(fixture.store()).toBeDeepEquals(fixture.data);
			});
			it("should have evicted 1 cache entry", function() {
				expect(fixture.store(fixture.foo, null)).toBeNull();
				expect(fixture.store(fixture.foo)).not.toBeDefined();
			});
		});
		
		describe("when using TTL of global storage ($.store.globalStorage)", function() {
			var async = new AsyncSpec(this);
			var Store, fixture;
			
			async.beforeEach(function(done){
				Store = TestUtil.resetStore();
				fixture = TestUtil.createTTLFixture($.store.globalStorage);
				fixture.firstPuts();
				_.delay(function(){
					done();
				}, 100);
			});
			
			async.it("should expire 1 of 3 cache entries", function(done) {
				_.delay(function() {
					fixture.assertions.first();
					done();
				}, 10);
			});
			async.it("should expire 2 of 3 cache entries", function(done) {
				_.delay(function() {
					fixture.assertions.second();
					done();
				}, 110);
			});
		});
	}
	
	if ( "userData" in $.store.types ) {
		describe("when using basics of user data ($.store.userData)", function() {
			var Store, fixture;
			beforeEach(function() {
				Store = TestUtil.resetStore();
				fixture = TestUtil.createBasicFixture(TestUtil.clear.userData, $.store.userData);
			});
			it("should start as empty", function() {
				expect(Store).toHaveAPI(true);
				expect(fixture.store()).toBeEmptyCache();
			});
			it("should have a cache miss when empty", function() {
				expect(fixture.store(fixture.foo)).toBeCacheMiss();
			});
			it("should have cache put a string to string", function() {
				expect(fixture.store(fixture.foo, fixture.bar)).toBe(fixture.bar);
			});
			it("should have cache put a string to object", function() {
				expect(fixture.store(fixture.foo, fixture.bar)).toBe(fixture.bar);
				expect(fixture.store(fixture.baz, { qux : fixture.quux })).toBeDeepEquals({ qux: "quux" });
				expect(fixture.store(fixture.baz)).toBeDeepEquals({ qux: "quux" });
			});
			it("should have retrieve all items in cache", function() {
				expect(fixture.store(fixture.foo, fixture.bar)).toBe(fixture.bar);
				expect(fixture.store(fixture.baz, { qux : fixture.quux })).toBeDeepEquals({ qux: "quux" });
				expect(fixture.store()).toBeDeepEquals(fixture.data);
			});
			it("should have evicted 1 cache entry", function() {
				expect(fixture.store(fixture.foo, null)).toBeNull();
				expect(fixture.store(fixture.foo)).not.toBeDefined();
			});
		});
		
		describe("when using TTL of user data ($.store.userData)", function() {
			var async = new AsyncSpec(this);
			var Store, fixture;
			async.beforeEach(function(done){
				Store = TestUtil.resetStore();
				fixture = TestUtil.createTTLFixture($.store.userData);
				fixture.firstPuts();
				_.delay(function(){
					done();
				}, 100);
			});
			
			async.it("should expire 1 of 3 cache entries", function(done) {
				_.delay(function() {
					fixture.assertions.first();
					done();
				}, 10);
			});
			async.it("should expire 2 of 3 cache entries", function(done) {
				_.delay(function() {
					fixture.assertions.second();
					done();
				}, 110);
			});
		});
	}
	
	
});

