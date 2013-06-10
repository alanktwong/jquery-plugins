This jquery plugin combines the ideas of various publish/subscribe libraries.

## Basic Example

First, create a function to subscribe to messages.

```javascript
var mySubscriber = function( notification ){
    var data = notification.data();
    console.log( data );
};
```

Second, add the function to the list of subscribers for a particular topic.
Topic names should be like Unix directories, because hierarchical publication is supported.
You can keep a subscription object in order to unsubscribe from the topic later on.

```javascript
var subscription = $.subscribe("/my/topic", mySubscriber);
```

Then, you can publish to the topic asynchronously:

```javascript
$.publish("/my/topic", {data : "hello world"});
```

or synchronously.

```javascript
$.publishSync("/my/topic", {data : "hello world"});
```

And you can unsubscribe from the topic, using a unique id.

```javascript
$.unsubscribe("/my/topic", subscription.id);
```

## Features

This plugin has the following features:

### Pub/Sub without data

```javascript
var mySubscriber = function( notification ){
    // do stuff
};

var subscription = $.subscribe("/pubsub/nodata", mySubscriber);

$.publish("/pubsub/nodata");
```

### Pub/Sub with data

```javascript
var mySubscriber = function( notification ){
    var data = notification.data();
    // do stuff
};

var subscription = $.subscribe("/pubsub/data", mySubscriber);
var json = { id : 1, message: "hi" };
$.publish("/pubsub/data", {data : json});
```

### Pub/Sub with context

```javascript
var mySubscriber = {
    notify : function( notification ){
        // expect this === mySubscriber.context
    },
    context : {}
};

var subscription = $.subscribe("/pubsub/data", mySubscriber.context, mySubscriber.notify);
$.publish("/pubsub/data");
```

Alternatively, the publisher can publish a context too.

```javascript
var mySubscriber = {
    notify : function( notification ){
        // expect this === context
    }
};

var context = {};
var subscription = $.subscribe("/pubsub/data", mySubscriber.notify);
$.publish("/pubsub/data", {context : context});
```

### Pub/Sub to same topic with different priorities

```javascript
var subscribers = {
    one : {
        notify : function( notification ){
            // expect this to be notified first
        },
        priority : 1
    },
    two : {
        notify : function( notification ){
            // expect this to be notified last
        },
        priority : 100
    }
};

$.subscribe("/pubsub/priority", subscribers.one.notify, subscribers.one.priority);
$.subscribe("/pubsub/priority", subscribers.two.notify, subscribers.two.priority);
$.publish("/pubsub/priority");
```

### Hierarchical Pub/Sub

```javascript
var subscribers = {
    notify : function( notification ){
        // expect this to be notified last
    },
    hierarchy : {
        notify : function( notification ){
            // expect this to be notified first
        }
    }
};

$.subscribe("/pubsub/hierarchy", subscribers.hierarchy.notify);
$.subscribe("/pubsub", subscribers.notify);
$.publish("/pubsub/hierarchy");
```

### Pub/Sub Callbacks

```javascript
var subscribers = {
    notify : function( notification ){
        // expect this to be notified last
    }
};

$.subscribe("/pubsub/callback", subscribers.notify);
$.publish("/pubsub/hierarchy", {
    progress : function( notification ) {
        // expect this to be invoked before all subscriptions get notified
    },
    done : function( notification ) {
        // expect this to be invoked after all subscriptions get successfully notified
    },
    fail : function( notification ) {
        // expect this to be invoked if only some of subscriptions get successfully notified
    },
    always : function( notification ) {
        // expect this to always be invoked after an notification attempt is made
    }
});
```

### More Examples



For further elaboration, see the specs or the demo folder


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




## Future of jquery.pubsub.js



## More About Publish/Subscribe

* [The Many Faces of Publish/Subscribe](http://www.cs.ru.nl/~pieter/oss/manyfaces.pdf) (PDF)
* [Addy Osmani's mini book on Patterns](http://addyosmani.com/resources/essentialjsdesignpatterns/book/#observerpatternjavascript)
* [Publish / Subscribe Systems, A summary of 'The Many Faces of Publish / Subscribe'](http://downloads.ohohlfeld.com/talks/hohlfeld_schroeder-publish_subscribe_systems-dsmware_eurecom2007.pdf)

## Versioning

jquery.pubsub.js uses [Semantic Versioning](http://semver.org/) for predictable versioning.

## Change Log

* v1.0.0
    * Upgraded to new design

* v0.0.2
    * Blah


## Alternatives

These are alternative projects that implement topic=-based pub/sub in Javascript.

* [PubSub JS](https://github.com/mroderick/PubSubJS)
* [Amplify](https://github.com/appendto/amplify/tree/master/core)
* [JZ Publish/Subscribe](https://github.com/joezimjs/JZ-Publish-Subscribe-jQuery-Plugin)
* [Radio JS](http://radio.uxder.com/)
* [Subtopic](https://github.com/pmelander/Subtopic)


