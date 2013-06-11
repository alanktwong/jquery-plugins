var CommonUtil = (function ($,_) {
	var _helper = {
		loadInDocument : function(doesNotExist, jsSrc) {
			if (doesNotExist) {
				document.write(unescape('%3Cscript type="text/javascript" src="' + jsSrc + '"%3E%3C/script%3E'));
			}
		},
		configureLogger : function() {
			var log4jq = $.configureLog4jq({
				enabled: true,
				level : "debug",
				targets : [
					{
						name: "console",
						enabled: true
					}
				]
			});
			return log4jq;
		}
	};
	
	
	return {
		loadInDocument : _helper.loadInDocument,
		configureLogger : _helper.configureLogger
	}
	
}(jQuery,_));

CommonUtil.loadInDocument(!window.JSON, "//cdnjs.cloudflare.com/ajax/libs/json2/20110223/json2.min.js");
CommonUtil.loadInDocument(!window.JSON, "//cdn.jsdelivr.net/json2/0.1/json2.min.js");
