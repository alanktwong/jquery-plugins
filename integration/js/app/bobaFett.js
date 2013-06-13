define('app/bobaFett',['app/app'],function(App) {
	var _self = {
			topic : App.topics.starWars.jangoFett.bobaFett.topic,
			log : null,
			init : function(notification) {
				if (App.endsWith(notification.publishTopic(),"init")) {
					$.debug("BobaFettSvc.init: " + App.getType(notification));
					_self.log = new App.RollingLog( $('.console-log', '#bobaFett') );
					$('.blast', '#bobaFett').unbind('click').bind('click', function(evt) {
						var options = $.extend({}, App.publishOptions, { data : _self.data });
						$.publish(_self.topic, options);
					});
				}
			},
			data : {
				id : "BOBA",
				msg : "he's worth a lot of money to me!"
			},
			blast : function(notification) {
				if (!App.endsWith(notification.publishTopic(),"init")) {
					$.debug("BobaFettSvc fired blaster: " + App.getType(notification));
					var msg = App.combine(notification, _self.data);
					_self.log.append(msg);
				}
			},
			clear : function(notification) {
				if (App.endsWith(notification.publishTopic(),"clear")) {
					$.debug("BobaFettSvc.clear: " + App.getType(notification));
					_self.log.clear();
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