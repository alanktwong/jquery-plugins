define("app/hero", ["app/app"], function(App) {
	var _self = {
			topic : App.topics.hero.topic,
			init : function(notification) {
				if (App.endsWith(notification.publishTopic(),"init")) {
					$.debug("HeroUnitSvc.init: " + App.getType(notification));
					var $heroUnit = $('#hero-unit');
					$('#test', $heroUnit).unbind('click').bind('click', function(evt) {
						_self.test();
					});
					$('#clear', $heroUnit).unbind('click').bind('click', function(evt) {
						console.clear();
						_self.clear();
					});
				}
			},
			test : function() {
				$.publish(App.topics.test.topic, App.publishOptions);
			},
			clear : function() {
				var options = $.extend(App.publishOptions, {
					data : {
						message : "Messages on this topic appear below:"
					}
				});
				$.publish(App.topics.clear.topic, options);
			}
	};
	
	$.subscribe(_self.topic, _self.init);
	
	return {
		topic : _self.topic
	};
});
