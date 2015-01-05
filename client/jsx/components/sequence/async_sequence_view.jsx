/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

var HelpIcon = require("../widgets/help_icon.jsx");
var HistoryTable = require("./history_table.jsx");
var SequenceDetailsModel = require("../../models/sequence_details_model.jsx");
var SequenceNeighborsModel = require("../../models/sequence_neighbors_model.jsx");
var SequenceComposite = require("./sequence_composite.jsx");
var SequenceToggler = require("./sequence_toggler.jsx");

/*
	Fetches data from model and renders locus diagram (or loader while fetching).
*/
module.exports = React.createClass({

	getDefaultProps: function () {
		return {
			detailsCallback: null, // (err, detailsModel)
			geneticPosition: null,
			isSimplified: false, // simplified is for LSP
			locusDisplayName: null,
			locusHistoryData: null,
			locusFormatName: null,
			showAltStrains: true,
			showOtherStrains: true,
			showHistory: true,
			locusId: null,
		};
	},

	getInitialState: function () {
		return {
			neighborsModel: null,
			detailsModel: null
		};
	},

	render: function () {
		var mainStrainNode = this._getMainStrainNode();
		var altStrainsNode = this._getAltStrainsNode();
		var otherStrainsNode = this._getOtherStrainsNode();
		var historyNode = this._getHistoryNode();

		return (<div>
			{mainStrainNode}
			{altStrainsNode}
			{otherStrainsNode}
			{historyNode}
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
				var _detailsModel = new SequenceDetailsModel({
					id: this.props.locusId,
					locusDiplayName: this.props.locusDisplayName,
					locusFormatName: this.props.locusFormatName,
					locusSGDID: this.props.locusSGDID
				});
				_detailsModel.fetch( (err, response) => {
					if (this.isMounted()) this.setState({ detailsModel: _detailsModel });

					// call details callback (if defined)
					if (this.props.detailsCallback) {
						this.props.detailsCallback(err, _detailsModel);
					}
				});
			}
		});
	},

	_getMainStrainNode: function () {
		var innerNode = (<SequenceComposite
			isSimplified={this.props.isSimplified}
			focusLocusDisplayName={this.props.locusDisplayName}
			focusLocusFormatName={this.props.locusFormatName}
			geneticPosition={this.props.geneticPosition}
			neighborsModel={this.state.neighborsModel}
			detailsModel={this.state.detailsModel}
			showAltStrains={false}
		/>);

		if (this.props.isSimplified) {
			return <div>{innerNode}</div>;
		} else {
			return (<section id="reference">
				{innerNode}
			</section>);
		}
	},

	_getAltStrainsNode: function () {
		var node = null;
		if (!this.props.showAltStrains) return node;
		if (this.state.detailsModel ? this.state.detailsModel.attributes.altStrainMetaData.length : false) {
			var _defaultAltStrainKey = this.state.detailsModel.attributes.altStrainMetaData[0].key;
			node = (<section id="alternative"><SequenceComposite
				focusLocusDisplayName={this.props.locusDisplayName}
				neighborsModel={this.state.neighborsModel}
				detailsModel={this.state.detailsModel}
				defaultAltStrainKey={_defaultAltStrainKey}
				showAltStrains={true}
				showSubFeatures={false}
			/></section>);
		}

		return node;
	},

	_getOtherStrainsNode: function () {
		var node = null
		if (!this.props.showOtherStrains) return node;
		if (this.state.detailsModel ? this.state.detailsModel.attributes.otherStrains.length : false) {
			var outerHelpNode = <HelpIcon text="Other laboratory, industrial, and environmental isolates; sequences available via the Download button." isInfo={true} />;
			var innerHelpNode = <HelpIcon text="Select a strain using the pull-down in order to download its sequence as an .fsa file using the Download button located directly below." />;
			node = (<section id="other">
				<h2>Other Strains {outerHelpNode}</h2>
				<hr />
				<div className="panel sgd-viz">
					<h3>Strains Available for Download {innerHelpNode}</h3>
					<SequenceToggler
						sequences={this.state.detailsModel.attributes.otherStrains}
						locusDisplayName={this.props.locusDisplayName} showSequence={false}
						buttonId="other_download"
					/>
				</div>
			</section>);
		}

		return node;
	},

	_getHistoryNode: function () {
		var node = null;
		if (this.props.showHistory && this.props.locusHistoryData) {
			node = <HistoryTable data={this.props.locusHistoryData} dataType="SEQUENCE" />;
		}

		return node;
	},

});
