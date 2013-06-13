define('app/leia',['app/app'], function(App) {
	var _self = {
			topic : App.topics.starWars.darthVader.leia.topic,
			log : null,
			init : function(notification) {
				if (App.endsWith(notification.publishTopic(),"init")) {
					$.debug("LeiaSvc.init: " + App.getType(notification));
					_self.log = new App.RollingLog( $('.console-log', '#leia') );
					$('.blast', '#leia').unbind('click').bind('click', function(evt) {
						var options = $.extend({}, App.publishOptions, { data : _self.data });
						$.publish(_self.topic, options);
					});
				}
			},
			data : {
				id : "LEIA",
				msg : "obi wan kenobi, you are my only hope!"
			},
			blast : function(notification) {
				if (!App.endsWith(notification.publishTopic(),"init")) {
					$.debug("LeiaSvc fired blaster: " + App.getType(notification));
					var msg = App.combine(notification, _self.data);
					_self.log.append(msg);
					var $log = $('.console-log', '#leia');
				}
			},
			clear : function(notification) {
				if (App.endsWith(notification.publishTopic(),"clear")) {
					$.debug("LeiaSvc.clear: " + App.getType(notification));
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