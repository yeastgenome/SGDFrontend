/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

var AlignmentIndexModel = require("../../models/alignment_index_model.jsx");
var Drawer = require("./drawer.jsx");
var RadioSelector = require("../widgets/radio_selector.jsx");
var SearchBar = require("../widgets/search_bar.jsx");
var VariantHeatmap = require("./variant_heatmap.jsx");
var StrainSelector = require("./strain_selector.jsx");

module.exports = React.createClass({
	getInitialState: function () {
		return {
			drawerVisible: false,
			selectedLocusId: null,
			isPending: true,
			isProteinMode: false,
			lociData: [],
			strainData: []
		};
	},

	render: function () {
		if (this.state.isPending) {
			return <img className="loader" src="/static/img/dark-slow-wheel.gif" />;
		}

		var heatmapNode = this._getHeatmapNode();

		var _onExit = () => {
			this.setState({ drawerVisible: false });
		};
		var _onRadioSelect = key => { this.setState({ isProteinMode: key === "protein" }); };
		var _radioElements = [ { name: "DNA", key: "dna" }, { name: "Protein", key: "protein" }];

		// TEMP strain selector cb
		// ([123, 456]) =>
		var _onStrainSelect = activeStrainIds => {
			console.log(activeStrainIds);
		};
		var _strainData = _.map(this.state.strainData, d => {
			return { key: d.id, name: d.display_name };
		});

		// TEMP hardcoded locus id for RAD54 and display name
		var drawerNode = this.state.drawerVisible ? <Drawer onExit={_onExit} locusDisplayName="RAD54" locusId={4672} strainData={_strainMetaData} /> : null;
		return (<div>
			<p><i className="fa fa-exclamation" /> This is a development version of this tool.  Data are NOT accurate.</p>
			<h1>Variant Map</h1>
			<hr />
						
			<div className="row">
				<div className="columns small-12 medium-6">
					<SearchBar />
				</div>
				<div className="columns small-6 medium-2">
					<StrainSelector data={_strainData} onSelect={_onStrainSelect} />
				</div>
				<div className="columns small-6 medium-4">
					<div style={{ marginTop: "0.35rem" }}>
						<RadioSelector elements={_radioElements} initialActiveElementKey="dna" onSelect={_onRadioSelect} />
					</div>
				</div>
			</div>
			<div className="panel" style={{ zIndex: 1 }}>
				{heatmapNode}
			</div>
			{drawerNode}
		</div>);
	},

	componentDidMount: function () {
		var indexModel = new AlignmentIndexModel();
		indexModel.fetch( (err, res) => {
			this.setState({
				isPending: false,
				lociData: res.loci,
				strainData: res.strains
			});
		});
	},

	_getHeatmapNode: function () {
		// TEMP
		var _onClick = (d) => {
			this.setState({
				drawerVisible: true,
				selectedLocusId: d.id
			});
		};

		var _heatmapData = _.map(this.state.lociData, d => {
			return {
				name: d.display_name,
				id: d.id,
				variationData: this.state.isProteinMode ? d.protein_scores : d.dna_scores
			};
		});
		var _strainData = _.map(this.state.strainData, d => {
			return {
				name: d.display_name,
				id: d.id
			};
		});
		return (<VariantHeatmap
			data={_heatmapData}
			strainData={_strainData}
			onClick={_onClick}
		/>);
	}
});
