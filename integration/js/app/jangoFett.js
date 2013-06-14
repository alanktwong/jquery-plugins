define('app/jangoFett',['app/app'], function(App) {
	var _self = {
			topic : App.topics.starWars.jangoFett.topic,
			log : null,
			init : function(notification) {
				if (App.endsWith(notification.publishTopic(),"init")) {
					$.debug("JangoFett.init: " + App.getType(notification));
					_self.log = new App.RollingLog( $('.console-log', '#jangoFett') );
					$('.blast', '#jangoFett').unbind('click').bind('click', function(evt) {
						var options = $.extend({}, App.publishOptions, { data : _self.data });
						$.publish(_self.topic, options);
					});
				}
			},
			data : {
				id : "JANGO",
				msg : "I'm just a simple man trying to make my way in the universe"
			},
			blast : function(notification) {
				if (!App.endsWith(notification.publishTopic(),"init")) {
					$.debug("JangoFettSvc fired blaster: " + App.getType(notification));
					var msg = App.combine(notification, _self.data);
					_self.log.append(msg);
				}
			},
			clear : function(notification) {
				if (App.endsWith(notification.publishTopic(),"clear")) {
					$.debug("JangoFettSvc.clear: " + App.getType(notification));
					_self.log.clear();
					_self.log.append(notification.data().msg);
				}
			}
	};
	$.subscribe(_self.topic, _self.init);
	$.subscribe(_self.topic, _self.blast);
	
	$.subscribe(App.topics.clear.topic, _self.clear);

	return {
		topic : _self.topic
	};
});
