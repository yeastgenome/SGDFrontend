/** @jsx React.DOM */
"use strict";

var _ = require("underscore");

var BaseModel = require("./base_model.jsx");

module.exports = class AlignmentIndexModel extends BaseModel {

	constructor (options) {
		var options = options || {};
		options.url = options.url || "/backend/alignments?callback=?";
		super(options);
	}

	parse (response) {
		console.log("VM model res: ", response)
		return response;
	}
};
