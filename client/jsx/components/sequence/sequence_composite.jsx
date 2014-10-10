/** @jsx React.DOM */
"use strict";
/*
	A react component which can render locus diagrams, sub-feature tables, and a sequence toggler.
	If it doesn't have the models, returns the right loaders
*/
var React = require("react");
var _ = require("underscore");

var DataTable = require("../data_table.jsx");
var DropdownSelector = require("../widgets/dropdown_selector.jsx");
var LocusDiagram = require("../viz/locus_diagram.jsx");
var SequenceToggler = require("./sequence_toggler.jsx");

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

	getInitialState: function () {
		return { activeStrainKey: null };
	},

	render: function () {
		if (!this.props.neighborsModel && !this.props.detailsModel) {
			return <div className="panel sgd-viz"><img className="loader" src="/static/img/dark-slow-wheel.gif" /></div>;
		} else {
			var strainSelectorNode = this._getStrainSelectorNode();
			var neighborsNode = this._getNeighborsNode();
			var detailsNode = this._getDetailsNode();
			var sequenceNode = this._getSequenceNode();
			return (<div>
				{strainSelectorNode}
				{neighborsNode}
				{detailsNode}
				{sequenceNode}
			</div>);
		}
	},

	componentDidUpdate: function () {
		var _detailsModel = this.props.detailsModel;
		if (_detailsModel && !this.state.activeStrainKey && _detailsModel.attributes.altStrainMetaData.length) {
			var _altStrainKey = _detailsModel.attributes.altStrainMetaData[0].key;
			this.setState({ activeStrainKey: _altStrainKey });
		}
	},

	_getStrainSelectorNode: function () {
		var node = null;
		if (this.props.showAltStrains && this.props.detailsModel && this.state.activeStrainKey) {
			var _elements = _.map(this.props.detailsModel.attributes.altStrainMetaData, s => {
				return {
					value: s.key,
					name: s.name
				};
			});
			var _onChange = (key) => { this.setState({ activeStrainKey: key }); };
			node = <DropdownSelector elements={_elements} onChange={_onChange} defaultActiveValue={this.state.activeStrainKey}/>;
		}

		return node;
	},

	_getNeighborsNode: function () {
		var node = <div className="panel sgd-viz"><img className="loader" src="/static/img/dark-slow-wheel.gif" /></div>;
		if (this.props.neighborsModel && (!this.props.showAltStrains || this.state.activeStrainKey)) {
			var attr = this._getActiveStrainNeighborsData();
			if (!attr) return null
			node = (<div className="panel sgd-viz">
				<h3>
					{this.props.focusLocusDisplayName} Location: <a href={attr.contigData.href}>{attr.contigData.name}</a> {attr.focusLocusDomain[0].toLocaleString()} - {attr.focusLocusDomain[1].toLocaleString()}
				</h3>
				<LocusDiagram
					contigData={attr.contigData}
					data={attr.data}
					domainBounds={attr.domainBounds}
					focusLocusDisplayName={this.props.focusLocusDisplayName}
					showSubFeatures={false}
					watsonTracks={Math.abs(attr.trackDomain[1])}
					crickTracks={Math.abs(attr.trackDomain[0])}
				/>
			</div>);
		}
		return node;
	},

	_getDetailsNode: function () {
		if (!this.props.showSubFeatures) return null;

		var innerNode = <img className="loader" src="/static/img/dark-slow-wheel.gif" />;
		var tableNode = null;
		if (this._canRenderDetails()) {
			var attr = this._getActiveStrainDetailsData();
			innerNode = (<LocusDiagram
				contigData={attr.contigData}
				data={attr.data}
				domainBounds={attr.domainBounds}
				focusLocusDisplayName={this.props.focusLocusDisplayName}
				showSubFeatures={true}
				watsonTracks={Math.abs(attr.trackDomain[1])}
				crickTracks={Math.abs(attr.trackDomain[0])}
			/>);

			tableNode = this._getSubFeaturesTable();
		}

		return (<div className="panel sgd-viz">
			{innerNode}
			{tableNode}
		</div>);
	},

	_getSequenceNode: function () {
		if (!this.props.showSequence) return null;

		var innerNode = <img className="loader" src="/static/img/dark-slow-wheel.gif" />;
		if (this._canRenderDetails()) {
			var _text = this.props.showAltStrains ? "Sequence" : "Sequence - S288C";
			var _sequences = this._getActiveStrainDetailsData().sequences;
			var _contigName = this._getActiveStrainDetailsData().contigData.formatName;
			innerNode = <SequenceToggler sequences={_sequences} text={_text} locusDisplayName={this.props.focusLocusDisplayName} contigName={_contigName}/>;
		}

		return <div className="panel sgd-viz">{innerNode}</div>;
	},

	_canRenderDetails: function () {
		return (this.props.detailsModel && (!this.props.showAltStrains || this.state.activeStrainKey));
	},

	_getSubFeaturesTable: function () {
		if (!this.props.showSubFeaturesTable && !this._canRenderDetails()) return null;

		var _options = {
			bPaginate: false,
			oLanguage: { "sEmptyTable": "No subfeatures for " + this.props.focusLocusDisplayName + '.' }
		};
		var _tableData = this._getActiveStrainDetailsData().tableData;
		return <DataTable data={_tableData} usePlugin={true} pluginOptions={_options} />;
	},

	_getActiveStrainNeighborsData: function () {
		if (this.props.showAltStrains) {
			return _.findWhere(this.props.neighborsModel.attributes.altStrains, { strainKey: this.state.activeStrainKey });
		} else {
			return this.props.neighborsModel.attributes.mainStrain;
		}
	},

	_getActiveStrainDetailsData: function () {
		if (this.props.showAltStrains) {
			return _.findWhere(this.props.detailsModel.attributes.altStrains, { strainKey: this.state.activeStrainKey });
		} else {
			return this.props.detailsModel.attributes.mainStrain;	
		}
	}
});
