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
	}
};


var conditionalTest = function(isEnabled, message, callback) {
	if (isEnabled) {
		test(message, callback);
	}
};


var isEnabled = true;

conditionalTest(isEnabled, "internal functionality", function() {
	expect( 24 );
	
	var PubSub = TestUtil.getPubSub();
	PubSub.reset();
	deepEqual(false, PubSub.validateTopicName("bad topic name"), "topic names may not have white space");
	deepEqual(false, PubSub.validateTopicName({}), "topic names must be a string");
	deepEqual(false, PubSub.validateTopicName(null), "topic names must be defined");
	deepEqual(false, PubSub.validateTopicName("app.Name"), "each node in a topic name must be an alphanumeric string");
	deepEqual(false, PubSub.validateTopicName("appName"), "topic name must be begin with a slash");
	
	var topic = "/app/module/class";
	deepEqual(true, PubSub.validateTopicName(topic), "topic names must be a string defined a la Unix directory");
	var topics = PubSub.createTopics(topic);
	deepEqual( topics, ["/app", "/app/module", "/app/module/class"], "ancestory of topics created" );

	var data = { id : 1, date: new Date(), name: "name" };
	var context = {};
	var notification = PubSub.createNotification(topic , data, context);
	deepEqual( notification !== null, true, "notification created" );
	deepEqual( notification.data, data, "notification.data created" );
	deepEqual( notification.publishTopic, topic, "notification.publishTopic created" );
	deepEqual( notification.context, context, "notification.context created" );

	notification = PubSub.createNotification(topic , data);
	deepEqual( notification.context, null, "notification created w/o context" );
	notification = PubSub.createNotification(topic );
	deepEqual( notification.data, null,    "notification created w/o context or data" );
	deepEqual( notification.context, null, "notification created w/o context or data" );
	PubSub.addTimeStamp(notification);
	equal(true, PubSub.isDefined(notification.timestamp), "timestamp added");

	var callback = function(notification) {
		$.noop();
	};
	var priority = 100;
	var subscription = PubSub.createSubscription(topic, callback, priority, context);
	deepEqual( subscription !== null, true, "subscription created" );
	
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


conditionalTest(isEnabled, "subscribe to topic with just a callback", function() {
	expect( 6 );
	
	var PubSub = TestUtil.getPubSub();
	PubSub.reset();
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
	
	var PubSub = TestUtil.getPubSub();
	PubSub.reset();
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
	
	var PubSub = TestUtil.getPubSub();
	PubSub.reset();
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
	
	var PubSub = TestUtil.getPubSub();
	PubSub.reset();
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


asyncTest("publish just to topic to see notifications captured", function() {
	expect( 10 );
	
	var PubSub = TestUtil.getPubSub();
	PubSub.reset();
	var topic = "/app/module/class";
	var topics = PubSub.createTopics(topic);
	var count = 0;
	
	var appSubscription = $.subscribe("/app", function(notification) {
		equal(true, !!notification, "notification should be defined");
		equal(0, count, "app subscriber called 1st");
		count++;
	});
	
	var moduleSubscription = $.subscribe("/app/module", function(notification) {
		equal(true, !!notification, "notification should be defined");
		equal(1, count, "module subscriber called 2nd");
		count++;
	});
	
	var classSubscription = $.subscribe(topic, function(notification) {
		equal(true, !!notification, "notification should be defined");
		equal(2, count, "class subscriber called 3rd");
		count++;
	});
	
<<<<<<< HEAD
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
=======
	equal(1, PubSub.getSubscriptions("/app").length, "1 subscription should exist at app level");
	equal(1, PubSub.getSubscriptions("/app/module").length, "1 subscription should exist at module level");
	equal(1, PubSub.getSubscriptions(topic).length, "1 subscription should exist at class level");
	
	equal(3, _.keys(PubSub.subscriptions).length, "there should be 3 subscriptions total");
	
	setTimeout(function() {
		var result = $.publish(topic);
		// publish results and then see if it effected the change
		start();
	}, 1000);
});

>>>>>>> release/0.0.2
