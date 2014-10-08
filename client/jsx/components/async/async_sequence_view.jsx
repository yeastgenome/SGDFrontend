/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

var SequenceDetailsModel = require("../../models/sequence_details_model.jsx");
var SequenceNeighborsModel = require("../../models/sequence_neighbors_model.jsx");

/*
	Fetches data from model and renders locus diagram (or loader while fetching).
*/
module.exports = React.createClass({

	getDefaultProps: function () {
		return {
			focusLocusDisplayName: null,
			showAltStrains: true,
			locusId: null,
		};
	},

	getInitialState: function () {
		return {
			neighborsModel: null,
			detailsModel: null
		};
	},

	// TEMP
	render: function () {

		var mainStrainNode = this._getMainStrainNode();
		var altStrainNode = this._getAltStrainNode();

		// get node for alt strains

		return <span></span>;
	},

	componentDidMount: function () {
		this._fetchData();
	},

	// from locusId, get data and update
	_fetchData: function () {
		// TODO

		// fetch the neighbor model
		// set the model to state
		// fetch the details model
		// set the model to state

	},

	_getMainStrainNode: function () {
		// if no model, return a giant spinner panel
		// if neighbors model, render first viz in panel, with another spinner panel
		// if both models, render neigbors, sub-features, and sequence toggler
	},

	_getAltStrainNode: function () {

	}

});
