//Explicitly defines the "app/global" module:
define("app/app", [], function() {
	//Define app/global object in here.
	var _self = {
			logger : null,
			reset : function() {
				_self.logger = null;
			},
			init : function() {
				_self.logger = $.configureLog4jq({
					enabled: true,
					level : "debug",
					targets : [
						{
							name: "console",
							enabled: true
						}
					]
				});
				$.publish(_self.topics.starWars.darthVader.luke.topic + "/init", _self.publishOptions);
				$.publish(_self.topics.starWars.darthVader.leia.topic + "/init", _self.publishOptions);
				$.publish(_self.topics.starWars.jangoFett.bobaFett.topic + "/init", _self.publishOptions);
				$.publish(_self.topics.starWars.jangoFett.captainRex.topic + "/init", _self.publishOptions);
				
				$.publish(_self.topics.hero.topic + "/init", _self.publishOptions);
			},
			publishOptions : {
				progress : function(notification) {
					$.info("progress: " + _self.getType(notification));
				},
				done : function(notification) {
					$.info("done: " + _self.getType(notification));
				},
				fail : function(notification) {
					$.warn("fail: " + _self.getType(notification));
				},
				always : function(notification) {
					$.info("always: " + _self.getType(notification));
				}
			},
			getType : function(notification) {
				var msg = (notification.isSynchronous() ? "synchronous" : "asynchronous");
				msg = msg + " notification @ " + notification.currentTopic() + " <- " + notification.publishTopic();
				return msg;
			},
			topics : {
				starWars : {
					topic : "/StarWars",
					darthVader : {
						topic : "/StarWars/DarthVader",
						luke : {
							topic : "/StarWars/DarthVader/Luke"
							
						},
						leia : {
							topic : "/StarWars/DarthVader/Leia"
						}
					},
					jangoFett : {
						topic : "/StarWars/JangoFett",
						bobaFett : {
							topic : "/StarWars/JangoFett/BobaFett"
						},
						captainRex : {
							topic : "/StarWars/JangoFett/CaptainRex"
						}
					}
				},
				hero : {
					topic : "/hero"
				},
				clear : {
					topic : "/app/clear"
				},
				test : {
					topic : "/app/test"
				}
			},
			endsWith : function(test, match) {
				var result = new RegExp(match + "$").test(test);
				return result;
			},
			combine : function(notification, data) {
				var message = "";
				var notifyData = notification.data();
				if (notification.publishTopic() === notification.currentTopic()) {
					message = data.id + ": " + data.msg
				} else {
					message = notifyData.id + "->" + data.id + ": " + data.msg;
				}
				return message;
			}
	};

	function _RollingLog($log) {
		this.$log = $log;
		
		this.append = function(msg) {
			var $rollingLog = $('p:last',this.$log);
			if ($rollingLog.length > 0) {
				$rollingLog.after("<p>" + msg + "</p>");
			} else {
				this.$log.append("<p>" + msg + "</p>");
			}
		}
		
		this.clear = function() {
			this.$log.empty()
		}
	}

	return {
		publishOptions : _self.publishOptions,
		combine : _self.combine,
		init : _self.init,
		topics : _self.topics,
		getType : _self.getType,
		endsWith : _self.endsWith,
		RollingLog : _RollingLog
	};
});

