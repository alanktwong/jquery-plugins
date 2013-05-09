This is a fork of the publish/subscribe library by AmplifyJS.
It has virtually the same signature and implementation EXCEPT,
that the methods (publish,subscribe and unsubscribe) are directly
bound to the jQuery object. This addresses the following use
cases:


* Subscribe and publish without data
* Subscribe and publish with data [majority case]
* Subscribe with a context and publish with data
* Subscribe to a topic with differing priorities, and publish with data

For examples of each of the following use cases, see the demo folder
