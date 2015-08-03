/** @jsx React.DOM */
"use strict";

var React = require("react");
var $ = require("jquery");
var AsyncVariantMap = require("../components/variant_map/async_variant_map.jsx");
var Drawer = require("../components/variant_map/drawer.jsx");
var LocalStorageSetup = require("../lib/local_storage_setup.jsx");
var AlignmentClusterModel = require("../models/alignment_cluster_model.jsx");
var d3 = require("d3");

// router stuff
var Router = require("react-router");
var { Route, DefaultRoute } = Router;

// TEMP prototype the search
var SearchBar = require("../components/widgets/search_bar.jsx");
var SimpleLocusSearch = React.createClass({

	getInitialState: function () {
	    return {
	        results: [],
	        totalResults: 0,
	        clusterData: null
	    };
	},

	render: function () {
		var resultNodes = null;
		var res = this.state.results;
		if (res.length > 0) {
			var matchingText;
			var resultItemNodes = this.state.results.map( (d, i) => {
				matchingText = null;
				var innerNodes;
				if (d.highlight) {
					innerNodes = d.highlight.go_terms.map( (_d, _i) => {
						return <span key={"matchingText" + _i + i} dangerouslySetInnerHTML={{ __html: _d }} />;
					});
					matchingText = <small>{innerNodes}</small>;
				}
				return <li key={"searchResult" + i}>{d.name} {matchingText}</li>;
			});
			resultNodes = (
				<ul>{resultItemNodes}</ul>
			)
		}
		return (
			<div>
				<h1>Variant Viewer Search Test</h1>
				<SearchBar onSubmit={this._onSearch}/>
				{this._renderDendo()}
				<p>{this.state.totalResults} results</p>
				{resultNodes}
			</div>
		);
	},

	_onSearch: function (query) {
		var url = `/search_sequence_objects?query=${query}`;
		$.getJSON(url, data => {
			if (this.isMounted()) {
				this.setState({ results: data.loci, totalResults: data.total });
				var clusterModel = new AlignmentClusterModel();
				if (data.loci.length > 0) {
					var clusters = clusterModel.clusterFeatures(data.loci);
					this.setState({ clusterData: clusters });
				} else {
					this.setState({ clusterData: null });
				}
			}
		});
	},

	_renderDendo: function () {
		if (!this.state.clusterData) return null;

		var width = 600;
		var height = 400;
		var labelHeight = 70;
		var dendoFn = d3.layout.cluster().size([width, height]);

		var nodes = dendoFn.nodes(this.state.clusterData);
		var links = dendoFn.links(nodes);
		var diagonal = d3.svg.diagonal()
		    .projection(function(d) { return [d.x, d.y]; });

		var _transform, _fill;
		var nodesNodes = nodes.map( (d, i) => {
			_transform = `translate(${d.x}, ${d.y})`;
			var textNode = d.isLeaf ? <text transform="rotate(90)">{d.value.name}</text> : null;
			return (<g key={"dendoNode" + i} transform={_transform}>
				{textNode}
			</g>)
		});

		var pathString;
		var linkNodes = links.map( (d, i) => {
			pathString = diagonal(d);
			return <path key={"pNode" + i} d={pathString} fill="none" stroke="black" />;
		});
		
		return (
			<svg width={width} height={height + labelHeight}>
				{nodesNodes}
				{linkNodes}
			</svg>
		);
	}

});


var view = {};
view.render = function () {
	React.render(<SimpleLocusSearch />, document.getElementById("j-main"));
};

// var view = {};
// view.render = function () {
// 	// validate local storage cache
// 	var cacheBustingToken = CACHE_BUSTER || Math.random().toString();
// 	(new LocalStorageSetup()).checkCache(cacheBustingToken);

// 	// blank react component to make no drawer
// 	var BlankComponent = React.createClass({ render: function () { return <span />; }});

// 	var routes = (
// 		<Route path="/" handler={AsyncVariantMap}>
// 			<DefaultRoute
// 				name="variantViewerIndex" handler={BlankComponent}
// 		    />
// 		    <Route
// 		    	name="shallowDrawer" path="/:locusId" handler={Drawer}
// 		    />
// 		</Route>
// 	);

// 	Router.run(routes, (Handler) => {
// 		React.render(<Handler />, document.getElementById("j-main"));
// 	});
// };

module.exports = view;
