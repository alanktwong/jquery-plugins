requirejs.config({
	/*
	 * By default load any module IDs from js/lib
	 */
	baseUrl: 'js/lib',
	/*
	 * except, if the module ID starts with "app", then load it from the js/app directory.
	 * paths config is relative to the baseUrl, and never includes a ".js" extension since
	 * the paths config could be for a directory
	 */
	paths: {
		app: '../app'
	}
});


// Start the main app logic.
requirejs(['app/app','app/hero','app/starWars','app/darthVader','app/jangoFett','app/captainRex','app/bobaFett','app/luke','app/leia'],
function(App, hero, starWars, darthVader, jangoFett, captainRex, bobaFett, luke, leia) {
	// sub.js should be loaded as well as any *.js file inside js/lib
	App.init();
	var x = starWars.topic;
	$.debug(x);
});