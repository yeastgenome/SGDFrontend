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

	//Get resources
	var tab_link = "{{tab_link}}";
	$.getJSON(tab_link, function(data) {
		for(var key in data) {
			if(!data[key]) {
				var element = document.getElementById(key);
				if(element != null) {
					element.style.display = "none";
				}
			}
		}
	});

	$(document).ready(function(){          // does the following only after DOM completely loads
		if (window.location.hash) {         // if the url contains an anchor
			var anchor = window.location.hash;
			window.location.hash = anchor;
		}
	});
};

