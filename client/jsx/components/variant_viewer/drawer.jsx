/** @jsx React.DOM */
"use strict";
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
		store: React.PropTypes.object.isRequired
	},

	render: function () {
		var _screenHeight = window.innerHeight;
		var _drawerHeight = Math.min((this.state.showSequence ? 0.9 * _screenHeight : HEIGHT_WITHOUT_SEQUENCE), HEIGHT_WITH_SEQUENCE);
		var _maskHeight = _screenHeight - _drawerHeight;
		var _maskStyle = {
			position: "fixed",
			top: 0,
			right: 0,
			left: 0,
			height: _maskHeight,
			zIndex: 10
		};
		var _drawerWrapperStyle = {
			position: "fixed",
			bottom: 0,
			left: 0,
			right: 0,
			height: _drawerHeight,
			background: "#efefef",
			padding: "1rem",
			zIndex: 10,
			overflow: "scroll"
		};
		var _exitStyle = {
			position: "absolute",
			top: "0.5rem",
			right: "1rem",
			color: "black"
		};

		return (<div>
			<div style={_maskStyle} onClick={this._exit} />
			<div style={_drawerWrapperStyle}>
				<div>
					<h1>
						<a onClick={this._exit} style={_exitStyle}><i className="fa fa-times"></i></a>
					</h1>
					<h1 style={{ display: "inline-block" }}><a href={this.props.locusHref}>{this.props.locusName}</a></h1>
					<span style={{ display: "inline-block", fontSize: REM_SIZE, marginLeft: REM_SIZE }}>{this.props.locusHeadline}</span>
					{this._renderContentNode()}		
				</div>
			</div>
		</div>);
	},

	_renderContentNode: function () {
		var _sgdid = this.props.params.id;
		return (
			<AsyncVariantViewer sgdid={_sgdid} store={this.props.store} />
		);
	},

	_exit: function () {
		this.setState({ isPending: true });
		this.transitionTo("variantViewerIndex");
	}
});

module.exports = Drawer;
