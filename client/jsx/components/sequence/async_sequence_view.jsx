/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

var SequenceDetailsModel = require("../../models/sequence_details_model.jsx");
var SequenceNeighborsModel = require("../../models/sequence_neighbors_model.jsx");
var SequenceComposite = require("./sequence_composite.jsx");

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

		// TODO
		// get node for alt strains

		return (<div>
			{mainStrainNode}
		</div>);
	},

	componentDidMount: function () {
		this._fetchData();
	},

	// from locusId, get data and update
	_fetchData: function () {
		var _neighborsModel = new SequenceNeighborsModel({ id: this.props.locusId });
		_neighborsModel.fetch( (err, response) => {
			if (this.isMounted()) {
				this.setState({ neighborsModel: _neighborsModel });
				var _detailsModel = new SequenceDetailsModel({ id: this.props.locusId });
				_detailsModel.fetch( (err, response) => {
					if (this.isMounted()) this.setState({ detailsModel: _detailsModel });
				});
			}
		});
	},

	_getMainStrainNode: function () {
		var node = (<div>
			<SequenceComposite
				focusLocusDisplayName={this.props.focusLocusDisplayName}
				neighborsModel={this.state.neighborsModel}
				detailsModel={this.state.detailsModel}
				showAltStrains={false}
			/>
		</div>);

		return node;
	},

	_getAltStrainNode: function () {
		// TEMP
		return null;
	}

});
