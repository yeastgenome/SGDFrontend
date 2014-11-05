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

	getInitialState: function () {
		return {
			backToTopVisible: false
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

		var backToTopNode = null;
		if (this.state.backToTopVisible) {
			backToTopNode = <a href="#" className="back-to-top" style={{ position: "fixed", display: "inline", zIndex: 1 }}>Back to Top</a>;
		}

		return (<div>
			<nav id="sidebar">
				<div data-magellan-expedition="fixed">
			        <ul className="side-nav" id="side-nav-sticky">
			        	<li id="nav-title"><h4>{titleNode}</h4></li>
			        	{listElements}
			        </ul>
			    </div>
		    </nav>

		    {backToTopNode}
		</div>);
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

	    var _throttled = _.throttle( () => {
	    	var yOffset = window.pageYOffset;
	        if (yOffset > offset) {
	        	this.setState({ backToTopVisible: true });
	        } else {
	            this.setState({ backToTopVisible: false });
	        }
	    }, 500);
	    $(window).scroll(_throttled);

	    $(".back-to-top").click( e => {
	        e.preventDefault();
	        $("html, body").animate({scrollTop: 0}, duration);
	        return false;
	    });
	}
});
