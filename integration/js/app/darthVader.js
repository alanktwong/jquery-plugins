define("app/darthVader", ["app/app"], function(App) {
	var _self = {
			topic : App.topics.starWars.darthVader.topic,
			log : null,
			init : function(notification) {
				if (App.endsWith(notification.publishTopic(),"init")) {
					$.debug("DarthVaderSvc.init: " + App.getType(notification));
					_self.log = new App.RollingLog( $('.console-log', '#darthVader') );
					$('.lightsaber', '#darthVader').unbind('click').bind('click', function(evt) {
						var options = $.extend({}, App.publishOptions, { data : _self.data });
						$.publish(_self.topic, options);
					});
				}
			},
			data : {
				id : "VADER",
				msg : "Obi Wan has taught you well!"
			},
			ignite : function(notification) {
				if (!App.endsWith(notification.publishTopic(),"init")) {
					$.debug("DarthVaderSvc ignited lightsaber: " + App.getType(notification));
					var msg = App.combine(notification, _self.data);
					_self.log.append(msg);
				}
			},
			clear : function(notification) {
				if (App.endsWith(notification.publishTopic(),"clear")) {
					$.debug("DarthVaderSvc.clear: " + App.getType(notification));
					_self.log.clear();
				}
			}
	};
	$.subscribe(_self.topic, _self.init);
	$.subscribe(_self.topic, _self.ignite);

	$.subscribe(App.topics.clear.topic, _self.clear);
	
	return {
		topic : _self.topic
	};
});
