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
						enabled: true
					}
				]
			});
			return log4jq;
		}
	};

	describe("when testing the core internal functionality of PubSub", function() {
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
	
	describe("when testing the utilities of PubSub", function() {
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
			expect(notification).not.toBeNull();
			expect(notification.data).toBe(data);
			expect(notification.publishTopic).toBe(topic);
			expect(notification.context).toBe(context);
			expect(notification.timestamp).not.toBeNull();
		});
		it("should create them with just data", function() {
			publication = PubSub.createPublication(topic, { data : data });
			notification = publication.notification;
			expect(notification.context).toBeNull();
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
			expect(notification.data).toBeNull();
			expect(notification.context).toBeNull();
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
			expect(subscription).not.toBeNull();
			expect(subscription.timestamp ).not.toBeNull();
			expect(_.isEqual(subscription.topics,topics)).toBe(true);
			expect(subscription.callback).toBe(callback);
			expect(subscription.priority).toBe(priority);
			expect(subscription.context).toBe(context);
		});
		it("should create them with topic, callback and priority", function() {
			var subscription = PubSub.createSubscription(topic, callback, priority);
			expect(subscription.context ).toBeNull();
		});
		it("should create them with topic and callback", function() {
			var subscription = PubSub.createSubscription(topic, callback);
			expect(subscription.context ).toBeNull();
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
			PubSub = TestUtil.resetPubSub();
		});
		
		it("should subscribe correctly to a topic with just a callback", function() {
			var count = 0;
			topic = "/subscribe/topic/callbackAlone";
			topics = PubSub.createTopics(topic);
			var callbacks = {
				first: {
					notify : function(notification) {
						var data   = notification.data;
						var topic  = notification.currentTopic;
						var origin = notification.publishTopic;
						$.debug("1st subscriber notified on: " + origin);
						expect(count).toBe(0);
						count++;
					}
				},
				second: {
					notify : function(notification) {
						var data   = notification.data;
						var topic  = notification.currentTopic;
						var origin = notification.publishTopic;
						$.debug("2nd subscriber notified on: " + origin);
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
			topic = "/subscribe/topic/callbackWithContext";
			topics = PubSub.createTopics(topic);
			var callbacks = {
					first: {
						notify : function(notification) {
							var data   = notification.data;
							var topic  = notification.currentTopic;
							var origin = notification.publishTopic;
							$.debug("1st subscriber notified on: " + origin);
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
			topic = "/subscribe/topic/callbackWithPriority";
			topics = PubSub.createTopics(topic);
			var callbacks = {
					first: {
						notify : function(notification) {
							var data   = notification.data;
							var topic  = notification.currentTopic;
							var origin = notification.publishTopic;
							$.debug("1st subscriber notified on: " + origin);
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
			topic = "/subscribe/topic/callbackWithContextAndPriority";
			topics = PubSub.createTopics(topic);
			var callbacks = {
					first: {
						notify : function(notification) {
							var data   = notification.data;
							var topic  = notification.currentTopic;
							var origin = notification.publishTopic;
							$.debug("1st subscriber notified on: " + origin);
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
							var data   = notification.data;
							var topic  = notification.currentTopic;
							var origin = notification.publishTopic;
							var msg = "1st subscriber called on: " + origin;
							expect(this).toBeOk(true,msg);
							expect(order).toBe(0);
							order++;
						}
					},
					second: {
						notify : function(notification) {
							var data   = notification.data;
							var topic  = notification.currentTopic;
							var origin = notification.publishTopic;
							var msg = "unsubscribed and should not have been notified on: " + origin;
							expect(this).toBeOk(false,msg);
							order++;
						}
					},
					third: {
						notify : function(notification) {
							var data   = notification.data;
							var topic  = notification.currentTopic;
							var origin = notification.publishTopic;
							var msg = "2nd subscriber called on: " + origin;
							expect(this).toBeOk(true,msg);
							strictEqual( order, 1, msg );
							order++;
						}
					},
					fourth: {
						notify : function(notification) {
							var data   = notification.data;
							var topic  = notification.currentTopic;
							var origin = notification.publishTopic;
							var msg = "unsubscribed and should not have been notified on: " + origin;
							expect(this).toBeOk(false,msg);
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
							var data   = notification.data;
							var topic  = notification.currentTopic;
							var origin = notification.publishTopic;
							var msg = "1st subscriber called on: " + origin;
							expect(this).toBeOk(true,msg);
							expect(order).toBe(0);
							order++;
						}
					},
					second:  {
						notify : function(notification) {
							var data   = notification.data;
							var topic  = notification.currentTopic;
							var origin = notification.publishTopic;
							var msg = "2nd subscriber called on: " + origin;
							expect(this).toBeOk(true,msg);
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

	describe("when setting priorities for subscriptions", function() {
		var PubSub, fixture, order, done;
		
		beforeEach(function() {
			order = 1;
			done = false;
			PubSub = TestUtil.resetPubSub();
			fixture = {
				topic : "/priority/notify",
				first: {
					notify : function(notification) {
						var data   = notification.data;
						var topic  = notification.currentTopic;
						var origin = notification.publishTopic;
						$.debug("the initial subscriber has priority default, it is notified 2nd on: " + origin);
						expect(order).toBe(2);
						order++;
					}
				},
				second : {
					notify : function(notification) {
						var data   = notification.data;
						var topic  = notification.currentTopic;
						var origin = notification.publishTopic;
						$.debug("this subscriber has priority 15; it is notified 4th on: " + origin);
						expect(order).toBe(4);
						order++;
					},
					priority : 15
				},
				third : {
					notify : function(notification) {
						var data   = notification.data;
						var topic  = notification.currentTopic;
						var origin = notification.publishTopic;
						$.debug("this subscriber has priority default; it is notified 3rd on: " +origin+ " after the initial subscriber as its timestamp is later");
						expect(order).toBe(3);
						order++;
					}
				},
				fourth : {
					notify : function(notification) {
						var data   = notification.data;
						var topic  = notification.currentTopic;
						var origin = notification.publishTopic;
						$.debug("this subscriber has highest priority since it is the lowest number on: " + origin);
						expect(order).toBe(1);
						order++;
					},
					priority : 1
				},
				fifth : {
					notify : function(notification) {
						var data   = notification.data;
						var topic  = notification.currentTopic;
						var origin = notification.publishTopic;
						$.debug("this subscriber is dead last because it has a highest priority number on " + origin);
						expect(order).toBe(5);
						order++;
					},
					priority : 100
				},
				publishOptions : {
					progress : function(notification) {
						var data   = notification.data;
						var topic  = notification.currentTopic;
						var origin = notification.publishTopic;
						
						var msg = "begin notifications w/o data on: " + origin;
						$.info(msg);
					},
					done: function(notification) {
						var data   = notification.data;
						var topic  = notification.currentTopic;
						var origin = notification.publishTopic;
						
						var msg = "successful notifications w/o data on: " + origin;
						$.info(msg);
					},
					fail: function(notification) {
						var data   = notification.data;
						var topic  = notification.currentTopic;
						var origin = notification.publishTopic;
						
						var msg = "failed notifications w/o data on: " + origin;
						$.error(msg);
					},
					always : function(notification) {
						var data   = notification.data;
						var topic  = notification.currentTopic;
						var origin = notification.publishTopic;
						
						var msg = "completed notifications w/o data on: " + origin;
						$.info(msg);
						done = true;
					}
				},
				setUp : function() {
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
				}
			};
			
		});
		
		it("should notify subscriptions in order during synchronous publication", function() {
			fixture.topic = "/priority/notify/sync";
			fixture.setUp();
			var publication = $.publishSync( fixture.topic, fixture.publishOptions );
			
			expect(fixture.first.notify).toHaveBeenCalled();
			expect(fixture.second.notify).toHaveBeenCalled();
			expect(fixture.third.notify).toHaveBeenCalled();
			expect(fixture.fourth.notify).toHaveBeenCalled();
			expect(fixture.fifth.notify).toHaveBeenCalled();
			
			expect(order).toBe(6);
		});
		it("should notify subscriptions in order during asynchronous publication", function() {
			var publication = null;
			runs(function() {
				fixture.topic = "/priority/notify/async";
				fixture.setUp();
				publication = $.publish( fixture.topic, fixture.publishOptions );
			});
			waitsFor(function() {
				return done !== false;
			}, "publication should be sent asynchronously", 10);
			
			runs(function() {
				expect(publication).not.toBeNull();
				expect(done).toBe(true);
				expect(order).toBeGreaterThan(1);
				expect(order).toBe(6);
				
				expect(fixture.first.notify).toHaveBeenCalled();
				expect(fixture.second.notify).toHaveBeenCalled();
				expect(fixture.third.notify).toHaveBeenCalled();
				expect(fixture.fourth.notify).toHaveBeenCalled();
				expect(fixture.fifth.notify).toHaveBeenCalled();
			});
		});
	});
	
	describe("when setting context for subscriptions", function() {
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
					notify : function(notification) {
						var data   = notification.data;
						var topic  = notification.currentTopic;
						var origin = notification.publishTopic;
						$.debug("default context is the window on: " + origin);
						expect(this).toBe(window);
					}
				},
				contextualSubscriber : {
					notify : function(notification) {
						var data   = notification.data;
						var topic  = notification.currentTopic;
						var origin = notification.publishTopic;
						$.debug("receives context from subscription on: " + origin);
						expect(this).not.toBeNull();
						expect( _.isEqual(this, fixture.contexts.subscriber) ).toBe(true);
					}
				},
				pubSubscriber : {
					notify : function(notification) {
						var data   = notification.data;
						var topic  = notification.currentTopic;
						var origin = notification.publishTopic;
						$.debug("receives context from publisher on: " + origin);
						expect(this).not.toBeNull();
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
			
			expect(fixture.defaultSubscriber.notify).toHaveBeenCalled();
			expect(fixture.contextualSubscriber.notify).toHaveBeenCalled();
		});
		it("should have context from publisher", function() {
			spyOn(fixture.pubSubscriber, 'notify').andCallThrough();
			fixture.pubSubscriber.subscription = $.subscribe(fixture.topic, fixture.pubSubscriber.notify);
			$.publishSync(fixture.topic, { context : fixture.contexts.publisher });
			
			expect(fixture.pubSubscriber.notify).toHaveBeenCalled();
		});
	});
	
	describe("when pushing data during publish", function() {
		var PubSub, fixture, order, done;
		
		beforeEach(function() {
			done = false;
			PubSub = TestUtil.resetPubSub();
			fixture = {
				topic : "/data/push",
				first : {
					notify : function(notification) {
						var data = notification.data;
						var topic  = notification.currentTopic;
						var origin = notification.publishTopic;
						expect( data.string ).toBe("hello")
						$.debug( "string passed to first.notify on: " + origin);
						expect( data.number).toBe(5);
						$.debug("number passed to first.notify on: " + origin);
						var expected = {
								foo: "bar",
								baz: "qux"
						};
						expect(_.isEqual(data.object, expected)).toBe(true);
						$.debug("object passed to first.notify on: " + origin );
						$.debug("first.notify mutating data on: " + origin)
						data.string = "goodbye";
						data.object.baz = "quux";
					}
				},
				second : {
					notify : function(notification) {
						var data = notification.data;
						var topic  = notification.currentTopic;
						var origin = notification.publishTopic;
						expect( data.string ).toBe("goodbye");
						$.debug( "string changed on reception of data by second.notify on: " + origin );
						expect( data.number ).toBe(5);
						$.debug("number changed on reception of data by second.notify on: " + origin );
						var expected = {
								foo: "bar",
								baz: "quux"
						};
						expect(_.isEqual(data.object, expected)).toBe(true);
						$.debug("object changed on reception of data by second.notify on: " + origin );
					}
				},
				publishOptions : {
					data : {
						string: "hello",
						number: 5,
						object: {
							foo: "bar",
							baz: "qux"
						}
					},
					progress : function(notification) {
						var data   = notification.data;
						var topic  = notification.currentTopic;
						var origin = notification.publishTopic;
						
						var msg = "begin notifications w/data on: " + origin;
						$.info(msg);
					},
					done: function(notification) {
						var data   = notification.data;
						var topic  = notification.currentTopic;
						var origin = notification.publishTopic;
						
						var msg = "successful notifications w/data on: " + origin;
						$.info(msg);
					},
					fail: function(notification) {
						var data   = notification.data;
						var topic  = notification.currentTopic;
						var origin = notification.publishTopic;
						
						var msg = "failed notifications w/data on: " + origin;
						$.error(msg);
					},
					always : function(notification) {
						var data   = notification.data;
						var topic  = notification.currentTopic;
						var origin = notification.publishTopic;
						
						var msg = "completed notifications w/data on: " + origin;
						$.info(msg);
						var expected = {
								foo: "bar",
								baz: "quux"
						};
						var obj = fixture.publishOptions.data.object;
						expect(_.isEqual(obj, expected)).toBe(true);
						$.info("object updated after notifications w/data on: " + origin);
						done = true;
					}
				},
				setUp : function() {
					spyOn(fixture.first,  'notify').andCallThrough();
					spyOn(fixture.second, 'notify').andCallThrough();
					
					spyOn(fixture.publishOptions, 'progress').andCallThrough();
					spyOn(fixture.publishOptions, 'done').andCallThrough();
					spyOn(fixture.publishOptions, 'fail').andCallThrough();
					spyOn(fixture.publishOptions, 'always').andCallThrough();
					
					$.subscribe(fixture.topic, fixture.first.notify);
					$.subscribe(fixture.topic, fixture.second.notify);
				}
			};
		});
		
		it("should publish data synchronously to 1st subscriber which mutates the data that then gets passed to 2nd subscriber", function() {
			fixture.topic = "/data/push/sync";
			fixture.setUp();
			$.publishSync(fixture.topic, fixture.publishOptions);
			
			expect(fixture.first.notify).toHaveBeenCalled();
			expect(fixture.second.notify).toHaveBeenCalled();
			
			expect(fixture.publishOptions.progress).toHaveBeenCalled();
			expect(fixture.publishOptions.done).toHaveBeenCalled();
			expect(fixture.publishOptions.fail).not.toHaveBeenCalled();
			expect(fixture.publishOptions.always).toHaveBeenCalled();
		});
		it("should publish data asynchronously to 1st subscriber which mutates the data that then gets passed to 2nd subscriber", function() {
			var publication = null;
			runs(function() {
				fixture.topic = "/data/push/async";
				fixture.setUp();
				publication = $.publish( fixture.topic, fixture.publishOptions );
			});
			waitsFor(function() {
				return done !== false;
			}, "publication should be sent asynchronously", 10);
			
			if (done) {
				runs(function() {
					expect(done).toBe(true);
					expect(publication).not.toBeNull();
					expect(fixture.first.notify).toHaveBeenCalled();
					expect(fixture.second.notify).toHaveBeenCalled();
					
					expect(fixture.publishOptions.progress).toHaveBeenCalled();
					expect(fixture.publishOptions.done).toHaveBeenCalled();
					expect(fixture.publishOptions.fail).not.toHaveBeenCalled();
					expect(fixture.publishOptions.always).toHaveBeenCalled();
				});
			}
		});
	});
	
	describe("when pushing data to 2 different topics", function() {
		var PubSub, fixture, order, done;
		
		beforeEach(function() {
			done = false;
			PubSub = TestUtil.resetPubSub();
			fixture = {
				topic : "/data/push",
				notify : function(notification) {
					var data   = notification.data;
					var topic  = notification.currentTopic;
					var origin = notification.publishTopic;
					
					var msg = "async notification of topic: " + topic + " from " + origin;
					$.debug(msg);
					// ok( true, msg);
					if (fixture.first.topic === origin ) {
						var expectedData = fixture.first.data;
						expect(data.object.id).toBe(expectedData.object.id);
						$.debug("data originating from " + origin + " should have same id");
						expect(data.number).toBe(expectedData.number);
						$.debug("data originating from " + origin + " should have same number");
						data.number++;
					} else if (fixture.second.topic === origin ) {
						var expectedData = fixture.second.data;
						expect(data.object.id).toBe(expectedData.object.id);
						$.debug("data originating from " + origin + " should have same id");
						expect(data.number).toBe(expectedData.number);
						$.debug("data originating from " + origin + " should have same number");
						data.number++;
					}
				},
				first : {
					topic : "/data/push/1",
					notify : function(notification) {
						var data   = notification.data;
						var topic  = notification.currentTopic;
						var origin = notification.publishTopic;
						
						var msg = "1st notification of topic: " + topic;
						$.debug(msg);
						expect(data.string).toBe("hello");
						$.debug("string passed during notification of " + topic );
						expect(data.number).toBe(fixture.first.data.number);
						$.debug("number passed during notification of " + topic );
						expect(_.isEqual(data.object,fixture.first.data.object)).toBe(true);
						$.debug("object passed during notification of " + topic );
						data.string = "goodbye";
						data.object.baz = "quux";
						
					},
					data : {
						string: "hello",
						number : 100,
						object : {
							id:  1,
							foo: "bar",
							baz: "qux"
						}
					}
				},
				second : {
					topic : "/data/push/2",
					notify : function(notification) {
						var data   = notification.data;
						var topic  = notification.currentTopic;
						var origin = notification.publishTopic;
						
						var msg = "2nd notification of topic: " + topic;
						$.debug(msg);
						expect(data.string).toBe("goodbye");
						$.debug("string changed during async notification of " + topic );
						expect(data.number).toBe(fixture.second.data.number);
						$.debug("number unchanged during async notification of " + topic );
						expect(_.isEqual(data.object,fixture.two.data.object)).toBe(true);
						$.debug("object passed during notification of  " + topic );
						data.string = "guten tag";
						data.object.baz = "quux 2";
						
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
				},
				publishOptions: {
					progress : function(notification) {
						var data   = notification.data;
						var topic  = notification.currentTopic;
						var origin = notification.publishTopic;
						
						var msg = "begin notifications with data of " + origin;
						$.info(msg);
					},
					done: function(notification) {
						var data   = notification.data;
						var topic  = notification.currentTopic;
						var origin = notification.publishTopic;

						var msg = "successful notifications with data of " + origin;
						$.info(msg);
					},
					fail: function(notification) {
						var data   = notification.data;
						var topic  = notification.currentTopic;
						var origin = notification.publishTopic;

						var msg = "failed notifications with data of " + origin;
						$.error(msg);
					},
					always : function(notification) {
						var data   = notification.data;
						var topic  = notification.currentTopic;
						var origin = notification.publishTopic;
						var msg = "completed notifications with data of " + origin;
						$.info(msg);
						var data = fixture.first.data;
						expect(data.object.baz).toBe("quux");
						$.info("object updated after notification for " + origin);
						expect(data.string).toBe("goodbye");
						$.info("string updated after notification for " + origin);
					}
				}
			};
			
			spyOn(fixture,  'notify').andCallThrough();
			spyOn(fixture.first,  'notify').andCallThrough();
			spyOn(fixture.second, 'notify').andCallThrough();
			
			fixture.subscription = $.subscribe(fixture.topic, fixture.notify);
			fixture.first.subscription = $.subscribe(fixture.first.topic, fixture.first.notify);
			fixture.second.subscription = $.subscribe(fixture.second.topic, fixture.second.notify);
		
			spyOn(fixture.publishOptions, 'progress').andCallThrough();
			spyOn(fixture.publishOptions, 'done').andCallThrough();
			spyOn(fixture.publishOptions, 'fail').andCallThrough();
			spyOn(fixture.publishOptions, 'always').andCallThrough();
		});
		xit("should publish data synchronously to each subscriber independently", function() {
			var topic = fixture.first.topic;
			
			var options = $.extend({}, fixture.first.data, fixture.publishOptions);
			fixture.first.publication = $.publishSync( topic, options);
			
			expect(fixture.first.notify).toHaveBeenCalled();
			expect(fixture.notify).toHaveBeenCalled();
			expect(fixture.second.notify).not.toHaveBeenCalled();
			
			expect(fixture.publishOptions.progress).toHaveBeenCalled();
			expect(fixture.publishOptions.done).toHaveBeenCalled();
			expect(fixture.publishOptions.fail).not.toHaveBeenCalled();
			expect(fixture.publishOptions.always).toHaveBeenCalled();
			
			topic = fixture.second.topic;
			options = $.extend({}, fixture.second.data, fixture.publishOptions);
			fixture.second.publication = $.publishSync( topic, options);
			
			expect(fixture.first.notify).not.toHaveBeenCalled();
			expect(fixture.notify).toHaveBeenCalled();
			expect(fixture.second.notify).toHaveBeenCalled();
			
			expect(fixture.publishOptions.progress).toHaveBeenCalled();
			expect(fixture.publishOptions.done).toHaveBeenCalled();
			expect(fixture.publishOptions.fail).not.toHaveBeenCalled();
			expect(fixture.publishOptions.always).toHaveBeenCalled();
		});
	});
	
	describe("when continuing notifications", function() {
		var PubSub, fixture, done;
		
		beforeEach(function() {
			PubSub = TestUtil.resetPubSub();
			done = false;
			fixture = {
				topic : "/continuation/sync",
				one : {
					notify : function(notification) {
						var data   = notification.data;
						var topic  = notification.currentTopic;
						var origin = notification.publishTopic;
						
						var msg = "1st subscriber called for publication to: " + origin;
						expect(this).toBeOk(true, msg);
					}
				},
				two : {
					notify : function(notification) {
						var data   = notification.data;
						var topic  = notification.currentTopic;
						var origin = notification.publishTopic;
						
						var msg = "2nd subscriber called for publication to: " + origin;
						expect(this).toBeOk(true, msg);
						return true;
					}
				},
				noSubscriberOptions : {
					progress : function(notification) {
						var origin = notification.publishTopic;
						var msg = "begin notifications w/o subscribers of " + origin;
						expect(this).toBeOk(msg, msg);
					},
					fail : function(notification) {
						var origin = notification.publishTopic;
						var msg = "failed notifications w/o subscribers of " + origin;
						expect(this).toBeOk(msg, msg);
					},
					done : function(notification) {
						var origin = notification.publishTopic;
						var msg = "done notifications w/o subscribers of " + origin;
						expect(this).toBeOk(false, msg);
					},
					always : function(notification) {
						var origin = notification.publishTopic;
						var msg = "completed notifications w/o subscribers of " + origin;
						expect(this).toBeOk(msg, msg);
						done = true;
					}
				},
				subscriberOptions : {
					progress : function(notification) {
						var origin = notification.publishTopic;
						var msg = "begin notification of: " + origin;
						expect(this).toBeOk(msg,msg);
					},
					done: function(notification) {
						var origin = notification.publishTopic;
						var msg = "successful notification of: " + origin;
						expect(this).toBeOk(msg,msg);
					},
					fail: function(notification) {
						var origin = notification.publishTopic;
						var msg = "failed notification of: " + origin;
						expect(this).toBeOk(false,msg);
					},
					always : function(notification) {
						var origin = notification.publishTopic;
						var msg = "completed notification of: " + origin;
						expect(this).toBeOk(msg,msg);
						done = true;
					}
				}
			};
		});
		
		it("should invoke fail callback for synchronous publish when there are no subscribers", function() {
			fixture.topic = "/continuation/sync/noSubscribers";
			spyOn(fixture.noSubscriberOptions, 'progress').andCallThrough();
			spyOn(fixture.noSubscriberOptions, 'fail').andCallThrough();
			spyOn(fixture.noSubscriberOptions, 'done').andCallThrough();
			spyOn(fixture.noSubscriberOptions, 'always').andCallThrough();
			
			var publication = $.publishSync( fixture.topic, fixture.noSubscriberOptions);
			expect(done).toBe(true);
			expect(publication).not.toBeNull();
			expect( publication.state() ).toBe("rejected");
			
			expect(fixture.noSubscriberOptions.progress).toHaveBeenCalled();
			expect(fixture.noSubscriberOptions.fail).toHaveBeenCalled();
			expect(fixture.noSubscriberOptions.done).not.toHaveBeenCalled();
			expect(fixture.noSubscriberOptions.always).toHaveBeenCalled();
		})
		
		it("should invoke fail callback for asynchronous publish when there are no subscribers", function() {
			var publication = null;
			runs(function() {
				fixture.topic = "/continuation/async/noSubscribers";
				spyOn(fixture.noSubscriberOptions, 'progress').andCallThrough();
				spyOn(fixture.noSubscriberOptions, 'fail').andCallThrough();
				spyOn(fixture.noSubscriberOptions, 'done').andCallThrough();
				spyOn(fixture.noSubscriberOptions, 'always').andCallThrough();
				publication = $.publish( fixture.topic, fixture.noSubscriberOptions );
			});
			
			waitsFor(function() {
				return done !== false;
			}, "publication should be sent asynchronously", 10);
			
			runs(function() {
				expect( done ).toBe(true);
				expect( publication ).not.toBeNull();
				expect( publication.state() ).toBe("rejected");
				
				expect(fixture.noSubscriberOptions.progress).toHaveBeenCalled();
				expect(fixture.noSubscriberOptions.fail).toHaveBeenCalled();
				expect(fixture.noSubscriberOptions.done).not.toHaveBeenCalled();
				expect(fixture.noSubscriberOptions.always).toHaveBeenCalled();
			});
		})
		
		it("should continue for synchronous publish when there are subscribers", function() {
			fixture.topic = "/continuation/sync/subscribers";
			spyOn(fixture.one, 'notify').andCallThrough();
			spyOn(fixture.two, 'notify').andCallThrough();
			
			fixture.one.subscription = $.subscribe(fixture.topic, fixture.one.notify);
			fixture.two.subscription = $.subscribe(fixture.topic, fixture.two.notify);
			
			spyOn(fixture.subscriberOptions, 'progress').andCallThrough();
			spyOn(fixture.subscriberOptions, 'done').andCallThrough();
			spyOn(fixture.subscriberOptions, 'fail').andCallThrough();
			spyOn(fixture.subscriberOptions, 'always').andCallThrough();
			
			var publication = $.publishSync( fixture.topic, fixture.subscriberOptions);
			
			expect(done).toBe(true);
			expect(publication).not.toBeNull();
			expect(publication.state()).toBe("resolved");
			
			expect(fixture.one.notify).toHaveBeenCalled();
			expect(fixture.two.notify).toHaveBeenCalled();
			
			expect(fixture.subscriberOptions.progress).toHaveBeenCalled();
			expect(fixture.subscriberOptions.done).toHaveBeenCalled();
			expect(fixture.subscriberOptions.fail).not.toHaveBeenCalled();
			expect(fixture.subscriberOptions.always).toHaveBeenCalled();
		});
		
		it("should continue for asynchronous publish when there are subscribers", function() {
			var publication = null;
			runs(function() {
				fixture.topic = "/continuation/async/subscribers";
				spyOn(fixture.one, 'notify').andCallThrough();
				spyOn(fixture.two, 'notify').andCallThrough();
				
				fixture.one.subscription = $.subscribe(fixture.topic, fixture.one.notify);
				fixture.two.subscription = $.subscribe(fixture.topic, fixture.two.notify);
				
				spyOn(fixture.subscriberOptions, 'progress').andCallThrough();
				spyOn(fixture.subscriberOptions, 'done').andCallThrough();
				spyOn(fixture.subscriberOptions, 'fail').andCallThrough();
				spyOn(fixture.subscriberOptions, 'always').andCallThrough();
				
				publication = $.publish( fixture.topic, fixture.subscriberOptions );
			});
			waitsFor(function() {
				return done !== false;
			}, "publication should be sent asynchronously", 10);
			
			runs(function() {
				expect(done).toBe(true);
				expect(publication).not.toBeNull();
				expect(publication.state()).toBe("resolved");
				
				expect(fixture.one.notify).toHaveBeenCalled();
				expect(fixture.two.notify).toHaveBeenCalled();
				
				expect(fixture.subscriberOptions.progress).toHaveBeenCalled();
				expect(fixture.subscriberOptions.done).toHaveBeenCalled();
				expect(fixture.subscriberOptions.fail).not.toHaveBeenCalled();
				expect(fixture.subscriberOptions.always).toHaveBeenCalled();
			});
		});
	});
	
	describe("when discontinuing notifications", function() {
		var PubSub, fixture, done;
		
		beforeEach(function() {
			done = false;
			PubSub = TestUtil.resetPubSub();
			fixture = {
				topic : "/discontinuation/sync",
				returnsFalse: {
					notify : function(notification) {
						var origin = notification.publishTopic;
						var msg = "continued after returning true for pub on: " + origin;
						expect(this).toBeOk( true, msg );
						return false;
					}
				},
				neverNotified: {
					notify : function(notification) {
						var origin = notification.publishTopic;
						var msg = "continued after returning false or throwing error for pub on: " + origin;
						expect(this).toBeOk( false, msg );
						return false;
					}
				},
				throwsException: {
					notify : function(notification) {
						var origin = notification.publishTopic;
						var msg = "continued after returning true for pub on: " + origin;
						expect(this).toBeOk( true, msg );
						throw new Error("stop publication");
					}
				},
				rejectNotification : {
					notify : function(notification) {
						var origin = notification.publishTopic;
						var msg = "continued after returning true for pub on: " + origin;
						expect(this).toBeOk( true, msg );
						notification.reject();
					}
				},
				publishOptions : {
					progress : function(notification) {
						var origin = notification.publishTopic;
						var msg = "begun notifications on: " + origin;
						expect(this).toBeOk(msg,msg);
					},
					done: function(notification) {
						var origin = notification.publishTopic;
						var msg = "successful notifications on: " + origin;
						expect(this).toBeOk(false,msg);
					},
					fail: function(notification) {
						var origin = notification.publishTopic;
						var msg = "failed notifications on: " + origin;
						expect(this).toBeOk(msg,msg);
					},
					always : function(notification) {
						done = true;
						var origin = notification.publishTopic;
						var msg = "completed notifications on: " + origin;
						expect(this).toBeOk(msg,msg);
					}
				}
			}
		});
		
		it("should discontinue sync publication when 1 subscriber returns false", function() {
			var _self = fixture;
			
			_self.topic = "/discontinuation/sync/returnFalse";
			spyOn(_self.returnsFalse, 'notify').andCallThrough();
			spyOn(_self.neverNotified, 'notify').andCallThrough();
			
			spyOn(_self.publishOptions, 'progress').andCallThrough();
			spyOn(_self.publishOptions, 'done').andCallThrough();
			spyOn(_self.publishOptions, 'fail').andCallThrough();
			spyOn(_self.publishOptions, 'always').andCallThrough();
			
			
			$.subscribe( _self.topic, _self.returnsFalse.notify);
			$.subscribe( _self.topic, _self.neverNotified.notify);
			var publication = $.publishSync( _self.topic, _self.publishOptions);
			
			expect(publication).not.toBeNull();
			expect(publication.state()).toBe("rejected");
			
			expect(_self.returnsFalse.notify).toHaveBeenCalled();
			expect(_self.neverNotified.notify).not.toHaveBeenCalled();
			
			expect(_self.publishOptions.progress).toHaveBeenCalled();
			expect(_self.publishOptions.done).not.toHaveBeenCalled();
			expect(_self.publishOptions.fail).toHaveBeenCalled();
			expect(_self.publishOptions.always).toHaveBeenCalled();
		});
		
		it("should discontinue sync publication when 1 subscriber throws an exception", function() {
			var _self = fixture;
			_self.topic = "/discontinuation/sync/throwsException";
			spyOn(_self.throwsException, 'notify').andCallThrough();
			spyOn(_self.neverNotified, 'notify').andCallThrough();
			
			spyOn(_self.publishOptions, 'progress').andCallThrough();
			spyOn(_self.publishOptions, 'done').andCallThrough();
			spyOn(_self.publishOptions, 'fail').andCallThrough();
			spyOn(_self.publishOptions, 'always').andCallThrough();
			
			$.subscribe( _self.topic, _self.throwsException.notify);
			$.subscribe( _self.topic, _self.neverNotified.notify);
			var publication = $.publishSync( _self.topic, _self.publishOptions);
			
			expect(publication).not.toBeNull();
			expect(publication.state()).toBe("rejected");
			
			expect(_self.throwsException.notify).toHaveBeenCalled();
			expect(_self.neverNotified.notify).not.toHaveBeenCalled();
			
			expect(_self.publishOptions.progress).toHaveBeenCalled();
			expect(_self.publishOptions.done).not.toHaveBeenCalled();
			expect(_self.publishOptions.fail).toHaveBeenCalled();
			expect(_self.publishOptions.always).toHaveBeenCalled();
		});
		
		it("should discontinue sync publication when 1 subscriber rejects the notification", function() {
			var _self = fixture;
			_self.topic = "/discontinuation/sync/rejectNotification";
			spyOn(_self.rejectNotification, 'notify').andCallThrough();
			spyOn(_self.neverNotified, 'notify').andCallThrough();
			
			spyOn(_self.publishOptions, 'progress').andCallThrough();
			spyOn(_self.publishOptions, 'done').andCallThrough();
			spyOn(_self.publishOptions, 'fail').andCallThrough();
			spyOn(_self.publishOptions, 'always').andCallThrough();
			
			$.subscribe( _self.topic, _self.rejectNotification.notify);
			$.subscribe( _self.topic, _self.neverNotified.notify);
			var publication = $.publishSync( _self.topic, _self.publishOptions);
			
			expect(publication).not.toBeNull();
			expect(publication.state()).toBe("rejected");
			
			expect(_self.rejectNotification.notify).toHaveBeenCalled();
			expect(_self.neverNotified.notify).not.toHaveBeenCalled();
			
			expect(_self.publishOptions.progress).toHaveBeenCalled();
			expect(_self.publishOptions.done).not.toHaveBeenCalled();
			expect(_self.publishOptions.fail).toHaveBeenCalled();
			expect(_self.publishOptions.always).toHaveBeenCalled();
		});
		it("should discontinue async publication when 1 subscriber returns false", function() {
			var _self = fixture;
			var publication = null;
			
			runs(function() {
				_self.topic = "/discontinuation/async/returnFalse";
				
				spyOn(_self.returnsFalse, 'notify').andCallThrough();
				spyOn(_self.neverNotified, 'notify').andCallThrough();
				
				spyOn(_self.publishOptions, 'progress').andCallThrough();
				spyOn(_self.publishOptions, 'done').andCallThrough();
				spyOn(_self.publishOptions, 'fail').andCallThrough();
				spyOn(_self.publishOptions, 'always').andCallThrough();
				
				$.subscribe( _self.topic, _self.returnsFalse.notify);
				$.subscribe( _self.topic, _self.neverNotified.notify);
				
				publication = $.publish( _self.topic, _self.publishOptions);
			});
			
			waitsFor(function() {
				return done !== false;
			}, "async publication should have finished",10);

			runs(function() {
				expect(done).toBe(true);
				expect(publication).not.toBeNull();
				expect(publication.state()).toBe("rejected");
				
				expect(_self.returnsFalse.notify).toHaveBeenCalled();
				expect(_self.neverNotified.notify).not.toHaveBeenCalled();
				
				expect(_self.publishOptions.progress).toHaveBeenCalled();
				expect(_self.publishOptions.done).not.toHaveBeenCalled();
				expect(_self.publishOptions.fail).toHaveBeenCalled();
				expect(_self.publishOptions.always).toHaveBeenCalled();
			});
		});

		it("should discontinue async publication when 1 subscriber throws an exception", function() {
			var _self = fixture;
			var publication = null;
			
			runs(function() {
				_self.topic = "/discontinuation/async/throwsException";
				spyOn(_self.throwsException, 'notify').andCallThrough();
				spyOn(_self.neverNotified, 'notify').andCallThrough();
				
				spyOn(_self.publishOptions, 'progress').andCallThrough();
				spyOn(_self.publishOptions, 'done').andCallThrough();
				spyOn(_self.publishOptions, 'fail').andCallThrough();
				spyOn(_self.publishOptions, 'always').andCallThrough();
				
				$.subscribe( _self.topic, _self.throwsException.notify);
				$.subscribe( _self.topic, _self.neverNotified.notify);
				publication = $.publish( _self.topic, _self.publishOptions);
			});
			
			waitsFor(function() {
				return done !== false;
			}, "async publication should have finished", 10);
			
			runs(function() {
				expect(publication).not.toBeNull();
				expect(publication.state()).toBe("rejected");
				
				expect(_self.throwsException.notify).toHaveBeenCalled();
				expect(_self.neverNotified.notify).not.toHaveBeenCalled();
				
				expect(_self.publishOptions.progress).toHaveBeenCalled();
				expect(_self.publishOptions.done).not.toHaveBeenCalled();
				expect(_self.publishOptions.fail).toHaveBeenCalled();
				expect(_self.publishOptions.always).toHaveBeenCalled();
			});
		});
		
		it("should discontinue async publication when 1 subscriber rejects the notification", function() {
			var _self = fixture;
			var publication = null;
			runs(function() {
				_self.topic = "/discontinuation/async/rejectNotification";
				spyOn(_self.rejectNotification, 'notify').andCallThrough();
				spyOn(_self.neverNotified, 'notify').andCallThrough();

				spyOn(_self.publishOptions, 'progress').andCallThrough();
				spyOn(_self.publishOptions, 'done').andCallThrough();
				spyOn(_self.publishOptions, 'fail').andCallThrough();
				spyOn(_self.publishOptions, 'always').andCallThrough();

				$.subscribe( _self.topic, _self.rejectNotification.notify);
				$.subscribe( _self.topic, _self.neverNotified.notify);
				publication = $.publish( _self.topic, _self.publishOptions);
			});
			waitsFor(function() {
				return done !== false;
			}, "async publication should have finished",10);
			runs(function(){
				expect(publication).not.toBeNull();
				expect(publication.state()).toBe("rejected");

				expect(_self.rejectNotification.notify).toHaveBeenCalled();
				expect(_self.neverNotified.notify).not.toHaveBeenCalled();

				expect(_self.publishOptions.progress).toHaveBeenCalled();
				expect(_self.publishOptions.done).not.toHaveBeenCalled();
				expect(_self.publishOptions.fail).toHaveBeenCalled();
				expect(_self.publishOptions.always).toHaveBeenCalled();
			});
		});
	});
	
	describe("when notifications bubble up a hierarchical topic", function() {
		var PubSub, fixture, done, count;
		
		beforeEach(function() {
			done = false;
			count = 1;
			PubSub = TestUtil.resetPubSub();
			
			var neverNotified = function(notification) {
				var data   = notification.data;
				var topic  = notification.currentTopic;
				var origin = notification.publishTopic;
				var msg = "this callback should never be notified on: " + topic + " from: " + origin;
				expect(this).toBeOk(false,msg);
			};
			var exceptionThrown = function(notification) {
				var data   = notification.data;
				var topic  = notification.currentTopic;
				var origin = notification.publishTopic;
				var msg = "exceptionThrown was notified @ " + topic + " from: " + origin + " where count = " + count;
				expect(this).toBeOk(true, msg)
				throw new Error("burp!");
			};
			var notificationReject = function(notification) {
				var data   = notification.data;
				var topic  = notification.currentTopic;
				var origin = notification.publishTopic;
				var msg = "notificationReject was notified @ " + topic + " from: " + origin + " where count = " + count;
				expect(this).toBeOk(true, msg)
				notification.reject();
			};
			var returnsFalse = function(notification) {
				var data   = notification.data;
				var topic  = notification.currentTopic;
				var origin = notification.publishTopic;
				var msg = "returnsFalse was notified @ " + topic + " from: " + origin + " where count = " + count;
				expect(this).toBeOk(true, msg)
				return false;
			};
			
			fixture = {
				topic : "/starwars",
				data : {
					id : 1,
					name : "Star Wars hierarchy",
					isSync : true
				},
				notify : function(notification) {
					var _self = this;
					var data   = notification.data;
					var topic  = notification.currentTopic;
					var origin = notification.publishTopic;
					
					var msg = "notification of subscriber @ " + topic;
					expect(this).toBeOk(true,msg);
					expect(count).toBe(3);
					expect(_.isEqual(data, _self.data)).toBe(true);
					$.debug("same data by reference passed to "  + topic);
					count++;
				},
				padma : {
					topic : "/starwars/padma",
					notify : function(notification) {
						var _self = this;
						var data   = notification.data;
						var topic  = notification.currentTopic;
						var origin = notification.publishTopic;
						
						var msg = "notification of subscriber @ " + topic;
						expect(this).toBeOk(true,msg);
						expect(count).toBe(2);
						expect(data.name).toBe("empire strikes back");
						$.debug("data.name should have mutated when received by: " + topic);
						count++;
					},
					luke : {
						topic : "/starwars/padma/luke",
						notify : neverNotified
					},
					leia : {
						topic : "/starwars/padma/leia",
						notify : function(notification) {
							var _self = this;
							var data   = notification.data;
							var topic  = notification.currentTopic;
							var origin = notification.publishTopic;
							var msg = "notification of subscriber @ " + topic;
							expect(this).toBeOk(true,msg);
							expect( _.isEqual(data, _self.data) ).toBe(true);
							$.debug(topic + " should receive data, mutated data.name and count = " + count);
							data.name = "empire strikes back";
							expect(count).toBe(1);
							count++;
						}
					}
				},
				anakin : {
					topic : "/starwars/anakin",
					notify : neverNotified
				},
				publishOptions : {
					progress : function(notification) {
						var origin = notification.publishTopic;
						var type = notification.data.isSync ? "synchronous" : "asynchronous";
						var msg = "progress: " + type + " notifications on: " + origin;
						expect(this).toBeOk(msg,msg);
					},
					done: function(notification) {
						var origin = notification.publishTopic;
						var type = notification.data.isSync ? "synchronous" : "asynchronous";
						var msg = "done: " + type + " notifications on: " + origin;
						expect(this).toBeOk(msg,msg);
					},
					fail: function(notification) {
						var origin = notification.publishTopic;
						var type = notification.data.isSync ? "synchronous" : "asynchronous";
						var msg = "fail: " + type + " notifications on: " + origin;
						expect(this).toBeOk(msg,msg);
					},
					always : function(notification) {
						var origin = notification.publishTopic;
						var type = notification.data.isSync ? "synchronous" : "asynchronous";
						var msg = "always: " + type + " notifications on: " + origin;
						expect(this).toBeOk(msg,msg);
						done = true;
					}
				},
				setUp : function() {
					var _self = this;
					
					this.neverNotified = neverNotified;
					this.exceptionThrown = exceptionThrown;
					this.notificationReject = notificationReject;
					this.returnsFalse = returnsFalse;
				},
				spyOn : function() {
					var _self = this;
					
					spyOn(_self, 'notify').andCallThrough();
					spyOn(_self.padma,  'notify').andCallThrough();
					spyOn(_self.anakin, 'notify').andCallThrough();
					
					spyOn(_self.padma.luke, 'notify').andCallThrough();
					spyOn(_self.padma.leia, 'notify').andCallThrough();
					
					spyOn(_self.publishOptions, 'progress').andCallThrough();
					spyOn(_self.publishOptions, 'done').andCallThrough();
					spyOn(_self.publishOptions, 'fail').andCallThrough();
					spyOn(_self.publishOptions, 'always').andCallThrough();
				},
				subscribeAll : function() {
					var _self = this;
					
					_self.padma.leia.subscription = $.subscribe(_self.padma.leia.topic, _self, _self.padma.leia.notify);
					_self.padma.subscription = $.subscribe(_self.padma.topic, _self, _self.padma.notify);
					_self.subscription = $.subscribe(_self.topic, _self, _self.notify);
					
					_self.anakin.subscription = $.subscribe(_self.anakin.topic, _self, _self.anakin.notify);
					_self.padma.luke.subscription = $.subscribe(_self.padma.luke.topic, _self, _self.padma.luke.notify);
					
					expect(PubSub.getSubscriptions(_self.topic).length).toBe(1);
					expect(PubSub.getSubscriptions(_self.padma.topic).length).toBe(1);
					expect(PubSub.getSubscriptions(_self.padma.leia.topic).length).toBe(1);
					
					expect(PubSub.getSubscriptions(_self.anakin.topic).length).toBe(1);
					expect(PubSub.getSubscriptions(_self.padma.luke.topic).length).toBe(1);
					
					expect(_.keys(PubSub.subscriptions).length).toBe(5);
				},
				expectSuccess : function(publication) {
					var _self = this;
					expect(publication).not.toBeNull();
					expect(done).toBe(true);

					expect(_self.notify).toHaveBeenCalled();
					expect(_self.anakin.notify).not.toHaveBeenCalled();
					expect(_self.padma.notify).toHaveBeenCalled();
					expect(_self.padma.leia.notify).toHaveBeenCalled();
					expect(_self.padma.luke.notify).not.toHaveBeenCalled();

					expect(_self.publishOptions.progress).toHaveBeenCalled();
					expect(_self.publishOptions.done).toHaveBeenCalled();
					expect(_self.publishOptions.fail).not.toHaveBeenCalled();
					expect(_self.publishOptions.always).toHaveBeenCalled();

					expect(count).toBe(4);
				},
				expectFail : function(publication) {
					var _self = this;
					
					expect(publication).not.toBeNull();
					expect(done).toBe(true);

					expect(_self.notify).not.toHaveBeenCalled();
					expect(_self.anakin.notify).not.toHaveBeenCalled();
					expect(_self.padma.notify).toHaveBeenCalled();
					expect(_self.padma.leia.notify).toHaveBeenCalled();
					expect(_self.padma.luke.notify).not.toHaveBeenCalled();

					expect(_self.publishOptions.progress).toHaveBeenCalled();
					expect(_self.publishOptions.done).not.toHaveBeenCalled();
					expect(_self.publishOptions.fail).toHaveBeenCalled();
					expect(_self.publishOptions.always).toHaveBeenCalled();

					expect(count).toBe(2);
				}
			}
		});
		
		it("should notify each subscriber on synchronous publish to a hierarchical topic from the leaf up to the root", function() {
			var _self = fixture;
			_self.setUp();
			_self.spyOn();
			_self.subscribeAll();
			
			var options = $.extend({data : _self.data}, _self.publishOptions);
			var publication = $.publishSync(_self.padma.leia.topic, options);
			_self.expectSuccess(publication);
		});
		it("should notify each subscriber on asynchronous publish to a hierarchical topic from the leaf up to the root", function() {
			var _self = fixture;
			var publication = null;
			runs(function() {
				_self.setUp();
				_self.spyOn();
				_self.subscribeAll();
				var options = $.extend({data : _self.data}, _self.publishOptions);
				publication = $.publish(_self.padma.leia.topic, options);
			});
			waitsFor(function() {
				return done !== false;
			}, "publication should be sent asynchronously", 10);
			runs(function() {
				_self.expectSuccess(publication);
			});
		});
		it("should notify only some subscribers on synchronous publish to a hierarchical topic b/c mid-level subscriber returns false", function() {
			var _self = fixture;
			
			_self.setUp();
			_self.notify = _self.neverNotified;
			_self.padma.notify = _self.returnsFalse;
			_self.spyOn();
			_self.subscribeAll();
			
			var options = $.extend({data : _self.data}, _self.publishOptions);
			var publication = $.publishSync(_self.padma.leia.topic, options);
			
			_self.expectFail(publication);
		});
		it("should notify only some subscribers on asynchronous publish to a hierarchical topic b/c mid-level subscriber returns false", function() {
			var _self = fixture;
			var publication = null;
			runs(function() {
				_self.setUp();
				_self.notify = _self.neverNotified;
				_self.padma.notify = _self.returnsFalse;
				_self.spyOn();
				_self.subscribeAll();

				var options = $.extend({data : _self.data}, _self.publishOptions);
				publication = $.publish(_self.padma.leia.topic, options);
			});
			waitsFor(function() {
				return done !== false;
			}, "publication should be sent asynchronously", 10);
			runs(function() {
				_self.expectFail(publication);
			});
		});
		it("should notify only some subscribers on synchronous publish to a hierarchical topic b/c mid-level subscriber throws an exception", function() {
			var _self = fixture;
			
			_self.setUp();
			_self.notify = _self.neverNotified;
			_self.padma.notify = _self.exceptionThrown;
			_self.spyOn();
			_self.subscribeAll();
			
			var options = $.extend({data : _self.data}, _self.publishOptions);
			var publication = $.publishSync(_self.padma.leia.topic, options);
			
			_self.expectFail(publication);
		});
		it("should notify only some subscribers on asynchronous publish to a hierarchical topic b/c mid-level subscriber throws an exception", function() {
			var _self = fixture;
			var publication = null;
			runs(function() {
				_self.setUp();
				_self.notify = _self.neverNotified;
				_self.padma.notify = _self.exceptionThrown;
				_self.spyOn();
				_self.subscribeAll();

				var options = $.extend({data : _self.data}, _self.publishOptions);
				publication = $.publishSync(_self.padma.leia.topic, options);
			});
			waitsFor(function() {
				return done !== false;
			}, "publication should be sent asynchronously", 10);
			runs(function() {
				_self.expectFail(publication);
			});
		});
		it("should notify only some subscribers on synchronous publish to a hierarchical topic b/c mid-level subscriber rejects a notification", function() {
			var _self = fixture;
			
			_self.setUp();
			_self.notify = _self.neverNotified;
			_self.padma.notify = _self.notificationReject;
			_self.spyOn();
			_self.subscribeAll();
			
			var options = $.extend({data : _self.data}, _self.publishOptions);
			var publication = $.publishSync(_self.padma.leia.topic, options);
			
			_self.expectFail(publication);
		});
		it("should notify only some subscribers on asynchronous publish to a hierarchical topic b/c mid-level subscriber rejects a notification", function() {
			var _self = fixture;
			var publication = null;
			
			runs(function() {
				_self.setUp();
				_self.notify = _self.neverNotified;
				_self.padma.notify = _self.notificationReject;
				_self.spyOn();
				_self.subscribeAll();
				var options = $.extend({data : _self.data}, _self.publishOptions);
				publication = $.publishSync(_self.padma.leia.topic, options);
			});
			waitsFor(function() {
				return done !== false;
			}, "publication should be sent asynchronously", 10);
			runs(function() {
				_self.expectFail(publication);
			});
		});
	});
	
});