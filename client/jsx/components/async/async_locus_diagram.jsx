/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

var SequenceDetailsModel = require("../../models/sequence_details_model.jsx");
var SequenceNeighborsModel = require("../../models/sequence_neighbors_model.jsx");
var LocusDiagram = require("../viz/locus_diagram.jsx");

/*
	Fetches data from model and renders locus diagram (or loader while fetching).
*/
module.exports = React.createClass({

	getDefaultProps: function () {
		return {
			baseUrl: null,
			focusLocusDisplayName: null,
			hasControls: true,
			locusId: null,
			showSubFeatures: false,
		};
	},

	getInitialState: function () {
		return {
			data: null, // { locci: [] }
			domainBounds: null, // [0, 100]
			watsonTracks: 1,
			crickTracks: 1
		};
	},

	render: function () {
		if (this._isPending()) {
			return <div><img className="loader" src="/static/img/dark-slow-wheel.gif" /></div>;
		} else {
			return (<LocusDiagram
				data={this.state.data}
				domainBounds={this.state.domainBounds}
				focusLocusDisplayName={this.props.focusLocusDisplayName}
				hasControls={this.props.hasControls}
				showSubFeatures={this.props.showSubFeatures}
			/>);
		}
	},

	componentDidMount: function () {
		this._fetchData();
	},

	// from locusId, get data and update
	_fetchData: function () {
		var options = {
			id: this.props.locusId,
			baseUrl: this.props.baseUrl
		};

		// init either details or neighbors model
		var sequenceDetailsModel = new SequenceDetailsModel(_.clone(options));
		var sequenceNeighborsModel = new SequenceNeighborsModel(_.clone(options));
		var model = this.props.showSubFeatures ? sequenceDetailsModel: sequenceNeighborsModel;
 
 		// fetch data and set result
		model.fetch( (err, response) => {
			if (this.isMounted()) this.setState({
				data: response.data,
				domainBounds: response.domainBounds
			});
		});

	},

	// return true if it has necessary data to render
	_isPending: function () {
		return !(this.state.data && this.state.domainBounds);
	}

});
