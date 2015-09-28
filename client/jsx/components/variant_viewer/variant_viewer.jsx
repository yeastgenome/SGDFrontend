/** @jsx React.DOM */
"use strict";
var React = require("react");
var Router = require("react-router");
var { RouteHandler, Navigation, State } = Router;
var d3 = require("d3");
var _ = require("underscore");

var ColorScaleLegend = require("./color_scale_legend.jsx");
var Dendrogram = require("./dendrogram.jsx");
var RadioSelector = require("../widgets/radio_selector.jsx");
var SearchBar = require("../widgets/search_bar.jsx");
var SettingsDropdown = require("./settings_dropdown.jsx");
var ScrollyHeatmap = require("./scrolly_heatmap.jsx");
var StrainSelector = require("./strain_selector.jsx");

var VariantViewer = React.createClass({
	mixins: [Navigation, State],

	propTypes: {
		store: React.PropTypes.object.isRequired,
		visibleLocusId: React.PropTypes.string	
	},

	getDefaultProps: function () {
		return { visibleLocusId: null };
	},

	getInitialState: function () {
		return {
			isPending: true,
			isProteinMode: false,
			labelsVisible: true
		};
	},

	render: function () {
		return (
			<div>
				<RouteHandler {...this.props} isProteinMode={this.state.isProteinMode} />
				<h1>Variant Viewer</h1>
				<hr />
				{this._renderControls()}
				{this._renderViz()}
			</div>
		);
	},

	componentDidMount: function () {
		this.props.store.fetchInitialData( err => {
			this.setState({ isPending: false });
		});
	},

	_renderControls: function () {
		var radioElements = [
			{ name: "DNA", key: "dna" },
			{ name: "Protein", key: "protein" }
		];
		var radioOnSelect = key => {
			this.setState({ isProteinMode: (key === "protein") }, () => {
				this.props.store.setIsProteinMode(this.state.isProteinMode);
			});
		};
		var onSettingsUpdate = this.forceUpdate.bind(this);

		return (
			<div>
				{this._renderLocus()}
				<div className="row">
					<div className="columns small-12 large-6">
						{this._renderSearchBar()}
					</div>
					<div className="columns small-12 large-6 end" style={{ display: "flex", justifyContent: "flex-start" }}>
						<div className="row">
							<div className="columns small-3">
								<StrainSelector store={this.props.store} onUpdate={onSettingsUpdate} />
							</div>
							<div className="columns small-5">
								<div style={{ marginTop: "0.5rem", marginLeft: "1.8rem", minWidth: "13rem" }}>
									<RadioSelector elements={radioElements} onSelect={radioOnSelect} initialActiveElementKey="dna" />
								</div>
							</div>
							<div className="columns small-4 end" style={{ textAlign: "right" }}>
								<SettingsDropdown store={this.props.store} onUpdate={onSettingsUpdate} />
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	},

	_renderLocus: function () {
		if (!this.props.visibleLocusId) return null;
		return <h1>{this.props.visibleLocusId}</h1>;
	},

	_renderViz: function () {
		if (this.state.isPending) return <div className="sgd-loader-container"><div className="sgd-loader" /></div>;
		return (
			<div>
				{this._renderDendro()}
				<div style={{ display: "flex", justifyContent: "flex-start" }}>
					{this._renderHeatmap()}
					{this._renderHeatmapNav()}
					<div style={{ marginLeft: "auto" }}>
						<ColorScaleLegend />
					</div>
				</div>
			</div>
		);
	},

	_renderDendro: function () {
		var _data = this.props.store.getClusteredStrainData();
		var _left = this.state.labelsVisible ? LABEL_WIDTH : 0;
		var _width = this.props.store.getHeatmapStrainData().length * (NODE_SIZE + 0.5);
		var _height = 150;
		return (
			<div style={{ marginLeft: _left, height: _height, marginBottom: 5 }}>
				<Dendrogram data={_data} width={_width} height={_height} />
			</div>
		);
	},

	_renderHeatmap: function () {
		var _heatmapData = this.props.store.getHeatmapData();
		var _strainData = this.props.store.getHeatmapStrainData();
		var _zoom = this.props.store.getHeatmapZoom();
		var _onClick = d => {
			this.transitionTo("variantViewerShow", { locusId: d.id });
		};
		return <ScrollyHeatmap data={_heatmapData} onClick={_onClick} strainData={_strainData} nodeSize={_zoom} />;
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

	// this._pendingTimer
	// cb(err)
	submitSearch: function (cb) {
		if (this._pendingTimer) clearTimeout(this._pendingTimer);
		this._pendingTimer = setTimeout( () => {
			this.setState({ isPending: true });
		}, MIN_PENDING_TIME);
		this.props.store.fetchSearchResults( err => {
			if (this.isMounted()) {
				// this.props.store.clusterStrains( err => {
					if (this._pendingTimer) clearTimeout(this._pendingTimer);
					this.setState({ isPending: false });
					if (typeof cb === "function") return cb(err);
				// });
			}
		});
	}
});

var LABEL_WIDTH = 100;
var NODE_SIZE = 16;
var SCROLL_CONTAINER_HEIGHT = 800;
var MIN_PENDING_TIME = 250; // millis before loading state invoked

module.exports = VariantViewer;
