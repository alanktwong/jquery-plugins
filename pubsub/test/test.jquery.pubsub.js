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
	}
};




