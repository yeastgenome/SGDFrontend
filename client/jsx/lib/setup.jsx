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

	// does the following only after DOM completely loads
	// if the url contains an anchor
	$(document).ready(function(){          
		if (window.location.hash) {
			var anchor = window.location.hash;
			window.location.hash = anchor;
		}
	});
};

