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
		version : "1.0.0.SNAPSHOT",
		key : "PubSub",
		subscriptions : {},
		TOPIC_SEPARATOR : "/",
		immediateExceptions : false,
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
		 * Publish a message asynchronously
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
			var ret = _publishImpl( topic, data, context, false );
			return ret !== false;
		},
		/**
		 * Publish a message synchronously.
		 * 
		 * <ul>
		 * <li>topic: Name of the message to subscribe to.</li>
		 * <li>Any additional parameters will be passed to the subscriptions.</li>
		 * </ul>
		 * 
		 * Example:
		 *    $.publishSync( topic )
		 *    $.publishSync( topic, data )
		 *    $.publishSync( topic, data, context )
		 * 
		 * $.publishSync returns a boolean indicating whether any subscriptions returned false.
		 * The return value is true if none of the subscriptions returned false, and false otherwise.
		 * Note that only one subscription can return false because doing so will prevent additional
		 * subscriptions from being invoked.
		 * 
		 */
		publishSync : function(topic /* string */, data /* object */, context /* object */) {
			var ret = _publishImpl( topic, data, context, true );
			return ret !== false;
		},
		/**
		 * Remove a subscription.
		 * 
		 * <ul>
		 * <li>topic: The topic being unsubscribed from.</li>
		 * <li>subscription: The subscription object for the callback that was originally subscribed.</li>
		 * </ul>
		 * 
		 * Example:
		 *    $.unsubscribe( topic );
		 *    $.unsubscribe( topic, subscription );
		 *
		 * Returns subsciptions that still subscribe to the topic.
		 */
		unsubscribe : function unsubscribe( topic /* string */, subscription /* object */ ) {
			var _self = PubSub;
			
			if (!_self.validateTopicName(topic)) {
				throw new Error( "You must provide a valid topic to remove a subscription." );
			}
			
			var registrations = _self.subscriptions[ topic ];

			if ( !registrations ) {
				return;
			}
			
			if ( !subscription ) {
				_self.subscriptions[topic] = registrations = [];
				return registrations;
			}
			
			if ( $.type(subscription) !== "object" && !(subscription instanceof Subscription)) {
				throw new Error( "You must provide the subscription generated for the callback to remove it." );
			}

			for (var i = 0 ; i < registrations.length; i++ ) {
				var each = registrations[i];
				if ( each.id === subscription.id ) {
					registrations.splice( i, 1 );
					return registrations;
				}
			}
		},
		generateGUID : function(){
			var guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
				return v.toString(16);
			});
			return guid
		},
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
			topics.reverse();
			return topics;
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
		}
	};
	
	function Notification(topic /* string */, data /* object */, context /* object */ ) {
		var _self = PubSub;
		this.id = _self.generateGUID();
		this.publishTopic = topic;
		this.currentTopic = topic;
		this.data    = _self.isDefined(data)    ? data : null;
		this.context = _self.isDefined(context) ? context : null;
		_addTimeStamp(this);
	}
	
	function Subscription( topic /*string */, callback /* function */, priority /* integer */, context /* object */ ) {
		var _self = PubSub;
		this.id = _self.generateGUID();
		this.callback = callback;
		this.priority = _self.isDefined(priority) ? priority : 10;
		this.context  = _self.isDefined(context)  ? context : null;
		this.topics = _self.createTopics(topic);
		_addTimeStamp(this);
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
	
	function _addTimeStamp(obj /* object */) {
		obj.timestamp = new Date();
		return obj;
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
			// deliver notification to each level by using topic bubbling.
			// i.e. deliver by going up the hierarchy through each topic
			var ret = true;
			for (var i = 0; i < topics.length; i++) {
				var currentNotification = notification;
				currentNotification.currentTopic = topics[i];
				ret = _deliverMessage( currentNotification );
				if (ret === false) {
					break;
				}
			}
			return ret;
		};
		return deliverNamespaced;
	}

	
	function _publishImpl( topic /* string */, data /* object */, context /* object */, sync /* boolean */ ){
		var _self = PubSub;
		
		if (!_self.validateTopicName(topic)) {
			throw new Error( "You must provide a valid topic name to publish." );
		}

		var ret = false;
		
		var registrations = _self.subscriptions[ topic ];
		if ( !registrations ) {
			return ret;
		}

		var hasSubscribers = _self.hasSubscriptions(topic);
		if ( !hasSubscribers ){
			return ret;
		}

		var _data    = _self.isDefined(data) ? data : null;
		var _context = _self.isDefined(context) ? context : null;
		
		var notification = _self.createNotification(topic, _data, _context );
		
		var deliver = _createDeliveryFunction( notification );
		if ( sync === true ){
			ret = deliver();
		} else {
			_delay(deliver,0);
			return ret;
		}
		return ret;
	}
	
	// now publicize the API on the pubsub object onto the jQuery object
	$.publish = PubSub.publish;
	$.publishSync = PubSub.publishSync;
	$.subscribe = PubSub.subscribe;
	$.unsubscribe = PubSub.unsubscribe;
	
	if ($.store) {
		$.store("pubsub", PubSub);
	} else if (window && window.document) {
		var $document = $(document);
		$document.data('pubsub', PubSub);
	}
}( jQuery ) );