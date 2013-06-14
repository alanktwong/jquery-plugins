define('app/luke',['app/app'],function(App) {
	var _self = {
			topic : App.topics.starWars.darthVader.luke.topic,
			log : null,
			init : function(notification) {
				if (App.endsWith(notification.publishTopic(),"init")) {
					$.debug("LukeSvc.init: " + App.getType(notification));
					_self.log = new App.RollingLog( $('.console-log', '#luke') );
					$('.lightsaber', '#luke').unbind('click').bind('click', function(evt) {
						var options = $.extend({}, App.publishOptions, { data : _self.data });
						$.publish(_self.topic, options);
					});
				}
			},
			data : {
				id : "LUKE",
				msg : "you will find that I am full of surprises!"
			},
			ignite : function(notification) {
				if (!App.endsWith(notification.publishTopic(),"init")) {
					$.debug("LukeSvc ignited lightsaber: " + App.getType(notification));
					var msg = App.combine(notification, _self.data);
					_self.log.append(msg);
				}
			},
			clear : function(notification) {
				if (App.endsWith(notification.publishTopic(),"clear")) {
					$.debug("LukeSvc.clear: " + App.getType(notification));
					_self.log.clear();
				}
			},
			test : function(notification) {
				$('.lightsaber', '#luke').click();
			}
	};
	$.subscribe(_self.topic, _self.init);
	$.subscribe(_self.topic, _self.ignite);

	$.subscribe(App.topics.clear.topic, _self.clear);
	$.subscribe(App.topics.test.topic, _self.test);
	
	return {
		topic : _self.topic
	};
});
