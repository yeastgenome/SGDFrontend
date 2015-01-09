/** @jsx React.DOM */
"use strict";

var _ = require("underscore");

var BaseModel = require("./base_model.jsx");

module.exports = class AlignmentShowModel extends BaseModel {

	constructor (options) {
		options.url = options.url || "/backend/alignments" + options.id + "?callback=?";
		super(options);
	}
};
