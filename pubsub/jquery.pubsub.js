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
			//var _self = PubSub;
			
			if (!_self.validateTopicName(topic)) {
				throw new Error( "You must provide a valid topic name to create a Subscription." );
			}
			if ( arguments.length === 3 && Util.isNumber(callback) ) {
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
			priority =  Util.isNumber(priority) ? priority : null;
			if ( !Util.isFunction(callback) ) {
				throw new Error( "You must provide a valid handle to the callback to add its subscription." );
			}
			
			if (Util.isNotNull(context)  && !Util.isObject(context)) {
				throw new Error( "You must provide an object for a context." );
			}
			
			var subscription = _self.addSubscription(topic, callback, priority, context);
			return subscription;
		},
		/**
		 * Publish a message asynchronously
		 * 
		 * <ul>
		 * <li>topic: Name of the message to subscribe to.</li>
		 * <li>Options: Any additional parameters will be passed to the subscriptions.</li>
		 * </ul>
		 * 
		 * Example:
		 *    $.publish( topic )
		 *    $.publish( topic, {data : data, context: context});
		 * 
		 * $.publish returns the notification which was sent to all the subscriptions.
		 * If publication is unsuccessful due to a lack of subscribers a null will be returned.
		 * 
		 * Publication to all the subscribers in the notification chain can be interrupted if
		 * at least one of the subscribers returns false. This will prevent subscribers
		 * further down the chain from receiving the notification.
		 * 
		 */
		publish : function publish( topic /* string */, options /* object */ ) {
			return _self.publishImpl( topic, options, false );
		},
		/**
		 * Publish a message synchronously.
		 * 
		 * $.publishSync returns the notification which was sent to all the subscriptions.
		 * If publication is unsuccessful due to a lack of subscribers a null will be returned.
		 * 
		 * 
		 */
		publishSync : function(topic /* string */, options /* object */ ) {
			return _self.publishImpl( topic, options, true );
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
		unsubscribe : function unsubscribe( topic /* string */, subscriptionId /* string */ ) {
			//var _self = PubSub;
			
			if (!_self.validateTopicName(topic)) {
				throw new Error( "You must provide a valid topic to remove a subscription." );
			}
			
			var registrations = _self.subscriptions[ topic ];

			if ( !registrations ) {
				return;
			}
			// unsubscribing all
			if ( !subscriptionId ) {
				_self.subscriptions[topic] = registrations = [];
				return registrations;
			} else if (Util.isString(subscriptionId)) {
				for (var i = 0 ; i < registrations.length; i++ ) {
					var each = registrations[i];
					if ( each.id === subscriptionId ) {
						registrations.splice( i, 1 );
						return registrations;
					}
				}
			} else {
				throw new Error( "You must provide the subscription id generated for the callback to remove it." );
			}
		},
		reset : function() {
			//var _self = PubSub;
			_self.subscriptions = {};
		},
		publishImpl : function( topic /* string */, options /* object */, sync /* boolean */ ){
			// var _self = PubSub;
			var publication = null;
			if (!_self.validateTopicName(topic)) {
				throw new Error( "You must provide a valid topic name to publish." );
			}
			options = options || {};
			
			publication = _self.createPublication( topic, options, sync );
			
			var hasSubscribers = _self.hasSubscriptions(topic);
			if ( !hasSubscribers ){
				var _notification = publication.notification;
				_notification.reject();
				publication.progress(_notification);
				publication.fail(_notification);
				publication.always(_notification);
			} else {
				var deliver = createDeliveryFunction(publication);
				if (Util.isFunction(deliver)) {
					if ( sync === true ){
						deliver();
					} else {
						Util.delay(deliver,0);
					}
				} else {
					throw new Error("should have created delivery function");
				}
			}
			
			return publication;
		},
		validateTopicName : function(name /*string */) {
			//var _self = PubSub;
			var result = false;
			if (Util.isString(name) && name[0] === _self.TOPIC_SEPARATOR) {
				result = new RegExp("\\S").test(name);
				if (result) {
					var temp = name.replace(new RegExp(_self.TOPIC_SEPARATOR, "g"),"");
					result = new RegExp("\\w", "g").test(temp);
				}
			}
			return result;
		},
		createNodes : function (topic /* string */) {
			//var _self = PubSub;
			var nodes = topic.split(_self.TOPIC_SEPARATOR);
			nodes = $.grep(nodes, function(node) {
				return (node !== null && node !== "");
			});
			return nodes;
		},
		createTopics : function(topic /*string */) {
			//var _self = PubSub;
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
		defaultPublicationOptions : {
			topic : "",
			data : null,
			context : null,
			progress : function(notification) {},
			done : function(notification) {},
			fail : function(notification) {},
			always : function(notification) {}
		},
		createPublication : function(topic /* string */, publication /* object */, sync /* boolean */ ) {
			//var _self = PubSub;
			if (!_self.validateTopicName(topic)) {
				throw new Error( "You must provide a valid topic name to create a Notification." );
			}
			if (!Util.isObject(publication)) {
				throw new Error( "You must provide options to create a Notification." );
			}
			publication.topic = topic;

			publication.data     = Util.isObject(publication.data)       ? publication.data    : null;
			publication.context  = Util.isObject(publication.context)    ? publication.context : null;
			
			var createCallback = function(callback, safe, context) {
				var cb = Util.isFunction(callback) ? callback : safe;
				cb = Util.bind(cb, context);
				return cb;
			};
			
			var deferredContext = publication.context;
			var callbacks = {
				progress : createCallback(publication.progress, _self.defaultPublicationOptions.progress, deferredContext),
				done :     createCallback(publication.done,     _self.defaultPublicationOptions.done,     deferredContext),
				fail :     createCallback(publication.fail,     _self.defaultPublicationOptions.fail,     deferredContext),
				always :   createCallback(publication.always,   _self.defaultPublicationOptions.always,   deferredContext)
			};
			
			publication.notification = new Notification(topic, publication.data, publication.context, sync);
			publication.state = publication.notification.state;
			publication = $.extend({}, publication, callbacks);
			return publication;
		},
		/**
		 * Returns whether a topic has an explicit subscription in its ancestory
		 */
		hasSubscriptions : function( topic /* string */) {
			//var _self = PubSub;
			var _topics = _self.createTopics(topic),
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
		/*
		 * Does not flatten list of subscriptions in the ancestory of the topic
		 */
		getSubscriptions : function(topic /* string */, all /* boolean */) {
			// var _self = PubSub;
			if (!_self.validateTopicName(topic)) {
				throw new Error( "You must provide a valid topic name to get Subscriptions." );
			}
			var _subscriptions = _self.subscriptions;
			var results = [];
			if (all && all === true) {
				var _topics = _self.createTopics(topic);
				for (var i=0; i < _topics.length; i++) {
					var eachTopic = _topics[i];
					var subscriptionsOn = _subscriptions[eachTopic];
					results.push.apply(results,subscriptionsOn);
				}
			} else {
				results = _subscriptions[topic];
			}
			return results;
		},
		addSubscription : function( topic /*string */, callback /* function */, priority /* integer */, context /* object */ ) {
			//var _self = PubSub;
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
			//var _self = PubSub;
			if (!_self.validateTopicName(topic)) {
				throw new Error( "You must provide a valid topic name to create a Subscription." );
			}
			var subscription = new Subscription(topic, callback, priority, context);
			return subscription;
		}
	};
	
	var _self = PubSub;
	
	function Notification(topic /* string */, data /* object */, context /* object */, sync /* boolean */ ) {
		this.id = Util.generateGUID();
		this.publishTopic = topic;
		this.currentTopic = topic;
		this.data    = Util.isObject(data)    ? data : null;
		this.context = Util.isObject(context) ? context : null;
		this.message = null;
		
		var _publishPropagated = true;
		var _sync = (sync === true);
		var _state = "pending";
		
		this.isSynchronous = function() {
			return (_sync === true);
		}
		
		this.reject = function(message) {
			_publishPropagated = false;
			if (message) {
				this.message = message;
			}
			_state = "rejected";
		};
		
		this.resolve = function() {
			_state = "resolved"
		}
		
		this.state = function() {
			return _state;
		};
		
		this.isPropagation = function() {
			return _publishPropagated === true;
		}
		_addTimeStamp(this);
	}
	
	function Subscription( topic /*string */, callback /* function */, priority /* integer */, context /* object */ ) {
		this.id = Util.generateGUID();
		this.callback = callback;
		this.priority = Util.isNumber(priority) ? priority : 10;
		this.context  = Util.isObject(context)  ? context : null;
		this.topic = topic;
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
	
	/**
	 * Below is from PubSubJS
	 */
	function _throwException( ex ){
		return function reThrowException(){
			throw ex;
		};
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
	
	function _createCallSubscriber() {
		var _callSubscriberWithImmediateExceptions = function(subscriber, notification) {
			var ret = true;
			try {
				ret = subscriber.apply(notification.context, [notification]);
			} catch( ex ){
				ret = false;
				notification.reject(ex.message);
			}
			return ret;
		}
		return Util.bind(_callSubscriberWithImmediateExceptions, self);
	}
	
	function _deliverMessage( publication ){
		var _self = PubSub;
		var notification  = publication.notification;
		var currentTopic  = notification.currentTopic;
		
		var callSubscriber = _createCallSubscriber();
		
		var continuePropagating = ( publication.state() === "pending" );
		if ( !_self.subscriptions.hasOwnProperty( currentTopic ) ) {
			return continuePropagating;
		}
		var subscribers = _self.getSubscriptions(currentTopic);
		if (continuePropagating) {
			for (var i = 0; i < subscribers.length; i++) {
				var subscription = subscribers[i];
				notification.context = _createContext(subscription,notification);
				var continuePropagating  = callSubscriber(subscription.callback, notification);
				if (continuePropagating === false || !notification.isPropagation()) {
					notification.reject();
					break;
				}
			}
		}
		return continuePropagating;
	}

	function createDeliveryFunction(publication){
		var deliver = function(_publication) {
			var _self = PubSub;
			
			var _notification = _publication.notification;
			var allSubscribers = _self.getSubscriptions(_notification.publishTopic, true);
			
			var topics = _self.createTopics(_notification.publishTopic);
			_publication.progress(_notification);
			
			// deliver notification to each level by using topic bubbling.
			// i.e. deliver by going up the hierarchy through each topic
			if (_publication.state() === "pending") {
				for (var i = 0; i < topics.length; i++) {
					var topic = topics[i];
					_notification.currentTopic = topic;
					var continuePropagating = _deliverMessage( _publication );
					if (continuePropagating === false || !_notification.isPropagation() ) {
						_notification.reject();
						break;
					}
				}
			}
			if (_publication.state() !== "rejected") {
				_notification.resolve();
			}
			if (_publication.state() === "resolved") {
				_publication.done(_notification);
			} else {
				_publication.fail(_notification);
			}
			_publication.always(_notification);
		};
		return Util.partial(deliver,publication);
	}
	
	var Util = (function ($) {
		/**
		 * clones parts of underscore.js
		 */
		var ArrayProto  = Array.prototype,
			ObjProto    = Object.prototype,
			FuncProto   = Function.prototype;
		
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
			if (_isFunction(func) && _isNumber(wait)) {
				var context = null;
				var args = slice.call(arguments, 2);
				return setTimeout(function(){
					return func.apply(context, args);
				}, wait);
			} else {
				// throw new Error("Cannot delay anything except a function");
			}
		}
		
		var _identity = function(value) {
			return value;
		};
		
		var _has = function(obj, key) {
			return hasOwnProperty.call(obj, key);
		};
		
		var _bind = function(func, context) {
			if (func.bind === nativeBind && nativeBind) {
				return nativeBind.apply(func, slice.call(arguments, 1));
			}
			var args = slice.call(arguments, 2);
			return function() {
				return func.apply(context, args.concat(slice.call(arguments)));
			}
		};
		
		
		var _partial = function(func) {
			var args = slice.call(arguments, 1);
			return function() {
				return func.apply(this, args.concat(slice.call(arguments)));
			};
		};
		
		var _memoize = function(func, hasher) {
			var memo = {};
			hasher || (hasher = _identity);
			return function() {
				var key = hasher.apply(this, arguments);
				return _has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
			};
		};
		
		var breaker = {};
		
		// The cornerstone, an each implementation, aka forEach.
		// Handles objects with the built-in forEach, arrays, and raw objects.
		// Delegates to ECMAScript 5's native forEach if available.
		var _each = function(obj, iterator, context) {
			if (obj == null) {
				return;
			}
			if (nativeForEach && obj.forEach === nativeForEach) {
				obj.forEach(iterator, context);
			} else if (obj.length === +obj.length) {
				for (var i = 0, l = obj.length; i < l; i++) {
					if (iterator.call(context, obj[i], i, obj) === breaker) {
						return;
					}
				}
			} else {
				for (var key in obj) {
					if (_has(obj, key)) {
						if (iterator.call(context, obj[key], key, obj) === breaker) {
							return;
						}
					}
				}
			}
		};
		// Return the results of applying the iterator to each element.
		// Delegates to ECMAScript 5's native map if available.
		var _map  = function(obj, iterator, context) {
			var results = [];
			if (obj == null) {
				return results;
			}
			if (nativeMap && obj.map === nativeMap) {
				return obj.map(iterator, context);
			}
			_each(obj, function(value, index, list) {
				results[results.length] = iterator.call(context, value, index, list);
			})
			return results;
		};

		// Reduce builds up a single result from a list of values, aka inject, or foldl.
		// Delegates to ECMAScript 5's native reduce if available.
		var reduceError = 'Reduce of empty array with no initial value';
		var _reduce = function(obj, iterator, memo, context) {
			var initial = arguments.length > 2;
			if (obj == null) {
				obj = [];
			}
			if (nativeReduce && obj.reduce === nativeReduce) {
				if (context) iterator = _.bind(iterator, context);
				return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
			}
			each(obj, function(value, index, list) {
				if (!initial) {
					memo = value;
					initial = true;
				} else {
					memo = iterator.call(context, memo, value, index, list);
				}
			});
			if (!initial) {
				throw new TypeError(reduceError);
			}
			return memo;
		};
		
		// Return the first value which passes a truth test.
		var _find = function(obj, iterator, context) {
			var result;
			_any(obj, function(value, index, list) {
				if (iterator.call(context, value, index, list)) {
					result = value;
					return true;
				}
			});
			return result;
		};
		
		// Return all the elements that pass a truth test.
		// Delegates to ECMAScript 5's native filter if available. 
		var _filter = function(obj, iterator, context) {
			var results = [];
			if (obj == null) {
				return results;
			}
			if (nativeFilter && obj.filter === nativeFilter) {
				return obj.filter(iterator, context);
			}
			_each(obj, function(value, index, list) {
				if (iterator.call(context, value, index, list)) {
					results[results.length] = value;
				}
			});
			return results;
		};
		
		// Determine if at least one element in the object matches a truth test.
		// Delegates to ECMAScript 5's native some if available.
		var _any = function(obj, iterator, context) {
			iterator || (iterator = _identity);
			var result = false;
			if (obj == null) {
				return result;
			}
			if (nativeSome && obj.some === nativeSome) {
				return obj.some(iterator, context);
			}
			_each(obj, function(value, index, list) {
				if (result || (result = iterator.call(context, value, index, list))) {
					return breaker;
				}
			});
			return !!result;
		};
		
		var _generateGUID = function(){
			var guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
				return v.toString(16);
			});
			return guid
		};
		
		var _isUndefined = function(obj) {
			return obj === undefined;
		};
		
		var _isNotNull = function(obj) {
			return (!_isUndefined(obj) && obj !== null);
		};
		var _isObject = function(obj) {
			return (_isNotNull(obj) && $.type(obj) === "object");
		};
		var _isFunction = function(obj) {
			return (_isNotNull(obj) && $.type(obj) === "function");
		};
		var _isString = function(obj) {
			return (_isNotNull(obj) && $.type(obj) === "string");
		};
		var _isNumber = function(obj) {
			return (_isNotNull(obj) && $.type(obj) === "number");
		};
		
		return {
			generateGUID : _generateGUID,
			isUndefined : _isUndefined,
			isNotNull : _isNotNull,
			isObject : _isObject,
			isFunction : _isFunction,
			isString : _isString,
			isNumber : _isNumber,
			delay : _delay,
			identity : _identity,
			has : _has,
			memoize : _memoize,
			bind : _bind,
			partial : _partial,
			each : _each,
			map : _map,
			reduce : _reduce,
			find : _find,
			filter : _filter,
			any : _any,
		};
	}(jQuery));
	
	
	PubSub.Util = Util;
	// store PubSub object for unit testing
	if ($.store) {
		$.store(PubSub.key, PubSub);
	} else if (window && window.document) {
		var $document = $(document);
		$document.data(PubSub.key, PubSub);
	}
	// now publicize the API on the pubsub object onto the jQuery object
	$.publish = PubSub.publish;
	$.publishSync = PubSub.publishSync;
	$.subscribe = PubSub.subscribe;
	$.unsubscribe = PubSub.unsubscribe;
}( jQuery ) );