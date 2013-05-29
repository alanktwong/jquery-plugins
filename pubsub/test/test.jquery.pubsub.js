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