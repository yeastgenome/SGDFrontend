/** @jsx React.DOM */
"use strict";

var React = require("react");
var _ = require("underscore");

var Checklist = React.createFactory(require("../widgets/checklist.jsx"));
var DidClickOutside = require("../mixins/did_click_outside.jsx");

var WIDTH = 350;
var IMAGE_WIDTH = 174;
var IMAGE_HEIGHT = 274;

var StrainSelector = React.createClass({
	mixins: [DidClickOutside],

	propTypes: {
		data: React.PropTypes.array.isRequired,
		initialActiveStrainIds: React.PropTypes.array,
		onSelect: React.PropTypes.func // (activeStrainIds) =>
	},

	getDefaultProps: function () {
		return {
			initialActiveStrainIds: []
		};
	},

	getInitialState: function () {
		return {
			isActive: false,
			activeStrainIds: this.props.initialActiveStrainIds
		};
	},

	render: function () {
		return (<div className="strain-selector" style={{ position: "relative" }}>
			{this._getActiveNode()}
			<a className="button dropdown small secondary" onClick={this._toggleActive}><i className="fa fa-check-square" /> Strains</a>
		</div>);
	},

	didClickOutside: function () {
		this.setState({ isActive: false });
	},

	_toggleActive: function (e) {
		e.preventDefault();
		e.nativeEvent.stopImmediatePropagation();
		this.setState({ isActive: !this.state.isActive });
	},

	_getActiveNode: function () {
		if (!this.state.isActive) return null;

		var _style = {
			position: "absolute",
			top: "3rem",
			padding: "1rem",
			background: "#efefef",
			width: WIDTH,
			zIndex: 2
		};

		var _stopClick = e => {
			e.nativeEvent.stopImmediatePropagation();
		};
		var _onSelect = keys => {
			if (this.props.onSelect) {
				this.props.onSelect(keys);
			}
			this.setState({ activeStrainIds: keys });
		};
		// re-order data to match dendrogram order
		var DESIRED_ID_ORDER = [1, 8, 12, 2, 11, 3, 4, 7, 5, 13, 6];
		var _sortedData = _.sortBy(this.props.data, d => {
			var _index = DESIRED_ID_ORDER.indexOf(d.key);
			return _index >= 0 ? _index : Math.Infinity;
		});
		var _imgStyle = {
			width: IMAGE_WIDTH,
			height: IMAGE_HEIGHT,
			marginTop: 8,
			marginLeft: 20
		};
		return (
			<div onClick={_stopClick} style={_style}>
				<div className="row">
					<div className="small-6 columns">
						<img style={_imgStyle} src="/static/img/strains_dendrogram.png" />
					</div>
					<div className="small-6 columns">
						<span style={{ fontSize: "0.875rem" }}>S288C (reference)</span>
						<Checklist elements={_sortedData} initialActiveElementKeys={this.state.activeStrainIds} onSelect={_onSelect} />
					</div>
				</div>
			</div>
		);
	}
});

module.exports = StrainSelector;
