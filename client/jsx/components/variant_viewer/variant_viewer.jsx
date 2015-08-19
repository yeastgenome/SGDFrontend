/** @jsx React.DOM */
"use strict";

var React = require("react");
var Router = require("react-router");
var _ = require("underscore");

var Dendrogram = require("./dendrogram.jsx");
var RadioSelector = require("../widgets/radio_selector.jsx");
var SearchBar = require("../widgets/search_bar.jsx");
var ScrollyHeatmap = require("./scrolly_heatmap.jsx");
var StrainSelector = require("./strain_selector.jsx");

var VariantViewer = React.createClass({
	propTypes: {
		store: React.PropTypes.object.isRequired		
	},

	getInitialState: function () {
		return {
			isPending: true,
			labelsVisible: true
		};
	},

	render: function () {
		return (
			<div>
				<h1>Variant Viewer</h1>
				<hr />
				{this._renderControls()}
				{this._renderViz()}
			</div>
		);
	},

	componentDidMount: function () {
		// this.props.store.fetchInitialData( err => {
		// 	this.setState({ isPending: false });
		// });
	},

	_renderControls: function () {
		var radioElements = [
			{ name: "DNA", key: "dna" },
			{ name: "Protein", key: "protein" }
		];
		return (
			<div className="row">
				<div className="columns small-12 large-6">
					{this._renderSearchBar()}
				</div>
				<div className="columns small-12 large-6" style={{ display: "flex", justifyContent: "flex-start" }}>
					<StrainSelector data={[]}/>
					<div style={{ marginTop: "0.4rem", marginLeft: "1.8rem", minWidth: "13rem" }}>
						<RadioSelector elements={radioElements} initialActiveElementKey="dna" />
					</div>
					<a className="button dropdown secondary small" style={{ height: "2.4rem", marginLeft: "auto" }}><i className="fa fa-cog" /></a>
				</div>
			</div>
		);
	},

	_renderViz: function () {
		if (this.state.isPending) return <div className="sgd-loader-container"><div className="sgd-loader" /></div>;
		return (
			<div>
				{this._renderDendro()}
				<div style={{ display: "flex", justifyContent: "space-between" }}>
					{this._renderHeatmap()}
					{this._renderHeatmapNav()}
				</div>
			</div>
		);
	},

	_renderDendro: function () {
		var _data = this.props.store.getClusteredStrainData();
		var _left = this.state.labelsVisible ? LABEL_WIDTH : 0;
		var _width = this.props.store.getHeatmapStrainData().length * NODE_SIZE;
		return (
			<div style={{ marginLeft: _left }}>
				<Dendrogram data={_data} width={_width} height={100} />
			</div>
		);
	},

	_renderHeatmap: function () {
		var _heatmapData = this.props.store.getHeatmapData();
		var _strainData = this.props.store.getHeatmapStrainData();
		var _zoom = this.props.store.getHeatmapZoom()
		return <ScrollyHeatmap data={_heatmapData} strainData={_strainData} nodeSize={_zoom} />;
	},

	_renderHeatmapNav: function () {
		var _style = { backgroundColor: "#e7e7e7", padding: "0.25rem 0.5rem" };
		var __style = _.extend(_.clone(_style), { borderTop: "1px solid #b9b9b9" });
		var zoom = this.props.store.zoomHeatmap;
		var zoomIn = e => { zoom(1); this.forceUpdate(); };
		var zoomOut = e => { zoom(-1); this.forceUpdate(); };
		return (
			<div>
				<div onClick={zoomIn} style={_style}><i className="fa fa-plus" /></div>
				<div onClick={zoomOut} style={__style}><i className="fa fa-minus" /></div>
			</div>
		);
	},

	_renderSearchBar: function () {
		var _onSubmit = query => {
			this.props.store.setQuery(query);
			this.submitSearch();
		}
		var _text = "Enter gene name, GO term, or list of gene names";
		return <SearchBar placeholderText={_text} onSubmit={_onSubmit} />;
	},

	// cb(err)
	submitSearch: function (cb) {
		this.props.store.fetchSearchResults( err => {
			if (this.isMounted()) {
				this.props.store.clusterStrains( err => {
					this.forceUpdate();
					if (typeof cb === "function") return cb(err);
				});
			}
		});
	}
});

var LABEL_WIDTH = 130;
var NODE_SIZE = 16;

module.exports = VariantViewer;
