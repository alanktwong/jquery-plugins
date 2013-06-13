/**
 * @author awong
 */
var App = (function ($,_) {
	
	var _self = {};
	_self = $.extend(_self, {
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
				$.info("progress: " + App.getType(notification));
			},
			done : function(notification) {
				$.info("done: " + App.getType(notification));
			},
			fail : function(notification) {
				$.warn("fail: " + App.getType(notification));
			},
			always : function(notification) {
				$.info("always: " + App.getType(notification));
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
	});
	
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
}(jQuery,_));

/* ================================================================== */
var TopNavbarSvc = (function ($,_,App) {
	var _self = {};
	_self = $.extend(_self, {
		
	});
	
	return {
		
	};
}(jQuery,_,App));

/* ================================================================== */
var HeroUnitSvc = (function ($,_,App) {
	var _self = {};
	_self = $.extend(_self, {
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
	});
	
	$.subscribe(_self.topic, _self.init);
	
	return {
		topic : _self.topic
	};
}(jQuery,_,App));

/* ================================================================== */
var StarWarsSvc = (function ($,_,App) {
	var _self = {};
	_self = $.extend(_self, {
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
	});
	
	$.subscribe(_self.topic, _self.init);
	$.subscribe(_self.topic, _self.displayFight);

	$.subscribe(App.topics.clear.topic, _self.clear);
	
	return {
		topic : _self.topic
	};
}(jQuery,_,App));

/* ================================================================== */
var DarthVaderSvc = (function ($,_,App) {
	var _self = {};
	_self = $.extend(_self, {
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
	});
	
	$.subscribe(_self.topic, _self.init);
	$.subscribe(_self.topic, _self.ignite);

	$.subscribe(App.topics.clear.topic, _self.clear);
	
	return {
		topic : _self.topic
	};
}(jQuery,_,App));

/* ================================================================== */
var JangoFettSvc = (function ($,_,App) {
	var _self = {};
	_self = $.extend(_self, {
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
			}
		}
	});
	
	$.subscribe(_self.topic, _self.init);
	$.subscribe(_self.topic, _self.blast);
	
	$.subscribe(App.topics.clear.topic, _self.clear);
	
	return {
		topic : _self.topic
	};
}(jQuery,_,App));

/* ================================================================== */
var LukeSvc = (function ($,_,App) {
	var _self = {};
	_self = $.extend(_self, {
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
		}
	});
	$.subscribe(_self.topic, _self.init);
	$.subscribe(_self.topic, _self.ignite);

	$.subscribe(App.topics.clear.topic, _self.clear);
	
	return {
		topic : _self.topic
	};
}(jQuery,_,App));

/* ================================================================== */
var LeiaSvc = (function ($,_,App) {
	var _self = {};
	_self = $.extend(_self, {
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
	});
	$.subscribe(_self.topic, _self.init);
	$.subscribe(_self.topic, _self.blast);

	$.subscribe(App.topics.clear.topic, _self.clear);
	
	return {
		topic : _self.topic
	};
}(jQuery,_,App));

/* ================================================================== */
var BobaFettSvc = (function ($,_,App) {
	var _self = {};
	_self = $.extend(_self, {
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
	});
	$.subscribe(_self.topic, _self.init);
	$.subscribe(_self.topic, _self.blast);

	$.subscribe(App.topics.clear.topic, _self.clear);
	
	return {
		topic : _self.topic
	};
}(jQuery,_,App));

/* ================================================================== */
var CaptainRexSvc = (function ($,_,App) {
	var _self = {};
	_self = $.extend(_self, {
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
			}
		}
	});
	$.subscribe(_self.topic, _self.init);
	$.subscribe(_self.topic, _self.blast);

	$.subscribe(App.topics.clear.topic, _self.clear);
	
	return {
		topic : _self.topic
	};
}(jQuery,_,App));

/* ================================================================== */
var FooterSvc = (function ($,_,App) {
	var _self = {};
	_self = $.extend(_self, {
		
	});
	
	return {
		
	};
}(jQuery,_,App));

/* ================================================================== */

