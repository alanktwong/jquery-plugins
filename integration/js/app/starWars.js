define("app/starWars", ["app/app"], function(App) {
	var _self = {
			topic : App.topics.starWars.topic,
			log : null,
			init : function(notification) {
				if (App.endsWith(notification.publishTopic(),"init")) {
					$.debug("StarWarsSvc.init: " + App.getType(notification));
					_self.log = new App.RollingLog( $('.console-log', '#starWars') );
					$('.fight', '#starWars').unbind('click').bind('click', function(evt) {
						var options = $.extend({}, App.publishOptions, { data : _self.data });
						$.publish(_self.topic, options);
					});
				}
			},
			data : {
				id : "STAR WARS",
				msg : "a long time ago ... in a galaxy far, far away ..."
			},
			displayFight : function(notification) {
				if (!App.endsWith(notification.publishTopic(),"init")) {
					$.debug("StarWarsSvc displayed fight: " + App.getType(notification));
					var msg = App.combine(notification, _self.data);
					_self.log.append(msg);
				}
			},
			clear : function(notification) {
				if (App.endsWith(notification.publishTopic(),"clear")) {
					$.debug("StarWarsSvc.clear: " + App.getType(notification));
					_self.log.clear();
				}
			}
	};
	
	$.subscribe(_self.topic, _self.init);
	$.subscribe(_self.topic, _self.displayFight);

	$.subscribe(App.topics.clear.topic, _self.clear);
	
	return {
		topic : _self.topic
	};
});
