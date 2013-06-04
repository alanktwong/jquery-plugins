

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
						topic : "/StarWars/DarthVader/BobaFett"
					}
				}
			}
		}
	});
	
	
	return {
		init : _self.init,
		topics : _self.topics
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
		
	});
	
	return {
		topic : App.topics.starWars.topic
	};
}(jQuery,_,App));

/* ================================================================== */
var DarthVaderSvc = (function ($,_,App) {
	var _self = {};
	_self = $.extend(_self, {
		
	});
	
	return {
		topic : App.topics.starWars.darthVader.topic
	};
}(jQuery,_,App));

/* ================================================================== */
var JangoFettSvc = (function ($,_,App) {
	var _self = {};
	_self = $.extend(_self, {
		
	});
	
	return {
		topic : App.topics.starWars.jangoFett.topic
	};
}(jQuery,_,App));

/* ================================================================== */
var LukeSvc = (function ($,_,App) {
	var _self = {};
	_self = $.extend(_self, {
		
	});
	
	return {
		topic : App.topics.starWars.darthVader.luke.topic
	};
}(jQuery,_,App));

/* ================================================================== */
var LeiaSvc = (function ($,_,App) {
	var _self = {};
	_self = $.extend(_self, {
		
	});
	
	return {
		topic : App.topics.starWars.darthVader.leia.topic
	};
}(jQuery,_,App));

/* ================================================================== */
var BobaFettSvc = (function ($,_,App) {
	var _self = {};
	_self = $.extend(_self, {
		
	});
	
	return {
		topic : App.topics.starWars.jangoFett.bobaFett.topic
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