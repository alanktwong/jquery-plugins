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
					subscribed: true
				}
			]
		});
		return log4jq;
	},
	subscribeApp: function(app, PubSub) {
		var classSubscription = $.subscribe(app.padma.leia.topic, app.padma.leia.notify);
		var moduleSubscription = $.subscribe(app.padma.topic, app.padma.notify);
		var appSubscription = $.subscribe(app.topic, app.notify);
		
		$.subscribe(app.anakin.topic, app.anakin.notify);
		$.subscribe(app.padma.luke.topic, app.padma.luke.notify);
		
		equal(1, PubSub.getSubscriptions(app.topic).length, "1 subscription should exist for: " + app.topic);
		equal(1, PubSub.getSubscriptions(app.padma.topic).length, "1 subscription should exist for: " + app.padma.topic);
		equal(1, PubSub.getSubscriptions(app.padma.leia.topic).length, "1 subscription should exist for: " + app.padma.leia.topic);
		
		equal(1, PubSub.getSubscriptions(app.anakin.topic).length, "1 subscription should exist for: " + app.anakin.topic);
		equal(1, PubSub.getSubscriptions(app.padma.luke.topic).length, "1 subscription should exist for: " + app.padma.luke.topic);
		
		equal(5, _.keys(PubSub.subscriptions).length, "there should be 5 subscriptions total");
	}
};

module( "jquery.pubsub core" );
test("internal functionality", function() {
	expect( 38 );
	
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
	
	var u = PubSub.Util;
	
	strictEqual(u.isUndefined(undefined), true, "should be undefined");
	strictEqual(u.isUndefined(""), false, "should not be undefined");
	strictEqual(u.isNotNull(null), false, "should be null");
	strictEqual(u.isNotNull(""), true, "should not be null");
	strictEqual(u.isObject("de"), false, "should not be an object");
	strictEqual(u.isObject({}),   true, "should be an object");
	strictEqual(u.isFunction({}), false, "should not be a function");
	strictEqual(u.isFunction(function() {}),   true, "should be a function");
	
	strictEqual(u.isString({}), false, "should not be a string");
	strictEqual(u.isString(""), true,  "should be a string");
	strictEqual(u.isNumber({}), false, "should not be a number");
	strictEqual(u.isNumber(6),  true,  "should be a number");
	
	strictEqual(u.has(u,  "has"), true,  "should have 'has'");
	strictEqual(u.has({}, "has"), false, "should not have 'has'");
	strictEqual(u.identity(topic), topic, "identity should echo its input");
	
	var context = {};
	var aList = [1,2,3];
	if (u.each) {
		u.each(aList, function(element,i,list) {
			strictEqual(element, i + 1, "lists are 0-indexed for " + i )
			strictEqual(this, context, "context bound to {}");
		}, context);
		
		u.each({'1': 1, '2': 2, '3': 3 }, function(value,key,list) {
			strictEqual(key, "" + value, "objects are enumerable by their key " + key )
		});
	}
	if (u.find) {
		aList = [1, 2, 3, 4, 5, 6];
		var even = u.find(aList, function(num){ return num % 2 == 0; });
		strictEqual(even, 2, "found first even number in " +  aList);
	}
	if (u.filter) {
		var evens = u.filter(aList, function(num){ return num % 2 == 0; });
		deepEqual(evens, [2,4,6], "found all even numbers in " +  aList);
	}
	
	aList = [1,2,3];
	if (u.reduce) {
		var sum = _.reduce([1, 2, 3], function(memo, num){ return memo + num; }, 0);
		deepEqual(sum, 6, "this reduction of " +  aList + " should be 6");
	}
	
	if (u.map) {
		aList = [null, 0, 'yes', false];
		var mapped = u.map(aList, function(each) {
			var ret = each;
			if (each === null) {
				ret = "null";
			}
			return ret;
		});
		deepEqual(mapped, ["null", 0, "yes", false], "transformed array with truthy and untruthy values");
		equal(_.some(aList), true, mapped + " has 1 truthy value");
	}
	if (u.bind) {
		var fn = function(name) {
			ok(true, "executing a callback for " + name);
			strictEqual(this,context, name + " bound to context");
		};
		
		var bound = u.bind(fn, context);
		bound("bound function");
	}
});

test("notification creation", function() {
	expect( 10 );
	
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
	deepEqual( publication.immediateExceptions, true, "publication created to throw exceptions immediately" );

	publication = PubSub.createPublication(topic, { data : data });
	notification = publication.notification;
	deepEqual( notification.context, null, "notification created w/o context" );
	equal(true, PubSub.Util.isNotNull(notification.timestamp), "timestamp added");
	
	try {
		publication = PubSub.createPublication(topic)
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

module("subscribe functionality");
test("subscribe to topic with just a callback", function() {
	expect( 14 );
	
	var PubSub = TestUtil.resetPubSub();
	var topic = "/app/module/class";
	var topics = PubSub.createTopics(topic);
	var count = 0;
	var callback0 = function(notification) {
		ok(true, "1st subscriber notified");
		strictEqual(count, 0, "1st subscriber has not yet mutated count");
		count++;
	};
	var callback1 = function(notification) {
		ok(true, "2nd subscriber notified");
		strictEqual(count, 1, "1st subscriber has mutated count for 2nd subscriber");
	};
	
	var subscription0 = $.subscribe(topic, callback0);

	equal(true, PubSub.hasSubscriptions(topic), "has a subscription");
	equal(true, subscription0 !== null, "has returned a subscription");
	equal(1, PubSub.getSubscriptions(topic).length, "has exactly 1 subscription");
	equal(callback0, subscription0.callback, "has returned a subscription w/ callback");
	deepEqual( topics, subscription0.topics, "ancestory of topics for the subscription" );
	equal(null, subscription0.context, "has returned a subscription w/o context");
	
	var subscription1 = $.subscribe(topic, callback1);
	equal(2, PubSub.getSubscriptions(topic).length, "now has exactly 2 subscriptions");
	
	notStrictEqual(subscription0.id, subscription1.id, "IDs of both subscriptions are unique GUIDs");
	strictEqual(subscription0.priority, subscription1.priority, "both subscriptions have same priority");
	strictEqual(subscription1.timestamp >= subscription0.timestamp, true, "2nd subscription has timestamp later than 1st");
	$.publishSync(topic);
});


test("subscribe to topic with a callback and a context", function() {
	expect( 6 );
	
	var PubSub = TestUtil.resetPubSub();
	var topic = "/app/module/class";
	var topics = PubSub.createTopics(topic);
	var callback = function(notification) {
		$.debug("notified");
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
		$.debug("notified");
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
		$.debug("notified");
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

module("unsubscribe functionality");
test("unsubscribe", function() {
	expect( 4 );
	var PubSub = TestUtil.resetPubSub();
	var topic  = "/unsubscribe";
	var topic2 = "/unsubscribe2";

	var order = 0;
	var subscriber1 = $.subscribe( topic, function() {
		var msg = "1st subscriber called";
		$.debug(msg);
		strictEqual( order, 0, msg );
		order++;
	});
	var subscriber2 = $.subscribe( topic, function() {
		var msg = "unsubscribed and should not have been notified";
		$.error(msg);
		ok( false, msg );
		order++;
	});
	var subscriber3 = $.subscribe( topic, function() {
		var msg = "2nd subscriber called";
		$.debug(msg);
		strictEqual( order, 1, msg );
		order++;
	});
	var subscriber4 = $.subscribe( topic, function() {
		var msg = "unsubscribed and should not have been notified";
		$.error(msg);
		ok( false, msg );
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
		var msg = "1st subscriber called";
		$.debug(msg);
		strictEqual( order, 0, msg );
		order++;
	});
	
	var subscriber2 = $.subscribe( topic, function() {
		var msg = "2nd subscriber called";
		$.debug(msg);
		strictEqual( order, 1, msg );
		order++;
	});

	var result1 = $.publishSync( topic );
	
	var subscribers = $.unsubscribe( topic );
	strictEqual(0, subscribers.length, "no subscribers left on the topic");
	
	var result2 = $.publishSync( topic );
	strictEqual(2,order, "no subscribers notified");
});

module("setting priorities during pubsub");
test( "priority for synchronous publication", function() {
	var PubSub = TestUtil.resetPubSub();
	expect( 5 );
	
	var order = 1,
		subscription,
		topic = "/priority/sync";

	subscription = $.subscribe( topic, function() {
		strictEqual( order, 2, "the initial subscriber has priority default, it is notified 2nd" );
		order++;
	});
	subscription = $.subscribe( topic, function() {
		strictEqual( order, 4, "this subscriber has priority 15; it is notified 4th");
		order++;
	}, 15 );
	subscription = $.subscribe( topic, function() {
		strictEqual( order, 3, "this subscriber has priority default; it is notified 3rd after the initial subscriber as its timestamp is later" );
		order++;
	});
	subscription = $.subscribe( topic, function() {
		strictEqual( order, 1, "this subscriber greatest priority since it is the lowest number" );
		order++;
	}, 1 );
	subscription = $.subscribe( topic, function() {
		strictEqual( order, 5, "this subscriber is dead last because it has a high priority number" );
		order++;
	}, 100 );
	
	var publication = $.publishSync( topic );
});

asyncTest( "priority for asynchronous publication", function() {
	var PubSub = TestUtil.resetPubSub();
	expect( 5 );

	_.delay(function() {
		var order = 1,
			subscription,
			topic = "/priority/async";
		
		subscription = $.subscribe( topic, function() {
			strictEqual( order, 2, "the initial subscriber has priority default, it is notified 2nd" );
			order++;
		});
		subscription = $.subscribe( topic, function() {
			strictEqual( order, 4, "this subscriber has priority 15; it is notified 4th");
			order++;
		}, 15 );
		subscription = $.subscribe( topic, function() {
			strictEqual( order, 3, "this subscriber has priority default; it is notified 3rd after the initial subscriber as its timestamp is later" );
			order++;
		});
		subscription = $.subscribe( topic, function() {
			strictEqual( order, 1, "this subscriber greatest priority since it is the lowest number" );
			order++;
		}, 1 );
		subscription = $.subscribe( topic, {}, function() {
			strictEqual( order, 5, "this subscriber is dead last because it has a high priority number" );
			order++;
		}, 15 );
		
		var publication = $.publish(topic);
		start();
	}, 10); 
});

module("setting context during pubsub");
test( "subscriber context for sync publication", function() {
	var PubSub = TestUtil.resetPubSub();
	expect( 4 );
	var subscription,
		obj = {},
		topic = "/context/subscriber",
		fn = function() {};

	subscription = $.subscribe( topic, function() {
		strictEqual( this, window, "default context" );
	});
	subscription = $.subscribe( topic, obj, function() {
		strictEqual( this !== null, true, "has context from subscription" );
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
	expect( 2 );
	var topic = "/context/publisher",
		subscription,
		obj = {
			name : "from publisher"
		};

	subscription = $.subscribe( topic, function() {
		strictEqual( this !== null, true, "has context from publisher" );
		strictEqual( this, obj, "context from publisher" );
	});

	$.publishSync(topic, { context : obj });
});

module("pushing data during notifications");
test( "push data during synchronous publication", function() {
	var PubSub = TestUtil.resetPubSub();
	expect( 10 );
	var topic = "/data/sync";
	var subscription, publication;
	
	subscription = $.subscribe( topic, function( notification ) {
		var data = notification.data;
		strictEqual( data.string, "hello", "string passed during sync notification" );
		strictEqual( data.number, 5, "number passed during sync notification" );
		deepEqual( notification.data.object, {
			foo: "bar",
			baz: "qux"
		}, "object passed" );
		$.debug("1st subscriber mutating data")
		data.string = "goodbye";
		data.object.baz = "quux";
	});
	subscription = $.subscribe( topic, function( notification ) {
		var data = notification.data;
		strictEqual( data.string, "goodbye", "string changed during sync notification" );
		strictEqual( data.number, 5, "number unchanged during sync notification" );
		deepEqual( data.object, {
			foo: "bar",
			baz: "quux"
		}, "object changed during sync notification" );
	});

	var obj = {
		foo: "bar",
		baz: "qux"
	};
	publication = $.publishSync( topic, {
		progress : function() {
			var msg = "begin sync notifications w/data";
			$.debug(msg);
			ok(true, msg);
		},
		done: function() {
			var msg = "successful sync notifications w/data";
			$.debug(msg);
			ok(true, msg);
		},
		fail: function() {
			var msg = "failed sync notifications w/data";
			$.error(msg);
			ok(false, msg);
		},
		always : function() {
			var msg = "completed sync notifications w/data";
			$.info(msg);
			ok(true, msg);
			deepEqual( obj, {
				foo: "bar",
				baz: "quux"
			}, "object updated after sync notification" );
		},
		data: { string: "hello", number: 5, object: obj }
	});
});

test( "push data during synchronous publication to 2 different topics", function() {
	var PubSub = TestUtil.resetPubSub();
	expect( 24 );
	var app = {
		topic : "/data",
		notify : function(notification) {
			var data   = notification.data;
			var topic  = notification.currentTopic;
			var origin = notification.publishTopic;
			var msg = "sync notification of topic: " + topic + " from " + origin;
			$.debug(msg);
			ok( true, msg);
			if (app.one.topic === origin ) {
				strictEqual(data.object.id, app.one.data.object.id, "data originating from " + origin + " should have same id");
				strictEqual(data.number, app.one.data.number, "data originating from " + origin + " should have same number");
				data.number++;
			} else if (app.two.topic === origin ) {
				strictEqual(data.object.id, app.two.data.object.id, "data originating from " + origin + " should have same id");
				strictEqual(data.number, app.two.data.number, "data originating from " + origin + " should have same number");
				data.number++;
			}
		},
		one: {
			topic : "/data/1",
			notify : function(notification) {
				var data  = notification.data;
				var topic = notification.currentTopic;
				var msg = "sync notification of topic: " + topic;
				$.debug(msg);
				ok( true, msg );
				strictEqual( data.string, "hello", "string passed during sync notification of " + topic );
				strictEqual( data.number, app.one.data.number, "number passed during sync notification of " + topic );
				deepEqual( data.object, app.one.data.object, "object passed for " + topic );
				data.string = "goodbye";
				data.object.baz = "quux";
				$( "#receiver",'#console-log' ).append( JSON.stringify(data) );
			},
			data: {
				string: "hello",
				number : 100,
				object : {
					id:  1,
					foo: "bar",
					baz: "qux"
				}
			}
		},
		two: {
			topic : "/data/2",
			notify : function(notification) {
				var data  = notification.data;
				var topic = notification.currentTopic;
				var msg = "async notification of topic: " + topic;
				$.debug(msg);
				ok( true, msg);
				strictEqual( data.string, app.two.data.string, "string unchanged during sync notification of " + topic );
				strictEqual( data.number, app.two.data.number, "number unchanged during sync notification of " + topic );
				deepEqual( data.object, app.two.data.object, "object passed for " + topic );
				data.string = "guten tag";
				data.object.baz = "quux 2";
				$( "#receiver2",'#console-log' ).append( JSON.stringify(data) );
			},
			data : {
				string: "hello",
				number : 200,
				object : {
					id:  2,
					foo: "bar2",
					baz: "qux2"
				}
			}
		}
	};
		
	app.subscription = $.subscribe(app.topic, app.notify);
	app.one.subscription = $.subscribe(app.one.topic, app.one.notify);
	app.two.subscription = $.subscribe(app.two.topic, app.two.notify);
	
	app.one.publication = $.publishSync( app.one.topic, {
		data: app.one.data,
		progress : function() {
			var msg = "begin sync notifications with data of " + app.one.topic;
			$.debug(msg);
			ok(true, msg);
		},
		done: function() {
			var msg = "successful sync notifications with data of " + app.one.topic;
			$.debug(msg);
			ok(true, msg);
		},
		fail: function() {
			var msg = "failed sync notifications with data of " + app.one.topic;
			$.error(msg);
			ok(false, msg);
		},
		always : function() {
			var msg = "completed sync notifications with data of " + app.one.topic;
			$.info(msg);
			ok(true, msg);
			var data = app.one.data;
			deepEqual( data.object.baz, "quux", "object updated after sync notification for " + app.one.topic );
			deepEqual( data.string, "goodbye", "string updated after sync notification for " + app.one.topic );
		}
	});
	app.two.publication = $.publishSync( app.two.topic, {
		data: app.two.data,
		progress : function() {
			var msg = "begin sync notifications with data of " + app.two.topic;
			$.debug(msg);
			ok(true, msg);
		},
		done: function() {
			var msg = "successful sync notifications with data of " + app.two.topic;
			$.debug(msg);
			ok(true, msg);
		},
		fail: function() {
			var msg = "failed sync notifications with data of " + app.two.topic;
			$.error(msg);
			ok(false, msg);
		},
		always : function() {
			var msg = "completed sync notifications with data of " + app.two.topic;
			$.info(msg);
			ok(true, msg);
			var data = app.two.data;
			deepEqual( data.object.baz, "quux 2", "object updated after async notification for " + app.two.topic );
			deepEqual( data.string, "guten tag", "string updated after async notification for " + app.two.topic );
		}
	});
});

asyncTest( "push data during asynchronous publication", function() {
	var PubSub = TestUtil.resetPubSub();
	expect( 10 );
	
	_.delay(function() {
		var topic = "/data/async";
		var subscription, publication;
		subscription = $.subscribe( topic, function( notification ) {
			var data = notification.data;
			strictEqual( data.string, "hello", "string passed during async notification" );
			strictEqual( data.number, 5, "number passed during async notification" );
			deepEqual( data.object, {
				foo: "bar",
				baz: "qux"
			}, "object passed" );
			data.string = "goodbye";
			data.object.baz = "quux";
		});
		subscription = $.subscribe( topic, function( notification ) {
			var data = notification.data;
			strictEqual( data.string, "goodbye", "string changed during async notification" );
			strictEqual( data.number, 5, "number unchanged during async notification" );
			deepEqual( data.object, {
				foo: "bar",
				baz: "quux"
			}, "object changed during async notification" );
		});

		var obj = {
			foo: "bar",
			baz: "qux"
		};
		publication = $.publish( topic, {
			progress : function() {
				var msg = "begin async notifications w/data";
				$.debug(msg);
				ok(true, msg);
			},
			done: function() {
				var msg = "successful async notifications w/data";
				$.debug(msg);
				ok(true, msg);
			},
			fail: function() {
				var msg = "failed async notifications w/data";
				$.error(msg);
				ok(false, msg);
			},
			always : function() {
				var msg = "completed async notifications w/data";
				$.info(msg);
				ok(true, msg);
				deepEqual( obj, {
					foo: "bar",
					baz: "quux"
				}, "object updated after async notification" );
			},
			data: { string: "hello", number: 5, object: obj }
		});
		start();
	},10);
});

asyncTest( "push data during asynchronous publication to 2 different topics", function() {
	var PubSub = TestUtil.resetPubSub();
	expect( 20 );
	
	_.delay(function() {
		var app = {
			topic : "/data",
			notify : function(notification) {
				var data   = notification.data;
				var topic  = notification.currentTopic;
				var origin = notification.publishTopic;
				var msg = "async notification of topic: " + topic + " from " + origin;
				$.debug(msg);
				ok( true, msg);
				if (app.one.topic === origin ) {
					strictEqual(data.object.id, app.one.data.object.id, "data originating from " + origin + " should have same id");
					strictEqual(data.number, app.one.data.number, "data originating from " + origin + " should have same number");
					data.number++;
				} else if (app.two.topic === origin ) {
					strictEqual(data.object.id, app.two.data.object.id, "data originating from " + origin + " should have same id");
					strictEqual(data.number, app.two.data.number, "data originating from " + origin + " should have same number");
					data.number++;
				}
			},
			one: {
				topic : "/data/1",
				notify : function(notification) {
					var data  = notification.data;
					var topic = notification.currentTopic;
					var msg = "async notification of topic: " + topic;
					$.debug(msg);
					ok( true, msg );
					strictEqual( data.string, "hello", "string passed during async notification of " + topic );
					strictEqual( data.number, app.one.data.number, "number passed during async notification of " + topic );
					deepEqual( data.object, app.one.data.object, "object passed for " + topic );
					data.string = "goodbye";
					data.object.baz = "quux";
					$( "#receiver",'#console-log' ).append( JSON.stringify(data) );
				},
				data: {
					string: "hello",
					number : 100,
					object : {
						id:  1,
						foo: "bar",
						baz: "qux"
					}
				}
			},
			two: {
				topic : "/data/2",
				notify : function(notification) {
					var data  = notification.data;
					var topic = notification.currentTopic;
					var msg = "async notification of topic: " + topic;
					$.debug(msg);
					ok( true, msg);
					strictEqual( data.string, "goodbye", "string changed during async notification of " + topic );
					strictEqual( data.number, app.two.data.number, "number unchanged during async notification of " + topic );
					deepEqual( data.object, app.two.data.object, "object passed for " + topic );
					data.string = "guten tag";
					data.object.baz = "quux 2";
					$( "#receiver2",'#console-log' ).append( JSON.stringify(data) );
				},
				data : {
					string: "hello",
					number : 200,
					object : {
						id:  2,
						foo: "bar2",
						baz: "qux2"
					}
				}
			}
		};
		
		// https://gist.github.com/rustle/4115414
		app.subscription = $.subscribe(app.topic, app.notify);
		app.one.subscription = $.subscribe(app.one.topic, app.one.notify);
		app.two.subscription = $.subscribe(app.two.topic, app.two.notify);
		
		app.one.publication = $.publish( app.one.topic, {
			data: app.one.data,
			progress : function() {
				var msg = "begin async notifications with data of " + app.one.topic;
				$.debug(msg);
				ok(true, msg);
			},
			done: function() {
				var msg = "successful async notifications with data of " + app.one.topic;
				$.debug(msg);
				ok(true, msg);
			},
			fail: function() {
				var msg = "failed async notifications with data of " + app.one.topic;
				$.error(msg);
				ok(false, msg);
			},
			always : function() {
				var msg = "completed async notifications with data of " + app.one.topic;
				$.info(msg);
				ok(true, msg);
				var data = app.one.data;
				deepEqual( data.object.baz, "quux", "object updated after async notification for " + app.one.topic );
				deepEqual( data.string, "goodbye", "string updated after async notification for " + app.one.topic );
			}
		});
		app.two.publication = $.publish( app.two.topic, {
			data: app.two.data,
			progress : function() {
				var msg = "begin async notifications with data of " + app.two.topic;
				$.debug(msg);
				ok(true, msg);
			},
			done: function() {
				var msg = "successful async notifications with data of " + app.two.topic;
				$.debug(msg);
				ok(true, msg);
			},
			fail: function() {
				var msg = "failed async notifications with data of " + app.two.topic;
				$.error(msg);
				ok(false, msg);
			},
			always : function() {
				var msg = "completed async notifications with data of " + app.two.topic;
				$.info(msg);
				ok(true, msg);
				var data = app.two.data;
				deepEqual( data.object.baz, "quux 2", "object updated after async notification for " + app.two.topic );
				deepEqual( data.string, "guten tag", "string updated after async notification for " + app.two.topic );
			}
		});
		start();
	}, 20);
});

module("continuation of synchronous notifications");
test("continue sync publication w/o subscribers", function() {
	expect( 1 );
	
	var PubSub = TestUtil.resetPubSub();
	var topic = "/continuation/sync";
	var publication = $.publishSync( topic, {
		progress : function() {
			ok(false, "should never begin sync notifications");
		}
	});
	strictEqual( publication, null, "return null when topic has no subscribers for sync pub" );
});

test("continue sync publication w/subscribers", function() {
	expect( 7 );
	
	var topic = "/continuation/sync";
	
	$.subscribe( topic, function(notification) {
		var msg = "1st subscriber called for sync pub";
		$.debug(msg);
		ok( true, msg );
	});
	$.subscribe( topic, function(notification) {
		var msg = "continued with 2nd subscriber after 1st does not return value for sync pub";
		$.debug(msg);
		ok( true, msg );
		return true;
	});
	var publication = $.publishSync( topic, {
		progress : function() {
			var msg = "begin sync notification";
			$.debug(msg);
			ok(true, msg);
		},
		done: function() {
			var msg = "successful sync notification";
			$.debug(msg);
			ok(true, msg);
		},
		fail: function() {
			var msg = "failed sync notification";
			$.error(msg);
			ok(false, msg);
		},
		always : function() {
			var msg = "completed sync notification";
			$.info(msg);
			ok(true, msg);
		}
	});
	strictEqual( publication !== null , true, "return publication for sync pub when subscriptions are not stopped" );
	strictEqual( publication.state() , "resolved", "sync publication should have resolved" );
});

module("discontinuation of synchronous notifications");
test("discontinue sync publication when 1 subscriber returns false", function() {
	expect( 6 );
	
	var PubSub = TestUtil.resetPubSub();
	var topic = "/discontinuation/sync";
	$.subscribe( topic, function(notification) {
		var msg = "continued after returning true for sync pub";
		$.debug(msg);
		ok( true, msg );
		return false;
	});
	$.subscribe( topic, function(notification) {
		var msg = "continued after returning false for sync pub";
		$.error(msg);
		ok( false, msg );
	});
	var publication = $.publishSync( topic, {
		progress : function() {
			var msg = "begun sync notifications";
			$.debug(msg);
			ok(true, msg);
		},
		done: function() {
			var msg = "successful sync notifications";
			$.error(msg);
			ok(false, msg);
		},
		fail: function() {
			var msg = "failed sync notifications";
			$.debug(msg);
			ok(true, msg);
		},
		always : function() {
			var msg = "completed sync notifications";
			$.info(msg);
			ok(true, msg);
		}
	});
	strictEqual( publication !== null, true, "return publication when subscriptions are stopped during sync pub" );
	strictEqual( publication.state() , "rejected", "sync publication should have been rejected" );
});

test("discontinue sync publication when 1 subscriber throws an error", function() {
	expect( 6 );
	
	var PubSub = TestUtil.resetPubSub();
	var topic = "/discontinuation/sync";
	$.subscribe( topic, function(notification) {
		ok( true, "continued after returning true for sync pub" );
		throw new Error("stop publication");
	});
	$.subscribe( topic, function(notification) {
		ok( false, "continued after returning false for sync pub" );
	});
	var publication = $.publishSync( topic, {
		progress : function() {
			var msg = "begun sync notifications";
			$.debug(msg);
			ok(true, msg);
		},
		done: function() {
			var msg = "successful sync notifications";
			$.error(msg);
			ok(false, msg);
		},
		fail: function() {
			var msg = "failed sync notifications";
			$.debug(msg);
			ok(true, msg);
		},
		always : function() {
			var msg = "completed sync notifications";
			$.info(msg);
			ok(true, msg);
		}
	});
	strictEqual( publication !== null, true, "return publication when subscriptions are stopped during sync pub" );
	strictEqual( publication.state() , "rejected", "sync publication should have rejected" );
});

module("continuation of asynchronous notifications");
asyncTest( "continue async publication w/o subscribers", function() {
	expect( 1 );
	
	var PubSub = TestUtil.resetPubSub();
	var topic = "/continuation/async";
	
	_.delay(function() {
		var publication = $.publish(topic, {
			progress : function() {
				ok(false, "should never begin async notifications");
			}
		});
		start();
		strictEqual( publication, null, "return null when topic has no subscribers for async pub" );
	}, 10); 
});

asyncTest( "continue async publication w/subscribers", function() {
	var PubSub = TestUtil.resetPubSub();
	expect( 7 );
	
	_.delay(function() {
		var topic = "/continuation/async";
		$.subscribe( topic, function(notification) {
			var msg = "1st subscriber called for async pub";
			$.debug(msg);
			ok( true, msg );
		});
		$.subscribe( topic, function(notification) {
			var msg = "continued w/2nd subscriber after 1st does not return value for async pub";
			$.debug(msg);
			ok( true, msg );
			return true;
		});
		
		var publication = $.publish(topic, {
			progress : function() {
				var msg = "begin async notifcations";
				$.debug(msg);
				ok(true, msg);
				strictEqual( publication.state(), "pending", "pending immediately when subscriptions are not stopped during async pub" );
			},
			done: function() {
				var msg = "successful async notifcations";
				$.debug(msg);
				ok(true, msg);
			},
			fail: function() {
				var msg = "failed async notifcations";
				$.error(msg);
				ok(false, msg);
			},
			always : function() {
				var msg = "completed async notifcations";
				$.info(msg);
				ok(true, msg);
				strictEqual( publication.state(), "resolved", "resolved when subscriptions are not stopped during async pub" );
			}
		});
		start();
	}, 10);
});

module("discontinuation of asynchronous notifications");
asyncTest("discontinue async publication when 1 subscriber throws an exception", function() {
	var PubSub = TestUtil.resetPubSub();
	expect( 6 );

	_.delay(function() {
		var topic = "/discontinuation/async"
		$.subscribe( topic, function(notification) {
			var msg = "continued after returning true for async pub";
			$.debug(msg);
			ok( true, msg );
			throw new Error("stop publication");
		});
		$.subscribe( topic, function(notification) {
			var msg = "should not have continued after throwing error for async pub";
			$.error(msg);
			ok( false, msg );
		});
		
		var publication = $.publish(topic, {
			progress : function() {
				var msg = "begin async notifications";
				$.debug(msg);
				strictEqual( publication.state(), "pending", "return pending immediately when subscriptions are stopped during async pub" );
				ok(true, msg);
			},
			done: function() {
				var msg = "successful async notifications";
				$.error(msg);
				ok(false, msg);
			},
			fail: function() {
				var msg = "failed async notifications";
				$.debug(msg);
				ok(true, msg);
			},
			always : function() {
				var msg = "completed async notifications";
				$.info(msg);
				ok(true, msg);
				strictEqual( publication.state(), "rejected", "rejected when subscriptions are stopped during async pub" );
			}
		});
		start();
	}, 10);
});

asyncTest("discontinue async publication when 1 subscriber returns false", function() {
	var PubSub = TestUtil.resetPubSub();
	expect( 6 );

	_.delay(function() {
		var topic = "/discontinuation/async"
		$.subscribe( topic, function(notification) {
			var msg = "continued after returning true for async pub";
			$.debug(msg);
			ok( true, msg );
			return false;
		});
		$.subscribe( topic, function(notification) {
			var msg = "should have discontinued after previous subscriber returned false for async pub";
			$.error(msg);
			ok( false, msg );
		});
		
		var publication = $.publish(topic, {
			progress : function() {
				var msg = "begin async notifications";
				$.debug(msg);
				strictEqual( publication.state(), "pending", "return pending immediately when subscriptions are stopped during async pub" );
				ok(true, msg);
			},
			done: function() {
				var msg = "successful async notifications";
				$.error(msg);
				ok(false, msg);
			},
			fail: function() {
				var msg = "failed async notifications";
				$.debug(msg);
				ok(true, msg);
			},
			always : function() {
				var msg = "completed async notifications";
				$.info(msg);
				ok(true, msg);
				strictEqual( publication.state(), "rejected", "rejected when subscriptions are stopped during async pub" );
			}
		});
		start();
	}, 10);
});

module("synchronous bubbling of notifications");
test("notifications should bubble up during synchronous publication on a hierarchical topic", function() {
	var PubSub = TestUtil.resetPubSub();
	expect( 19 );
	
	var neverNotified = function(notification) {
		var msg = "this callback should never be notified";
		$.error(msg)
		ok(false, msg);
	};
	
	var app = {
		topic : "/app",
		notify : function(notification) {
			var msg = "notification of subscriber @ " + notification.currentTopic;
			$.debug(msg)
			ok(true, msg);
			equal(2, count, "root subscriber called 3rd");
			deepEqual(notification.data, app.data, "same data by reference passed to root");
			count++;
		},
		padma : {
			topic : "/app/padma",
			notify : function(notification) {
				var msg = "notification of subscriber @ " + notification.currentTopic;
				$.debug(msg)
				ok(true, msg);
				equal(1, count, "mid-level subscriber called 2nd");
				deepEqual(notification.data.name, "empire strikes back", "data received by padma should have mutated");
				count++;
			},
			luke : {
				topic : "/app/padma/luke",
				notify : neverNotified
			},
			leia : {
				topic : "/app/padma/leia",
				notify : function(notification) {
					var data = notification.data;
					var msg = "notification of subscriber @ " + notification.currentTopic;
					$.debug(msg)
					ok(true, msg);
					deepEqual(data, app.data, "leaf should receive data");
					data.name = "empire strikes back";
					equal(0, count, "leaf subscriber called 1st");
					count++;
				}
			}
		},
		anakin : {
			topic : "/app/anakin",
			notify : neverNotified
		},
		data : {
			id : 1,
			name : "star wars"
		}
	};
	
	var topics = PubSub.createTopics(app.padma.leia.topic);
	var count = 0;
	TestUtil.subscribeApp(app, PubSub);
	
	var publication = $.publishSync(app.padma.leia.topic, {
		data : app.data,
		progress : function() {
			var msg = "begin sync notifications";
			$.debug(msg);
			ok(true, msg);
		},
		done: function() {
			var msg = "successful sync notifications";
			$.debug(msg);
			ok(true, msg);
		},
		fail: function() {
			var msg = "failed sync notifications";
			$.error(msg);
			ok(false, msg);
		},
		always : function() {
			var msg = "completed sync notifications";
			$.info(msg);
			ok(true, msg);
		}
	});
	equal(3, count, "synchronous publication blocks and mutates the count");
});

test("notifications attempts to bubble up during synchronous publication on a hierarchical topic b/c mid-level subscriber interrupts", function() {
	var PubSub = TestUtil.resetPubSub();
	expect( 28 );
	
	var neverNotified = function(notification) {
		ok(false, "this callback should never be notified");
	};
	var exceptionThrown = function(notification) {
		ok(true, "exceptionThrown was notified @ " + notification.currentTopic);
		count++;
		throw new Error("burp!");
	};
	var notificationReject = function(notification) {
		ok(true, "notificationReject was notified @ " + notification.currentTopic);
		count++;
		notification.reject();
	};
	
	var app = {
		topic : "/app",
		notify : neverNotified,
		padma : {
			topic : "/app/padma",
			notify : function(notification) {
				var msg = "notification of subscriber @ " + notification.currentTopic;
				$.debug(msg)
				ok(true, msg);
				equal(1, count, "mid-level subscriber called 2nd");
				count++;
				$.debug("returning false");
				return false;
			},
			luke : {
				topic : "/app/padma/luke",
				notify : neverNotified
			},
			leia : {
				topic : "/app/padma/leia",
				notify : function(notification) {
					var msg = "notification of subscriber @ " + notification.currentTopic;
					$.debug(msg)
					ok(true, msg);
					equal(0, count, "leaf subscriber called 1st");
					count++;
				}
			}
		},
		anakin : {
			topic : "/app/anakin",
			notify : neverNotified
		}
	};
	
	var topics = PubSub.createTopics(app.padma.leia.topic);
	var count = 0;
	TestUtil.subscribeApp(app, PubSub);
	
	var options = {
		progress : function() {
			var msg = "begin sync notifications";
			$.debug(msg);
			ok(true, msg);
		},
		done: function() {
			var msg = "successful sync notifications";
			$.error(msg);
			ok(false, msg);
		},
		fail: function() {
			var msg = "failed sync notifications";
			$.debug(msg);
			ok(true, msg);
		},
		always : function() {
			var msg = "completed sync notifications";
			$.info(msg);
			ok(true, msg);
		}
	}
	var publication = $.publishSync(app.padma.leia.topic, options);
	equal(count, 2, "synchronous publication blocks and mutates the count when 1 subscriber returned false");
	
	$.unsubscribe(app.padma.topic);
	count = 0;
	$.subscribe(app.padma.topic, exceptionThrown);
	$.publishSync(app.padma.leia.topic, options);
	equal(count, 2, "synchronous publication blocks and mutates the count when 1 subscriber threw an exception");

	$.unsubscribe(app.padma.topic);
	count = 0;
	$.subscribe(app.padma.topic, notificationReject);
	$.publishSync(app.padma.leia.topic, options);
	equal(count, 2, "synchronous publication blocks and mutates the count when 1 subscriber rejected notification");
});

module("asynchronous bubbling of notifications");
asyncTest("notifications should bubble up during asynchronous publication on a hierarchical topic", function() {
	var PubSub = TestUtil.resetPubSub();
	expect( 19 );
	_.delay(function() {
		var neverNotified = function(notification) {
			var msg = "this callback should never be notified";
			$.error(msg);
			ok(false, msg);
		};
		
		var app = {
			topic : "/app",
			notify : function(notification) {
				var msg = "notification of subscriber @ " + notification.currentTopic;
				$.debug(msg);
				ok(true, msg);
				equal(2, count, "root subscriber called 3rd");
				var data = notification.data;
				deepEqual(data, app.data, "same data by reference passed to root");
				count++;
			},
			padma : {
				topic : "/app/padma",
				notify : function(notification) {
					var msg = "notification of subscriber @ " + notification.currentTopic;
					$.debug(msg);
					ok(true, msg);
					equal(1, count, "mid-level subscriber called 2nd");
					var data = notification.data;
					deepEqual(data.name, "empire strikes back", "data received by padma should have mutated");
					count++;
				},
				luke : {
					topic : "/app/padma/luke",
					notify : neverNotified
				},
				leia : {
					topic : "/app/padma/leia",
					notify : function(notification) {
						var msg = "notification of subscriber @ " + notification.currentTopic;
						$.debug(msg);
						ok(true, msg);
						var data = notification.data;
						deepEqual(data, app.data, "leaf should receive data");
						data.name = "empire strikes back";
						equal(0, count, "leaf subscriber called 1st");
						count++;
					}
				}
			},
			anakin : {
				topic : "/app/anakin",
				notify : neverNotified
			},
			data : {
				id : 1,
				name : "star wars"
			}
		};
		
		var topics = PubSub.createTopics(app.padma.leia.topic);
		var count = 0;
		TestUtil.subscribeApp(app, PubSub);
		
		var publication = $.publish(app.padma.leia.topic, {
			data : app.data,
			progress : function() {
				var msg = "begin async notifications";
				$.debug(msg);
				ok(true, msg);
			},
			done: function() {
				var msg = "successful async notifications";
				$.error(msg);
				ok(true, msg);
				equal(3, count, "now count is succesfully mutated by async publication");
			},
			fail: function() {
				var msg = "failed async notifications";
				$.debug(msg);
				ok(false, msg);
			},
			always : function() {
				var msg = "completed async notifications";
				$.info(msg);
				ok(true, msg);
			}
		});
		// publish results and then see if it effected the change
		start();
	}, 10);
});

asyncTest("notifications attempt to bubble up during asynchronous publication on a hierarchical topic b/c mid-level subscriber interrupts", function() {
	var PubSub = TestUtil.resetPubSub();
	expect( 17 );
	_.delay(function() {
		var neverNotified = function(notification) {
			var msg = "this callback should never be notified";
			$.error(msg);
			ok(false, msg);
		};
		var exceptionThrown = function(notification) {
			ok(true, "exceptionThrown was notified @ " + notification.currentTopic);
			count++;
			throw new Error("burp!");
		};
		var notificationReject = function(notification) {
			ok(true, "notificationReject was notified @ " + notification.currentTopic);
			count++;
			notification.reject();
		};
		
		var app = {
			topic : "/app",
			notify : neverNotified,
			padma : {
				topic : "/app/padma",
				notify : function(notification) {
					var msg = "notification of subscriber @ " + notification.currentTopic + " which returns false";
					$.debug(msg);
					ok(true, msg);
					count++;
					return false;
				},
				luke : {
					topic : "/app/padma/luke",
					notify : neverNotified
				},
				leia : {
					topic : "/app/padma/leia",
					notify : function(notification) {
						var msg = "notification of subscriber @ " + notification.currentTopic;
						$.debug(msg);
						ok(true, msg);
						equal(0, count, "leaf subscriber called 1st");
						count++;
					}
				}
			},
			anakin : {
				topic : "/app/anakin",
				notify : neverNotified
			}
		};
		
		var topics = PubSub.createTopics(app.padma.leia.topic);
		var count = 0;
		TestUtil.subscribeApp(app, PubSub);
		
		var options = {
			progress : function() {
				ok(true, "begin async notifications");
			},
			done: function() {
				ok(false, "successful async notifications");
			},
			fail: function() {
				ok(true, "failed async notifications");
				equal(2, count, "now count is succesfully mutated by async publication");
			},
			always : function() {
				ok(true, "completed async notification");
			}
		};
		
		var publication = $.publish(app.padma.leia.topic, options);
		
		$.unsubscribe(app.padma.topic);
		$.subscribe(app.padma.topic, exceptionThrown);
		$.publish(app.padma.leia.topic, options);
		start();
	}, 10);
});