module( "jquery.store testing" );

test( "$.store.addType", function() {
	expect( 11 );
	var testStore;
	var store = function( key, value ) {
			return testStore.apply( this, arguments );
		};
	$.store.addType( "custom", store );
	equal( $.store.types.custom, store, "custom store added" );

	testStore = function( key, value ) {
		equal( key, "foo", "getter key" );
		equal( value, undefined, "getter value" );
		return "bar";
	};
	equal( $.store.custom( "foo" ), "bar", "getter" );
	testStore = function( key, value ) {
		equal( key, "foo", "setter key" );
		equal( value, "baz", "setter value" );
		return value;
	};
	equal( $.store.custom( "foo", "baz" ), "baz", "setter" );
	equal( $.store( "foo", "baz", { type: "custom" } ), "baz",
		"setter via options" );
	var storageTypes = _.keys($.store.types);
	equal( storageTypes.length, 4);
});


if ( "localStorage" in $.store.types ) {
	module( "$.store.localStorage", {
		setup: function() {
			localStorage.clear();
		}
	});

	test( "localStorage", function() {
		expect( 9 );
		deepEqual( $.store.localStorage(), {}, "empty store" );
		equal( $.store.localStorage( "foo" ), undefined, "get; miss" );
		equal( $.store.localStorage( "foo", "bar" ), "bar", "set" );
		equal( $.store.localStorage( "foo" ), "bar", "get" );
		deepEqual( $.store.localStorage( "baz", { qux: "quux" } ),
			{ qux: "quux" }, "set object" );
		deepEqual( $.store.localStorage( "baz" ), { qux: "quux" }, "get object" );
		deepEqual( $.store.localStorage(),
			{ foo: "bar", baz: { qux: "quux" } }, "get all" );
		equal( $.store.localStorage( "foo", null ), null, "delete" );
		equal( $.store.localStorage( "foo" ), undefined, "deleted" );
	});

	asyncTest( "localStorage expiration", function() {
		expect( 5 );
		$.store.localStorage( "forever", "not really", { expires: 100 } );
		$.store.localStorage( "forever", "and ever" );
		$.store.localStorage( "expiring1", "i disappear",
			{ expires: 500 } );
		$.store.localStorage( "expiring2", "i disappear too",
			{ expires: 1000 } );
		deepEqual( $.store.localStorage(), {
			forever: "and ever",
			expiring1: "i disappear",
			expiring2: "i disappear too"
		}, "all values exist" );
		setTimeout(function() {
			deepEqual( $.store.localStorage(), {
				forever: "and ever",
				expiring2: "i disappear too"
			}, "500 expired, others exist" );
			equal( $.store.localStorage( "expiring1" ), undefined,
				"500 expired" );
			equal( $.store.localStorage( "expiring2" ), "i disappear too",
			"1000 still valid" );
		}, 750 );
		setTimeout(function() {
			deepEqual( $.store.localStorage(), { forever: "and ever" }, "both expired" );
			start();
		}, 1250 );
	});

	test( "localStorage multi-page", function() {
		expect( 1 );
		var iframe = $( "#other-page" )[0];
		
		var otherJqueryStore = (iframe.contentWindow || iframe.contentDocument.defaultView).$;
		
		// Chrome not permitting access to the iFrame
		if (otherJqueryStore !== undefined && otherJqueryStore !== null) {
			$.store.localStorage( "foo", "bar" );
			otherJqueryStore.store.localStorage( "baz", "qux" );
			deepEqual( $.store.localStorage(), {
				foo: "bar",
				baz: "qux"
			}, "both exist in current page" );
		} else {
			equal(1,0,"iframe cannot be accessed");
		}
	});
}

if ( "sessionStorage" in $.store.types ) {
	module( "$.store.sessionStorage", {
		setup: function() {
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
		}
	});

	test( "sessionStorage", function() {
		expect( 9 );
		deepEqual( $.store.sessionStorage(), {}, "empty store" );
		equal( $.store.sessionStorage( "foo" ), undefined, "get; miss" );
		equal( $.store.sessionStorage( "foo", "bar" ), "bar", "set" );
		equal( $.store.sessionStorage( "foo" ), "bar", "get" );
		deepEqual( $.store.sessionStorage( "baz", { qux: "quux" } ),
				{ qux: "quux" }, "set object" );
		deepEqual( $.store.sessionStorage( "baz" ), { qux: "quux" }, "get object" );
		deepEqual( $.store.sessionStorage(),
				{ foo: "bar", baz: { qux: "quux" } }, "get all" );
		equal( $.store.sessionStorage( "foo", null ), null, "delete" );
		equal( $.store.sessionStorage( "foo" ), undefined, "deleted" );
	});

	asyncTest( "sessionStorage expiration", function() {
		expect( 5 );
		$.store.sessionStorage( "forever", "not really", { expires: 100 } );
		$.store.sessionStorage( "forever", "and ever" );
		$.store.sessionStorage( "expiring1", "i disappear",
			{ expires: 500 } );
		$.store.sessionStorage( "expiring2", "i disappear too",
			{ expires: 1000 } );
		deepEqual( $.store.sessionStorage(), {
			forever: "and ever",
			expiring1: "i disappear",
			expiring2: "i disappear too"
		}, "all values exist" );
		setTimeout(function() {
			deepEqual( $.store.sessionStorage(), {
				forever: "and ever",
				expiring2: "i disappear too"
			}, "500 expired, others exist" );
			equal( $.store.sessionStorage( "expiring1" ), undefined,
				"500 expired" );
			equal( $.store.sessionStorage( "expiring2" ), "i disappear too",
			"1000 still valid" );
		}, 750 );
		setTimeout(function() {
			deepEqual( $.store.sessionStorage(), { forever: "and ever" }, "both expired" );
			start();
		}, 1250 );
	});

	test( "sessionStorage multi-page", function() {
		expect( 1 );
		var iframe = $( "#other-page" )[0];

		var otherJqueryStore = (iframe.contentWindow || iframe.contentDocument.defaultView).$;

		// Chrome not permitting access to the iFrame
		if (otherJqueryStore !== undefined && otherJqueryStore !== null) {
			$.store.sessionStorage( "foo", "bar" );
			otherJqueryStore.store.sessionStorage( "baz", "qux" );
			deepEqual( $.store.sessionStorage(), {
				foo: "bar",
				baz: "qux"
			}, "both exist in current page" );
		} else {
			equal(1,0,"iframe cannot be accessed");
		}
	});
}

if ( "globalStorage" in $.store.types ) {
	module( "$.store.globalStorage", {
		setup: function() {
			var key,
				store = window.globalStorage[ location.hostname ];
			try {
				while ( key = store.key( 0 ) ) {
					store.removeItem( key );
				}
			} catch( error ) {}
		}
	});

	test( "globalStorage", function() {
		expect( 9 );
		deepEqual( $.store.globalStorage(), {}, "empty store" );
		equal( $.store.globalStorage( "foo" ), undefined, "get; miss" );
		equal( $.store.globalStorage( "foo", "bar" ), "bar", "set" );
		equal( $.store.globalStorage( "foo" ), "bar", "get" );
		deepEqual( $.store.globalStorage( "baz", { qux: "quux" } ),
			{ qux: "quux" }, "set object" );
		deepEqual( $.store.globalStorage( "baz" ), { qux: "quux" }, "get object" );
		deepEqual( $.store.globalStorage(),
			{ foo: "bar", baz: { qux: "quux" } }, "get all" );
		equal( $.store.globalStorage( "foo", null ), null, "delete" );
		equal( $.store.globalStorage( "foo" ), undefined, "deleted" );
	});

	asyncTest( "globalStorage expiration", function() {
		expect( 5 );
		$.store.globalStorage( "forever", "not really", { expires: 100 } );
		$.store.globalStorage( "forever", "and ever" );
		$.store.globalStorage( "expiring1", "i disappear",
			{ expires: 500 } );
		$.store.globalStorage( "expiring2", "i disappear too",
			{ expires: 1000 } );
		deepEqual( $.store.globalStorage(), {
			forever: "and ever",
			expiring1: "i disappear",
			expiring2: "i disappear too"
		}, "all values exist" );
		setTimeout(function() {
			deepEqual( $.store.globalStorage(), {
				forever: "and ever",
				expiring2: "i disappear too"
			}, "500 expired, others exist" );
			equal( $.store.globalStorage( "expiring1" ), undefined,
				"500 expired" );
			equal( $.store.globalStorage( "expiring2" ), "i disappear too",
			"1000 still valid" );
		}, 750 );
		setTimeout(function() {
			deepEqual( $.store.globalStorage(), { forever: "and ever" }, "both expired" );
			start();
		}, 1250 );
	});

	test( "globalStorage multi-page", function() {
		expect( 1 );
		var iframe = document.getElementById( "other-page" ),
			otherJqueryStore = (iframe.contentWindow || iframe.contentDocument.defaultView).$;
		$.store.globalStorage( "foo", "bar" );
		otherJqueryStore.store.globalStorage( "baz", "qux" );
		deepEqual( $.store.globalStorage(), {
			foo: "bar",
			baz: "qux"
		}, "both exist in current page" );
	});
}

if ( "userData" in $.store.types ) {
	module( "$.store.userData", {
		setup: function() {
			var attr,
				div = document.createElement( "div" );
			document.body.appendChild( div );
			div.addBehavior( "#default#userdata" );
			div.load( "amplify" );
			while ( attr = div.XMLDocument.documentElement.attributes[ 0 ] ) {
				div.removeAttribute( attr.name );
			}
			div.save( "amplify" );
		}
	});

	test( "userData", function() {
		expect( 9 );
		deepEqual( $.store.userData(), {}, "empty store" );
		equal( $.store.userData( "foo" ), undefined, "get; miss" );
		equal( $.store.userData( "foo", "bar" ), "bar", "set" );
		equal( $.store.userData( "foo" ), "bar", "get" );
		deepEqual( $.store.userData( "baz", { qux: "quux" } ),
			{ qux: "quux" }, "set object" );
		deepEqual( $.store.userData( "baz" ), { qux: "quux" }, "get object" );
		deepEqual( $.store.userData(),
			{ foo: "bar", baz: { qux: "quux" } }, "get all" );
		equal( $.store.userData( "foo", null ), null, "delete" );
		equal( $.store.userData( "foo" ), undefined, "deleted" );
	});

	asyncTest( "userData expiration", function() {
		expect( 5 );
		$.store.userData( "forever", "not really", { expires: 100 } );
		$.store.userData( "forever", "and ever" );
		$.store.userData( "expiring1", "i disappear",
			{ expires: 500 } );
		$.store.userData( "expiring2", "i disappear too",
			{ expires: 1000 } );
		deepEqual( $.store.userData(), {
			forever: "and ever",
			expiring1: "i disappear",
			expiring2: "i disappear too"
		}, "all values exist" );
		setTimeout(function() {
			deepEqual( $.store.userData(), {
				forever: "and ever",
				expiring2: "i disappear too"
			}, "500 expired, others exist" );
			equal( $.store.userData( "expiring1" ), undefined,
				"500 expired" );
			equal( $.store.userData( "expiring2" ), "i disappear too",
			"1000 still valid" );
		}, 750 );
		setTimeout(function() {
			deepEqual( $.store.userData(), { forever: "and ever" }, "both expired" );
			start();
		}, 1250 );
	});

	test( "userData multi-page", function() {
		expect( 1 );
		var iframe = document.getElementById( "other-page" ),
			otherJqueryStore = (iframe.contentWindow || iframe.contentDocument.defaultView).$;
		$.store.userData( "foo", "bar" );
		otherJqueryStore.store.userData( "baz", "qux" );
		deepEqual( $.store.userData(), {
			foo: "bar",
			baz: "qux"
		}, "both exist in current page" );
	});
}

module( "$.store.memory", {
	setup: function() {
		for( var key in $.store.memory() ) {
			$.store.memory( key, null );
		}
	}
});

test( "memory", function() {
	expect( 9 );
	deepEqual( $.store.memory(), {}, "empty store" );
	equal( $.store.memory( "foo" ), undefined, "get; miss" );
	equal( $.store.memory( "foo", "bar" ), "bar", "set" );
	equal( $.store.memory( "foo" ), "bar", "get" );
	deepEqual( $.store.memory( "baz", { qux: "quux" } ),
		{ qux: "quux" }, "set object" );
	deepEqual( $.store.memory( "baz" ), { qux: "quux" }, "get object" );
	deepEqual( $.store.memory(),
		{ foo: "bar", baz: { qux: "quux" } }, "get all" );
	equal( $.store.memory( "foo", null ), null, "delete" );
	equal( $.store.memory( "foo" ), undefined, "deleted" );
});

asyncTest( "memory expiration", function() {
	expect( 5 );
	$.store.memory( "forever", "not really", { expires: 100 } );
	$.store.memory( "forever", "and ever" );
	$.store.memory( "expiring1", "i disappear",
		{ expires: 500 } );
	$.store.memory( "expiring2", "i disappear too",
		{ expires: 1000 } );
	deepEqual( $.store.memory(), {
		forever: "and ever",
		expiring1: "i disappear",
		expiring2: "i disappear too"
	}, "all values exist" );
	setTimeout(function() {
		deepEqual( $.store.memory(), {
			forever: "and ever",
			expiring2: "i disappear too"
		}, "500 expired, others exist" );
		equal( $.store.memory( "expiring1" ), undefined,
			"500 expired" );
		equal( $.store.memory( "expiring2" ), "i disappear too",
		"1000 still valid" );
	}, 750 );
	setTimeout(function() {
		deepEqual( $.store.memory(), { forever: "and ever" }, "both expired" );
		start();
	}, 1250 );
});