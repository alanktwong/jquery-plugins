This is a fork of the publish/subscribe library by AmplifyJS.
It has virtually the same signature and implementation EXCEPT,
that the methods (publish,subscribe and unsubscribe) are directly
bound to the jQuery object.

This plugin provides methods to facilitate the Publish and Subscribe messaging pattern in your front-end application. The idea is that someone is broadcasting one or more messages (publishing) and someone else is listening to one or more messages (subscribing). By separating your logic out like this it allows for loose coupling of your components, which results in less brittle and more reusable code.

It is possible to implement the publish and subscribe model by using jQuery custom events, however, this pub/sub plugin provides a slightly cleaner interface, prevents collisions between custom events and method names, and allows a priority to your messages.

This addresses the following use cases:

* Subscribe and publish without data
* Subscribe and publish with data [majority case]
* Subscribe with a context and publish with data
* Subscribe to a topic with differing priorities, and publish with data

For examples of each of the following use cases, see the demo folder


## API

### Publish a message.

* `topic`: Name of the message to subscribe to.
* Any additional parameters will be passed to the subscriptions.

Example:

    $.publish( string topic )
    $.publish( string topic, object data )
    $.publish( string topic, array *data )

`$.publish` notifies subscriptions to a `topic`. The subscribers can receive
no data, an object or an array.

It returns a boolean indicating whether any subscriptions returned false.
The return value is true if none of the subscriptions returned false, and false otherwise.
Note that only one subscription can return false because doing so will prevent additional
subscriptions from being invoked.


### Subscribe to a topic.

* `topic`: Name of the topic to subscribe to.
* `[context]`: What `this` will be when the callback is invoked.
* `callback`: Function to invoke when a message is published to the topic.
* `[priority]`: Priority relative to other subscriptions for the same topic. Lower values have higher priority. Default is 10.

Example:

    $.subscribe( string topic, function callback )
    $.subscribe( string topic, object context, function callback )
    $.subscribe( string topic, function callback, integer priority )
    $.subscribe( string topic, object context, function callback, integer priority )
 
Returning false from a subscription's callback will prevent any additional subscriptions
from being invoked and will cause `$.publish` to return false.


### Unsubscribe from a topic

* `topic`: The topic being unsubscribed from.
* `callback`: The callback that was originally subscribed.

