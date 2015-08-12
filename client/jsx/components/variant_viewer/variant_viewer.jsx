/** @jsx React.DOM */
"use strict";

var React = require("react");
var Router = require("react-router");
var _ = require("underscore");

var SearchBar = require("../widgets/search_bar.jsx");
var ScrollyHeatmap = require("./scrolly_heatmap.jsx");

var VariantViewer = React.createClass({
	propTypes: {
		store: React.PropTypes.object.isRequired		
	},

	getInitialState: function () {
		return {
			isPending: false
		};
	},

	render: function () {
		return (
			<div>
				<h1>Variant Viewer</h1>
				<hr />
				{this._renderControls()}
				{this._renderDendro()}
				{this._renderHeatmap()}
			</div>
		);
	},

	_renderControls: function () {
		return this._renderSearchBar();
	},

	_renderDendro: function () {
		return null;
	},

	_renderHeatmap: function () {
		var _heatmapData = this.props.store.getHeatmapData()
		var _strainData = this.props.store.getHeatmapStrainData()
		return <ScrollyHeatmap data={_heatmapData} strainData={_strainData} />;
	},

	_renderSearchBar: function () {
		var _onSubmit = query => {
			this.props.store.setQuery(query);
			this.props.store.fetchSearchResults( (err) => {
				if (this.isMounted()) this.forceUpdate();
			});
		}
		var _text = "Enter gene name, GO term, or list of gene names";
		return <SearchBar placeholderText={_text} onSubmit={_onSubmit} />;
	}
});

module.exports = VariantViewer;
