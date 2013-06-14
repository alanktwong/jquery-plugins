define('app/captainRex',['app/app'], function(App) {
	var _self = {
			topic : App.topics.starWars.jangoFett.captainRex.topic,
			log : null,
			init : function(notification) {
				if (App.endsWith(notification.publishTopic(),"init")) {
					$.debug("CaptainRexSvc.init: " + App.getType(notification));
					_self.log = new App.RollingLog( $('.console-log', '#captainRex') );
					$('.blast', '#captainRex').unbind('click').bind('click', function(evt) {
						var options = $.extend({}, App.publishOptions, { data : _self.data });
						$.publish(_self.topic, options);
					});
				}
			},
			data : {
				id : "REX",
				msg : "in my book, experience outranks everything!"
			},
			blast : function(notification) {
				if (!App.endsWith(notification.publishTopic(),"init")) {
					$.debug("CaptainRexSvc fired blaster: " + App.getType(notification));
					var msg = App.combine(notification, _self.data);
					_self.log.append(msg);
				}
			},
			clear : function(notification) {
				if (App.endsWith(notification.publishTopic(),"clear")) {
					$.debug("CaptainRexSvc.clear: " + App.getType(notification));
					_self.log.clear();
					_self.log.append(notification.data().msg);
				}
			},
			test : function(notification) {
				$('.blast', '#captainRex').click();
			}
	};
	$.subscribe(_self.topic, _self.init);
	$.subscribe(_self.topic, _self.blast);

	$.subscribe(App.topics.clear.topic, _self.clear);
	$.subscribe(App.topics.test.topic, _self.test);
	
	return {
		topic : _self.topic
	};
});