beforeEach(function() {
	this.addMatchers({
		toBeTrivial: function(level) {
			var result = false;
			var PubSub = this.actual;
			return result;
		}
	});
});
