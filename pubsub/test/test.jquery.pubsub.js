module( "jquery.pubsub testing" );

var TestUtil = {
	getPubSub : function() {
		if ($.store) {
			return $.store("pubsub");
		} else if (window && window.document) {
			var $document = $(document);
			return $document.data('pubsub');
		}
	},
	clone : function(obj) {
		// used to clone objects like Notification or Subscription
		_.clone(obj);
	},
	resetPubSub : function() {
		var PubSub = TestUtil.getPubSub();
		PubSub.reset();
		return PubSub;
	}
};


test("internal functionality", function() {
	expect( 7 );
	
	var PubSub = TestUtil.resetPubSub();
	deepEqual(false, PubSub.validateTopicName("bad topic name"), "topic names may not have white space");
	deepEqual(false, PubSub.validateTopicName({}), "topic names must be a string");
	deepEqual(false, PubSub.validateTopicName(null), "topic names must be defined");
	deepEqual(false, PubSub.validateTopicName("app.Name"), "each node in a topic name must be an alphanumeric string");
	deepEqual(false, PubSub.validateTopicName("appName"), "topic name must be begin with a slash");
	
	var topic = "/app/module/class";
	deepEqual(true, PubSub.validateTopicName(topic), "topic names must be a string defined a la Unix directory");
	var topics = PubSub.createTopics(topic);
	deepEqual( topics, ["/app/module/class", "/app/module", "/app"], "ancestory of topics created in bubble-up order" );
});

test("notification creation", function() {
	expect( 9 );
	
	var PubSub = TestUtil.resetPubSub();
	var topic = "/app/module/class";

	var data = { id : 1, date: new Date(), name: "name" };
	var context = {};
	var publication = PubSub.createPublication(topic ,{ data: data, context: context });
	
	var notification = publication.notification;
	deepEqual( notification !== null, true, "notification created" );
	deepEqual( notification.data, data, "notification.data created" );
	deepEqual( notification.publishTopic, topic, "notification.publishTopic created" );
	deepEqual( notification.context, context, "notification.context created" );

	publication = PubSub.createPublication(topic, { data : data });
	notification = publication.notification;
	deepEqual( notification.context, null, "notification created w/o context" );
	equal(true, PubSub.Util.isNotNull(notification.timestamp), "timestamp added");
	
	try {
		notification = PubSub.createPublication(topic)
	} catch( err ) {
		strictEqual( err.message, "You must provide options to create a Notification.",
			"cannot create notification w/o options" );
	}
	
	publication = PubSub.createPublication(topic, {});
	notification = publication.notification;
	deepEqual( notification.data, null,    "notification created w/o context or data" );
	deepEqual( notification.context, null, "notification created w/o context or data" );
});

test("subscription creation", function() {
	expect( 10 );
	
	var PubSub = TestUtil.resetPubSub();
	var topic = "/app/module/class";
	var data = { id : 1, date: new Date(), name: "name" };
	var context = {};

	var callback = function(notification) {
		$.noop();
	};
	var priority = 100;
	var topics = PubSub.createTopics(topic);
	
	var subscription = PubSub.createSubscription(topic, callback, priority, context);
	deepEqual( subscription !== null, true, "subscription created" );
	equal(true, PubSub.Util.isNotNull(subscription.timestamp), "timestamp added");
	
	deepEqual( subscription.topics, topics, "subscription.topics created" );
	deepEqual( subscription.callback, callback, "subscription.callback created" );
	deepEqual( subscription.priority, priority, "subscription.priority created" );
	deepEqual( subscription.context, context, "subscription.context created" );
	
	subscription = PubSub.createSubscription(topic, callback, priority);
	deepEqual( subscription.context, null, "subscription created w/o context" );
	subscription = PubSub.createSubscription(topic, callback);
	deepEqual( subscription.context, null, "subscription created w/o context or priority" );
	deepEqual( subscription.priority, 10, "subscription created w/o context or priority" );
	
	var hasSub = PubSub.hasSubscriptions(topic);
	equal(false, hasSub, "has no subscriptions");
});

test("topic error handling", function() {
	expect( 5 );
	var PubSub = TestUtil.resetPubSub();

	try {
		$.publish( undefined, function() {} );
	} catch( err ) {
		strictEqual( err.message, "You must provide a valid topic name to publish.",
			"error with no topic to publish" );
	}

	try {
		$.subscribe( undefined, function() {} );
	} catch( err ) {
		strictEqual( err.message, "You must provide a valid topic name to create a Subscription.",
			"error with undefined topic to subscribe" );
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
			"error with undefined topic to unsubscribe" );
	}
	try {
		$.unsubscribe( "badName", function() {} );
	} catch( err ) {
		strictEqual( err.message, "You must provide a valid topic to remove a subscription.",
			"error with bad topic name to unsubscribe" );
	}
});

test("subscribe to topic with just a callback", function() {
	expect( 8 );
	
	var PubSub = TestUtil.resetPubSub();
	var topic = "/app/module/class";
	var topics = PubSub.createTopics(topic);
	var callback = function(notification) {
		$.noop();
	};
	
	var subscription0 = $.subscribe(topic, callback);

	equal(true, PubSub.hasSubscriptions(topic), "has a subscription");
	equal(true, subscription0 !== null, "has returned a subscription");
	equal(1, PubSub.getSubscriptions(topic).length, "has exactly 1 subscription");
	equal(callback, subscription0.callback, "has returned a subscription w/ callback");
	deepEqual( topics, subscription0.topics, "ancestory of topics for the subscription" );
	equal(null, subscription0.context, "has returned a subscription w/o context");
	
	var subscription1 = $.subscribe(topic, callback);
	equal(2, PubSub.getSubscriptions(topic).length, "now has exactly 2 subscriptions");
	notStrictEqual(subscription0.id, subscription1.id, "IDs of both subscriptions are unique GUIDs");
	
	
});


test("subscribe to topic with a callback and a context", function() {
	expect( 6 );
	
	var PubSub = TestUtil.resetPubSub();
	var topic = "/app/module/class";
	var topics = PubSub.createTopics(topic);
	var callback = function(notification) {
		$.noop();
	};
	var context = {};
	
	var subscription = $.subscribe(topic, context, callback);

	equal(true, PubSub.hasSubscriptions(topic), "has a subscription");
	equal(true, subscription !== null, "has returned a subscription");
	equal(1, PubSub.getSubscriptions(topic).length, "has exactly 1 subscription");
	equal(callback, subscription.callback, "has returned a subscription w/ callback");
	deepEqual( topics, subscription.topics, "ancestory of topics for the subscription" );
	equal(context, subscription.context, "has returned a subscription w/ context");
});


test("subscribe to topic with a callback and a priority", function() {
	expect( 6 );
	
	var PubSub = TestUtil.resetPubSub();
	var topic = "/app/module/class";
	var topics = PubSub.createTopics(topic);
	var callback = function(notification) {
		$.noop();
	};
	var priority = 100;
	
	var subscription = $.subscribe(topic, callback, priority);

	equal(true, PubSub.hasSubscriptions(topic), "has a subscription");
	equal(true, subscription !== null, "has returned a subscription");
	equal(1, PubSub.getSubscriptions(topic).length, "has exactly 1 subscription");
	equal(callback, subscription.callback, "has returned a subscription w/ callback");
	deepEqual( topics, subscription.topics, "ancestory of topics for the subscription" );
	equal(priority, subscription.priority, "has returned a subscription w/ priority");
});

test("subscribe to topic with a callback, a priority and a context", function() {
	expect( 7 );
	
	var PubSub = TestUtil.resetPubSub();
	var topic = "/app/module/class";
	var topics = PubSub.createTopics(topic);
	var callback = function(notification) {
		$.noop();
	};
	var priority = 100;
	var context = {};
	
	var subscription = $.subscribe(topic, context, callback, priority);

	equal(true, PubSub.hasSubscriptions(topic), "has a subscription");
	equal(true, subscription !== null, "has returned a subscription");
	equal(1, PubSub.getSubscriptions(topic).length, "has exactly 1 subscription");
	equal(callback, subscription.callback, "has returned a subscription w/ callback");
	deepEqual( topics, subscription.topics, "ancestory of topics for the subscription" );
	equal(priority, subscription.priority, "has returned a subscription w/ priority");
	equal(context, subscription.context, "has returned a subscription w/ context");
});

test("unsubscribe", function() {
	expect( 4 );
	var PubSub = TestUtil.resetPubSub();
	var topic  = "/unsubscribe";
	var topic2 = "/unsubscribe2";

	var order = 0;
	var subscriber1 = $.subscribe( topic, function() {
		strictEqual( order, 0, "first subscriber called" );
		order++;
	});
	var subscriber2 = $.subscribe( topic, function() {
		ok( false, "removed by original reference" );
		order++;
	});
	var subscriber3 = $.subscribe( topic, function() {
		strictEqual( order, 1, "second subscriber called" );
		order++;
	});
	var subscriber4 = $.subscribe( topic, function() {
		ok( false, "removed by returned reference" );
		order++;
	});
	
	var subscribers = [];
	subscribers = $.unsubscribe( topic, subscriber2 );
	subscribers = $.unsubscribe( topic, subscriber4 );
	strictEqual(2, subscribers.length, "2 subscribers left as even-numbered ones were removed");
	try {
		subscribers = $.unsubscribe( topic, function() {});
		ok( false, "error with invalid handler" );
	} catch ( err ) {
		strictEqual( err.message, "You must provide the subscription generated for the callback to remove it.",
			"error with no topic to unsubscribe" );
	}
	$.publishSync( topic );
});

test("unsubscribe all", function() {
	expect( 4 );
	var order = 0;

	var PubSub = TestUtil.resetPubSub();
	var topic  = "/unsubscribeAll";
	var subscriber1 = $.subscribe( topic, function() {
		strictEqual( order, 0, "first subscriber called" );
		order++;
	});
	
	var subscriber2 = $.subscribe( topic, function() {
		strictEqual( order, 1, "2nd subscriber called" );
		order++;
	});

	var result1 = $.publishSync( topic );
	
	var subscribers = $.unsubscribe( topic );
	strictEqual(0, subscribers.length, "no subscribers left on the topic");
	
	var result2 = $.publishSync( topic );
	ok(result2, "no subscribers notified");
});

test( "priority for synchronous publication", function() {
	var PubSub = TestUtil.resetPubSub();
	expect( 5 );
	
	var order = 0,
		subscription,
		topic = "/priority/sync";

	subscription = $.subscribe( topic, function() {
		strictEqual( order, 1, "priority default; #1" );
		order++;
	});
	subscription = $.subscribe( topic, function() {
		strictEqual( order, 3, "priority 15; #1" );
		order++;
	}, 15 );
	subscription = $.subscribe( topic, function() {
		strictEqual( order, 2, "priority default; #2" );
		order++;
	});
	subscription = $.subscribe( topic, function() {
		strictEqual( order, 0, "priority 1; #1" );
		order++;
	}, 1 );
	subscription = $.subscribe( topic, {}, function() {
		strictEqual( order, 4, "priority 15; #2" );
		order++;
	}, 15 );
	
	var publication = $.publishSync( topic );
});

asyncTest( "priority for asynchronous publication", function() {
	var PubSub = TestUtil.resetPubSub();
	expect( 5 );

	_.delay(function() {
		var order = 0,
			subscription,
			topic = "/priority/async";
		
		subscription = $.subscribe( topic, function() {
			strictEqual( order, 1, "priority default; #1" );
			order++;
		});
		subscription = $.subscribe( topic, function() {
			strictEqual( order, 3, "priority 15; #1" );
			order++;
		}, 15 );
		subscription = $.subscribe( topic, function() {
			strictEqual( order, 2, "priority default; #2" );
			order++;
		});
		subscription = $.subscribe( topic, function() {
			strictEqual( order, 0, "priority 1; #1" );
			order++;
		}, 1 );
		subscription = $.subscribe( topic, {}, function() {
			strictEqual( order, 4, "priority 15; #2" );
			order++;
		}, 15 );
		
		var publication = $.publish(topic);
		start();
	}, 100); 
});

test( "subscriber context for sync", function() {
	var PubSub = TestUtil.resetPubSub();
	expect( 3 );
	var subscription,
		obj = {},
		topic = "/context/subscriber",
		fn = function() {};

	subscription = $.subscribe( topic, function() {
		strictEqual( this, window, "default context" );
	});
	subscription = $.subscribe( topic, obj, function() {
		strictEqual( this, obj, "object bound during subscription" );
	});
	try {
		subscription  = $.subscribe( topic, fn, function() {
			ok( false, "function cannot be bound during subscription" );
		});
	} catch( err ) {
		strictEqual( err.message, "You must provide an object for a context.", "function cannot be bound during subscription" );
	}
	$.publishSync( topic );
});

test( "publisher context", function() {
	var PubSub = TestUtil.resetPubSub();
	expect( 1 );
	var topic = "/context/publisher",
		subscription,
		obj = {
			name : "from publisher"
		};

	subscription = $.subscribe( topic, function() {
		strictEqual( this, obj, "context from publisher" );
	});

	$.publishSync(topic, { context : obj });
});

var testContinuations = false;
if (testContinuations) {
	test("continuation for sync publication w/o subscribers", function() {
		expect( 1 );
		
		var PubSub = TestUtil.resetPubSub();
		var topic = "/continuation/sync";
		var publication = $.publishSync( topic );
		strictEqual( publication, null, "return null when topic has no subscribers for sync pub" );
	});

	test("continuation for sync publication w/subscribers", function() {
		expect( 7 );
		
		var topic = "/continuation/sync";
		
		$.subscribe( topic, function(notification) {
			ok( true, "1st subscriber called for sync pub" );
		});
		$.subscribe( topic, function(notification) {
			ok( true, "continued after no return value for sync pub" );
			return true;
		});
		var publication = $.publishSync( topic, {
			progress : function() {
				ok(true, "begin sync notifications");
			},
			done: function() {
				ok(true, "successful sync notifications");
			},
			fail: function() {
				ok(false, "failed sync notifications");
			},
			always : function() {
				ok(true, "completed sync notification");
			}
		});
		strictEqual( publication !== null , true, "return publication for sync pub when subscriptions are not stopped" );
		strictEqual( publication.state() , "resolved", "sync publication should have resolved" );
	});

	test("discontinuation for sync publication w/1 subscriber returning false", function() {
		expect( 7 );
		
		var PubSub = TestUtil.resetPubSub();
		var topic = "/discontinuation/sync";
		$.subscribe( topic, function(notification) {
			ok( true, "continued after returning true for sync pub" );
			return false;
		});
		$.subscribe( topic, function(notification) {
			ok( false, "continued after returning false for sync pub" );
		});
		var publication = $.publishSync( topic, {
			progress : function() {
				ok(true, "begin sync notifications");
			},
			done: function() {
				ok(false, "successful sync notifications");
			},
			fail: function() {
				ok(true, "failed sync notifications");
			},
			always : function() {
				ok(true, "completed sync notification");
			}
		});
		strictEqual( publication !== null, true, "return publication when subscriptions are stopped during sync pub" );
		strictEqual( publication.state() , "rejected", "sync publication should have rejected" );
	});


	asyncTest( "continuation for async publication w/o subscribers", function() {
		expect( 1 );
		
		var PubSub = TestUtil.resetPubSub();
		var topic = "/continuation/async";
		
		_.delay(function() {
			var publication = $.publish(topic);
			start();
			strictEqual( publication, null, "return null when topic has no subscribers for async pub" );
		}, 100); 
	});

	asyncTest( "continuation for async publication w/subscribers", function() {
		var PubSub = TestUtil.resetPubSub();
		expect( 7 );
		
		_.delay(function() {
			var topic = "/continuation/async";
			$.subscribe( topic, function(notification) {
				ok( true, "1st subscriber called for async pub" );
			});
			$.subscribe( topic, function(notification) {
				ok( true, "continued after no return value for async pub" );
				return true;
			});
			
			var publication = $.publish(topic, {
				progress : function() {
					ok(true, "begin async notifications");
				},
				done: function() {
					ok(true, "successful async notifications");
				},
				fail: function() {
					ok(false, "failed async notifications");
				},
				always : function() {
					ok(true, "completed async notification");
					strictEqual( publication.state(), "resolved", "resolved when subscriptions are not stopped during async pub" );
				}
			});
			start();
			strictEqual( publication.state(), "pending", "pending immediately when subscriptions are not stopped during async pub" );
		}, 100);
	});


	asyncTest("discontinuation for async publication w/1 subscriber returning false", function() {
		var PubSub = TestUtil.resetPubSub();
		expect( 7 );

		_.delay(function() {
			var topic = "/discontinuation/async"
			$.subscribe( topic, function(notification) {
				ok( true, "continued after returning true for async pub" );
				return false;
			});
			$.subscribe( topic, function(notification) {
				ok( false, "continued after returning false for async pub" );
			});
			
			var publication = $.publish(topic, {
				progress : function() {
					ok(true, "begin async notifications");
				},
				done: function() {
					ok(false, "successful async notifications");
				},
				fail: function() {
					ok(true, "failed async notifications");
				},
				always : function() {
					ok(true, "completed async notification");
					strictEqual( publication.state(), "rejected", "rejected when subscriptions are stopped during async pub" );
				}
			});
			start();
			strictEqual( publication.state(), "pending", "return pending immediately when subscriptions are stopped during async pub" );
		}, 100);
	});


	test("publish synchronously on topic to see notifications bubbling up", function() {
		var PubSub = TestUtil.resetPubSub();
		expect( 14 );
		
		var topic = "/app/module/class";
		var topics = PubSub.createTopics(topic);
		var count = 0;
		
		var classSubscription = $.subscribe(topic, function(notification) {
			equal(true, !!notification, "notification should be defined");
			equal(0, count, "class subscriber called 1st");
			count++;
		});
		
		var moduleSubscription = $.subscribe("/app/module", function(notification) {
			equal(true, !!notification, "notification should be defined");
			equal(1, count, "module subscriber called 2nd");
			count++;
		});
		
		var appSubscription = $.subscribe("/app", function(notification) {
			equal(true, !!notification, "notification should be defined");
			equal(2, count, "app subscriber called 3rd");
			count++;
		});
		
		equal(1, PubSub.getSubscriptions("/app").length, "1 subscription should exist at app level");
		equal(1, PubSub.getSubscriptions("/app/module").length, "1 subscription should exist at module level");
		equal(1, PubSub.getSubscriptions(topic).length, "1 subscription should exist at class level");
		
		equal(3, _.keys(PubSub.subscriptions).length, "there should be 3 subscriptions total");
		
		var publication = $.publishSync(topic, {
			progress : function() {
				ok(true, "begin sync notifications");
			},
			done: function() {
				ok(true, "successful sync notifications");
			},
			fail: function() {
				ok(false, "failed sync notifications");
			},
			always : function() {
				ok(true, "completed sync notification");
			}
		});
		equal(3, count, "synchronous publication blocks and mutates the count");
	});


	asyncTest("publish asynchronously on topic to see notifications bubbling up", function() {
		var PubSub = TestUtil.resetPubSub();
		expect( 15 );
		
		_.delay(function() {
			var topic = "/app/module/class";
			var topics = PubSub.createTopics(topic);
			var count = 0;
			
			var classSubscription = $.subscribe(topic, function(notification) {
				equal(true, !!notification, "notification should be defined");
				equal(0, count, "class subscriber called 1st");
				count++;
			});
			
			var moduleSubscription = $.subscribe("/app/module", function(notification) {
				equal(true, !!notification, "notification should be defined");
				equal(1, count, "module subscriber called 2nd");
				count++;
			});
			
			var appSubscription = $.subscribe("/app", function(notification) {
				equal(true, !!notification, "notification should be defined");
				equal(2, count, "app subscriber called 3rd");
				count++;
			});
			
			equal(1, PubSub.getSubscriptions("/app").length, "1 subscription should exist at app level");
			equal(1, PubSub.getSubscriptions("/app/module").length, "1 subscription should exist at module level");
			equal(1, PubSub.getSubscriptions(topic).length, "1 subscription should exist at class level");
			equal(3, _.keys(PubSub.subscriptions).length, "there should be 3 subscriptions total");
			
			var publication = $.publish(topic, {
				progress : function() {
					ok(true, "begin async notifications");
				},
				done: function() {
					ok(true, "successful async notifications");
					equal(3, count, "now count is succesfully mutated");
				},
				fail: function() {
					ok(false, "failed async notifications");
				},
				always : function() {
					ok(true, "completed async notification");
				}
			});
			// publish results and then see if it effected the change
			start();
			ok( true, "publish asynchronously requires a delay" );
		}, 100);
	});
}

