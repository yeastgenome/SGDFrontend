/** @jsx React.DOM */
"use strict";

var React = require("react");
var $ = require("jquery");
var _ = require("underscore");
require("bootstrap");

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

		var listElements = _.map(this.props.elements, element => {
			if (!element) return null;
			return (
				<li id={`navbar_${element.target}`}>
					<a href={`#${element.target}`}>{element.name}</a>
				</li>
			);
		});
		var titleNode = this.props.title.href ? <a href={this.props.title.href}>{this.props.title.name}</a> : this.props.title;
		listElements.unshift(<li key="titleNode" id="nav-title"><h4>{titleNode}</h4></li>);

		var backToTopNode = null;
		if (this.state.backToTopVisible) {
			backToTopNode = <a onClick={this._onClickToTop} href="#" className="back-to-top" style={{ position: "fixed", display: "inline", zIndex: 1 }}>Back to Top</a>;
		}

		var _position = this.state.backToTopVisible ? "fixed" : "absolute";
		var _style = { position: _position, top: "0.5rem" };
		return (<div>
			<div className="sgd-navbar" style={_style}>
				<ul className="nav side-nav">
					{listElements}
				</ul>
			</div>
		    {backToTopNode}
		</div>);
	},

	// NOTE: Has effects outside of component. $(document), $(window)
	// Setup magellan nav with jquery helper.
	// Back to top button.
	componentDidMount: function () {
		$("body").scrollspy({ target: ".sgd-navbar" })

		// fix navbar if scrolling down below 245 px
		var offset = 245; // how far (px) to scroll to trigger link
	    var _throttled = _.throttle( () => {
	    	var yOffset = window.pageYOffset;
	        if (yOffset > offset) {
	        	this.setState({ backToTopVisible: true });
	        } else {
	            this.setState({ backToTopVisible: false });
	        }
	    }, 100);
	    $(window).scroll(_throttled);
	    $("body").on("touchmove", _throttled);
	},

	_onClickToTop: function (e) {
		var duration = 500; // 0.5s fade in/out
		e.preventDefault();
        $("html, body").animate({scrollTop: 0}, duration);
        window.location.hash = "";
	}
});
