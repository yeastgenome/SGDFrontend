/** @jsx React.DOM */
"use strict";
var Radium = require("radium");
var React = require("react");
var _ = require("underscore");

var Checklist = require("../widgets/checklist.jsx");
var DidClickOutside = require("../mixins/did_click_outside.jsx");

var WIDTH = 150;
var REFERENCE_STRAIN_ID = 1;

var StrainSelector = React.createClass({
	mixins: [DidClickOutside],

	propTypes: {
		store: React.PropTypes.object,
		onUpdate: React.PropTypes.func // onUpdate()
	},

	getInitialState: function () {
		return {
			isActive: false,
		};
	},

	render: function () {
		return (
			<div style={[style.wrapper]}>
				{this._getActiveNode()}
				<a className="button dropdown small secondary" onClick={this._toggleActive}><i className="fa fa-check-square" /> Strains</a>
			</div>
		);
	},

	didClickOutside: function () {
		this.setState({ isActive: false });
	},

	_toggleActive: function (e) {
		e.preventDefault();
		e.nativeEvent.stopImmediatePropagation();
		this.setState({ isActive: !this.state.isActive });
	},

	_getStrainMetaData: function () {
		return this.props.store.getStrainMetaData()
			.filter( d => { return d.id !== REFERENCE_STRAIN_ID; });
	},

	_getActiveNode: function () {
		if (!this.state.isActive) return null;
		var _stopClick = e => {
			e.nativeEvent.stopImmediatePropagation();
		};
		var currentActiveIds = this.props.store.getVisibleStrainIds()
			.filter( d => { return d !== REFERENCE_STRAIN_ID; });
		var metaData = this._getStrainMetaData();
		var strainIds = metaData.map( d => { return d.id; });

		var _elements = metaData.map( d => {
			return { name: d.name, key: d.id };
		});
		var _onSelect = ids => {
			ids = ids.filter( d => { return d !== REFERENCE_STRAIN_ID; });
			this.props.store.setVisibleStrainIds(ids, err => {
				if (typeof this.props.onUpdate === "function") this.props.onUpdate();
			});
		};
		return (
			<div onClick={_stopClick} style={[style.activeWrapper]}>
				<div>
					<span style={{ fontSize: "0.875rem" }}>S288C (reference)</span>
					<Checklist elements={_elements} initialActiveElementKeys={strainIds} onSelect={_onSelect} />
				</div>
			</div>
		);
	}
});

var style = {
	wrapper: {
		position: "relative",
		height: "2.4rem",
		minWidth: WIDTH
	},
	activeWrapper: {
		position: "absolute",
		top: "3rem",
		padding: "1rem",
		background: "#efefef",
		width: WIDTH,
		zIndex: 2
	}
};

module.exports = Radium(StrainSelector);
