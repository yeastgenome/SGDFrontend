/** @jsx React.DOM */
"use strict";

var $ = require("jquery");

/*
	Base model is an ES6 class that provides a backbone like utility for fetching data from an external API.
*/
module.exports = class BaseModel {

	constructor (options) {
		this.url = options.url;
	}

	/*
		Use $.getJSON to get JSON from this.url, then format the response with this.parse
	*/
	// callback(err, response)
	fetch (callback) {
		$.getJSON(this.url, (data) => {
			var _formattedData = this.parse(data);
			this.attributes = _formattedData;
			callback(null, _formattedData);
		});
	}

	/*
		Any transformations on the response should be overwritten in this method.
	*/
	parse (response) {
		return response;
	}
};
