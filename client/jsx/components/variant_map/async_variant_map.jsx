/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

var AlignmentIndexModel = require("../../models/alignment_index_model.jsx");
var RadioSelector = require("../widgets/radio_selector.jsx");
var SearchBar = require("../widgets/search_bar.jsx");
var VariantHeatmap = require("./variant_heatmap.jsx");
var StrainSelector = require("./strain_selector.jsx");

// router stuff
var Router = require("react-router");
var { Route, RouteHandler, Link, Transition } = Router;
RouteHandler = RouteHandler;

// id to filter out
var REFERENCE_STRAIN_ID = 1;

var AsyncVariantMap = React.createClass({
	mixins: [Router.Navigation, Router.State],

	getInitialState: function () {
		return {
			activeStrainIds: [],
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
		// filter out S288C
		_strainData = _.filter(_strainData, d => { return d.key !== REFERENCE_STRAIN_ID; });

		var heatmapNode = this._getHeatmapNode();
		var drawerNode = this._getDrawerNode();

		return (<div>
			<h1>Variant Viewer</h1>
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
			{heatmapNode}
			{drawerNode}
		</div>);
	},

	componentDidMount: function () {
		var indexModel = new AlignmentIndexModel();
		// TEMP time
		var startTime = new Date().getTime();
		indexModel.fetch( (err, res) => {
			var endTime = new Date().getTime();
			console.log("data response time: ", endTime - startTime)

			// format some strain data
			var _strains = _.map(res.strains, d => {
				d["type"] = "alternative";
				return d;
			});
			var _activeStrains = _.filter(_strains, d => {
				return (d.type !== "other" && d.id !== 1);
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
		// navigate with router
		var _onClick = d => {
			this.transitionTo("shallowDrawer",{ locusId: d.id});
		};

		var _lociData = this._getLociData();
		var _heatmapData = _.map(_lociData, d => {
			return {
				displayName: d.display_name,
				formatName: d.format_name,
				headline: d.headline,
				href: d.link,
				id: d.id,
				type: d.locus_type,
				name: d.display_name,
				qualifier: d.qualifier,
				variationData: this.state.isProteinMode ? d.protein_scores : d.dna_scores
			};
		});
		var _strainData = _.filter(this.state.strainData, d => {
			return (this.state.activeStrainIds.indexOf(d.id) > -1) && (d.id !== REFERENCE_STRAIN_ID);
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
		var _locusId = this.getParams().locusId;
		if (_locusId) _locusId = parseInt(_locusId);
		var _locusData = _.findWhere(this.state.lociData, { id: _locusId });
		var _locusName = _locusData ? _locusData.display_name : "";
		var _locusHref = _locusData ? _locusData.link : "";
		var _strainIds = [REFERENCE_STRAIN_ID].concat(this.state.activeStrainIds);
		return (<RouteHandler
			locusData={_locusData}
			locusId={_locusId}
			locusName={_locusName}
			locusHref={_locusHref}
			isProteinMode={this.state.isProteinMode}
			strainIds={_strainIds}
		/>);
		// var node = null;
		// if (this.state.activeLocusId) {
		// 	var _strainIds = [REFERENCE_STRAIN_ID].concat(this.state.activeStrainIds);
		// 	var _onExit = () => { this.setState({ activeLocusId: null }); };
		// 	var locusData = _.findWhere(this.state.lociData, { id: this.state.activeLocusId })
		// 	node = (<Drawer
		// 		onExit={_onExit} locusId={this.state.activeLocusId}
		// 		isProteinMode={this.state.isProteinMode} strainIds={_strainIds}
		// 		locusName={locusData.display_name} locusHref={locusData.link}
		// 	/>);
		// }
		// return node;
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

module.exports = AsyncVariantMap;
