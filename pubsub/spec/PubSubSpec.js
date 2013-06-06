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
		},
		getType : function(notification) {
			var msg = (notification.isSynchronous() ? "synchronous" : "asynchronous");
			msg = msg + " notification @ " + notification.currentTopic() + " from " + notification.publishTopic();
			return msg;
		}
	};

	describe("when validating topic names", function() {
		var PubSub;
		var topic = "/app/module/class";
		
		beforeEach(function() {
			PubSub = TestUtil.resetPubSub();
		});
		
		it("should invalidate topic names that are not strings", function() {
			expect(PubSub.validateTopicName({})).toBe(false);
		});
		it("should invalidate topic names that are undefined", function() {
			expect(PubSub.validateTopicName(undefined)).toBe(false);
		});
		it("should invalidate topic names that are null", function() {
			expect(PubSub.validateTopicName(null)).toBe(false);
		});
		it("should invalidate topic names with spaces", function() {
			expect(PubSub.validateTopicName("bad topic name")).toBe(false);
		});
		it("should validate topic names a la Unix directories", function() {
			expect(PubSub.validateTopicName(topic)).toBe(true);
		});
		it("should invalidate topic names with a beginning slash", function() {
			expect(PubSub.validateTopicName("appName")).toBe(false);
		});
		it("should validate topic names with a trailing slash", function() {
			expect(PubSub.validateTopicName(topic + "/")).toBe(false);
		});
		it("should invalidate topic names with double slashes", function() {
			var result = PubSub.validateTopicName("/" + topic);
			expect(result).not.toBe(true);
			var result = PubSub.validateTopicName("/app//module/class");
			expect(result).not.toBe(true);
		});
		it("should invalidate topic names that do not have all alphanumeric characters", function() {
			expect(PubSub.validateTopicName("/app.name")).toBe(false);
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
	
	describe("when creating Publications", function() {
		var PubSub, fixture;
		
		beforeEach(function() {
			PubSub = TestUtil.resetPubSub();
			fixture = {
				topic : "/app/module/class",
				data : { id : 1, date: new Date(), name: "name" },
				context : {}
			}
		});
		
		it("should create them with data and context", function() {
			var publication = PubSub.createPublication(fixture.topic ,{ data: fixture.data, context: fixture.context });
			var notification = publication.notification;

			expect(publication).not.toBeNull();
			expect(notification).not.toBeNull();
			
			expect(publication.id).not.toBeNull();
			expect(publication.id).toBe(notification.id());
			expect(publication.timestamp).not.toBeNull();
			expect(publication.timestamp).toBe(notification.timestamp());
			expect(publication.state() === "pending").toBe(true);
			
			expect(_.isFunction(publication.progress)).toBe(true);
			expect(_.isFunction(publication.done)).toBe(true);
			expect(_.isFunction(publication.fail)).toBe(true);
			expect(_.isFunction(publication.always)).toBe(true);
			expect(_.isFunction(publication.resolve)).toBe(true);
			
			expect(publication.data).toBe(notification.data());
			expect(publication.context).toBe(notification.context());
			expect(publication.publishTopic).toBe(notification.publishTopic());
			expect(publication.currentTopic).toBe(notification.currentTopic());
			
			expect(notification.id()).not.toBeNull();
			expect(notification.timestamp()).not.toBeNull();
			
			expect(notification.state() === "pending").toBe(true);
			expect(notification.isSynchronous()).toBe(false);
			expect(notification.isPropagation()).toBe(true);
			expect(_.isFunction(notification.reject)).toBe(true);
			
			expect(notification.data()).toBe(fixture.data);
			expect(notification.context()).toBe(fixture.context);
			expect(notification.publishTopic()).toBe(fixture.topic);
			expect(notification.currentTopic()).toBe(fixture.topic);
		});
		it("should create them with just data", function() {
			var publication = PubSub.createPublication(fixture.topic, { data : fixture.data });
			var notification = publication.notification;

			expect(publication).not.toBeNull();
			expect(notification).not.toBeNull();
			
			expect(notification.data()).toBe(fixture.data);
			expect(notification.context()).toBeNull();
			expect(publication.data).toBe(notification.data());
			expect(publication.context).toBeNull();
		});
		it("should not create them with w/o options", function() {
			try {
				var publication = PubSub.createPublication(fixture.topic)
			} catch( err ) {
				expect(err.message).toBe("You must provide options to create a Notification.");
			}
		});
		it("should create them with empty options", function() {
			var publication = PubSub.createPublication(fixture.topic, {});
			var notification = publication.notification;
			expect(publication).not.toBeNull();
			expect(notification).not.toBeNull();
			
			expect(notification.data()).toBeNull();
			expect(notification.context()).toBeNull();
			expect(publication.data).toBeNull();
			expect(publication.context).toBeNull();
		});
	});
	
	describe("when creating subscriptions", function() {
		var PubSub, subscription, topics;
		var topic = "/app/module/class";
		var data = { id : 1, date: new Date(), name: "name" };
		var context = {};
		

		var callback = function(notification) {
			var msg = "callback was notified @ " + notification.currentTopic() + " from: " + notification.publishTopic();
			$.debug(msg);
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
			var msg = "callback was notified @ " + notification.currentTopic() + " from: " + notification.publishTopic();
			$.debug(msg);
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
		it("should throw an error on subscribing to a topic with trailing slash", function() {
			try {
				$.subscribe( "/fake/topic/", callback );
			} catch( err ) {
				expect(err.message).toBe("You must provide a valid topic name to create a Subscription.");
			}
		});
		it("should throw an error on subscribing to a topic without a beginning slash", function() {
			try {
				$.subscribe( "fake/topic", callback );
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
						var msg = "callbacks.first.notify: " + TestUtil.getType(notification);
						expect(this).toBeOk(true,msg)
						expect(count).toBe(0);
						count++;
					}
				},
				second: {
					notify : function(notification) {
						var msg = "callbacks.second.notify: " + TestUtil.getType(notification);
						expect(this).toBeOk(true,msg)
						expect(count).toBe(1);
						count++;
					}
				}
			};
			spyOn(callbacks.first,  'notify').andCallThrough();
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
		
		it("should subscribe hierarchically to a topic with just callbacks", function() {
			var count = 1;
			var callbacks = {
					topic : "/subscribe",
					notify : function(notification) {
						var msg = "6th subscriber: " + TestUtil.getType(notification);
						expect(this).toBeOk(true, msg);
						expect(count).toBe(6);
						count++;
					},
					parent: {
						topic : "/subscribe/parent",
						notifyMother : function(notification) {
							var msg = "4th subscriber: " + TestUtil.getType(notification);
							expect(this).toBeOk(true, msg);
							expect(count).toBe(4);
							count++;
						},
						notifyFather : function(notification) {
							var msg = "5th subscriber: " + TestUtil.getType(notification);
							expect(this).toBeOk(true, msg);
							expect(count).toBe(5);
							count++;
						},
						leaf : {
							topic : "/subscribe/parent/leaf",
							notifyFirst : function(notification) {
								var msg = "1st subscriber: " + TestUtil.getType(notification);
								expect(this).toBeOk(true, msg);
								expect(count).toBe(1);
								count++;
							},
							notifySecond : function(notification) {
								var msg = "2nd subscriber: " + TestUtil.getType(notification);
								expect(this).toBeOk(true, msg);
								expect(count).toBe(2);
								count++;
							},
							notifyThird : function(notification) {
								var msg = "3rd subscriber: " + TestUtil.getType(notification);
								expect(this).toBeOk(true, msg);
								expect(count).toBe(3);
								count++;
							}
						}
					}
			};
			spyOn(callbacks, 'notify').andCallThrough();
			
			spyOn(callbacks.parent, 'notifyFather').andCallThrough();
			spyOn(callbacks.parent, 'notifyMother').andCallThrough();
			
			spyOn(callbacks.parent.leaf, 'notifyThird').andCallThrough();
			spyOn(callbacks.parent.leaf, 'notifySecond').andCallThrough();
			spyOn(callbacks.parent.leaf, 'notifyFirst').andCallThrough();
			
			callbacks.parent.leaf.first  = $.subscribe(callbacks.parent.leaf.topic, callbacks.parent.leaf.notifyFirst);
			callbacks.parent.leaf.second = $.subscribe(callbacks.parent.leaf.topic, callbacks.parent.leaf.notifySecond);
			callbacks.parent.leaf.third  = $.subscribe(callbacks.parent.leaf.topic, callbacks.parent.leaf.notifyThird);
			expect(PubSub.getSubscriptions(callbacks.parent.leaf.topic, true).length).toBe(3);
			
			callbacks.parent.leaf.mother  = $.subscribe(callbacks.parent.topic, callbacks.parent.notifyMother);
			callbacks.parent.leaf.father  = $.subscribe(callbacks.parent.topic, callbacks.parent.notifyFather);
			expect(PubSub.getSubscriptions(callbacks.parent.leaf.topic, true).length).toBe(5);
			
			callbacks.parent.root  = $.subscribe(callbacks.topic, callbacks.notify);
			expect(PubSub.getSubscriptions(callbacks.parent.leaf.topic, true).length).toBe(6);
			
			expect(PubSub.getSubscriptions(callbacks.parent.leaf.topic).length).toBe(3);
			expect(PubSub.getSubscriptions(callbacks.parent.topic).length).toBe(2);
			expect(PubSub.getSubscriptions(callbacks.topic).length).toBe(1);
			
			$.publishSync(callbacks.parent.leaf.topic);
			expect(count).toBe(7);
			
			expect(callbacks.parent.leaf.notifyFirst).toHaveBeenCalled();
			expect(callbacks.parent.leaf.notifySecond).toHaveBeenCalled();
			expect(callbacks.parent.leaf.notifyThird).toHaveBeenCalled();
			
			expect(callbacks.parent.notifyMother).toHaveBeenCalled();
			expect(callbacks.parent.notifyFather).toHaveBeenCalled();
			
			expect(callbacks.notify).toHaveBeenCalled();
		});
		
		it("should subscribe correctly to a topic with a context", function() {
			topic = "/subscribe/topic/callbackWithContext";
			topics = PubSub.createTopics(topic);
			var callbacks = {
					first: {
						notify : function(notification) {
							var msg = "1st subscriber: " + TestUtil.getType(notification);
							expect(this).toBeOk(true,msg);
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
							var msg = "1st subscriber: " + TestUtil.getType(notification);
							expect(this).toBeOk(true,msg);
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
							var msg = "1st subscriber: " + TestUtil.getType(notification);
							expect(this).toBeOk(true,msg);
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
							var msg = "fixture.first.notify: " + TestUtil.getType(notification);
							expect(this).toBeOk(true,msg);
							expect(order).toBe(0);
							order++;
						}
					},
					second: {
						notify : function(notification) {
							var msg = "fixture.second.notify should never be notified: " + TestUtil.getType(notification);
							expect(this).toBeOk(false,msg);
							order++;
						}
					},
					third: {
						notify : function(notification) {
							var msg = "fixture.third.notify: " + TestUtil.getType(notification);
							expect(this).toBeOk(true,msg);
							strictEqual( order, 1, msg );
							order++;
						}
					},
					fourth: {
						notify : function(notification) {
							var msg = "fixture.fourth.notify should never be notified: " + TestUtil.getType(notification);
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
			subscribers = $.unsubscribe( fixture.topic, fixture.second.subscription.id );
			subscribers = $.unsubscribe( fixture.topic, fixture.fourth.subscription.id );
			expect(PubSub.getSubscriptions(fixture.topic).length).toBe(2);
			
			try {
				subscribers = $.unsubscribe( fixture.topic, function() {});
			} catch ( err ) {
				expect( err.message ).toBe("You must provide the subscription id generated for the callback to remove it.");
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
							var msg = "fixture.first.notify: " + TestUtil.getType(notification);
							expect(this).toBeOk(true,msg);
							expect(order).toBe(0);
							order++;
						}
					},
					second:  {
						notify : function(notification) {
							var msg = "fixture.second.notify: " + TestUtil.getType(notification);
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
						var msg = "fixture.first.notify has priority default and is notified 2nd: " + TestUtil.getType(notification);
						expect(this).toBeOk(true,msg);
						expect(order).toBe(2);
						order++;
					}
				},
				second : {
					notify : function(notification) {
						var msg = "fixture.second.notify has priority 15 and is notified 4th: " + TestUtil.getType(notification);
						expect(this).toBeOk(true,msg);
						expect(order).toBe(4);
						order++;
					},
					priority : 15
				},
				third : {
					notify : function(notification) {
						var msg = "fixture.third.notify has priority default after initial subscriber with later timestamp and is notified 3rd: " + TestUtil.getType(notification);
						expect(this).toBeOk(true,msg);
						expect(order).toBe(3);
						order++;
					}
				},
				fourth : {
					notify : function(notification) {
						var msg = "fixture.fourth.notify has highest priority b/c it has a low priority number: " + TestUtil.getType(notification);
						expect(this).toBeOk(true,msg);
						expect(order).toBe(1);
						order++;
					},
					priority : 1
				},
				fifth : {
					notify : function(notification) {
						var msg = "fixture.fifth.notify is dead last b/c it has large priority number: " + TestUtil.getType(notification);
						expect(this).toBeOk(true,msg);
						expect(order).toBe(5);
						order++;
					},
					priority : 100
				},
				publishOptions : {
					progress : function(notification) {
						var msg = "progress: " +TestUtil.getType(notification)+ " w/o data";
						expect(this).toBeOk(msg,msg);
					},
					done: function(notification) {
						var msg = "done: " +TestUtil.getType(notification)+ " w/o data";
						expect(this).toBeOk(msg,msg);
					},
					fail: function(notification) {
						var msg = "fail: " +TestUtil.getType(notification)+ " w/o data";
						expect(this).toBeOk(false,msg);
					},
					always : function(notification) {
						var msg = "always: " +TestUtil.getType(notification)+ " w/o data";
						expect(this).toBeOk(msg,msg);
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
						var msg = "fixture.defaultSubscriber has window as context: " + TestUtil.getType(notification);
						expect(this).toBeOk(true,msg);
						expect(this).toBe(window);
					}
				},
				contextualSubscriber : {
					notify : function(notification) {
						var msg = "fixture.contextualSubscriber receives context from subscription: " + TestUtil.getType(notification);
						expect(this).toBeOk(true,msg);
						expect( _.isEqual(this, fixture.contexts.subscriber) ).toBe(true);
					}
				},
				pubSubscriber : {
					notify : function(notification) {
						var msg = "fixture.contextualSubscriber receives context from publisher: " + TestUtil.getType(notification);
						expect(this).toBeOk(true,msg);
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
						var data   = notification.data();
						var msg = "fixture.first.notify: " + TestUtil.getType(notification);
						expect(this).toBeOk(true,msg);
						
						expect( data.string ).toBe("hello")
						$.debug( "string passed to first.notify on: " + notification.publishTopic());
						expect( data.number).toBe(5);
						$.debug("number passed to first.notify on: " + notification.publishTopic());
						var expected = {
								foo: "bar",
								baz: "qux"
						};
						expect(_.isEqual(data.object, expected)).toBe(true);
						$.debug("object passed to first.notify on: " + notification.publishTopic() );
						$.debug("first.notify mutating data on: " + notification.publishTopic())
						data.string = "goodbye";
						data.object.baz = "quux";
					}
				},
				second : {
					notify : function(notification) {
						var data   = notification.data();
						var msg = "fixture.second.notify: " + TestUtil.getType(notification);
						expect(this).toBeOk(true,msg);
						expect( data.string ).toBe("goodbye");
						$.debug( "string changed on reception of data by second.notify on: " + notification.publishTopic() );
						expect( data.number ).toBe(5);
						$.debug("number changed on reception of data by second.notify on: " + notification.publishTopic() );
						var expected = {
								foo: "bar",
								baz: "quux"
						};
						expect(_.isEqual(data.object, expected)).toBe(true);
						$.debug("object changed on reception of data by second.notify on: " + notification.publishTopic() );
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
						var msg = "progress:" + TestUtil.getType(notification);
						expect(this).toBeOk(msg,msg);
					},
					done: function(notification) {
						var msg = "done:" + TestUtil.getType(notification);
						expect(this).toBeOk(msg,msg);
					},
					fail: function(notification) {
						var msg = "fail:" + TestUtil.getType(notification);
						expect(this).toBeOk(msg,msg);
					},
					always : function(notification) {
						var data   = notification.data();
						var msg = "always:" + TestUtil.getType(notification);
						expect(this).toBeOk(msg,msg);
						var expected = {
								foo: "bar",
								baz: "quux"
						};
						var obj = fixture.publishOptions.data.object;
						expect(_.isEqual(obj, expected)).toBe(true);
						$.info("object updated after notifications w/data on: " + notification.publishTopic());
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
		var PubSub, fixture, order, firstDone, secondDone;
		
		beforeEach(function() {
			firstDone = false;
			secondDone = false;
			PubSub = TestUtil.resetPubSub();
			fixture = {
				topic : "/data/push",
				notify : function(notification) {
					var self = fixture;
					var data   = notification.data();
					var msg = "fixture.notify: " + TestUtil.getType(notification);
					expect(this).toBeOk(true,msg);
					if (self.first.topic === notification.publishTopic() ) {
						var expectedData = self.first.options.data;
						expect(data.object.id).toBe(expectedData.object.id);
						$.debug("data originating from " + notification.publishTopic() + " should have same id");
						expect(data.number).toBe(expectedData.number);
						$.debug("data originating from " + notification.publishTopic() + " should have same number");
						data.number++;
					} else if (self.second.topic === notification.publishTopic() ) {
						var expectedData = self.second.options.data;
						expect(data.object.id).toBe(expectedData.object.id);
						$.debug("data originating from " + notification.publishTopic() + " should have same id");
						expect(data.number).toBe(expectedData.number);
						$.debug("data originating from " + notification.publishTopic() + " should have same number");
						data.number++;
					}
				},
				first : {
					topic : "/data/push/1",
					notify : function(notification) {
						var self = fixture;
						var data   = notification.data();
						var options = self.first.options;
						var msg = "fixture.first.notify: " + TestUtil.getType(notification);
						expect(this).toBeOk(true,msg);
						expect(data.string).toBe(options.data.string);
						$.debug("string passed during notification of " + notification.currentTopic() );
						expect(data.number).toBe(options.data.number);
						$.debug("number passed during notification of " + notification.currentTopic() );
						expect(_.isEqual(data.object, options.data.object)).toBe(true);
						$.debug("object passed during notification of " + notification.currentTopic() );
						data.string = "goodbye";
						data.object.baz = "quux";
					},
					options: {
						data : {
							string: "hello",
							number : 100,
							object : {
								id:  1,
								foo: "bar",
								baz: "qux"
							}
						},
						progress : function(notification) {
							var msg = "progress: " + TestUtil.getType(notification);
							expect(this).toBeOk(msg,msg);
						},
						done: function(notification) {
							var msg = "done: " + notification.publishTopic() + " -> " + notification.currentTopic();
							expect(this).toBeOk(msg,msg);
						},
						fail: function(notification) {
							var msg = "fail: " + notification.publishTopic() + " -> " + notification.currentTopic();
							expect(this).toBeOk(msg,msg);
						},
						always : function(notification) {
							var msg = "always: " + notification.publishTopic() + " -> " + notification.currentTopic();
							expect(this).toBeOk(msg,msg);
							firstDone = true;
						}
					}
				},
				second : {
					topic : "/data/push/2",
					notify : function(notification) {
						var self = fixture;
						var data   = notification.data();
						var options = self.second.options;

						var msg = "fixture.second.notify: " + TestUtil.getType(notification);
						expect(this).toBeOk(true,msg);
						expect(data.string).toBe(options.data.string);
						$.debug("string changed during notification of " + notification.currentTopic() );
						expect(data.number).toBe(options.data.number);
						$.debug("number unchanged during notification of " + notification.currentTopic() );
						expect(_.isEqual(data.object,options.data.object)).toBe(true);
						$.debug("object passed during notification of  " + notification.currentTopic() );
						data.string = "guten tag";
						data.object.baz = "wasser";
					},
					options: {
						data : {
							string: "guten morgen",
							number : 200,
							object : {
								id:  2,
								foo: "brot",
								baz: "bier"
							}
						},
						progress : function(notification) {
							var msg = "progress: " + TestUtil.getType(notification);
							expect(this).toBeOk(msg,msg);
						},
						done: function(notification) {
							var msg = "done: " + TestUtil.getType(notification);
							expect(this).toBeOk(msg,msg);
						},
						fail: function(notification) {
							var msg = "fail: " + TestUtil.getType(notification);
							expect(this).toBeOk(msg,msg);
						},
						always : function(notification) {
							var msg = "always: " + TestUtil.getType(notification);
							expect(this).toBeOk(msg,msg);
							secondDone = true;
						}
					}
				},
				spyOn : function() {
					var self = fixture;
					
					spyOn(self,  'notify').andCallThrough();
					spyOn(self.first,  'notify').andCallThrough();
					spyOn(self.second, 'notify').andCallThrough();
					
					spyOn(self.first.options, 'progress').andCallThrough();
					spyOn(self.first.options, 'done').andCallThrough();
					spyOn(self.first.options, 'fail').andCallThrough();
					spyOn(self.first.options, 'always').andCallThrough();
					
					spyOn(self.second.options, 'progress').andCallThrough();
					spyOn(self.second.options, 'done').andCallThrough();
					spyOn(self.second.options, 'fail').andCallThrough();
					spyOn(self.second.options, 'always').andCallThrough();
				},
				subscribe : function() {
					var self = fixture;
					
					self.subscription = $.subscribe(self.topic, self.notify);
					self.first.subscription = $.subscribe(self.first.topic,   self.first.notify);
					self.second.subscription = $.subscribe(self.second.topic, self.second.notify);
				}
			};
		});
		
		it("should publish data synchronously to each subscriber independently", function() {
			var self = fixture;
			self.spyOn();
			self.subscribe();
			
			self.first.publication = $.publishSync( self.first.topic, self.first.options);
			self.second.publication = $.publishSync( self.second.topic, self.second.options);
			
			expect(firstDone).toBe(true);
			expect(secondDone).toBe(true);
			expect(self.first.notify).toHaveBeenCalled();
			expect(self.second.notify).toHaveBeenCalled();
			
			expect(self.notify).toHaveBeenCalled();
			
			expect(self.first.options.progress).toHaveBeenCalled();
			expect(self.first.options.done).toHaveBeenCalled();
			expect(self.first.options.fail).not.toHaveBeenCalled();
			expect(self.first.options.always).toHaveBeenCalled();
			
			expect(self.second.options.progress).toHaveBeenCalled();
			expect(self.second.options.done).toHaveBeenCalled();
			expect(self.second.options.fail).not.toHaveBeenCalled();
			expect(self.second.options.always).toHaveBeenCalled();
		});
		
		it("should publish data asynchronously to each subscriber independently", function() {
			var self = fixture;
			runs(function() {
				self.spyOn();
				self.subscribe();
				
				self.first.publication = $.publish( self.first.topic, self.first.options);
				self.second.publication = $.publish( self.second.topic, self.second.options);
			})
			
			waitsFor(function() {
				return (firstDone !== false && secondDone !== false);
			}, "publication should be sent asynchronously to both topics", 5);
			
			runs(function() {
				expect(firstDone).toBe(true);
				expect(secondDone).toBe(true);
				
				expect(self.first.notify).toHaveBeenCalled();
				expect(self.second.notify).toHaveBeenCalled();
				
				expect(self.notify).toHaveBeenCalled();
				
				expect(self.first.options.progress).toHaveBeenCalled();
				expect(self.first.options.done).toHaveBeenCalled();
				expect(self.first.options.fail).not.toHaveBeenCalled();
				expect(self.first.options.always).toHaveBeenCalled();
				
				expect(self.second.options.progress).toHaveBeenCalled();
				expect(self.second.options.done).toHaveBeenCalled();
				expect(self.second.options.fail).not.toHaveBeenCalled();
				expect(self.second.options.always).toHaveBeenCalled();
			});
		});
	});
	
	describe("when there are dangling leaf subscriptions", function() {
		var PubSub, fixture, done;
		
		beforeEach(function() {
			PubSub = TestUtil.resetPubSub();
			done = false;
			fixture = {};
			fixture = $.extend(fixture, {
				topic : "/dangling",
				notify : function(notification) {
					var msg = "fixture.notify: " + TestUtil.getType(notification);
					expect(this).toBeOk(true,msg);
				},
				leaf : {
					topic : "/dangling/leaf"
				},
				options : {
					progress : function(notification) {
						var msg = "progress: " + TestUtil.getType(notification);
						expect(this).toBeOk(msg, msg);
					},
					fail : function(notification) {
						var msg = "progress: " + TestUtil.getType(notification);
						expect(this).toBeOk(msg, msg);
					},
					done : function(notification) {
						var msg = "done: " + TestUtil.getType(notification);
						expect(this).toBeOk(false, msg);
					},
					always : function(notification) {
						var msg = "always: " + TestUtil.getType(notification);
						expect(this).toBeOk(msg, msg);
						done = true;
					}
				},
				spyOn : function() {
					var self = fixture;
					spyOn(self.options, 'progress').andCallThrough();
					spyOn(self.options, 'fail').andCallThrough();
					spyOn(self.options, 'done').andCallThrough();
					spyOn(self.options, 'always').andCallThrough();
					
					spyOn(self, 'notify').andCallThrough();
				},
				subscribeAll : function() {
					var self = fixture;
					$.subscribe(self.topic, self.notify);
					
				}
			});
		});
		
		it("should be able to publish synchronously to dangling leafs", function() {
			var self = fixture;
			self.spyOn();
			self.subscribeAll();
			
			$.publishSync(self.leaf.topic, self.options);
			
			expect(done).toBe(true);
			
			expect(self.options.progress).toHaveBeenCalled();
			expect(self.options.fail).not.toHaveBeenCalled();
			expect(self.options.done).toHaveBeenCalled();
			expect(self.options.always).toHaveBeenCalled();
			
			expect(self.notify).toHaveBeenCalled();
		});
		it("should be able to publish asynchronously to dangling leafs", function() {
			var self = fixture;
			runs(function() {
				self.spyOn();
				self.subscribeAll();
				$.publishSync(self.leaf.topic, self.options);
			});
			
			waitsFor(function() {
				return done !== false;
			}, "publication should be sent asynchronously", 10);
			
			runs(function() {
				expect(done).toBe(true);
				
				expect(self.options.progress).toHaveBeenCalled();
				expect(self.options.fail).not.toHaveBeenCalled();
				expect(self.options.done).toHaveBeenCalled();
				expect(self.options.always).toHaveBeenCalled();
				
				expect(self.notify).toHaveBeenCalled();
			});
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
						var msg = "fixture.one.notify: " + TestUtil.getType(notification);
						expect(this).toBeOk(true, msg);
					}
				},
				two : {
					notify : function(notification) {
						var msg = "fixture.two.notify: " + TestUtil.getType(notification);
						expect(this).toBeOk(true, msg);
						return true;
					}
				},
				noSubscriberOptions : {
					progress : function(notification) {
						var msg = "noSubscriberOptions.progress: " + TestUtil.getType(notification);
						expect(this).toBeOk(msg, msg);
					},
					fail : function(notification) {
						var msg = "noSubscriberOptions.fail: " + TestUtil.getType(notification);
						expect(this).toBeOk(msg, msg);
					},
					done : function(notification) {
						var msg = "noSubscriberOptions.done: " + TestUtil.getType(notification);
						expect(this).toBeOk(false, msg);
					},
					always : function(notification) {
						var msg = "noSubscriberOptions.always: " + TestUtil.getType(notification);
						expect(this).toBeOk(msg, msg);
						done = true;
					}
				},
				subscriberOptions : {
					progress : function(notification) {
						var msg = "subscriberOptions.progress: " + TestUtil.getType(notification);
						expect(this).toBeOk(msg,msg);
					},
					done: function(notification) {
						var msg = "subscriberOptions.done: " + TestUtil.getType(notification);
						expect(this).toBeOk(msg,msg);
					},
					fail: function(notification) {
						var msg = "subscriberOptions.fail: " + TestUtil.getType(notification);
						expect(this).toBeOk(false,msg);
					},
					always : function(notification) {
						var msg = "subscriberOptions.always: " + TestUtil.getType(notification);
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
						var msg = "returnsFalse: " + TestUtil.getType(notification);
						expect(this).toBeOk( true, msg );
						return false;
					}
				},
				neverNotified: {
					notify : function(notification) {
						var msg = "neverNotified: " + TestUtil.getType(notification);
						expect(this).toBeOk( false, msg );
						return false;
					}
				},
				throwsException: {
					notify : function(notification) {
						var msg = "throwsException: " + TestUtil.getType(notification);
						expect(this).toBeOk( true, msg );
						throw new Error("stop publication");
					}
				},
				rejectNotification : {
					notify : function(notification) {
						var msg = "rejectNotification: " + TestUtil.getType(notification);
						expect(this).toBeOk( true, msg );
						notification.reject();
					}
				},
				publishOptions : {
					progress : function(notification) {
						var msg = "progress: " + TestUtil.getType(notification);
						expect(this).toBeOk(msg,msg);
					},
					done: function(notification) {
						var msg = "done: " + TestUtil.getType(notification);
						expect(this).toBeOk(false,msg);
					},
					fail: function(notification) {
						var msg = "fail: " + TestUtil.getType(notification);
						expect(this).toBeOk(msg,msg);
					},
					always : function(notification) {
						var msg = "always: " + TestUtil.getType(notification);
						expect(this).toBeOk(msg,msg);
						done = true;
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
				var msg = "neverNotified: " +TestUtil.getType(notification);
				expect(this).toBeOk(false,msg);
			};
			var exceptionThrown = function(notification) {
				var msg = "exceptionThrown: " +TestUtil.getType(notification);
				expect(this).toBeOk(true, msg)
				throw new Error("burp!");
			};
			var notificationReject = function(notification) {
				var msg = "notificationReject: " +TestUtil.getType(notification);
				expect(this).toBeOk(true, msg)
				notification.reject();
			};
			var returnsFalse = function(notification) {
				var msg = "returnsFalse: " +TestUtil.getType(notification);
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
					var data   = notification.data();
					var msg = "fixture.notify received same data by reference: " + TestUtil.getType(notification);
					expect(this).toBeOk(true,msg);
					expect(count).toBe(3);
					expect(_.isEqual(data, _self.data)).toBe(true);
					count++;
				},
				padma : {
					topic : "/starwars/padma",
					notify : function(notification) {
						var _self = this;
						var data   = notification.data();
						var msg = "fixture.padma.notify receives mutated data.name: " + TestUtil.getType(notification);
						expect(this).toBeOk(true,msg);
						expect(count).toBe(2);
						expect(data.name).toBe("empire strikes back");
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
							var data   = notification.data();
							var msg = "fixture.padma.leia.notify receiving data and mutated data.name: " + TestUtil.getType(notification);
							msg = msg + "where count = " + count;
							expect(this).toBeOk(true,msg);
							expect( _.isEqual(data, _self.data) ).toBe(true);
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
						var msg = "progress: " +TestUtil.getType(notification);
						expect(this).toBeOk(msg,msg);
					},
					done: function(notification) {
						var msg = "done: " +TestUtil.getType(notification);
						expect(this).toBeOk(msg,msg);
					},
					fail: function(notification) {
						var msg = "fail: " +TestUtil.getType(notification);
						expect(this).toBeOk(msg,msg);
					},
					always : function(notification) {
						var msg = "always: " +TestUtil.getType(notification);
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