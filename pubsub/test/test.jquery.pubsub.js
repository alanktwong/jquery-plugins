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
	u.each(aList, function(element,i,list) {
		strictEqual(element, i + 1, "lists are 0-indexed for " + i )
		strictEqual(this, context, "context bound to {}");
	}, context);
	
	u.each({'1': 1, '2': 2, '3': 3 }, function(value,key,list) {
		strictEqual(key, "" + value, "objects are enumerable by their key " + key )
	});
	aList = [1, 2, 3, 4, 5, 6];
	var even = u.find(aList, function(num){ return num % 2 == 0; });
	strictEqual(even, 2, "found first even number in " +  aList);
	var evens = u.filter(aList, function(num){ return num % 2 == 0; });
	deepEqual(evens, [2,4,6], "found all even numbers in " +  aList);
	
	aList = [1,2,3];
	var sum = _.reduce([1, 2, 3], function(memo, num){ return memo + num; }, 0);
	deepEqual(sum, 6, "this reduction of " +  aList + " should be 6");
	
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
	
	var fn = function(name) {
		ok(true, "executing a callback for " + name);
		strictEqual(this,context, name + " bound to context");
	};
	
	var bound = u.bind(fn, context);
	bound("bound fonction");
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

test("subscribe to topic with just a callback", function() {
	expect( 12 );
	
	var PubSub = TestUtil.resetPubSub();
	var topic = "/app/module/class";
	var topics = PubSub.createTopics(topic);
	var callback0 = function(notification) {
		ok(true, "1st subscriber notified");
	};
	var callback1 = function(notification) {
		ok(true, "2nd subscriber notified");
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
	strictEqual(subscription1.timestamp > subscription0.timestamp, true, "2nd subscription has timestamp later than 1st");
	
	
	$.publishSync(topic);
	
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
	subscription = $.subscribe( topic, {}, function() {
		strictEqual( order, 5, "this subscriber is dead last because it has a high priority number" );
		order++;
	}, 100 );
	
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
	}, 10); 
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

test( "push data during synchronous publication", function() {
	var PubSub = TestUtil.resetPubSub();
	expect( 10 );
	var topic = "/data/sync";
	var subscription, publication;
	
	subscription = $.subscribe( topic, function( notification ) {
		strictEqual( notification.data.string, "hello", "string passed during sync notification" );
		strictEqual( notification.data.number, 5, "number passed during sync notification" );
		deepEqual( notification.data.object, {
			foo: "bar",
			baz: "qux"
		}, "object passed" );
		notification.data.string = "goodbye";
		notification.data.object.baz = "quux";
	});
	subscription = $.subscribe( topic, function( notification ) {
		strictEqual( notification.data.string, "goodbye", "string changed during sync notification" );
		strictEqual( notification.data.number, 5, "number unchanged during sync notification" );
		deepEqual( notification.data.object, {
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
			ok(true, "begin sync notifications w/data");
		},
		done: function() {
			ok(true, "successful sync notifications w/data");
		},
		fail: function() {
			ok(false, "failed sync notifications w/data");
		},
		always : function() {
			ok(true, "completed sync notification w/data");
			deepEqual( obj, {
				foo: "bar",
				baz: "quux"
			}, "object updated after sync notification" );
		},
		data: { string: "hello", number: 5, object: obj }
	});
});


asyncTest( "push data during asynchronous publication", function() {
	var PubSub = TestUtil.resetPubSub();
	expect( 10 );
	
	_.delay(function() {
		var topic = "/data/async";
		var subscription, publication;
		subscription = $.subscribe( topic, function( notification ) {
			strictEqual( notification.data.string, "hello", "string passed during async notification" );
			strictEqual( notification.data.number, 5, "number passed during async notification" );
			deepEqual( notification.data.object, {
				foo: "bar",
				baz: "qux"
			}, "object passed" );
			notification.data.string = "goodbye";
			notification.data.object.baz = "quux";
		});
		subscription = $.subscribe( topic, function( notification ) {
			strictEqual( notification.data.string, "goodbye", "string changed during async notification" );
			strictEqual( notification.data.number, 5, "number unchanged during async notification" );
			deepEqual( notification.data.object, {
				foo: "bar",
				baz: "quux"
			}, "object changed during async notification" );
		});


		var obj = {
			foo: "bar",
			baz: "qux"
		};
		publication = $.publishSync( topic, {
			progress : function() {
				ok(true, "begin async notifications w/data");
			},
			done: function() {
				ok(true, "successful async notifications w/data");
			},
			fail: function() {
				ok(false, "failed async notifications w/data");
			},
			always : function() {
				ok(true, "completed async notification w/data");
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


var testContinuations = true;
if (testContinuations) {
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

	test("discontinue sync publication when 1 subscriber returns false", function() {
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

	test("discontinue sync publication when 1 subscribers throws an error", function() {
		expect( 7 );
		
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
		}, 10);
	});


	asyncTest("discontinue async publication when 1 subscriber returns false", function() {
		var PubSub = TestUtil.resetPubSub();
		expect( 7 );

		_.delay(function() {
			var topic = "/discontinuation/async"
			$.subscribe( topic, function(notification) {
				ok( true, "continued after returning true for async pub" );
				throw new Error("stop publication");
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
		}, 10);
	});

	asyncTest("discontinue async publication when 1 subscriber throws exception", function() {
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
		}, 10);
	});
}

var testBubbling = true;

if (testBubbling) {
	test("notifications should bubble up during synchronous publication on a hierarchical topic", function() {
		var PubSub = TestUtil.resetPubSub();
		expect( 17 );
		
		var neverNotified = function(notification) {
			ok(false, "this callback should never be notified");
		};
		
		var app = {
			topic : "/app",
			notify : function(notification) {
				ok(true, "root was notified");
				equal(2, count, "root subscriber called 3rd");
				deepEqual(notification.data, app.data, "same data by reference passed to root");
				count++;
			},
			padma : {
				topic : "/app/padma",
				notify : function(notification) {
					ok(true, "padma was notified");
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
						ok(true, "leia was notified");
						deepEqual(notification.data, app.data, "leaf should receive data");
						notification.data.name = "empire strikes back";
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
		
		var classSubscription = $.subscribe(app.padma.leia.topic, app.padma.leia.notify);
		var moduleSubscription = $.subscribe(app.padma.topic, app.padma.notify);
		var appSubscription = $.subscribe(app.topic, app.notify);
		
		$.subscribe(app.anakin.topic, app.anakin.notify);
		$.subscribe(app.padma.luke.topic, app.padma.luke.notify);
		
		equal(1, PubSub.getSubscriptions(app.topic).length, "1 subscription should exist at app level");
		equal(1, PubSub.getSubscriptions(app.padma.topic).length, "1 subscription should exist at padma level");
		equal(1, PubSub.getSubscriptions(app.padma.leia.topic).length, "1 subscription should exist at leia level");
		
		equal(5, _.keys(PubSub.subscriptions).length, "there should be 5 subscriptions total");
		
		var publication = $.publishSync(app.padma.leia.topic, {
			data : app.data,
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

	test("notifications attempts to bubble up during synchronous publication on a hierarchical topic b/c mid-level subscriber interrupts", function() {
		var PubSub = TestUtil.resetPubSub();
		expect( 27 );
		
		var neverNotified = function(notification) {
			ok(false, "this callback should never be notified");
		};
		var exceptionThrown = function(notification) {
			ok(true, "exceptionThrown was notified");
			throw new Error("burp!");
		};
		var notificationReject = function(notification) {
			ok(true, "notificationReject was notified");
			notification.reject();
		};
		
		var app = {
			topic : "/app",
			notify : neverNotified,
			padma : {
				topic : "/app/padma",
				notify : function(notification) {
					ok(true, "padma was notified");
					equal(1, count, "mid-level subscriber called 2nd");
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
						ok(true, "leia was notified");
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
		
		var classSubscription = $.subscribe(app.padma.leia.topic, app.padma.leia.notify);
		var moduleSubscription = $.subscribe(app.padma.topic, app.padma.notify);
		var appSubscription = $.subscribe(app.topic, app.notify);
		
		$.subscribe(app.anakin.topic, app.anakin.notify);
		$.subscribe(app.padma.luke.topic, app.padma.luke.notify);
		
		equal(1, PubSub.getSubscriptions(app.topic).length, "1 subscription should exist at app level");
		equal(1, PubSub.getSubscriptions(app.padma.topic).length, "1 subscription should exist at padma level");
		equal(1, PubSub.getSubscriptions(app.padma.leia.topic).length, "1 subscription should exist at leia level");
		
		equal(5, _.keys(PubSub.subscriptions).length, "there should be 5 subscriptions total");
		
		var options = {
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
		}
		var publication = $.publishSync(app.padma.leia.topic, options);
		equal(2, count, "synchronous publication blocks and mutates the count");
		
		$.unsubscribe(app.padma.topic);
		count = 0;
		$.subscribe(app.padma.topic, exceptionThrown);
		$.publishSync(app.padma.leia.topic, options);

		$.unsubscribe(app.padma.topic);
		count = 0;
		$.subscribe(app.padma.topic, notificationReject);
		$.publishSync(app.padma.leia.topic, options);
	});
	
	asyncTest("notifications should bubble up during asynchronous publication on a hierarchical topic", function() {
		var PubSub = TestUtil.resetPubSub();
		expect( 17 );
		_.delay(function() {
			var neverNotified = function(notification) {
				ok(false, "this callback should never be notified");
			};
			
			var app = {
				topic : "/app",
				notify : function(notification) {
					ok(true, "root was notified");
					equal(2, count, "root subscriber called 3rd");
					deepEqual(notification.data, app.data, "same data by reference passed to root");
					count++;
				},
				padma : {
					topic : "/app/padma",
					notify : function(notification) {
						ok(true, "padma was notified");
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
							ok(true, "leia was notified");
							deepEqual(notification.data, app.data, "leaf should receive data");
							notification.data.name = "empire strikes back";
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
			
			var classSubscription = $.subscribe(app.padma.leia.topic, app.padma.leia.notify);
			var moduleSubscription = $.subscribe(app.padma.topic, app.padma.notify);
			var appSubscription = $.subscribe(app.topic, app.notify);
			
			$.subscribe(app.anakin.topic, app.anakin.notify);
			$.subscribe(app.padma.luke.topic, app.padma.luke.notify);
			
			equal(1, PubSub.getSubscriptions(app.topic).length, "1 subscription should exist at app level");
			equal(1, PubSub.getSubscriptions(app.padma.topic).length, "1 subscription should exist at padma level");
			equal(1, PubSub.getSubscriptions(app.padma.leia.topic).length, "1 subscription should exist at leia level");
			
			equal(5, _.keys(PubSub.subscriptions).length, "there should be 5 subscriptions total");
			
			var publication = $.publish(app.padma.leia.topic, {
				data : app.data,
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
		}, 10);
	});
	
	asyncTest("notifications attempt to bubble up during asynchronous publication on a hierarchical topic b/c mid-level subscriber interrupts", function() {
		var PubSub = TestUtil.resetPubSub();
		expect( 15 );
		_.delay(function() {
			var neverNotified = function(notification) {
				ok(false, "this callback should never be notified");
			};
			var exceptionThrown = function(notification) {
				ok(true, "exceptionThrown was notified");
				throw new Error("burp!");
			};
			var notificationReject = function(notification) {
				ok(true, "notificationReject was notified");
				notification.reject();
			};
			
			var app = {
				topic : "/app",
				notify : neverNotified,
				padma : {
					topic : "/app/padma",
					notify : function(notification) {
						ok(true, "padma was notified");
						equal(1, count, "mid-level subscriber called 2nd");
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
							ok(true, "leia was notified");
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
			
			var classSubscription = $.subscribe(app.padma.leia.topic, app.padma.leia.notify);
			var moduleSubscription = $.subscribe(app.padma.topic, app.padma.notify);
			var appSubscription = $.subscribe(app.topic, app.notify);
			
			$.subscribe(app.anakin.topic, app.anakin.notify);
			$.subscribe(app.padma.luke.topic, app.padma.luke.notify);
			
			equal(1, PubSub.getSubscriptions(app.topic).length, "1 subscription should exist at app level");
			equal(1, PubSub.getSubscriptions(app.padma.topic).length, "1 subscription should exist at padma level");
			equal(1, PubSub.getSubscriptions(app.padma.leia.topic).length, "1 subscription should exist at leia level");
			
			equal(5, _.keys(PubSub.subscriptions).length, "there should be 5 subscriptions total");
			
			var options = {
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
				}
			};
			
			var publication = $.publish(app.padma.leia.topic, options);
			start();
			
			$.unsubscribe(app.padma.topic);
			$.subscribe(app.padma.topic, exceptionThrown);
			$.publish(app.padma.leia.topic, options);
			
			$.unsubscribe(app.padma.topic);
			$.subscribe(app.padma.topic, notificationReject);
			$.publish(app.padma.leia.topic, options);
		}, 10);
	});
}
