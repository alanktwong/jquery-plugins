
function loadInDocument(doesNotExist, jsSrc) {
	if (doesNotExist) {
		document.write(unescape('%3Cscript type="text/javascript" src="' + jsSrc + '"%3E%3C/script%3E'));
	}
}


loadInDocument(!window.JSON, "//cdnjs.cloudflare.com/ajax/libs/json2/20110223/json2.min.js");
loadInDocument(!window.JSON, "//cdn.jsdelivr.net/json2/0.1/json2.min.js");
