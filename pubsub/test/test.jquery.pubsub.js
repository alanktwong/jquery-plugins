module( "jquery.pubsub testing" );

test( "topic", function() {
	expect( 5 );

	try {
		$.publish( undefined, function() {} );
	} catch( err ) {
		strictEqual( err.message, "You must provide a valid topic to publish.",
			"error with no topic to publish" );
	}

	try {
		$.subscribe( undefined, function() {} );
	} catch( err ) {
		strictEqual( err.message, "You must provide a valid topic to create a subscription.",
			"error with no topic to subscribe" );
	}
	
	try {
		$.subscribe( "/fake/topic", "fooey callback" );
	} catch( err ) {
		strictEqual( err.message, "You must provide a valid handle to the callback to add its subscription.",
			"error with no callback to subscribe" );
	}

	try {
		$.unsubscribe( undefined, function() {} );
	} catch( err ) {
		strictEqual( err.message, "You must provide a valid topic to remove a subscription.",
			"error with no topic to unsubscribe" );
	}
	try {
		var f = $.subscribe( "/fake/topic", function() {} );
		$.unsubscribe( "/fake/topic","fooey callback" );
	} catch( err ) {
		strictEqual( err.message, "You must provide a valid handle to the callback to remove its subscription.",
			"error with no callback to unsubscribe" );
	}
});

test( "continuation", function() {
	expect( 7 );
	$.subscribe( "continuation", function() {
		ok( true, "first subscriber called" );
	});
	$.subscribe( "continuation", function() {
		ok( true, "continued after no return value" );
		return true;
	});
	strictEqual( $.publish( "continuation" ), true,
		"return true when subscriptions are not stopped" );

	$.subscribe( "continuation", function() {
		ok( true, "continued after returning true" );
		return false;
	});
	$.subscribe( "continuation", function() {
		ok( false, "continued after returning false" );
	});
	strictEqual( $.publish( "continuation" ), false,
		"return false when subscriptions are stopped" );
});

test( "priority", function() {
	expect( 5 );
	var order = 0;

	$.subscribe( "priority", function() {
		strictEqual( order, 1, "priority default; #1" );
		order++;
	});
	$.subscribe( "priority", function() {
		strictEqual( order, 3, "priority 15; #1" );
		order++;
	}, 15 );
	$.subscribe( "priority", function() {
		strictEqual( order, 2, "priority default; #2" );
		order++;
	});
	$.subscribe( "priority", function() {
		strictEqual( order, 0, "priority 1; #1" );
		order++;
	}, 1 );
	$.subscribe( "priority", {}, function() {
		strictEqual( order, 4, "priority 15; #2" );
		order++;
	}, 15 );
	$.publish( "priority" );
});

test( "context", function() {
	expect( 3 );
	var obj = {},
		fn = function() {};

	$.subscribe( "context", function() {
		strictEqual( this, window, "default context" );
	});
	$.subscribe( "context", obj, function() {
		strictEqual( this, obj, "object" );
	});
	$.subscribe( "context", fn, function() {
		strictEqual( this, fn, "function" );
	});
	$.publish( "context" );
});

test( "data", function() {
	$.subscribe( "data", function( string, number, object ) {
		strictEqual( string, "hello", "string passed" );
		strictEqual( number, 5, "number passed" );
		deepEqual( object, {
			foo: "bar",
			baz: "qux"
		}, "object passed" );
		string = "goodbye";
		object.baz = "quux";
	});
	$.subscribe( "data", function( string, number, object ) {
		strictEqual( string, "hello", "string unchanged" );
		strictEqual( number, 5, "number unchanged" );
		deepEqual( object, {
			foo: "bar",
			baz: "quux"
		}, "object changed" );
	});

	var obj = {
		foo: "bar",
		baz: "qux"
	};
	$.publish( "data", "hello", 5, obj );
	deepEqual( obj, {
		foo: "bar",
		baz: "quux"
	}, "object updated" );
});

test( "unsubscribe", function() {
	expect( 4 );
	var order = 0;

	$.subscribe( "unsubscribe", function() {
		strictEqual( order, 0, "first subscriber called" );
		order++;
	});
	var fn = function() {
		ok( false, "removed by original reference" );
		order++;
	};
	$.subscribe( "unsubscribe", fn );
	$.subscribe( "unsubscribe", function() {
		strictEqual( order, 1, "second subscriber called" );
		order++;
	});
	var fn2 = $.subscribe( "unsubscribe", function() {
		ok( false, "removed by returned reference" );
		order++;
	});
	$.unsubscribe( "unsubscribe", fn );
	$.unsubscribe( "unsubscribe", fn2 );
	try {
		$.unsubscribe( "unsubscribe", function() {});
		ok( true, "no error with invalid handler" );
	} catch ( e ) {
		ok( false, "error with invalid handler" );
	}
	try {
		$.unsubscribe( "unsubscribe2", function() {});
		ok( true, "no error with invalid topic" );
	} catch ( e ) {
		ok( false, "error with invalid topic" );
	}
	$.publish( "unsubscribe" );
});

test( "unsubscribe during publish", function() {
	expect( 3 );

	function racer() {
		ok( true, "second" );
		$.unsubscribe( "racy", racer );
	}

	$.subscribe( "racy", function() {
		ok( true, "first" );
	});
	$.subscribe( "racy", racer );
	$.subscribe( "racy", function() {
		ok( true, "third" );
	});
	$.publish( "racy" );
});

test( "multiple subscriptions", function() {
	expect( 4 );

	$.subscribe( "/sub/a/1 /sub/a/2 /sub/a/3", function() {
		ok( true );
	});
	$.publish( "/sub/a/1" );

	$.subscribe( "/sub/b/1 /sub/b/2", function() {
		ok( true );
	});
	
	// Test for Ticket #18
	$.subscribe( "/sub/b/1 /sub/b/3", function() {
		ok( true );
	});
	
	$.publish( "/sub/b/2" );
	$.publish( "/sub/b/2" );
	$.publish( "/sub/b/3" );
});

test("jquery deferred", function() {
	expect(1);
	var isTest = false;
	if (isTest) {
		// below has nothing to do with pubsub plugin
		function asyncEvent(){
			var dfd = new $.Deferred();
			// Resolve after a random interval
			setTimeout(function(){
				dfd.resolve("done");
			}, Math.floor(400+Math.random()*2000));
			// Reject after a random interval
			setTimeout(function(){
				dfd.reject("fail");
			}, Math.floor(400+Math.random()*2000));
			// Show a "working..." message every half-second
			setTimeout(function working(){
				if ( dfd.state() === "pending" ) {
					dfd.notify("progress");
				}
			}, 1);
			// Return the Promise so caller can't change the Deferred
			return dfd.promise();
		};
		$.when( asyncEvent() ).then(
			function(status){
				strictEqual( "done", status, "asyncEvent is done" );
			},
			function(status){
				strictEqual( "fail", status, "asyncEvent has failed" );
			},
			function(status){
				strictEqual( "progress", status, "asyncEvent is in progress" );
			}
		);
	} else {
		ok(true);
	}
});