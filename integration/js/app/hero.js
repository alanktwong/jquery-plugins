define("app/hero", ["app/app"], function(App) {
	var _self = {
			topic : App.topics.hero.topic,
			init : function(notification) {
				if (App.endsWith(notification.publishTopic(),"init")) {
					$.debug("HeroUnitSvc.init: " + App.getType(notification));
					var $heroUnit = $('#hero-unit');
					$('#test', $heroUnit).unbind('click').bind('click', function(evt) {
						
					});
					$('#clear', $heroUnit).unbind('click').bind('click', function(evt) {
						console.clear();
						_self.clear();
					});
				}
			},
			clear : function() {
				$.publish(App.topics.clear.topic, App.publishOptions);
			}
	};
	
	$.subscribe(_self.topic, _self.init);
	
	return {
		topic : _self.topic
	};
});
