/**
 * <p>This is a fork of the publish/subscribe library by AmplifyJS.
 * It has virtually the same signature and implementation EXCEPT,
 * that the methods (publish,subscribe & unsubscribe) are directly
 * bound to the jQuery object. This addresses the following use
 * cases:</p>
 * 
 * <ul>
 * <li>Subscribe and publish without data</li>
 * <li>Subscribe and publish with data [majority case]</li>
 * <li>Subscribe with a context and publish with data</li>
 * <li>Subscribe to a topic with differing priorities, and publish with data</li>
 * </ul>
 * 
 * <p>For examples of each of the following use cases, see the demo folder</p>
 * 
 * @author awong
 * @see https://github.com/appendto/amplify/tree/master/core
 * 
 */
;(function( $, undefined ) {
	/*
	 * Encapusulate state of pubsub event bus in following object.
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
	var pubsub = {
		slice : [].slice,
		version : "0.0.1",
		subscriptions : {}
	};
	
	/**
	 * Publish a message.
	 * 
	 * <ul>
	 * <li>topic: Name of the message to subscribe to.</li>
	 * <li>Any additional parameters will be passed to the subscriptions.</li>
	 * </ul>
	 * 
	 * Example:
	 *    $.subscribe( topic, callback )
	 *    $.subscribe( topic, context, callback )
	 *    $.subscribe( topic, callback, priority )
	 *    $.subscribe( topic, context, callback, priority )
	 * 
	 * $.publish returns a boolean indicating whether any subscriptions returned false.
	 * The return value is true if none of the subscriptions returned false, and false otherwise.
	 * Note that only one subscription can return false because doing so will prevent additional
	 * subscriptions from being invoked.
	 * 
	 */
	pubsub.publish = function( topic ) {
		if ( $.type(topic) !== "string" ) {
			throw new Error( "You must provide a valid topic to publish." );
		}

		var _self = pubsub;
		var args = _self.slice.call( arguments, 1 ),
			topicSubscriptions,
			subscription,
			length,
			i = 0,
			ret;
		
		var registrations = _self.subscriptions[ topic ];

		if ( !registrations ) {
			return true;
		}

		topicSubscriptions = registrations.slice();
		for ( length = topicSubscriptions.length; i < length; i++ ) {
			subscription = topicSubscriptions[ i ];
			var _cb = subscription.callback;
			ret = _cb.apply( subscription.context, args );
			if ( ret === false ) {
				break;
			}
		}
		return ret !== false;
	};
	/**
	 * 
	 * Subscribe to a message.
	 * 
	 * <ul>
	 * <li>topic: Name of the message to subscribe to.</li>
	 * <li>[context]: What this will be when the callback is invoked.</li>
	 * <li>callback: Function to invoke when the message is published.</li>
	 * <li>[priority]: Priority relative to other subscriptions for the same message. Lower values have higher priority. Default is 10.</li>
	 * </ul>
	 * 
	 * Example:
	 *    $.subscribe( topic, callback )
	 *    $.subscribe( topic, context, callback )
	 *    $.subscribe( topic, callback, priority )
	 *    $.subscribe( topic, context, callback, priority )
	 * 
	 * Returning false from a subscription's callback will prevent any additional subscriptions
	 * from being invoked and will cause amplify.publish to return false.
	 * 
	 */
	pubsub.subscribe = function( topic /*string */, context /* object */, callback /* function */, priority /* integer */ ) {
		if ( $.type(topic) !== "string" ) {
			throw new Error( "You must provide a valid topic to create a subscription." );
		}
		// pubsub.subscribe( topic, callback, priority )
		var _self = pubsub;
		
		if ( arguments.length === 3 && $.type(callback) === "number" ) {
			priority = callback;
			callback = context;
			context = null;
		}
		// pubsub.subscribe( topic, callback )
		if ( arguments.length === 2 ) {
			callback = context;
			context = null;
		}
		priority = priority || 10;
		if ( $.type(callback) !== "function" ) {
			throw new Error( "You must provide a valid handle to the callback to add its subscription." );
		}

		var topicIndex = 0,
			topics = topic.split( /\s/ ),
			topicLength = topics.length,
			added;
		for ( ; topicIndex < topicLength; topicIndex++ ) {
			topic = topics[ topicIndex ];
			added = false;

			if ( !_self.subscriptions[ topic ] ) {
				_self.subscriptions[ topic ] = [];
			}

			var i = _self.subscriptions[ topic ].length - 1,
				subscriptionInfo = {
					callback: callback,
					context: context,
					priority: priority
				};

			for ( ; i >= 0; i-- ) {
				if ( _self.subscriptions[ topic ][ i ].priority <= priority ) {
					_self.subscriptions[ topic ].splice( i + 1, 0, subscriptionInfo );
					added = true;
					break;
				}
			}

			if ( !added ) {
				_self.subscriptions[ topic ].unshift( subscriptionInfo );
			}
		}

		return callback;
	};
	/**
	 * Remove a subscription.
	 * 
	 * <ul>
	 * <li>topic: The topic being unsubscribed from.</li>
	 * <li>callback: The callback that was originally subscribed.</li>
	 * </ul>
	
	 * Returns registrations that still subscribe to the topic.
	 */
	pubsub.unsubscribe =  function( topic /* string */, callback /* function */ ) {
		if ( $.type(topic) !== "string" ) {
			throw new Error( "You must provide a valid topic to remove a subscription." );
		}
		
		var _self = pubsub;
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
	};
	// now publicize the API on the pubsub object onto the jQuery object
	$.publish = pubsub.publish;
	$.subscribe = pubsub.subscribe;
	$.unsubscribe = pubsub.unsubscribe;
}( jQuery ) );