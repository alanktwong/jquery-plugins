describe("jquery.pubsub", function() {

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

	describe("when testing the core internal functionality of the pubsub", function() {
		var PubSub;
		var topic = "/app/module/class";
		
		beforeEach(function() {
			PubSub = TestUtil.resetPubSub();
		});
		
		it("should validate topic names with spaces", function() {
			expect(PubSub.validateTopicName("bad topic name")).toBe(false);
		});
		it("should validate topic names that are not strings", function() {
			expect(PubSub.validateTopicName({})).toBe(false);
		});
		it("should validate topic names that are null", function() {
			expect(PubSub.validateTopicName(undefined)).toBe(false);
			expect(PubSub.validateTopicName(null)).toBe(false);
		});
		it("should validate topic names that do not have all alphanumeric characters", function() {
			expect(PubSub.validateTopicName("app.name")).toBe(false);
		});
		it("should validate topic names that do not begin with a slash a la Unix directories", function() {
			expect(PubSub.validateTopicName("appName")).toBe(false);
			expect(PubSub.validateTopicName(topic)).toBe(true);
		});
		it("should validate topic names a la Unix directories", function() {
			expect(PubSub.validateTopicName(topic)).toBe(true);
		});
		it("should infer ancestor chain of topic names", function() {
			expect(PubSub.validateTopicName(topic)).toBe(true);
			var topics = PubSub.createTopics(topic);
			expect(_.isEqual(topics,["/app/module/class", "/app/module", "/app"])).toBe(true);
		});
	});
	describe("when testing the utilities of the pubsub", function() {
		var PubSub, u;
		var topic = "/app/module/class";
		
		beforeEach(function() {
			PubSub = TestUtil.resetPubSub();
			u = PubSub.Util;
		});
		
		it("should test for undefined", function() {
			expect(u.isUndefined(undefined)).toBe(true);
			expect(u.isUndefined("")).toBe(false);
		});
		it("should test for non-nulls", function() {
			expect(u.isNotNull("")).toBe(true);
			expect(u.isNotNull(null)).toBe(false);
		});
		it("should test for objects", function() {
			expect(u.isObject({})).toBe(true);
			expect(u.isObject("string")).toBe(false);
		});
		it("should test for functions", function() {
			expect(u.isFunction(u.isFunction)).toBe(true);
			expect(u.isFunction({})).toBe(false);
		});
		it("should test for strings", function() {
			expect(u.isString("string")).toBe(true);
			expect(u.isString(6)).toBe(false);
		});
		it("should test for numbers", function() {
			expect(u.isNumber(6)).toBe(true);
			expect(u.isNumber("6")).toBe(false);
		});
		it("should test for 'has'", function() {
			expect(u.has(u, "has")).toBe(true);
			expect(u.has({},"has")).toBe(false);
		});
		it("should have identity echo its input", function() {
			expect(u.identity(topic)).toBe(topic);
		});
		it("should iterate through 0-indexed lists & objects", function() {
			var context = {};
			var aList = [1,2,3];
			var obj = {'1': 1, '2': 2, '3': 3 };
			if (u.each) {
				u.each(aList, function(element,i,iterable) {
					expect(element).toBe(i+1);
					expect(this).toBe(context);
				}, context);
				u.each(obj, function(value,key,iterable) {
					expect(key).toBe("" + value);
				});
			}
		});
		it("should search lists & objects", function() {
			var aList = [1, 2, 3, 4, 5, 6];
			if (u.find) {
				var even = u.find(aList, function(num){ return num % 2 == 0; });
				expect(even).toBe(2);
			}
		});
		it("should filter lists & objects", function() {
			var aList = [1, 2, 3, 4, 5, 6];
			if (u.filter) {
				var evens = u.filter(aList, function(num){ return num % 2 == 0; });
				expect(_.isEqual(evens,[2,4,6])).toBe(true);
			}
		});
		it("should reduce lists & objects", function() {
			var aList = [1, 2, 3];
			if (u.reduce) {
				var sum = _.reduce(aList, function(memo, num){ return memo + num; }, 0);
				expect(sum).toBe(6);
			}
		});
		it("should map lists & objects", function() {
			var aList = [null, 0, 'yes', false];
			if (u.map) {
				var mapped = u.map(aList, function(each) {
					var ret = each;
					if (each === null) {
						ret = "null";
					}
					return ret;
				});
				// transformed array with truthy and untruthy values
				expect(_.isEqual(mapped,["null",0,"yes", false])).toBe(true);
				// aList has 1 truthy value
				expect(_.some(aList)).toBe(true);
			}
		});
		it("should bind functions to a given context", function() {
			var context = {};
			var obj = {
				execute : function(name) {
					expect(obj.execute).toHaveBeenCalled();
					expect(this).toBe(context);
				}
			}
			spyOn(obj, 'execute');
			var bound = u.bind(obj.execute, context);
			bound("bound function");
		});
	});
	
	describe("when creating publications", function() {
		var PubSub, publication, notification;
		var topic = "/app/module/class";
		var data = { id : 1, date: new Date(), name: "name" };
		var context = {};
		
		beforeEach(function() {
			PubSub = TestUtil.resetPubSub();
		});
		
		it("should create them with data and context", function() {
			publication = PubSub.createPublication(topic ,{ data: data, context: context });
			notification = publication.notification;
			expect(notification !== null).toBe(true);
			expect(notification.data).toBe(data);
			expect(notification.publishTopic).toBe(topic);
			expect(notification.context).toBe(context);
			expect(notification.timestamp !== null).toBe(true);
			expect(publication.immediateExceptions).toBe(true);
		});
		it("should create them with just data", function() {
			publication = PubSub.createPublication(topic, { data : data });
			notification = publication.notification;
			expect(notification.context === null).toBe(true);
		});
		it("should not create them with w/o options", function() {
			try {
				publication = PubSub.createPublication(topic)
			} catch( err ) {
				expect(err.message).toBe("You must provide options to create a Notification.");
			}
		});
		it("should create them with empty options", function() {
			publication = PubSub.createPublication(topic, {});
			notification = publication.notification;
			expect(notification.data === null).toBe(true);
			expect(notification.context === null).toBe(true);
		});
	});
	describe("when creating subscriptions", function() {
		var PubSub, subscription, topics;
		var topic = "/app/module/class";
		var data = { id : 1, date: new Date(), name: "name" };
		var context = {};
		

		var callback = function(notification) {
			$.noop();
		};
		var priority = 100;
		
		beforeEach(function() {
			PubSub = TestUtil.resetPubSub();
			topics = PubSub.createTopics(topic);
		});
		
		it("should create them with topic, callback, priority and context", function() {
			var subscription = PubSub.createSubscription(topic, callback, priority, context);
			expect(subscription !== null).toBe(true);
			expect(subscription.timestamp !== null).toBe(true);
			expect(_.isEqual(subscription.topics,topics)).toBe(true);
			expect(subscription.callback).toBe(callback);
			expect(subscription.priority).toBe(priority);
			expect(subscription.context).toBe(context);
		});
		it("should create them with topic, callback and priority", function() {
			var subscription = PubSub.createSubscription(topic, callback, priority);
			expect(subscription.context === null).toBe(true);
		});
		it("should create them with topic and callback", function() {
			var subscription = PubSub.createSubscription(topic, callback);
			expect(subscription.context === null).toBe(true);
			expect(subscription.priority).toBe(10);
			// but this is not the 'official' way to subscribe
			expect(PubSub.hasSubscriptions(topic)).toBe(false);
		});
	});
	
	describe("when handling errors for public API", function() {
		var PubSub;
		

		var callback = function(notification) {
			$.noop();
		};
		
		beforeEach(function() {
			PubSub = TestUtil.resetPubSub();
		});
		
		it("should throw an error on publishing to bad topic name", function() {
			try {
				$.publish( undefined, callback );
			} catch( err ) {
				expect(err.message).toBe("You must provide a valid topic name to publish.");
			}
		});
		it("should throw an error on subscribing with bad topic name", function() {
			try {
				$.subscribe( undefined, callback );
			} catch( err ) {
				expect(err.message).toBe("You must provide a valid topic name to create a Subscription.");
			}
		});
		it("should throw an error on subscribing w/o a callback", function() {
			try {
				$.subscribe( "/fake/topic", "fooey callback" );
			} catch( err ) {
				expect(err.message).toBe("You must provide a valid handle to the callback to add its subscription.");
			}
		});
		it("should throw an error on unsubscribing with a bad topic name", function() {
			try {
				$.unsubscribe( undefined );
			} catch( err ) {
				expect(err.message).toBe("You must provide a valid topic to remove a subscription.");
			}
			try {
				$.unsubscribe( "bad name" );
			} catch( err ) {
				expect(err.message).toBe("You must provide a valid topic to remove a subscription.");
			}
		});
	});
	
	describe("when subscribing", function() {
		var PubSub, topic, topics;
		
		beforeEach(function() {
			topic = "/app/module/class";
			PubSub = TestUtil.resetPubSub();
			topics = PubSub.createTopics(topic);
		});
		
		it("should subscribe correctly to a topic with just a callback", function() {
			var count = 0;
			
			var callbacks = {
				first: {
					notify : function(notification) {
						expect(callbacks.first).toHaveBeenCalled();
						$.debug("1st subscriber notified");
						expect(count).toBe(0);
						count++;
					}
				},
				second: {
					notify : function(notification) {
						expect(callbacks.second).toHaveBeenCalled();
						$.debug("1st subscriber notified");
						expect(count).toBe(1);
						count++;
					}
				}
			};
			spyOn(callbacks.first, 'notify');
			spyOn(callbacks.second, 'notify');
			
			callbacks.first.subscription = $.subscribe(topic, callbacks.first.notify);
			expect(PubSub.hasSubscriptions(topic)).toBe(true);
			expect(PubSub.getSubscriptions(topic).length).toBe(1);
			expect(callbacks.first.subscription).toBeSubscribedCorrectly(topic, null, callbacks.first.notify, null, topics);


			callbacks.second.subscription = $.subscribe(topic, callbacks.second.notify);
			expect(callbacks.second.subscription).toBeSubscribedCorrectly(topic, null, callbacks.second.notify, null, topics);
			
			expect(PubSub.getSubscriptions(topic).length).toBe(2);
			// should have unique GUIDs
			expect(callbacks.first.subscription.id).not.toBe(callbacks.second.subscription.id);
			expect(callbacks.first.subscription.priority).toBe(callbacks.second.subscription.priority);
			expect(callbacks.second.subscription.timestamp >= callbacks.first.subscription.timestamp).toBe(true);
			
			$.publishSync(topic);
		});
		it("should subscribe correctly to a topic with a context", function() {
			var callbacks = {
					first: {
						notify : function(notification) {
							expect(callbacks.first).toHaveBeenCalled();
							$.debug("1st subscriber notified");
							expect(count).toBe(0);
						},
						context : {}
					}
			};
			spyOn(callbacks.first, 'notify');
			callbacks.first.subscription = $.subscribe(topic, callbacks.first.context, callbacks.first.notify);

			expect(PubSub.hasSubscriptions(topic)).toBe(true);
			expect(PubSub.getSubscriptions(topic).length).toBe(1);
			expect(callbacks.first.subscription).toBeSubscribedCorrectly(topic, callbacks.first.context, callbacks.first.notify, null, topics);

			$.publishSync(topic);
		});
		
		it("should subscribe correctly to topic with a callback and a priority", function() {
			var callbacks = {
					first: {
						notify : function(notification) {
							expect(callbacks.first).toHaveBeenCalled();
							$.debug("1st subscriber notified");
							expect(count).toBe(0);
						},
						priority : 100
					}
			};
			spyOn(callbacks.first, 'notify');
			callbacks.first.subscription = $.subscribe(topic, callbacks.first.notify, callbacks.first.priority);

			expect(PubSub.hasSubscriptions(topic)).toBe(true);
			expect(PubSub.getSubscriptions(topic).length).toBe(1);
			expect(callbacks.first.subscription).toBeSubscribedCorrectly(topic, null, callbacks.first.notify, callbacks.first.priority, topics);

			$.publishSync(topic);
		});
		it("should subscribe correctly to a topic with a callback, a priority and a context", function() {
			var callbacks = {
					first: {
						notify : function(notification) {
							expect(callbacks.first).toHaveBeenCalled();
							$.debug("1st subscriber notified");
							expect(count).toBe(0);
						},
						priority : 100,
						context: {}
					}
			};
			
			spyOn(callbacks.first, 'notify');
			callbacks.first.subscription = $.subscribe(topic, callbacks.first.context, callbacks.first.notify, callbacks.first.priority);
			expect(PubSub.hasSubscriptions(topic)).toBe(true);
			expect(PubSub.getSubscriptions(topic).length).toBe(1);
			expect(callbacks.first.subscription).toBeSubscribedCorrectly(topic,callbacks.first.context, callbacks.first.notify, callbacks.first.priority, topics);
			
			$.publishSync(topic);
		});
	});

});