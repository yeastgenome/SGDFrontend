const $ = require('jquery');
const attachFastClick = require('fastclick');
const setupSearch = require('./setup_search.jsx');
require('foundation');

module.exports = function () {
	// foundation setup
	$(document).foundation();

	// add fast click event listener to reduce delay of mobile "clicks" 
	attachFastClick(document.body);

	// add console, console.log, and console.warn if they don't exist, for IE9
	if (!(window.console && console.log && console.warn)) {
		window.console = {
			log: function(){},
			debug: function(){},
			info: function(){},
			warn: function(){},
			error: function(){}
		};
	}

	// does the following only after DOM completely loads
	
	$(document).ready(function(){
		// if the url contains an anchor        
		if (window.location.hash) {
			var anchor = window.location.hash;
			window.location.hash = anchor;
		}
		// exec search setup script, don't do if on the search page, or any redux page (just search for now)
		if (!window.location.href.match(/\/search/)) {
			setupSearch();
		}
	});
};
