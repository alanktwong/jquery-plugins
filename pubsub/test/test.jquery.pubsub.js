var TestUtil = {
	getPubSub : function() {
		if ($.store) {
			return $.store("PubSub");
		} else if (window && window.document) {
			var $document = $(document);
			return $document.data('PubSub');
		}
	},
	resetPubSub : function() {
		var PubSub = TestUtil.getPubSub();
		PubSub.reset();
		TestUtil.configureLogger();
		return PubSub;
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
	}
};

module( "jquery.pubsub testing" );

test( "unsubscribe during synchronous publish", function() {
	$.warn("this seems like a flaky thing to support");
	expect( 4 );
	var PubSub = TestUtil.resetPubSub();
	var fixture = {
		topic : "/racy/unsubscribe",
		one : {
			notify : function() {
				ok( true, "1st subscriber" );
			}
		},
		racer : {
			notify : function() {
				var self = fixture;
				ok( true, "2nd subscriber" );
				var subscribers = $.unsubscribe( self.topic, self.racer.subscriptionId );
				strictEqual(2, subscribers.length, "unsubscribed myself");
			}
		},
		three : {
			notify : function() {
				ok( true, "3rd subscriber" );
			}
		}
	};
	fixture.one.subscriptionId   = $.subscribe( fixture.topic, fixture.one.notify );
	fixture.racer.subscriptionId = $.subscribe( fixture.topic, fixture.racer.notify );
	fixture.three.subscriptionId = $.subscribe( fixture.topic, fixture.three.notify );
	$.publishSync( fixture.topic );
});

test( "subscribe 1 callback to multiple topics", function() {
	expect( 4 );
	
	var PubSub = TestUtil.resetPubSub();
	var sub = {
			topic : "/sub",
			createCallback : function()  {
				var cb = function(notification) {
					ok(true);
				};
				return cb;
			},
			a : {
				topic : "/sub/a",
				one : {
					topic : "/sub/a/1"
				},
				two : {
					topic : "/sub/a/2"
				},
				three : {
					topic : "/sub/a/3"
				}
			},
			b : {
				topic : "/sub/b",
				one : {
					topic : "/sub/b/1"
				},
				two : {
					topic : "/sub/b/2"
				},
				three : {
					topic : "/sub/b/3"
				}
			}
	};
	

	var x = $.subscribe( sub.a.one.topic + " " + sub.a.two.topic + " "  + sub.a.three.topic, sub.createCallback());
	$.publishSync( sub.a.one.topic );

	$.subscribe( sub.b.one.topic + " " + sub.b.two.topic, sub.createCallback() );
	
	// Test for Ticket #18
	$.subscribe( sub.b.one.topic + " " + sub.b.three.topic, sub.createCallback);
	
	$.publishSync( sub.b.two.topic );
	$.publishSync( sub.b.two.topic );
	$.publishSync( sub.b.three.topic );
});


