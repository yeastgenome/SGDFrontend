/** @jsx React.DOM */
"use strict";
var Radium = require("radium");
var React = require("react");
var _ = require("underscore");
// router stuff
var Router = require("react-router");
var { Route, RouteHandler, Link, Transition } = Router;

var AsyncVariantViewer = require("./async_variant_viewer.jsx");

var REM_SIZE = 16;
var HEIGHT_WITH_SEQUENCE = 680;
var HEIGHT_WITHOUT_SEQUENCE = 345;
var LABEL_WIDTH = 150;

var Drawer = React.createClass({
	mixins: [Router.Navigation, Router.State],

	propTypes: {
		store: React.PropTypes.object.isRequired,
		isProteinMode: React.PropTypes.bool
	},

	render: function () {
		return (
			<div>
				<div onClick={this._exit} style={[style.mask]} />
				<div style={[style.drawerWrapper]}>
					<div>
						<h1>
							<a onClick={this._exit} style={[style.exit]}><i className="fa fa-times"></i></a>
						</h1>
						{this._renderContentNode()}		
					</div>
				</div>
			</div>
		);
	},

	_renderContentNode: function () {
		var _sgdid = this.getParams().locusId;
		return (
			<AsyncVariantViewer sgdid={_sgdid} store={this.props.store} parentIsProtein={this.props.isProteinMode} />
		);
	},

	_exit: function () {
		this.transitionTo("variantViewerIndex", {});
	}
});

var style = {
	mask: {
		position: "fixed",
		top: 0,
		right: 0,
		left: 0,
		height: _maskHeight,
		zIndex: 10
	},
	drawerWrapper: {
		position: "fixed",
		bottom: 0,
		left: 0,
		right: 0,
		height: _drawerHeight,
		background: "#efefef",
		padding: "1rem",
		zIndex: 10,
		overflow: "scroll"
	},
	exit: {
		position: "absolute",
		top: "0.5rem",
		right: "1rem",
		color: "black"
	}
}
var _screenHeight = window.innerHeight;
var _drawerHeight = HEIGHT_WITH_SEQUENCE;
var _maskHeight = _screenHeight - _drawerHeight;

module.exports = Radium(Drawer);
