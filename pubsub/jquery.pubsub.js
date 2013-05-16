/**
 * Combines best ideas from various pub/sub JS frameworks.
 * 
 * 
 * @author awong
 * @see https://github.com/appendto/amplify/tree/master/core
 * @see https://github.com/mroderick/PubSubJS
 * @see https://github.com/joezimjs/JZ-Publish-Subscribe-jQuery-Plugin
 * @see http://radio.uxder.com/
 * @see https://github.com/pmelander/Subtopic
 * 
 */
;(function( $, undefined ) {
	/*
	 * Encapsulate state of pubsub event bus in following object.
	 * The structure of the {@code subscriptions} cache will look like:
	 * {  "/topic/1" : [
	 *                   {priority: 10, callback: fn, context: null},
	 *                   {priority: 12, callback: fn2, context: ctx}
	 *                 ],
	 *    "/topic/2" : [
	 *                   {priority: 10, callback: fn3, context: ctx1},
	 *                   {priority: 12, callback: fn4, context: ctx2}
	 *                 ]
	 * }
	 */
	var PubSub = {
		slice : Array.slice,
		version : "0.0.2.SNAPSHOT",
		subscriptions : {},
		TOPIC_SEPARATOR : "/",
		immediateExceptions : false,
		reset : function() {
			var _self = PubSub;
			_self.subscriptions = {};
			_self.immediateExceptions = false;
		},
		isDefined : function(obj) {
			return (obj !== undefined && obj !== null);
		},
		validateTopicName : function(name /*string */) {
			var _self = PubSub;
			var result = false;
			if (_self.isDefined(name) && $.type(name) === "string" && name[0] === _self.TOPIC_SEPARATOR) {
				result = new RegExp("\\S").test(name);
				if (result) {
					var temp = name.replace(new RegExp(_self.TOPIC_SEPARATOR, "g"),"");
					result = new RegExp("\\w", "g").test(temp);
				}
			}
			return result;
		},
		createNodes : function (topic /* string */) {
			var _self = PubSub;
			var nodes = topic.split(_self.TOPIC_SEPARATOR);
			nodes = $.grep(nodes, function(node) {
				return (node !== null && node !== "");
			});
			return nodes;
		},
		createTopics : function(topic /*string */) {
			var _self = PubSub;
			if (!_self.validateTopicName(topic)) {
				throw new Error( "You must provide a valid topic name to create a set of topics." );
			}
			var nodes = _self.createNodes(topic);
			var topics = $.map(nodes, function(node, i) {
				var temp = _self.slice(nodes);
				temp = temp.slice(0, i + 1);
				var ancestor = temp.join(_self.TOPIC_SEPARATOR);
				return _self.TOPIC_SEPARATOR + ancestor;
			});
			return topics;
		},
		addTimeStamp : function(obj /* object */) {
			obj.timestamp = new Date();
			return obj;
		},
		createNotification : function(topic /* string */, data /* object */, context /* object */ ) {
			var _self = PubSub;
			if (!_self.validateTopicName(topic)) {
				throw new Error( "You must provide a valid topic name to create a Notification." );
			}
			var notification = new Notification(topic, data, context);
			return notification;
		},
		/**
		 * Returns whether a topic has an explicit subscription in its ancestory
		 */
		hasSubscriptions : function( topic /* string */) {
			var _self = PubSub,
				_topics = _self.createTopics(topic),
				subscriptions = _self.subscriptions;
		
			var found = subscriptions.hasOwnProperty( topic );
			if (!found && !$.isEmptyObject(subscriptions)) {
				$.each(_topics, function(i, _topic) {
					found = subscriptions.hasOwnProperty(_topic);
					return !found;
				});
			}
			return found;
		},
		getSubscriptions : function(topic /* string */) {
			var _self = PubSub;
			if (!_self.validateTopicName(topic)) {
				throw new Error( "You must provide a valid topic name to get Subscriptions." );
			}
			return _self.subscriptions[topic];
		},
		addSubscription : function( topic /*string */, callback /* function */, priority /* integer */, context /* object */ ) {
			var _self = PubSub;
			if ( !_self.subscriptions.hasOwnProperty( topic ) ){
				_self.subscriptions[topic] = [];
			}
			var newSubscriptions = _self.getSubscriptions(topic);
			var subscription = _self.createSubscription(topic, callback, priority, context);
			_self.addTimeStamp(subscription);
			
			newSubscriptions.push( subscription );
			newSubscriptions = _sortBy(newSubscriptions, function(thiz, that) {
				var delta = thiz.priority - that.priority;
				if (delta === 0) {
					delta = thiz.timestamp - that.timestamp;
				}
				return delta;
			});
			_self.subscriptions[topic] = newSubscriptions;
			
			return subscription;
		},
		createSubscription : function( topic /*string */, callback /* function */, priority /* integer */, context /* object */ ) {
			var _self = PubSub;
			if (!_self.validateTopicName(topic)) {
				throw new Error( "You must provide a valid topic name to create a Subscription." );
			}
			var subscription = new Subscription(topic, callback, priority, context);
			return subscription;
		},
		/**
		 * 
		 * Subscribe to a message.
		 * 
		 * <ul>
		 * <li>topic: Name of the message to subscribe to.</li>
		 * <li>callback: Function to invoke when the message is published.</li>
		 * <li>[priority]: Priority relative to other subscriptions for the same message. Lower values have higher priority. Default is 10.</li>
		 * <li>[context]: What this will be when the callback is invoked.</li>
		 * </ul>
		 * 
		 * Example:
		 *    $.subscribe( topic, callback )
		 *    $.subscribe( topic, context, callback )
		 *    $.subscribe( topic, callback, priority )
		 *    $.subscribe( topic, context, callback, priority )
		 * 
		 * Returning false from a subscription's callback will prevent any additional subscriptions
		 * from being invoked and will cause the publish function to return false.
		 * 
		 */
		subscribe : function subscribe( topic /*string */, context /* object */, callback /* function */, priority /* integer */ ) {
			var _self = PubSub;
			
			if (!_self.validateTopicName(topic)) {
				throw new Error( "You must provide a valid topic name to create a Subscription." );
			}
			if ( arguments.length === 3 && $.type(callback) === "number" ) {
				// $.subscribe(topic, callback, priority) otherwise $.subscribe(topic, priority, callback)
				priority = callback;
				callback = context;
				context = null;
			}
			if ( arguments.length === 2 ) {
				// $.subscribe(topic, callback)
				callback = context;
				context = null;
			}
			priority =  $.type(priority) === "number" ? priority : null;
			if ( $.type(callback) !== "function" ) {
				throw new Error( "You must provide a valid handle to the callback to add its subscription." );
			}
			var subscription = _self.addSubscription(topic, callback, priority, context);
			return subscription;
		},
		/**
		 * Publish a message.
		 * 
		 * <ul>
		 * <li>topic: Name of the message to subscribe to.</li>
		 * <li>Any additional parameters will be passed to the subscriptions.</li>
		 * </ul>
		 * 
		 * Example:
		 *    $.publish( topic )
		 *    $.publish( topic, data )
		 *    $.publish( topic, data, context )
		 * 
		 * $.publish returns a boolean indicating whether any subscriptions returned false.
		 * The return value is true if none of the subscriptions returned false, and false otherwise.
		 * Note that only one subscription can return false because doing so will prevent additional
		 * subscriptions from being invoked.
		 * 
		 */
		publish : function publish( topic /* string */, data /* object */, context /* object */ ) {
			var _self = PubSub;
			
			if (!_self.validateTopicName(topic)) {
				throw new Error( "You must provide a valid topic name to publish." );
			}

			var topicSubscriptions,
				subscription,
				ret;
			
			var registrations = _self.subscriptions[ topic ];

			if ( !registrations ) {
				return true;
			}
			
			var _data    = _self.isDefined(data) ? data : null;
			var _context = _self.isDefined(context) ? context : null;
			
			var notification = _self.createNotification(topic, _data, _context );
			_self.addTimeStamp(notification);

			var ret = _publishImpl( notification, false );
			return ret !== false;
		},
		/**
		 * Remove a subscription.
		 * 
		 * <ul>
		 * <li>topic: The topic being unsubscribed from.</li>
		 * <li>callback: The callback that was originally subscribed.</li>
		 * </ul>
		 * 
		 * Example:
		 *    $.unsubscribe( topic );
		 *    $.unsubscribe( topic, callback );
		 *
		 * Returns subsciptions that still subscribe to the topic.
		 */
		unsubscribe : function unsubscribe( topic /* string */, callback /* function */ ) {
			var _self = PubSub;
			
			if (!_self.validateTopicName(topic)) {
				throw new Error( "You must provide a valid topic to remove a subscription." );
			}
			
			var registrations = _self.subscriptions[ topic ];

			if ( !registrations ) {
				return;
			}
			
			if ( !callback ) {
				_self.subscriptions[topic] = registrations = [];
				return registrations;
			}
			
			if ( $.type(callback) !== "function" ) {
				throw new Error( "You must provide a valid handle to the callback to remove its subscription." );
			}

			var length = registrations.length,
				i = 0;

			for ( ; i < length; i++ ) {
				if ( registrations[ i ].callback === callback ) {
					registrations.splice( i, 1 );
					return registrations;
				}
			}
		}
	};
	
	function Notification(topic /* string */, data /* object */, context /* object */ ) {
		var _self = PubSub;

		this.publishTopic = topic;
		this.currentTopic = topic;
		this.data    = _self.isDefined(data)    ? data : null;
		this.context = _self.isDefined(context) ? context : null;
	}
	
	function Subscription( topic /*string */, callback /* function */, priority /* integer */, context /* object */ ) {
		var _self = PubSub;
		this.callback = callback;
		this.priority = _self.isDefined(priority) ? priority : 10;
		this.context  = _self.isDefined(context)  ? context : null;
		this.topics = _self.createTopics(topic);
	}
	
	function _sortBy(array, callback) {
		var clone = array;
		if (callback) {
			clone.sort(callback);
		} else {
			clone.sort();
		}
		return clone;
	}
	
	
	var ArrayProto = Array.prototype,
		ObjProto = Object.prototype,
		FuncProto = Function.prototype;
	
	// Create quick reference variables for speed access to core prototypes.
	var push             = ArrayProto.push,
		slice            = ArrayProto.slice,
		concat           = ArrayProto.concat,
		toString         = ObjProto.toString,
		hasOwnProperty   = ObjProto.hasOwnProperty;
	
	// All ECMAScript 5 native function implementations that we hope to use are declared here.
	var nativeForEach      = ArrayProto.forEach,
		nativeMap          = ArrayProto.map,
		nativeReduce       = ArrayProto.reduce,
		nativeReduceRight  = ArrayProto.reduceRight,
		nativeFilter       = ArrayProto.filter,
		nativeEvery        = ArrayProto.every,
		nativeSome         = ArrayProto.some,
		nativeIndexOf      = ArrayProto.indexOf,
		nativeLastIndexOf  = ArrayProto.lastIndexOf,
		nativeIsArray      = Array.isArray,
		nativeKeys         = Object.keys,
		nativeBind         = FuncProto.bind;

	var _delay = function(func, wait) {
		var context = null;
		var args = slice.call(arguments, 2);
		return setTimeout(function(){ return func.apply(context, args); }, wait);
	}
	
	/**
	 * Below is from PubSubJS
	 */
	function _throwException( ex ){
		return function reThrowException(){
			throw ex;
		};
	}

	function _deliverMessage( notification ){
		var _self = PubSub;
		var originalTopic = notification.publishTopic;
		var matchedTopic  = notification.currentTopic;
		
		var callSubscriber = function() {
			if (_self.immediateExceptions) {
				var _callSubscriberWithImmediateExceptions = function(subscriber, notification) {
					var ret = subscriber.apply(notification.context, [notification]);
					return ret;
				}
				return _callSubscriberWithImmediateExceptions;
			} else {
				var _callSubscriberWithDelayedExceptions = function(subscriber, notification) {
					var ret = true;
					try {
						ret = subscriber.apply(notification.context, [notification]);
					} catch( ex ){
						ret = false;
						_delay( _throwException( ex ), 0 );
					}
					return ret;
				}
				return _callSubscriberWithDelayedExceptions;
			}
		}();

		if ( !_self.subscriptions.hasOwnProperty( matchedTopic ) ) {
			return;
		}
		var subscribers = _self.getSubscriptions(matchedTopic);
		var ret = true;
		for (var i = 0; i < subscribers.length; i++ ) {
			var subscription = subscribers[i];
			notification.context = _createContext(subscription,notification);
			ret = callSubscriber(subscription.callback, notification);
			if (ret === false) {
				break;
			}
		}
		return ret;
	}
	
	
	function _createContext(subscription, notification) {
		var context = null;
		if (subscription.context !== null && notification.context !== null) {
			context = $.extend({}, notification.context, subscription.context);
		} else if (subscription.context !== null) {
			context = subscription.context
		} else if (notification.context !== null) {
			context = notification.context
		}
		return context;
	}

	function _createDeliveryFunction( notification ){
		var _self = PubSub;
		var topics = _self.createTopics(notification.publishTopic);

		var deliverNamespaced = function() {
			// deliver notification to each level by using topic capture.
			// i.e. deliver by going down the hierarchy trhough each topic
			for (var i = 0; i < topics.length; i++) {
				var currentNotification = notification;
				currentNotification.currentTopic = topics[i];
				_deliverMessage( currentNotification );
			}
		};
		return deliverNamespaced;
	}

	function foobar() {
		var _self = PubSub;
		var registrations = _self.subscriptions[ topic ];
		topicSubscriptions = registrations.slice();
		for (var i = 0; i < topicSubscriptions.length; i++ ) {
			subscription = topicSubscriptions[ i ];
			var _cb = subscription.callback;
			var _ctx = pubContext !== null ? pubContext : subscription.context;
			ret = _cb.apply( _ctx, data );
			if ( ret === false ) {
				break;
			}
		}
		
	}

	function _publishImpl( notification, sync ){
		var _self = PubSub;
		var deliver = _createDeliveryFunction( notification );
		var hasSubscribers = _self.hasSubscriptions(notification.publishTopic);

		if ( !hasSubscribers ){
			return false;
		}

		if ( sync === true ){
			deliver();
		} else {
			_delay(deliver,0);
		}
		return true;
	}
	
	// now publicize the API on the pubsub object onto the jQuery object
	$.publish = PubSub.publish;
	$.subscribe = PubSub.subscribe;
	$.unsubscribe = PubSub.unsubscribe;
	
	if ($.store) {
		$.store("pubsub", PubSub);
	} else if (window && window.document) {
		var $document = $(document);
		$document.data('pubsub', PubSub);
	}
}( jQuery ) );