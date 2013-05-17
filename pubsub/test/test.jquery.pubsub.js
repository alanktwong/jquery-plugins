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


var conditionalTest = function(isEnabled, message, callback) {
	if (isEnabled) {
		test(message, callback);
	}
};


var isEnabled = true;

conditionalTest(isEnabled, "internal functionality", function() {
	expect( 26 );
	
	var PubSub = TestUtil.resetPubSub();
	deepEqual(false, PubSub.validateTopicName("bad topic name"), "topic names may not have white space");
	deepEqual(false, PubSub.validateTopicName({}), "topic names must be a string");
	deepEqual(false, PubSub.validateTopicName(null), "topic names must be defined");
	deepEqual(false, PubSub.validateTopicName("app.Name"), "each node in a topic name must be an alphanumeric string");
	deepEqual(false, PubSub.validateTopicName("appName"), "topic name must be begin with a slash");
	
	var guid1 = PubSub.generateGUID();
	var guid2 = PubSub.generateGUID();
	notStrictEqual(guid1, guid2, "GUID generation should be unique");
	
	var topic = "/app/module/class";
	deepEqual(true, PubSub.validateTopicName(topic), "topic names must be a string defined a la Unix directory");
	var topics = PubSub.createTopics(topic);
	deepEqual( topics, ["/app/module/class", "/app/module", "/app"], "ancestory of topics created in bubble-up order" );

	var data = { id : 1, date: new Date(), name: "name" };
	var context = {};
	var notification = PubSub.createNotification(topic , data, context);
	deepEqual( notification !== null, true, "notification created" );
	deepEqual( notification.data, data, "notification.data created" );
	deepEqual( notification.publishTopic, topic, "notification.publishTopic created" );
	deepEqual( notification.context, context, "notification.context created" );

	notification = PubSub.createNotification(topic , data);
	deepEqual( notification.context, null, "notification created w/o context" );
	equal(true, PubSub.isDefined(notification.timestamp), "timestamp added");
	notification = PubSub.createNotification(topic );
	deepEqual( notification.data, null,    "notification created w/o context or data" );
	deepEqual( notification.context, null, "notification created w/o context or data" );

	var callback = function(notification) {
		$.noop();
	};
	var priority = 100;
	var subscription = PubSub.createSubscription(topic, callback, priority, context);
	deepEqual( subscription !== null, true, "subscription created" );
	equal(true, PubSub.isDefined(notification.timestamp), "timestamp added");
	
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

conditionalTest(isEnabled, "topic error handling", function() {
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
		$.unsubscribe( "badName", function() {} );
	} catch( err ) {
		strictEqual( err.message, "You must provide a valid topic to remove a subscription.",
			"error with no topic to unsubscribe" );
	}
});

conditionalTest(isEnabled, "subscribe to topic with just a callback", function() {
	expect( 6 );
	
	var PubSub = TestUtil.resetPubSub();
	var topic = "/app/module/class";
	var topics = PubSub.createTopics(topic);
	var callback = function(notification) {
		$.noop();
	};
	
	var subscription = $.subscribe(topic, callback);

	equal(true, PubSub.hasSubscriptions(topic), "has a subscription");
	equal(true, subscription !== null, "has returned a subscription");
	equal(1, PubSub.getSubscriptions(topic).length, "has exactly 1 subscription");
	equal(callback, subscription.callback, "has returned a subscription w/ callback");
	deepEqual( topics, subscription.topics, "ancestory of topics for the subscription" );
	equal(null, subscription.context, "has returned a subscription w/o context");
});


conditionalTest(isEnabled, "subscribe to topic with a callback and a context", function() {
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


conditionalTest(isEnabled, "subscribe to topic with a callback and a priority", function() {
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

conditionalTest(isEnabled, "subscribe to topic with a callback, a priority and a context", function() {
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


asyncTest("publish just to topic to see notifications bubbling up", function() {
	expect( 18 );
	
	var PubSub = TestUtil.resetPubSub();
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
	
	$.publishSync(topic);
	equal(3, count, "synchronous publication blocks and mutates the count");
	
	count = 0;
	_.delay(function() {
		var result = $.publish(topic);
		// publish results and then see if it effected the change
		start();
		ok( true, "publish asynchronously requires a delay" );
	}, 1000);
});


conditionalTest(isEnabled, "unsubscribe", function() {
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

conditionalTest(isEnabled, "unsubscribe all", function() {
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

conditionalTest(isEnabled, "continuation for sync pub", function() {
	expect( 8 );
	
	var PubSub = TestUtil.resetPubSub();
	var topic = "/continuation/sync";
	var ret;
	ret = $.publishSync( topic );
	strictEqual( ret, false, "return false when topic has no subscribers for sync pub" );
	
	$.subscribe( topic, function(notification) {
		ok( true, "1st subscriber called for sync pub" );
	});
	$.subscribe( topic, function(notification) {
		ok( true, "continued after no return value for sync pub" );
		return true;
	});
	ret = $.publishSync( topic );
	strictEqual( ret , true, "return true for sync pub when subscriptions are not stopped" );
	
	$.subscribe( topic, function(notification) {
		ok( true, "continued after returning true for sync pub" );
		return false;
	});
	$.subscribe( topic, function(notification) {
		ok( false, "continued after returning false for sync pub" );
	});
	ret = $.publishSync( topic );
	strictEqual( ret, false, "return false when subscriptions are stopped during sync pub" );
	
});
asyncTest( "continuation for async pub", function() {
	var isEnabled = true;
	if (isEnabled) {
		expect( 6 );
		
		var PubSub = TestUtil.resetPubSub();
		var topic = "/continuation/async";
		var ret;
		
		_.delay(function() {
			ret = $.publish(topic);
			start();
			strictEqual( ret, false, "return false when topic has no subscribers for async pub" );
		}, 1000); 
		
		$.subscribe( topic, function(notification) {
			ok( true, "1st subscriber called for async pub" );
		});
		$.subscribe( topic, function(notification) {
			ok( true, "continued after no return value for async pub" );
			return true;
		});
		
		_.delay(function() {
			ret = $.publish(topic);
			start();
			strictEqual( ret, true, "return true when subscriptions are not stopped during async pub" );
		}, 1000); 
	}
});

