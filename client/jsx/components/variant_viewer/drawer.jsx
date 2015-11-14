var Radium = require("radium");
var React = require("react");
var _ = require("underscore");

var VariantViewerStore = require("../../stores/variant_viewer_store.jsx");
var AsyncVariantViewer = require("./async_variant_viewer.jsx");

var REM_SIZE = 16;
var MAX_HEIGHT = 800;
var LABEL_WIDTH = 150;

var Drawer = React.createClass({

	propTypes: {
		store: React.PropTypes.object.isRequired,
		isProteinMode: React.PropTypes.bool
	},

	getDefaultProps() {
	    return {
	        store: new VariantViewerStore(),  
	    };
	},

	render: function () {
		var screenHeight = this._getScreenHeight();
		var maxDrawerHeight = Math.min(screenHeight * 0.9, MAX_HEIGHT);
		var drawerHeight = maxDrawerHeight
		var maskHeight = screenHeight - drawerHeight;
		return (
			<div>
				<div onClick={this._exit} style={[style.mask, { height: screenHeight }]}>
				</div>
				<div style={[style.drawerWrapper, { height: drawerHeight }]}>
					<div style={[style.exitWrapper]}>
						<a onClick={this._exit} style={[style.exit]}><i className="fa fa-times"></i></a>
					</div>
					<div style={[style.contentWrapper]}>
						{this._renderContentNode()}		
					</div>
				</div>
			</div>
		);
	},

	_getScreenHeight: function () {
		return (window) ? window.innerHeight : MAX_HEIGHT;
	},

	_renderContentNode: function () {
		var _sgdid = this.props.params.locusId;
		return (
			<AsyncVariantViewer sgdid={_sgdid} store={this.props.store} parentIsProtein={this.props.isProteinMode} />
		);
	},

	_exit: function () {
		this.props.history.pushState(null, "/");
	}
});

var style = {
	mask: {
		position: "fixed",
		top: 0,
		right: 0,
		left: 0,
		zIndex: 10
	},
	drawerWrapper: {
		position: "fixed",
		bottom: 0,
		left: 0,
		right: 0,
		background: "#efefef",
		padding: "1rem",
		zIndex: 10,
		overflow: "scroll"
	},
	exitWrapper: {
		position: "absolute",
		top: "1rem",
		right: "1rem"
	},
	exit: {
		color: "black",
		fontSize: 24,
		position: "relative",
		zIndex: 101
	},
	contentWrapper: {
		height: "100%",
		overflow: "scroll",
		paddingTop: "0.5rem"
	}
}

module.exports = Radium(Drawer);
