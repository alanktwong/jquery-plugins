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
	
	describe("when testing the utilities of the PubSub", function() {
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
					expect(this).toBe(context);
				}
			}
			spyOn(obj, 'execute').andCallThrough();
			var bound = u.bind(obj.execute, context);
			bound("bound function");
			expect(obj.execute).toHaveBeenCalled();
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
						$.debug("1st subscriber notified");
						expect(count).toBe(0);
						count++;
					}
				},
				second: {
					notify : function(notification) {
						$.debug("1st subscriber notified");
						expect(count).toBe(1);
						count++;
					}
				}
			};
			spyOn(callbacks.first, 'notify').andCallThrough();
			spyOn(callbacks.second, 'notify').andCallThrough();
			
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
			expect(callbacks.first.notify).toHaveBeenCalled();
			expect(callbacks.second.notify).toHaveBeenCalled();
		});
		it("should subscribe correctly to a topic with a context", function() {
			var callbacks = {
					first: {
						notify : function(notification) {
							$.debug("1st subscriber notified");
							expect(count).toBe(0);
						},
						context : {}
					}
			};
			spyOn(callbacks.first, 'notify').andCallThrough();
			callbacks.first.subscription = $.subscribe(topic, callbacks.first.context, callbacks.first.notify);

			expect(PubSub.hasSubscriptions(topic)).toBe(true);
			expect(PubSub.getSubscriptions(topic).length).toBe(1);
			expect(callbacks.first.subscription).toBeSubscribedCorrectly(topic, callbacks.first.context, callbacks.first.notify, null, topics);

			$.publishSync(topic);
			expect(callbacks.first.notify).toHaveBeenCalled();
		});
		
		it("should subscribe correctly to topic with a callback and a priority", function() {
			var callbacks = {
					first: {
						notify : function(notification) {
							$.debug("1st subscriber notified");
							expect(count).toBe(0);
						},
						priority : 100
					}
			};
			spyOn(callbacks.first, 'notify').andCallThrough();
			callbacks.first.subscription = $.subscribe(topic, callbacks.first.notify, callbacks.first.priority);

			expect(PubSub.hasSubscriptions(topic)).toBe(true);
			expect(PubSub.getSubscriptions(topic).length).toBe(1);
			expect(callbacks.first.subscription).toBeSubscribedCorrectly(topic, null, callbacks.first.notify, callbacks.first.priority, topics);

			$.publishSync(topic);
			expect(callbacks.first.notify).toHaveBeenCalled();
		});
		it("should subscribe correctly to a topic with a callback, a priority and a context", function() {
			var callbacks = {
					first: {
						notify : function(notification) {
							$.debug("1st subscriber notified");
							expect(count).toBe(0);
						},
						priority : 100,
						context: {}
					}
			};
			
			spyOn(callbacks.first, 'notify').andCallThrough();
			callbacks.first.subscription = $.subscribe(topic, callbacks.first.context, callbacks.first.notify, callbacks.first.priority);
			expect(PubSub.hasSubscriptions(topic)).toBe(true);
			expect(PubSub.getSubscriptions(topic).length).toBe(1);
			expect(callbacks.first.subscription).toBeSubscribedCorrectly(topic,callbacks.first.context, callbacks.first.notify, callbacks.first.priority, topics);
			
			$.publishSync(topic);
			expect(callbacks.first.notify).toHaveBeenCalled();
		});
	});
	
	describe("when unsubscribing", function() {
		var PubSub, topics;
		
		beforeEach(function() {
			PubSub = TestUtil.resetPubSub();
		});
		it("should unsubscribe each subscription correctly", function() {
			var order = 0;
			var fixture = {
					topic : "/unsubscribe",
					first:  {
						notify : function(notification) {
							var msg = "1st subscriber called";
							$.debug(msg);
							expect(order).toBe(0);
							order++;
						}
					},
					second: {
						notify : function(notification) {
							var msg = "unsubscribed and should not have been notified";
							$.error(msg);
							expect(msg).toBe(false);
							order++;
						}
					},
					third: {
						notify : function(notification) {
							var msg = "2nd subscriber called";
							$.debug(msg);
							strictEqual( order, 1, msg );
							order++;
						}
					},
					fourth: {
						notify : function(notification) {
							var msg = "unsubscribed and should not have been notified";
							$.error(msg);
							expect(msg).toBe(false);
							order++;
						}
					}
			};
			spyOn(fixture.first,  'notify').andCallThrough();
			spyOn(fixture.second, 'notify').andCallThrough();
			spyOn(fixture.third,  'notify').andCallThrough();
			spyOn(fixture.fourth, 'notify').andCallThrough();
			
			fixture.first.subscription  = $.subscribe(fixture.topic, fixture.first.notify);
			fixture.second.subscription = $.subscribe(fixture.topic, fixture.second.notify);
			fixture.third.subscription  = $.subscribe(fixture.topic, fixture.third.notify);
			fixture.fourth.subscription = $.subscribe(fixture.topic, fixture.fourth.notify);
			
			expect(PubSub.hasSubscriptions(fixture.topic)).toBe(true);
			expect(PubSub.getSubscriptions(fixture.topic).length).toBe(4);
			
			var subscribers = [];
			// remove even numbered subscriptions
			subscribers = $.unsubscribe( fixture.topic, fixture.second.subscription );
			subscribers = $.unsubscribe( fixture.topic, fixture.fourth.subscription );
			expect(PubSub.getSubscriptions(fixture.topic).length).toBe(2);
			
			try {
				subscribers = $.unsubscribe( fixture.topic, function() {});
			} catch ( err ) {
				expect( err.message ).toBe("You must provide the subscription generated for the callback to remove it.");
			}
			$.publishSync( fixture.topic );
			expect(fixture.first.notify).toHaveBeenCalled();
			expect(fixture.third.notify).toHaveBeenCalled();
		});
		it("should unsubscribe all", function() {
			var order = 0;
			var fixture = {
					topic : "/unsubscribe/all",
					first:  {
						notify : function(notification) {
							var msg = "1st subscriber called";
							$.debug(msg);
							expect(order).toBe(0);
							order++;
						}
					},
					second:  {
						notify : function(notification) {
							var msg = "2nd subscriber called";
							$.debug(msg);
							expect(order).toBe(1);
							order++;
						}
					}
			};
			spyOn(fixture.first,  'notify').andCallThrough();
			spyOn(fixture.second, 'notify').andCallThrough();
			
			fixture.first.subscription =  $.subscribe(fixture.topic, fixture.first.notify);
			fixture.second.subscription = $.subscribe(fixture.topic, fixture.second.notify);
			$.publishSync( fixture.topic );
			expect(fixture.first.notify).toHaveBeenCalled();
			expect(fixture.second.notify).toHaveBeenCalled();
			expect(order).toBe(2);
			
			var subscribers = $.unsubscribe( fixture.topic );
			expect(subscribers.length).toBe(0);
			$.publishSync( fixture.topic );
			expect(order).toBe(2);
		});
		
	});

	describe("when setting priorities during PubSub", function() {
		var PubSub, fixture, order;
		
		beforeEach(function() {
			order = 1;
			PubSub = TestUtil.resetPubSub();
			fixture = {
				topic : "/priority/notify",
				first: {
					notify : function(notification) {
						$.debug("the initial subscriber has priority default, it is notified 2nd");
						expect(order).toBe(2);
						order++;
					}
				},
				second : {
					notify : function(notification) {
						$.debug("this subscriber has priority 15; it is notified 4th");
						expect(order).toBe(4);
						order++;
					},
					priority : 15
				},
				third : {
					notify : function(notification) {
						$.debug("this subscriber has priority default; it is notified 3rd after the initial subscriber as its timestamp is later");
						expect(order).toBe(3);
						order++;
					}
				},
				fourth : {
					notify : function(notification) {
						$.debug("this subscriber greatest priority since it is the lowest number");
						expect(order).toBe(1);
						order++;
					},
					priority : 1
				},
				fifth : {
					notify : function(notification) {
						$.debug("this subscriber is dead last because it has a high priority number");
						expect(order).toBe(5);
						order++;
					},
					priority : 100
				},
				publishOptions : {
					progress : function() {
						var msg = "begin notifications w/o data";
						$.info(msg);
					},
					done: function() {
						var msg = "successful notifications w/o data";
						$.info(msg);
					},
					fail: function() {
						var msg = "failed notifications w/o data";
						$.error(msg);
					},
					always : function() {
						var msg = "completed notifications w/o data";
						$.info(msg);
					}
				}
			};
			spyOn(fixture.first,  'notify').andCallThrough();
			spyOn(fixture.second, 'notify').andCallThrough();
			spyOn(fixture.third,  'notify').andCallThrough();
			spyOn(fixture.fourth, 'notify').andCallThrough();
			spyOn(fixture.fifth,  'notify').andCallThrough();
			
			fixture.first.subscription = $.subscribe(fixture.topic, fixture.first.notify);
			fixture.second.subscription = $.subscribe(fixture.topic, fixture.second.notify, fixture.second.priority);
			fixture.third.subscription = $.subscribe(fixture.topic, fixture.third.notify);
			fixture.fourth.subscription = $.subscribe(fixture.topic, fixture.fourth.notify, fixture.fourth.priority);
			fixture.fifth.subscription = $.subscribe(fixture.topic, fixture.fifth.notify, fixture.fifth.priority);
		});
		
		it("should notify in order during synchronous publication", function() {
			var publication = $.publishSync( fixture.topic, fixture.publishOptions );
			
			expect(fixture.first.notify).toHaveBeenCalled();
			expect(fixture.second.notify).toHaveBeenCalled();
			expect(fixture.third.notify).toHaveBeenCalled();
			expect(fixture.fourth.notify).toHaveBeenCalled();
			expect(fixture.fifth.notify).toHaveBeenCalled();
			
			expect(order).toBe(6);
		});
		it("should notify in order during asynchronous publication", function() {
			
			waitsFor(function() {
				var publication = $.publish( fixture.topic, fixture.publishOptions );
				return publication !== null;
			}, "publication should be sent asynchronously", 10);
			
			_.delay(function() {
				runs(function() {
					expect(order).toBeGreaterThan(1);
					expect(order).toBe(6);
					
					expect(fixture.first.notify).toHaveBeenCalled();
					expect(fixture.second.notify).toHaveBeenCalled();
					expect(fixture.third.notify).toHaveBeenCalled();
					expect(fixture.fourth.notify).toHaveBeenCalled();
					expect(fixture.fifth.notify).toHaveBeenCalled();
				});
			}, 20);
		});
	});
	
	describe("when setting context during PubSub", function() {
		var PubSub, fixture, order;
		
		beforeEach(function() {
			PubSub = TestUtil.resetPubSub();
			
			fixture = {
				topic : "/context/notify",
				contexts : {
					publisher : {
						name : "from publisher"
					},
					subscriber : {
						name : "from subscriber"
					}
				},
				callback : function() {},
				defaultSubscriber : {
					notify : function(n) {
						$.debug("default context is the window");
						expect(this).toBe(window);
					}
				},
				contextualSubscriber : {
					notify : function(n) {
						$.debug("receives context from subscription");
						expect(this !== null).toBe(true);
						expect( _.isEqual(this, fixture.contexts.subscriber) ).toBe(true);
					}
				},
				pubSubscriber : {
					notify : function(n) {
						$.debug("receives context from publisher");
						expect(this !== null).toBe(true);
						expect( _.isEqual(this, fixture.contexts.publisher) ).toBe(true);
					}
				}
			};
			spyOn(fixture.defaultSubscriber,    'notify').andCallThrough();
			spyOn(fixture.contextualSubscriber, 'notify').andCallThrough();
		});
		
		it("should have context from subscriber", function() {
			fixture.defaultSubscriber.subscription = $.subscribe(fixture.topic, fixture.defaultSubscriber.notify);
			fixture.contextualSubscriber.subscription = $.subscribe(fixture.topic, fixture.contexts.subscriber, fixture.contextualSubscriber.notify);
			try {
				$.subscribe(fixture.topic, fixture.callback, fixture.callback);
				$.error("function cannot be bound during subscription");
			} catch (err) {
				expect(err.message).toBe("You must provide an object for a context.");
			}
			$.publishSync(fixture.topic);
		});
		it("should have context from publisher", function() {
			fixture.pubSubscriber.subscription = $.subscribe(fixture.topic, fixture.pubSubscriber.notify);
			$.publishSync(fixture.topic, { context : fixture.contexts.publisher });
		});
	});
});