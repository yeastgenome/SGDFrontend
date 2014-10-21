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

		// title can be link or plain text, depending on if title has href property
		var titleNode = this.props.title.href ? <a href={this.props.title.href}>{this.props.title.name}</a> : this.props.title;

		var listElements = _.map(this.props.elements, (element) => {
			if (!element) return null;
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
			        	<li id="nav-title"><h4>{titleNode}</h4></li>
			        	{listElements}
			        </ul>
			    </div>
		    </nav>
		);
	},

	// NOTE: Has effects outside of component. $(document), $(window)
	// Setup magellan nav with jquery helper.
	// Back to top button.
	componentDidMount: function () {
		$(document).foundation();
		$(".side-nav").foundation("magellan", {threshold: 50});

		// back to top button
		var offset = 245; // how far (px) to scroll to trigger link
	    var duration = 500; // 0.5s fade in/out
	    $(window).scroll( function () {
	        if ($(this).scrollTop() > offset) {
	            $(".back-to-top").fadeIn(duration);
	        } else {
	            $(".back-to-top").fadeOut(duration);
	        }
	    });
	    $(".back-to-top").click( e => {
	        e.preventDefault();
	        $("html, body").animate({scrollTop: 0}, duration);
	        return false;
	    });
	}
});
