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
			}
		},
		endsWith : function(test, match) {
			var result = new RegExp(match + "$").test(test);
			return result;
		},
		combine : function(notification, data) {
			var message = "";
			var notifyData = notification.data();
			if (notification.publishTopic() !== notification.currentTopic()) {
				message = data.id + ": " + data.msg
			} else {
				message = notifyData.id + ": " + data.msg;
			}
			return message;
		}
	});
	
	
	return {
		publishOptions : _self.publishOptions,
		combine : _self.combine,
		init : _self.init,
		topics : _self.topics,
		getType : _self.getType,
		endsWith : _self.endsWith
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
		
	});
	
	return {
		
	};
}(jQuery,_,App));

/* ================================================================== */
var StarWarsSvc = (function ($,_,App) {
	var _self = {};
	_self = $.extend(_self, {
		topic : App.topics.starWars.topic,
		init : function(notification) {
			if (App.endsWith(notification.publishTopic(),"init")) {
				$.debug("StarWarsSvc.init: " + App.getType(notification));
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
				$.debug("StarWarsSvc displayed fight");
				var msg = App.combine(notification, _self.data);
				var $log = $('.console-log', '#starWars');
				var $rollingLog = $('p:last',$log);
				$rollingLog.after("<p>" + msg + "</p>");
			}
		}
	});
	
	$.subscribe(_self.topic, _self.init);
	$.subscribe(_self.topic, _self.displayFight);
	
	return {
		topic : _self.topic
	};
}(jQuery,_,App));

/* ================================================================== */
var DarthVaderSvc = (function ($,_,App) {
	var _self = {};
	_self = $.extend(_self, {
		topic : App.topics.starWars.darthVader.topic,
		init : function(notification) {
			if (App.endsWith(notification.publishTopic(),"init")) {
				$.debug("DarthVaderSvc.init: " + App.getType(notification));
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
				$.debug("DarthVaderSvc ignited lightsaber");
				var msg = App.combine(notification, _self.data);
				var $log = $('.console-log', '#darthVader');
				var $rollingLog = $('p:last',$log);
				$rollingLog.after("<p>" + msg + "</p>");
			}
		}
	});
	
	$.subscribe(_self.topic, _self.init);
	$.subscribe(_self.topic, _self.ignite);
	
	return {
		topic : _self.topic
	};
}(jQuery,_,App));

/* ================================================================== */
var JangoFettSvc = (function ($,_,App) {
	var _self = {};
	_self = $.extend(_self, {
		topic : App.topics.starWars.jangoFett.topic,
		init : function(notification) {
			if (App.endsWith(notification.publishTopic(),"init")) {
				$.debug("JangoFett.init: " + App.getType(notification));
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
				$.debug("JangoFettSvc fired blaster");
				var msg = App.combine(notification, _self.data);
				var $log = $('.console-log', '#jangoFett');
				var $rollingLog = $('p:last',$log);
				$rollingLog.after("<p>" + msg + "</p>");
			}
		}
	});
	
	$.subscribe(_self.topic, _self.init);
	$.subscribe(_self.topic, _self.blast);
	
	return {
		topic : _self.topic
	};
}(jQuery,_,App));

/* ================================================================== */
var LukeSvc = (function ($,_,App) {
	var _self = {};
	_self = $.extend(_self, {
		topic : App.topics.starWars.darthVader.luke.topic,
		init : function(notification) {
			if (App.endsWith(notification.publishTopic(),"init")) {
				$.debug("LukeSvc.init: " + App.getType(notification));
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
				$.debug("LukeSvc ignited lightsaber");
				var msg = App.combine(notification, _self.data);
				var $log = $('.console-log', '#luke');
				var $rollingLog = $('p:last',$log);
				$rollingLog.after("<p>" + msg + "</p>");
			}
		}
	});
	$.subscribe(_self.topic, _self.init);
	$.subscribe(_self.topic, _self.ignite);
	
	return {
		topic : _self.topic
	};
}(jQuery,_,App));

/* ================================================================== */
var LeiaSvc = (function ($,_,App) {
	var _self = {};
	_self = $.extend(_self, {
		topic : App.topics.starWars.darthVader.leia.topic,
		init : function(notification) {
			if (App.endsWith(notification.publishTopic(),"init")) {
				$.debug("LeiaSvc.init: " + App.getType(notification));
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
				$.debug("LeiaSvc fired blaster");
				var msg = App.combine(notification, _self.data);
				var $log = $('.console-log', '#leia');
				var $rollingLog = $('p:last',$log);
				$rollingLog.after("<p>" + msg + "</p>");
			}
		}
	});
	$.subscribe(_self.topic, _self.init);
	$.subscribe(_self.topic, _self.blast);
	
	return {
		topic : _self.topic
	};
}(jQuery,_,App));

/* ================================================================== */
var BobaFettSvc = (function ($,_,App) {
	var _self = {};
	_self = $.extend(_self, {
		topic : App.topics.starWars.jangoFett.bobaFett.topic,
		init : function(notification) {
			if (App.endsWith(notification.publishTopic(),"init")) {
				$.debug("BobaFettSvc.init: " + App.getType(notification));
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
				$.debug("BobaFettSvc fired blaster");
				var msg = App.combine(notification, _self.data);
				var $log = $('.console-log', '#bobaFett');
				var $rollingLog = $('p:last',$log);
				$rollingLog.after("<p>" + msg + "</p>");
			}
		}
	});
	$.subscribe(_self.topic, _self.init);
	$.subscribe(_self.topic, _self.blast);
	
	return {
		topic : _self.topic
	};
}(jQuery,_,App));

/* ================================================================== */
var CaptainRexSvc = (function ($,_,App) {
	var _self = {};
	_self = $.extend(_self, {
		topic : App.topics.starWars.jangoFett.captainRex.topic,
		init : function(notification) {
			if (App.endsWith(notification.publishTopic(),"init")) {
				$.debug("CaptainRexSvc.init: " + App.getType(notification));
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
				$.debug("CaptainRexSvc fired blaster");
				var msg = App.combine(notification, _self.data);
				var $log = $('.console-log', '#captainRex');
				var $rollingLog = $('p:last',$log);
				$rollingLog.after("<p>" + msg + "</p>");
			}
		}
	});
	$.subscribe(_self.topic, _self.init);
	$.subscribe(_self.topic, _self.blast);
	
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