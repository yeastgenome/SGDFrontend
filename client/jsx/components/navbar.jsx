/** @jsx React.DOM */
"use strict";

var React = require("react");
var $ = require("jquery");
var _ = require("underscore");
require("foundation");

module.exports = React.createClass({

	getDefaultProps: function () {
		return {
			title: "",
			elements: []
		};
	},

	render: function () {

		var listElements = _.map(this.props.elements, (element) => {
			return (
				<li data-magellan-arrival={element.target} id={`navbar_${element.target}`}>
					<a href={`#${element.target}`}>{element.name}</a>
				</li>
			);
		});

		return (
			<nav id="sidebar">
				<div data-magellan-expedition="fixed">
			        <ul className="side-nav" id="side-nav-sticky">
			        	<li id="nav-title"><h4>{this.props.title}</h4></li>
			        	{listElements}
			        </ul>
			    </div>
		    </nav>
		);
	},

	// NOTE: Has effects outside of component. $(document)
	// setup magellan nav with jquery helper
	componentDidMount: function () {
		$(document).foundation();
		$(".side-nav").foundation("magellan", {threshold: 50});
	}
});
