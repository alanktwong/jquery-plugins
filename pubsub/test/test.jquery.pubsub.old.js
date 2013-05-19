module( "jquery.pubsub testing" );

test( "unsubscribe during publish", function() {
	expect( 4 );

	var topic = "/racy";
	function racer() {
		ok( true, "second subscriber" );
		var subscribers = $.unsubscribe( topic, racer );
		strictEqual(2, subscribers.length, "unsubscribed myself");
	}

	$.subscribe( topic, function() {
		ok( true, "first subscriber" );
	});
	$.subscribe( topic, racer );
	$.subscribe( topic, function() {
		ok( true, "third subscriber" );
	});
	$.publishSync( topic );
});

test( "multiple subscriptions", function() {
	expect( 4 );

	$.subscribe( "/sub/a/1 /sub/a/2 /sub/a/3", function() {
		ok( true );
	});
	$.publishSync( "/sub/a/1" );

	$.subscribe( "/sub/b/1 /sub/b/2", function() {
		ok( true );
	});
	
	// Test for Ticket #18
	$.subscribe( "/sub/b/1 /sub/b/3", function() {
		ok( true );
	});
	
	$.publishSync( "/sub/b/2" );
	$.publishSync( "/sub/b/2" );
	$.publishSync( "/sub/b/3" );
});