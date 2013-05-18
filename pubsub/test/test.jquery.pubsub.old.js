module( "jquery.pubsub testing" );

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

test( "unsubscribe during publish", function() {
	expect( 4 );

	function racer() {
		ok( true, "second subscriber" );
		var subscribers = $.unsubscribe( "racy", racer );
		strictEqual(2, subscribers.length, "unsubscribed myself");
	}

	$.subscribe( "racy", function() {
		ok( true, "first subscriber" );
	});
	$.subscribe( "racy", racer );
	$.subscribe( "racy", function() {
		ok( true, "third subscriber" );
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