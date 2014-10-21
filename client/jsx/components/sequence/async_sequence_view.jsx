/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

var DataTable = require("../widgets/data_table.jsx");
var HelpIcon = require("../widgets/help_icon.jsx");
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
				var _detailsModel = new SequenceDetailsModel({ id: this.props.locusId });
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
		var node = (<section id="reference" data-magellan-destination="reference">
			<SequenceComposite
				focusLocusDisplayName={this.props.locusDisplayName}
				focusLocusFormatName={this.props.locusFormatName}
				neighborsModel={this.state.neighborsModel}
				detailsModel={this.state.detailsModel}
				showAltStrains={false}
			/>
		</section>);

		return node;
	},

	_getAltStrainsNode: function () {
		var node = null;
		if (!this.props.showAltStrains) return node;
		if (this.state.detailsModel ? this.state.detailsModel.attributes.altStrainMetaData.length : false) {
			var _defaultAltStrainKey = this.state.detailsModel.attributes.altStrainMetaData[0].key;
			node = (<section id="alternative" data-magellan-destination="alternative"><SequenceComposite
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
			node = (<section id="other" data-magellan-destination="other">
				<h2>Other Strains {outerHelpNode}</h2>
				<div className="panel sgd-viz">
					<h3>Strains Available for Download {innerHelpNode}</h3>
					<SequenceToggler
						sequences={this.state.detailsModel.attributes.otherStrains}
						locusDisplayName={this.props.locusDisplayName} showSequence={false}
					/>
				</div>
			</section>);
		}

		return node;
	},

	_getHistoryNode: function () {
		var node = null;
		if (this.props.showHistory && this.props.locusHistoryData) {
			// format history data for table
			var _tableRows = _.map(this.props.locusHistoryData, e => {
				var noteNode = <span dangerouslySetInnerHTML={{__html: e.note }} />;
				var refsNode = _.map(e.references, (r, i) => {
					var pubmedNode = r.pubmed_id ? <small> PMID:{r.pubmed_id}</small> : null;
					var sepNode = (i > 0 && i !== e.references.length - 1) ? ", " : null;
					return <span><a href={r.link}>{r.display_name}</a>{pubmedNode}{sepNode}</span>;
				});
				return [e.date_created, noteNode, refsNode];
			});
			var _tableData = {
				headers: [["Date", "Note", "References"]],
				rows: _tableRows
			};

			var _dataTableOptions = {
				bPaginate: false,
				oLanguage: { "sEmptyTable": "No history for " + this.props.locusDisplayName + '.' }
			};
			node = (<section id="history" data-magellan-destination="history">
				<h2>
					History <HelpIcon isInfo={true} text="Documentation of sequence and/or annotation changes that have been made or proposed in the Reference strain S288C, and that directly affect this gene by altering the start, stop, intron structure, or amino acid sequence. Also includes information regarding sequence changes in adjacent intergenic regions. May also contain notes and references for the mapping of this gene." />
				</h2>
				<DataTable data={_tableData} usePlugin={true} pluginOptions={_dataTableOptions}/>
			</section>);
		}

		return node;
	},

});
