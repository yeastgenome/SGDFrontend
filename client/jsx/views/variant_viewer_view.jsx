/** @jsx React.DOM */
"use strict";

var React = require("react");
var $ = require("jquery");
var AsyncVariantMap = require("../components/variant_map/async_variant_map.jsx");
var Drawer = require("../components/variant_map/drawer.jsx");
var LocalStorageSetup = require("../lib/local_storage_setup.jsx");

// router stuff
var Router = require("react-router");
var { Route, DefaultRoute } = Router;

// TEMP prototype the search
var SearchBar = require("../components/widgets/search_bar.jsx");
var SimpleLocusSearch = React.createClass({

	getInitialState: function () {
	    return {
	        results: []  
	    };
	},

	render: function () {
		var resultNodes;
		var res = this.state.results;
		if (res.length > 0) {
			var resultItemNodes = this.state.results.map( (d, i) => {
				return <li key={"searchResult" + i}>{d}</li>;
			});
			resultNodes = (
				<ul>{resultItemNodes}</ul>
			)
		} else {
			resultNodes = <p>No Results</p>;
		}

		return (
			<div>
				<h1>Variant Viewer Search Test</h1>
				<SearchBar onSubmit={this._onSearch}/>
				{resultNodes}
			</div>
		);
	},

	_onSearch: function (query) {
		var url = `/search_sequence_objects?query=${query}`;
		$.getJSON(url, data => {
			if (this.isMounted()) {
				this.setState({ results: data.loci });
			}
		});
	},

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
