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
			activeLocusId: null,
			drawerVisible: false,
			isPending: true,
			isProteinMode: false,
			lociData: [],
			searchQuery: null,
			strainData: []
		};
	},

	render: function () {
		if (this.state.isPending) {
			return <img className="loader" src="/static/img/dark-slow-wheel.gif" />;
		}

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

		var heatmapNode = this._getHeatmapNode();
		var drawerNode = this._getDrawerNode();

		return (<div>
			<p><i className="fa fa-exclamation" /> This is a development version of this tool.  Data are NOT accurate.</p>
			<h1>Variant Map</h1>
			<hr />
						
			<div className="row">
				<div className="columns small-12 medium-6">
					<SearchBar placeholderText="Gene Name, List of Genes" onSubmit={this._onSearch} />
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
				activeLocusId: d.id
			});
		};

		var _lociData = this._getLociData();
		var _heatmapData = _.map(_lociData, d => {
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
	},

	_getDrawerNode: function () {
		var node = null;
		if (this.state.activeLocusId) {
			var _strainData = _.map(this.state.strainData, d => {
				return { key: d.id, name: d.display_name };
			});
			var _onExit = () => { this.setState({ activeLocusId: null }); };
			node = (<Drawer
				onExit={_onExit} locusId={this.state.activeLocusId}
				isProteinMode={this.state.isProteinMode} strainData={_strainData}
			/>);
		}
		return node;
	},

	_getLociData: function () {
		if (!this.state.searchQuery) {
			return this.state.lociData;
		} else if ((/[\s,]/).test(this.state.searchQuery)) {
			// multiple inputs
			var queries = this.state.searchQuery.split(/[\s,]/);
			queries = _.filter(queries, d => { return (d !== ""); });
			return _.filter(this.state.lociData, d => {
				var _isMatch = false;
				queries.forEach( _d => {
					if (d.display_name.indexOf(_d) > -1) {
						_isMatch = true;
					}
				});
				return _isMatch;
			});
		} else {
			return _.filter(this.state.lociData, d => {
				return (d.display_name.indexOf(this.state.searchQuery) > -1);
			});
		}
	},

	_onSearch: function (query) {
		query = query.toUpperCase();
		if (query.length === "") query = null;
		this.setState({
			searchQuery: query
		});
	}
});
