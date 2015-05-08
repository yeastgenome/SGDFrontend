/** @jsx React.DOM */
"use strict";

var $ = require("jquery");
var attachFastClick = require("fastclick");
require("foundation");

var search = require("./search.jsx");

module.exports = function () {

	// foundation setup
	$(document).foundation();

	// add fast click event listener to reduce delay of mobile "clicks" 
	attachFastClick(document.body);

	// exec search setup script
	search();

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
	// if the url contains an anchor
	$(document).ready(function(){          
		if (window.location.hash) {
			var anchor = window.location.hash;
			window.location.hash = anchor;
		}
	});

	// TEMP animate survey link
	$("#j-survey").slideDown();
};

