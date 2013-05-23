beforeEach(function() {
	this.addMatchers({
		toBeSubscribedCorrectly: function(topic, context, callback, priority, topics) {
			var result = false;
			var subscription = this.actual;
			var defaultPriority = 10;
			if (subscription && subscription !== null) {
				result = subscription.callback === callback
					&& _.isEqual(subscription.topics,topics);
				if (context !== null && priority !== null) {
					result = result 
						&& subscription.priority === priority
						&& subscription.context === context;
				} else if (context !== null) {
					result = result 
						&& subscription.priority === defaultPriority
						&& subscription.context === context;
				} else if (priority !== null) {
					result = result 
						&& subscription.priority === priority
						&& subscription.context === null;
				} else {
					result = result 
						&& subscription.priority === 10
						&& subscription.context === null;
				}
			}
			return result;
		}
	});
});
