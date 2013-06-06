describe("jquery.store", function() {
	var TestUtil = {
			getStore : function() {
				return $.store;
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
			spyOnStore : function(Store) {
				spyOn($,'store').andCallThrough();
				spyOn(Store, 'error').andCallThrough();
				spyOn(Store, 'memory').andCallThrough();
				if (Store.localStorage) {
					spyOn(Store, 'localStorage').andCallThrough();
				}
				if (Store.sessionStorage) {
					spyOn(Store, 'sessionStorage').andCallThrough();
				}
				if (Store.globalStorage) {
					spyOn(Store, 'globalStorage').andCallThrough();
				}
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
			
			var foo = "foo";
			var bar = "bar";
			var baz = "baz";
			var testStore;
			var customStore = function( key, value ) {
				return testStore.apply( this, arguments );
			};
			
			$.store.addType( "custom", customStore );
			
			expect($.store.types.custom).toBe(customStore);

			testStore = function( key, value ) {
				expect(key).toBe(foo);
				expect(value).not.toBeDefined();
				return bar;
			};
			expect($.store.custom( foo)).toBe(bar);
			
			testStore = function( key, value ) {
				expect(key).toBe(foo);
				expect(value).toBe(baz);
				return value;
			};
			
			expect( $.store.custom( foo, baz ) ).toBe(baz);
			
			expect( $.store( foo, baz, { type: "custom" } ) ).toBe(baz);
			var storageTypes = _.keys($.store.types);
			expect(storageTypes.length).toBe(4);
		});
	});
	
	if ( "localStorage" in $.store.types ) {
		describe("when testing localStorage", function() {
			var Store;
			
			beforeEach(function() {
				Store = TestUtil.resetStore();
			});
			
			it("should fail initially", function() {
				expect(true).toBe(false);
			});
		});
	}
	
});

