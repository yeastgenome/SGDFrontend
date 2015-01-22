/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

var AlignmentIndexModel = require("../../models/alignment_index_model.jsx");
var ColorScaleLegend = require("./color_scale_legend.jsx");
var Drawer = require("./drawer.jsx");
var RadioSelector = require("../widgets/radio_selector.jsx");
var SearchBar = require("../widgets/search_bar.jsx");
var VariantHeatmap = require("./variant_heatmap.jsx");
var StrainSelector = require("./strain_selector.jsx");

module.exports = React.createClass({
	getInitialState: function () {
		return {
			activeStrainIds: [],
			activeLocusId: null,
			drawerVisible: false,
			isPending: true,
			isProteinMode: false,
			lociData: [],
			searchQuery: null,
			strainData: [],
			indexModel: null
		};
	},

	render: function () {
		if (this.state.isPending) {
			return <img className="loader" src="/static/img/dark-slow-wheel.gif" />;
		}

		var _onRadioSelect = key => { this.setState({ isProteinMode: key === "protein" }); };
		var _radioElements = [{ name: "DNA", key: "dna" }, { name: "Protein", key: "protein" }];

		var _onStrainSelect = _activeStrainIds => {
			this.setState({ activeStrainIds: _activeStrainIds });
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
					<StrainSelector data={_strainData} onSelect={_onStrainSelect} initialActiveStrainIds={this.state.activeStrainIds} />
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
			<ColorScaleLegend />
			{drawerNode}
		</div>);
	},

	componentDidMount: function () {
		var indexModel = new AlignmentIndexModel();
		indexModel.fetch( (err, res) => {
			// TEMP, add some fake strains
			var _strains = _.map(res.strains, d => {
				d["type"] = "alternative";
				return d;
			});
			for (var i = 0; i < 10; i++) {
				_strains.push({
					display_name: "Strain" + i,
					link: "http://yeastgenome.org",
					id: 100 + i,
					format_name: "strain" + i,
					type: "other"
				});
			}

			var _activeStrains = _.filter(_strains, d => {
				return d.type !== "other";
			});

			var _activeStrainIds = _.map(_activeStrains, d => {
				return d.id;
			});

			this.setState({
				activeStrainIds: _activeStrainIds,
				isPending: false,
				lociData: res.loci,
				strainData: _strains,
				indexModel: indexModel
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
				href: d.link,
				id: d.id,
				variationData: this.state.isProteinMode ? d.protein_scores : d.dna_scores
			};
		});
		var _strainData = _.filter(this.state.strainData, d => {
			return this.state.activeStrainIds.indexOf(d.id) > -1;
		});
		_strainData = _.map(_strainData, d => {
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
		var model = this.state.indexModel;
		model.getAllLoci();
		if (!this.state.searchQuery) {
			return model.getAllLoci(this.state.activeStrainIds);
		} else {
			return model.searchLoci(this.state.searchQuery, this.state.activeStrainIds);
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
