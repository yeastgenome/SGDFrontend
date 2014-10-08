/** @jsx React.DOM */
"use strict";
/*
	A react component which can render locus diagrams, sub-feature tables, and a sequence toggler.
	If it doesn't have the models, returns the right loaders
*/
var React = require("react");

var DataTable = require("../data_table.jsx");
var LocusDiagram = require("../viz/locus_diagram.jsx");

module.exports = React.createClass({

	getDefaultProps: function () {
		return  {
			neighborsModel: null,
			detailsModel: null,
			focusLocusDisplayName: null,
			showAltStrains: false,
			showSequence: true,
			showSubFeatures: true,
			showSubFeaturesTable: true,
		};
	},

	render: function () {
		if (!this.props.neighborsModel && !this.props.detailsModel) {
			return <div className="panel sgd-viz"><img className="loader" src="/static/img/dark-slow-wheel.gif" /></div>;
		} else {
			var neighborsNode = this._getNeighborsNode();
			var detailsNode = this._getDetailsNode();
			var sequenceNode = this._getSequenceNode();
			return (<div>
				{neighborsNode}
				{detailsNode}
				{sequenceNode}
			</div>);
		}
	},

	_getNeighborsNode: function () {
		var innerNode = <img className="loader" src="/static/img/dark-slow-wheel.gif" />;
		if (this.props.neighborsModel) {
			var attr = this.props.neighborsModel.attributes;
			innerNode = (<LocusDiagram
				contigData={attr.contigData}
				data={attr.data}
				domainBounds={attr.domainBounds}
				focusLocusDisplayName={this.props.focusLocusDisplayName}
				showSubFeatures={false}
				watsonTracks={Math.abs(attr.trackDomain[0])}
				crickTracks={Math.abs(attr.trackDomain[1])}
			/>);
		}
		return <div className="panel sgd-viz">{innerNode}</div>;
	},

	_getDetailsNode: function () {
		if (!this.props.showSubFeatures) return null;

		var innerNode = <img className="loader" src="/static/img/dark-slow-wheel.gif" />;
		var tableNode = null;
		if (this.props.detailsModel) {
			var attr = this.props.detailsModel.attributes;
			innerNode = (<LocusDiagram
				contigData={attr.contigData}
				data={attr.data}
				domainBounds={attr.domainBounds}
				focusLocusDisplayName={this.props.focusLocusDisplayName}
				showSubFeatures={true}
				watsonTracks={Math.abs(attr.trackDomain[0])}
				crickTracks={Math.abs(attr.trackDomain[1])}
			/>);

			tableNode = this._getSubFeaturesTable();
		}

		return (<div className="panel sgd-viz">
			{innerNode}
			{tableNode}
		</div>);
	},

	// TODO
	_getSequenceNode: function () {
		if (!this.props.showSequence) return null;

		return (<div className="panel sgd-viz">
			<img className="loader" src="/static/img/dark-slow-wheel.gif" />
		</div>);
	},

	_getSubFeaturesTable: function () {
		if (!this.props.showSubFeaturesTable) return null;

		var _options = {
			bPaginate: false,
			oLanguage: { "sEmptyTable": "No subfeatures for " + this.props.focusLocusDisplayName + '.' }
		};
		return <DataTable data={this.props.detailsModel.attributes.tableData} usePlugin={true} pluginOptions={_options} />;
	}
});
