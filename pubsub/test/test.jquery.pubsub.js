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